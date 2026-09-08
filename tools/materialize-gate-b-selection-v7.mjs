import fs from 'node:fs';
import path from 'node:path';
import { validateResearchData } from './validate-research-data.mjs';
import { validateSelectionData } from './validate-selection-data.mjs';
import { assessSelectionQuality } from './selection-quality-gate.mjs';

const ROOT = process.cwd();
const BATCH = '20260908-manifest-v7-first10';
const batchDir = path.join(ROOT, 'batches', BATCH);
const dispositions = JSON.parse(fs.readFileSync(path.join(batchDir, 'gate-b-feature-disposition-draft.json'), 'utf8'));
const deps = JSON.parse(fs.readFileSync(path.join(batchDir, 'gate-b-dependency-audit.json'), 'utf8'));
const machineIds = dispositions.machines.map(x => x.machineId);
const dispByMachine = new Map(dispositions.machines.map(x => [x.machineId, x.decisions]));
const depByMachine = new Map(deps.machines.map(x => [x.machineId, x]));

const slug = s => String(s).replace(/^RF_/, '').replace(/[^A-Z0-9_]/g, '_');
const inputId = (prefix, rf, suffix='') => `INP_${prefix}_${slug(rf)}${suffix ? '_' + suffix : ''}`;
const featureId = rf => `FEAT_${slug(rf)}`;
const settings = r => r.machine?.settings ?? [];
const isFullSettingFeature = (rf, research) => {
  if (rf.candidateModel === 'multinomial') {
    const d = rf.settingDistributions ?? {};
    return settings(research).every(s => d[s] && Object.keys(d[s]).length >= 2);
  }
  const vals = rf.settingValues ?? {};
  return settings(research).every(s => vals[s] && Number.isFinite(Number(vals[s].probability)));
};
const concreteReason = (adoption, machineId, rf) => {
  if (adoption === 'INCLUDE_PRIMARY') return '公開された全設定の確率・分布を比較でき、依存関係監査で独立または主経路として扱えるため、主推測要素として採用する。';
  if (adoption === 'INCLUDE_SUPPORT') return '公開された全設定の確率・分布があり、条件付き分母や排他的カテゴリを保って観測できるため、補助推測要素として採用する。';
  if (adoption === 'INCLUDE_FALLBACK') return '公開された設定差は有効だが、主Featureとの因果・包含関係で同じ好不調を二重評価し得るため、同時独立加算せずFallbackとして使用する。';
  const reason = dispositions.excludeReasons?.[`${machineId}/${rf.researchFeatureId}`];
  return reason || '公開情報だけでは全設定の尤度を一意に構築できないため、現時点では数値推測に使用しない。';
};

const badQualStatuses = new Set(['PUBLIC_NUMERIC_VALUES_EXIST','PUBLIC_VALUES_EXIST']);
const batchCoverage = [];
let hardErrors = [];

