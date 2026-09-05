#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const INCLUDE = new Set(['INCLUDE_PRIMARY', 'INCLUDE_SUPPORT', 'INCLUDE_FALLBACK']);
const EVIDENCE_REASON = /(Evidence|evidence|確定情報|確定系|確定演出|設定確定|設定否定|示唆.*優先|優先.*示唆)/u;
const OVERLAP_REASON = /(重複|二重評価|二重計上|同じ観測|同一観測|同じ事象|同一事象|同一演出|同じ演出|重なる)/u;
const SUBSET_REASON = /(部分集合|内包|親Feature|全体の分布|全体分布|同じ連続事象|必ず.*成立を内包)/u;
const CAUSAL_REASON = /(上流下流|因果|成立過程|当選系列の上流|当選系列.*下流)/u;
const GENERIC_CONTEXT = new Set([
  'RF','RE','FEAT','EVI','SCREEN','PICTURE','IMAGE','RESULT','OUTCOME','SETTING','SET','COUNT','RATE','COMPOSITION','DISTRIBUTION','HINT','INDICATION',
  'BIG','REG','AT','CZ','ST','ART','BT','RB','BB','LB','BONUS','END','START','初当り','終了','開始','画面','ボーナス'
]);
const GENERIC_CATEGORY = new Set(['RED','BLUE','GREEN','YELLOW','WHITE','BLACK','GOLD','SILVER','PURPLE','RAINBOW','虹','赤','青','緑','黄','白','黒','金','銀','紫']);
const ALLOWED_SINGLE_CONTEXT = new Set(['A','B','C']);
const arr = v => Array.isArray(v) ? v : [];
const obj = v => v && typeof v === 'object' && !Array.isArray(v);
const uniq = xs => [...new Set(xs.filter(Boolean))];
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));