for (const machineId of machineIds) {
  const rp = path.join(ROOT, 'research', machineId, 'research-data.json');
  const research = JSON.parse(fs.readFileSync(rp, 'utf8'));
  const rv = validateResearchData(research);
  if (rv.status !== 'PASS') hardErrors.push(`${machineId}: ResearchData validation ${rv.status}`);
  const decisions = dispByMachine.get(machineId) ?? {};
  const dep = depByMachine.get(machineId) ?? {relationships:[]};
  const inputs = [];
  const features = [];
  const selectedSummary = [];
  const rejectedSummary = [];
  const qualitativeDisposition = [];
  let order = 10;

  for (const rf of research.features ?? []) {
    const adoption = decisions[rf.researchFeatureId];
    if (!adoption) { hardErrors.push(`${machineId}: unclassified feature ${rf.researchFeatureId}`); continue; }
    const reason = concreteReason(adoption, machineId, rf);
    const f = {
      featureId: featureId(rf.researchFeatureId),
      researchFeatureId: rf.researchFeatureId,
      adoptionCategory: adoption,
      userReason: reason,
      userFacingReason: adoption === 'EXCLUDE' ? reason : undefined,
      weight: 1,
      integratedContribution: false,
    };
    if (adoption !== 'EXCLUDE') {
      if (!isFullSettingFeature(rf, research)) hardErrors.push(`${machineId}: included feature lacks full setting likelihood ${rf.researchFeatureId}`);
      if (rf.candidateModel === 'multinomial') {
        const ids = [];
        for (const [i, cat] of (rf.categories ?? []).entries()) {
          const id = inputId('CAT', rf.researchFeatureId, String(i+1));
          inputs.push({id,name:String(cat),category:`SEL_${slug(rf.researchFeatureId)}`,type:'counter',unit:'回',displayOrder:order++,inferenceRole:adoption,defaultValue:'',minimum:0});
          ids.push(id);
        }
        f.categoryInputIds = ids;
      } else {
        const num = inputId('NUM', rf.researchFeatureId);
        const den = inputId('DEN', rf.researchFeatureId);
        inputs.push({id:num,name:rf.numeratorDefinition || rf.name,category:`SEL_${slug(rf.researchFeatureId)}`,type:'counter',unit:'回',displayOrder:order++,inferenceRole:adoption,defaultValue:'',minimum:0});
        inputs.push({id:den,name:rf.denominatorDefinition || rf.trialUnit || '試行回数',category:`SEL_${slug(rf.researchFeatureId)}`,type:'integer',unit:'回',displayOrder:order++,inferenceRole:adoption,defaultValue:'',minimum:0});
        f.numeratorInputId = num;
        f.denominatorInputId = den;
      }
      selectedSummary.push({name:rf.name,reason});
    } else {
      rejectedSummary.push({name:rf.name,reason});
    }
    features.push(f);
  }

  const evidenceUiGroups = [];
  const evidenceReviewExclusions = [];
  for (const ev of research.evidenceCandidates ?? []) {
    if (ev.factStatus === 'verified') {
      evidenceUiGroups.push({
        groupId:`EVI_${slug(ev.researchEvidenceId)}`,
        label:ev.name,
        options:[{value:slug(ev.researchEvidenceId),label:ev.name,allowedSettings:ev.allowedSettings ?? [],excludedSettings:ev.deniedSettings ?? [],sourceEvidenceIds:[ev.researchEvidenceId]}]
      });
    } else {
      evidenceReviewExclusions.push({researchEvidenceId:ev.researchEvidenceId,reason:'公開根拠の確度がverifiedに達していないため、確定Evidenceとしては採用しない。'});
    }
  }

  for (const q of research.qualitativeCandidates ?? []) {
    let disposition = 'REFERENCE';
    let reason = '設定差の数値尤度を構築できないため確率推測には直接加えず、示唆・観測経路・参考情報として保持する。';
    if (badQualStatuses.has(q.status)) {
      disposition = 'BLOCKED_UNMATERIALIZED';
      reason = '公開数値が存在するのにResearch Featureへ物質化されていないためGate Bを閉じられない。';
      hardErrors.push(`${machineId}: qualitative candidate still has materializable numeric status ${q.candidateId}`);
    } else if (/OBSERVATION|FIELDS|SERVICE|CONCRETE/.test(q.status ?? '') || q.category === 'linked_service_items') {
      disposition = 'REFERENCE_OBSERVATION';
      reason = '推測尤度ではなく観測・入力経路候補として保持し、Gate Cで取得単位と定義一致を確認する。';
    } else if (/PARTIAL|WITHOUT_FULL|SETTING_DIFFERENCE/.test(q.status ?? '')) {
      disposition = 'REFERENCE_PARTIAL';
      reason = '公開値が一部設定または傾向のみで全設定尤度を構築できないため、欠損値を補間せず参考情報として保持する。';
    } else if (/CONFLICT/.test(q.status ?? '')) {
      disposition = 'REFERENCE_CONFLICT';
      reason = '公開情報の確度・解釈が競合しているため、解消まで確定推測要素へ昇格しない。';
    }
    qualitativeDisposition.push({candidateId:q.candidateId,name:q.name,disposition,reason,integratedContribution:false,userFacingRejected:disposition.startsWith('REFERENCE_PARTIAL')});
  }
  for (const u of research.unresolvedResearchCandidates ?? []) {
    qualitativeDisposition.push({candidateId:u.candidateId,name:u.name,disposition:'RESEARCH_REOPEN',reason:u.reason || '公開Webで未解決。Gate C終了前に再調査または実機連動画面で確認する。',integratedContribution:false,userFacingRejected:false});
  }
  for (const c of research.conflicts ?? []) {
    qualitativeDisposition.push({candidateId:c.conflictId,name:c.targetId || c.conflictId,disposition:'CONFLICT_TRACKED',reason:c.description || '公開情報競合を保持し、尤度を一意化しない。',integratedContribution:false,userFacingRejected:false});
  }

  const selection = {
    schemaVersion:'selection-data-v1',
    machineId,
    machineDataVersion:'0.1.0',
    generatedAt:'2026-09-08',
    inputs,
    features,
    evidenceUi:{groups:evidenceUiGroups},
    evidenceReview:{policyVersion:1,exclusions:evidenceReviewExclusions},
    qualitativeDisposition,
    dependencyAuditRef:`batches/${BATCH}/gate-b-dependency-audit.json`,
    selectionSummaryContract:{schemaVersion:'selection-summary-v1',evaluatedCount:features.length,selectedCount:selectedSummary.length,rejectedCount:rejectedSummary.length,selected:selectedSummary,rejected:rejectedSummary},
    selectionPolicy:{noRejectionForInputBurden:true,noRejectionForRequiredTrialsAlone:true,rareEventLikelihoodEvaluation:true},
  };
  const sv = validateSelectionData(selection, research);
  const sq = assessSelectionQuality(research, selection);
  if (!sv.ok) hardErrors.push(...sv.errors.map(x => `${machineId}: ${x}`));
  if (sq.status === 'BLOCKED') hardErrors.push(...sq.blockers.map(x => `${machineId}: ${x}`));
  fs.writeFileSync(path.join(ROOT,'research',machineId,'selection-data.json'), JSON.stringify(selection,null,2)+'\n');
  batchCoverage.push({machineId,features:(research.features??[]).length,featureDecisions:features.length,evidence:(research.evidenceCandidates??[]).length,evidenceIncluded:evidenceUiGroups.length,evidenceExcluded:evidenceReviewExclusions.length,qualitative:(research.qualitativeCandidates??[]).length,unresolved:(research.unresolvedResearchCandidates??[]).length,conflicts:(research.conflicts??[]).length,validator:sv.ok?'PASS':'FAIL',quality:sq.status,reviews:sq.reviews});
}

const report = {
  schemaVersion:'gate-b-materialization-report-v1',
  batchId:BATCH,
  checkedAt:'2026-09-08T20:30:00+09:00',
  status:hardErrors.length?'BLOCKED':'PASS',
  machineCount:machineIds.length,
  coverage:batchCoverage,
  hardErrors,
  dependencyAuditRef:`batches/${BATCH}/gate-b-dependency-audit.json`,
  featureDispositionRef:`batches/${BATCH}/gate-b-feature-disposition-draft.json`
};
fs.writeFileSync(path.join(batchDir,'gate-b-materialization-report.json'),JSON.stringify(report,null,2)+'\n');
console.log(`GATE B MATERIALIZATION ${report.status}: machines=${machineIds.length} errors=${hardErrors.length}`);
for (const e of hardErrors) console.error('ERROR:',e);
if (hardErrors.length) process.exit(1);