function normTokens(value) {
  return uniq(String(value ?? '')
    .toUpperCase()
    .replace(/[＋+／/・（）()\[\]【】「」『』:：,，.。\-]/gu, '_')
    .split(/[_\s]+/u)
    .map(x => x.trim())
    .filter(x => (x.length >= 2 || ALLOWED_SINGLE_CONTEXT.has(x)) && !GENERIC_CONTEXT.has(x)));
}
function eventInputs(f) {
  return uniq([f?.numeratorInputId, ...arr(f?.numeratorInputIds), ...arr(f?.categoryInputIds), ...arr(f?.optionalCategoryInputIds)]);
}
function numericSignature(v) {
  if (!obj(v)) return null;
  const scalar = [v.probability, v.rate, v.value].find(Number.isFinite);
  if (Number.isFinite(scalar)) return `scalar:${scalar}`;
  const pairs = Object.entries(v).filter(([,x]) => Number.isFinite(x)).sort(([a],[b]) => a.localeCompare(b));
  return pairs.length ? `dist:${JSON.stringify(pairs)}` : null;
}
function numericCoverage(feature) {
  const values = Object.entries(obj(feature?.settingValues) ? feature.settingValues : {})
    .map(([k,v]) => [k,v,numericSignature(v)])
    .filter(([, ,sig]) => sig);
  const dists = Object.entries(obj(feature?.settingDistributions) ? feature.settingDistributions : {})
    .map(([k,v]) => [k,v,numericSignature(v)])
    .filter(([, ,sig]) => sig);
  const settings = uniq([...values.map(([k]) => k), ...dists.map(([k]) => k)]);
  const signatures = new Set([...values.map(([, ,sig]) => sig), ...dists.map(([, ,sig]) => sig)]);
  const hasSettingVariation = signatures.size >= 2;
  const mode = String(feature?.distributionMode ?? '');
  return {
    settings,
    settingCount: settings.length,
    hasNumeric: settings.length >= 2 && hasSettingVariation,
    hasSettingVariation,
    completeDistribution: /(complete|implicit_residual)/i.test(mode) && dists.length >= 2 && hasSettingVariation,
    multinomialLike: /multinomial/i.test(String(feature?.candidateModel ?? '')) || arr(feature?.categories).length >= 2 || dists.length >= 2,
  };
}
function collectExplicitPairs(research) {
  const rf = new Set(arr(research?.features).map(x => x?.researchFeatureId).filter(Boolean));
  const re = new Set(arr(research?.evidenceCandidates).map(x => x?.researchEvidenceId).filter(Boolean));
  const pairs = new Set();
  const walk = node => {
    if (Array.isArray(node)) { for (const v of node) walk(v); return; }
    if (!obj(node)) return;
    const raw = node.researchTarget ?? node.mappedTo;
    const targets = arr(raw).length ? raw : (raw ? [raw] : []);
    const fids = targets.filter(x => rf.has(x));
    const eids = targets.filter(x => re.has(x));
    for (const f of fids) for (const e of eids) pairs.add(`${f}::${e}`);
    for (const v of Object.values(node)) walk(v);
  };
  walk(research?.discoveryInventory ?? []);
  return pairs;
}
function discriminatorMismatch(featureTokens, evidenceTokens) {
  const f = [...featureTokens].filter(t => ALLOWED_SINGLE_CONTEXT.has(t));
  const e = [...evidenceTokens].filter(t => ALLOWED_SINGLE_CONTEXT.has(t));
  return f.length && e.length && !f.some(t => e.includes(t));
}
function relation(feature, evidence, explicitPairs) {
  const fid = feature?.researchFeatureId;
  const eid = evidence?.researchEvidenceId;
  if (explicitPairs.has(`${fid}::${eid}`)) return { confidence: 'HIGH', basis: ['EXPLICIT_DISCOVERY_LINKAGE'] };

  const categoryTokens = new Set(arr(feature?.categories).flatMap(normTokens));
  const evidenceTokens = new Set([...normTokens(evidence?.researchEvidenceId), ...normTokens(evidence?.name)]);
  const featureTokens = new Set([...normTokens(feature?.researchFeatureId), ...normTokens(feature?.name)]);
  if (discriminatorMismatch(featureTokens, evidenceTokens)) return null;
  const categoryHit = [...categoryTokens].filter(t => evidenceTokens.has(t));
  const contextHit = [...featureTokens].filter(t => evidenceTokens.has(t));
  const distinctiveCategoryHit = categoryHit.filter(t => !GENERIC_CATEGORY.has(t));

  if (categoryHit.length && contextHit.length >= 2) return { confidence: 'HIGH', basis: ['CATEGORY_TOKEN_MATCH','CONTEXT_TOKEN_MATCH'], categoryHit, contextHit };
  if (categoryHit.length && contextHit.length === 1) {
    return { confidence: distinctiveCategoryHit.length ? 'HIGH' : 'MEDIUM', basis: ['CATEGORY_TOKEN_MATCH','CONTEXT_TOKEN_MATCH'], categoryHit, contextHit };
  }
  if (contextHit.length >= 2) return { confidence: 'MEDIUM', basis: ['CONTEXT_TOKEN_MATCH'], contextHit };
  return null;
}
function normalizedText(value) {
  return String(value ?? '').toUpperCase().replace(/[^A-Z0-9\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]+/gu, '');
}
function likelyConsolidatedByActiveInput(rf, selection) {
  const featureName = normalizedText(rf?.name);
  const numerator = normalizedText(rf?.numeratorDefinition);
  const candidates = arr(selection?.inputs).filter(input => {
    const inputName = normalizedText(input?.name);
    if (!inputName) return false;
    return (featureName && (featureName.includes(inputName) || inputName.includes(featureName))) ||
      (numerator && numerator.includes(inputName));
  });
  if (!candidates.length) return null;
  const activeFeatures = arr(selection?.features).filter(f => INCLUDE.has(f?.adoptionCategory));
  for (const input of candidates) {
    const owner = activeFeatures.find(f => eventInputs(f).includes(input.id));
    if (owner) return { inputId: input.id, featureId: owner.featureId, researchFeatureId: owner.researchFeatureId };
  }
  return null;
}
function evidenceUiIds(selection) {
  return new Set(arr(selection?.evidenceUi?.groups).flatMap(g => arr(g?.options)).flatMap(o => arr(o?.sourceEvidenceIds)));
}
function machineStatus(issues) {
  return issues.some(x => x.severity === 'HIGH_RISK') ? 'HIGH_RISK' : issues.some(x => x.severity === 'REVIEW') ? 'REVIEW' : 'PASS';
}

export function auditV64CrossMachine(root = process.cwd()) {
  const researchRoot = path.join(root, 'research');
  const machineRoot = path.join(root, 'machines');
  const machines = [];
  if (!fs.existsSync(researchRoot)) throw new Error(`research root not found: ${researchRoot}`);

  // Batch-level research workspaces contain Gate/Discovery notes, not a machine
  // research-data/selection-data contract. Do not count those workspaces as machines.
  const dirs = fs.readdirSync(researchRoot, {withFileTypes:true})
    .filter(x => x.isDirectory() && !x.name.startsWith('_') && !x.name.startsWith('batch-'))
    .sort((a,b) => a.name.localeCompare(b.name));

  for (const de of dirs) {
    const machineId = de.name;
    const rp = path.join(researchRoot, machineId, 'research-data.json');
    const sp = path.join(researchRoot, machineId, 'selection-data.json');
    const mp = path.join(machineRoot, machineId, 'machine-package.json');
    const issues = [];
    if (!fs.existsSync(rp) || !fs.existsSync(sp)) {
      issues.push({severity:'REVIEW', code:'SCHEMA_LIMITATION_MISSING_RESEARCH_OR_SELECTION'});
      machines.push({machineId, status:machineStatus(issues), issues});
      continue;
    }
    let research, selection, pkg = null;
    try { research = read(rp); selection = read(sp); if (fs.existsSync(mp)) pkg = read(mp); }
    catch (error) {
      issues.push({severity:'HIGH_RISK', code:'INVALID_JSON', detail:String(error)});
      machines.push({machineId, status:machineStatus(issues), issues});
      continue;
    }

    const sfByResearch = new Map(arr(selection.features).filter(x => x?.researchFeatureId).map(x => [x.researchFeatureId, x]));
    const featureById = new Map(arr(selection.features).filter(x => x?.featureId).map(x => [x.featureId, x]));
    const evidenceByResearch = new Map(arr(selection.evidence).filter(x => x?.researchEvidenceId).map(x => [x.researchEvidenceId, x]));
    const explicitPairs = collectExplicitPairs(research);
    const uiEvidence = evidenceUiIds(selection);
    const selectedEvidence = new Set([...uiEvidence, ...arr(selection.evidence).map(x => x?.researchEvidenceId).filter(Boolean)]);

    for (const rf of arr(research.features)) {
      const cov = numericCoverage(rf);
      if (!cov.hasNumeric) continue;
      const sf = sfByResearch.get(rf.researchFeatureId);
      if (!sf) {
        const consolidated = likelyConsolidatedByActiveInput(rf, selection);
        if (!consolidated) {
          issues.push({severity:'REVIEW', code:'RESEARCH_NUMERIC_FEATURE_MISSING_FROM_SELECTION', researchFeatureId:rf.researchFeatureId, name:rf.name, settingCount:cov.settingCount});
        }
        continue;
      }
      const relatedEvidence = [];
      for (const re of arr(research.evidenceCandidates)) {
        const rel = relation(rf, re, explicitPairs);
        if (rel) relatedEvidence.push({researchEvidenceId:re.researchEvidenceId, name:re.name, ...rel});
      }
      const selectedRelatedEvidence = relatedEvidence.filter(e => selectedEvidence.has(e.researchEvidenceId));
      const reason = String(sf.rejectionReason ?? sf.userReason ?? sf.userFacingReason ?? '');

      if (!INCLUDE.has(sf.adoptionCategory)) {
        if (CAUSAL_REASON.test(reason) && !SUBSET_REASON.test(reason)) {
          issues.push({severity:'REVIEW', code:'CAUSAL_RELATION_REJECT_CANDIDATE', researchFeatureId:rf.researchFeatureId, featureId:sf.featureId ?? null, name:rf.name, reason, settingCount:cov.settingCount});
          continue;
        }
        if (SUBSET_REASON.test(reason)) continue;
        if (selectedRelatedEvidence.length) {
          const overlapWording = EVIDENCE_REASON.test(reason) || OVERLAP_REASON.test(reason);
          const strongest = selectedRelatedEvidence.some(x => x.confidence === 'HIGH') ? 'HIGH' : 'MEDIUM';
          issues.push({
            severity:'REVIEW',
            code: overlapWording ? 'LEGACY_EVIDENCE_OVERLAP_REJECT_CANDIDATE' : 'EXCLUDED_NUMERIC_FEATURE_WITH_RELATED_EVIDENCE',
            researchFeatureId:rf.researchFeatureId,
            featureId:sf.featureId ?? null,
            name:rf.name,
            adoptionCategory:sf.adoptionCategory,
            candidateModel:rf.candidateModel ?? null,
            completeDistribution:cov.completeDistribution,
            settingCount:cov.settingCount,
            relationConfidence:strongest,
            reason,
            relatedEvidence:selectedRelatedEvidence,
          });
        }
        continue;
      }

      // Legacy design may keep the numeric Feature but strip Evidence categories into a separate Evidence UI.
      const excludedLabels = arr(sf.categoryExcludeLabels);
      if (excludedLabels.length && cov.multinomialLike) {
        const splitEvidence = relatedEvidence.filter(e => uiEvidence.has(e.researchEvidenceId));
        if (splitEvidence.length) {
          issues.push({
            severity:'REVIEW',
            code:'SPLIT_FEATURE_EVIDENCE_INPUT_SURFACE_CANDIDATE',
            researchFeatureId:rf.researchFeatureId,
            featureId:sf.featureId ?? null,
            name:rf.name,
            excludedLabels,
            relatedEvidence:splitEvidence,
          });
        }
      }

      const featureInputs = new Set(eventInputs(sf));
      for (const other of arr(selection.features).filter(x => INCLUDE.has(x?.adoptionCategory) && x?.featureId !== sf.featureId)) {
        const overlap = eventInputs(other).filter(id => featureInputs.has(id));
        if (overlap.length) {
          issues.push({severity:'HIGH_RISK', code:'ACTIVE_FEATURE_SHARED_EVENT_INPUT', featureId:sf.featureId, otherFeatureId:other.featureId, sharedInputIds:overlap});
        }
      }
    }

    if (pkg) {
      const pkgFeatureIds = new Set(arr(pkg?.features?.features).map(x => x?.featureId).filter(Boolean));
      for (const sf of arr(selection.features).filter(x => INCLUDE.has(x?.adoptionCategory) && x?.featureId)) {
        if (!pkgFeatureIds.has(sf.featureId)) {
          issues.push({severity:'REVIEW', code:'SELECTED_FEATURE_NOT_MATERIALIZED', researchFeatureId:sf.researchFeatureId, featureId:sf.featureId});
        }
      }
    }

    machines.push({machineId, displayName:research?.machine?.displayName ?? pkg?.machine?.displayName ?? machineId, status:machineStatus(issues), issues});
  }

  const counts = machines.reduce((a,m)=>(a[m.status]=(a[m.status]||0)+1,a),{PASS:0,REVIEW:0,HIGH_RISK:0});
  const issueCounts = machines.flatMap(m=>m.issues).reduce((a,i)=>(a[i.code]=(a[i.code]||0)+1,a),{});
  return {
    schemaVersion:'v6.4-cross-machine-semantic-audit-v1.3',
    generatedAt:new Date().toISOString(),
    summary:{machineCount:machines.length,...counts,issueCounts},
    machines,
  };
}

function main(){
  const root=path.resolve(process.argv[2]??'.');
  const out=path.resolve(process.argv[3]??path.join(root,'reports','v64-cross-machine-semantic-audit.json'));
  const report=auditV64CrossMachine(root);
  fs.mkdirSync(path.dirname(out),{recursive:true});
  fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');
  console.log(`v6.4 Cross-machine Semantic Audit: PASS ${report.summary.PASS} / REVIEW ${report.summary.REVIEW} / HIGH_RISK ${report.summary.HIGH_RISK} / TOTAL ${report.summary.machineCount}`);
  console.log(JSON.stringify({issueCounts:report.summary.issueCounts,report:out},null,2));
  for(const m of report.machines.filter(x=>x.status!=='PASS')) for(const i of m.issues) console.log(`${m.status}\t${m.machineId}\t${i.code}`);
  if(report.summary.HIGH_RISK>0) process.exit(1);
}
if(process.argv[1]&&path.resolve(process.argv[1])===path.resolve(new URL(import.meta.url).pathname)) main();
