import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RESEARCH = path.join(ROOT, 'research');
const reportIndex = process.argv.indexOf('--report');
const REPORT = path.resolve(ROOT, reportIndex >= 0 && process.argv[reportIndex + 1]
  ? process.argv[reportIndex + 1]
  : 'reports/feature-ui-v2-audit.json');
const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));

const registry = read(path.join(ROOT, 'machine-registry.json'));
const displayNameById = new Map((registry.machines ?? []).map((m) => [m.machineId, m.displayName]));
const KNOWN_DRIFT = new Set(['L_KYOUKARA_OREHA_FE','S_SENGOKU_KOIHIME_FC','S_SUPER_BINGO_NEO_CLASSIC_HH1']);
const FULL = /(総ゲーム|累計ゲーム|通常ゲーム|通常G|ゲーム数|G数|消化G|消化ゲーム|対象ゲーム|AT中ゲーム|AT中G|分母|試行ゲーム|試行G|総数|合計|まとめ入力)/;
const DEP = /(うち|内訳|対象|分母|母数|合計|総数|成功率の分母|前項|上記)/;
const COMPLEX = /(.{19,}|自由入力|メモ|備考|複合|詳細入力)/;
const DANGLING = /[のをがでにと]$/;
const SYMBOL_ONLY = /^[\s\p{P}\p{S}]+$/u;
const REVIEW_MODES = new Set(['NUMBER','RATE','SELECT','CATEGORY','BOOLEAN','ENUM','MULTI_SELECT','DERIVED']);

const fixtures = [
  { id:'love-cure-weak-cherry-suika', machineId:'L_LOVEKYURE2_PS', labels:[/弱チェリー/,/スイカ/] },
  { id:'bancho4-first-hit-direct-at', machineId:'L_OSU_BANCHO4_A3', labels:[/初当り/,/AT直撃/] },
  { id:'umineko2-lv2-replay', machineId:'L_UMINEKO_2_A1', labels:[/Lv2ナビ/i,/対象リプレイ/] },
  { id:'arifureta-first-hit-success', machineId:'L_ARIFURETA_JA', ids:['INP_COMBINED_FIRST_HIT','INP_AWAKENING_TRIALS','INP_AWAKENING_SUCCESS'] },
  { id:'initial-d-2nd-at-lb-end-feature', machineId:'L_INITIAL_D_2ND', ids:['INP_AT_LB_END_DEFAULT_COUNT','INP_AT_LB_END_ODD_COUNT','INP_AT_LB_END_EVEN_COUNT','INP_AT_LB_END_SWIMSUIT_COUNT'], featureName:'AT中LB終了画面' },
];
const fixturesByMachine = new Map();
for (const f of fixtures) fixturesByMachine.set(f.machineId, [...(fixturesByMachine.get(f.machineId) ?? []), f]);

const safeLabel = (name) => {
  const raw = String(name ?? '').trim();
  if (!raw.endsWith('回数')) return raw;
  const shorter = raw.slice(0,-2).trim();
  return !shorter || DANGLING.test(shorter) ? raw : shorter;
};
const uiItems = (pkg) => {
  const map = new Map();
  for (const section of pkg.ui?.sections ?? []) for (const item of section.items ?? []) {
    if (item?.type === 'input' && item.inputId) map.set(item.inputId,{sectionTitle:section.title ?? null,item});
  }
  return map;
};
const classify = (c, fixtureRequired) => {
  const label = String(c?.name ?? '').trim();
  const mode = String(c?.mode ?? c?.widget ?? '').toUpperCase();
  if (fixtureRequired) return ['AUTO-6','required-regression-fixture'];
  if (FULL.test(label)) return ['KEEP-12','game-total/denominator/aggregate'];
  if (COMPLEX.test(label)) return ['KEEP-12','long/freeform/complex'];
  if (DEP.test(label)) return ['REVIEW','possible parent-child/denominator dependency'];
  if (c?.gridSpan === 6 && c?.compact === true) return ['AUTO-6','existing explicit compact canonical intent'];
  if (mode === 'COUNTER') return ['AUTO-6','short independent counter'];
  if (REVIEW_MODES.has(mode)) return ['REVIEW',`compact-capable/special ${mode} requires review`];
  if (c?.gridSpan === 6) return ['REVIEW',`existing half-width special ${mode || 'UNKNOWN'}`];
  return ['REVIEW',`unknown/special ${mode || 'UNKNOWN'}`];
};
const isEvidence = (id, contract, pkgInput) => id.startsWith('INP_EVI_') || String(contract?.mode ?? '').toUpperCase() === 'EVIDENCE' || pkgInput?.category === 'EVIDENCE';

const rows=[]; const excludedEvidence=[]; const labels=[]; const duplicates=[]; const contractDrifts=[]; const parity=[]; const fixtureResults=[];
let machines=0, sections=0;

for (const machineId of fs.readdirSync(RESEARCH).sort()) {
  if (machineId.includes('_TEST_') || machineId.endsWith('_TEST')) continue;
  const designPath=path.join(RESEARCH,machineId,'ui-design-data.json');
  const packagePath=path.join(ROOT,'machines',machineId,'machine-package.json');
  if (!fs.existsSync(designPath)) continue;
  const ui=read(designPath);
  if (ui.schemaVersion !== 'ui-design-data-v1' || ui.machineId !== machineId) continue;
  machines++;
  const displayName=displayNameById.get(machineId) ?? machineId;
  if (!fs.existsSync(packagePath)) { contractDrifts.push({machineId,displayName,reason:'machine-package-missing',expectedKnownDrift:KNOWN_DRIFT.has(machineId)}); continue; }
  const pkg=read(packagePath);
  const pkgInputs=new Map((pkg.inputs?.inputs ?? []).map((x)=>[x.id,x]));
  const pkgUi=uiItems(pkg);
  const machineRows=[];
  const canonicalIds=[];

  for (const sectionName of ui.sectionOrder ?? []) {
    const section=ui.sections?.[sectionName];
    if (!section?.inputIds?.length) continue;
    const ids=section.inputIds.filter((id)=>Object.hasOwn(ui.inputContracts ?? {},id));
    if (!ids.length) continue;
    const featureIds=ids.filter((id)=>!isEvidence(id,ui.inputContracts[id],pkgInputs.get(id)));
    const evidenceIds=ids.filter((id)=>isEvidence(id,ui.inputContracts[id],pkgInputs.get(id)));
    for (const id of evidenceIds) excludedEvidence.push({machineId,displayName,sectionName,inputId:id});
    if (!featureIds.length) continue;
    sections++;
    canonicalIds.push(...featureIds);
    const seen=new Map();

    for (const inputId of featureIds) {
      const c=ui.inputContracts[inputId];
      const pkgInput=pkgInputs.get(inputId);
      if (!pkgInput) continue;
      const fixtureRequired=(fixturesByMachine.get(machineId) ?? []).some((f)=>f.ids?.includes(inputId) || f.labels?.some((re)=>re.test(String(c.name ?? ''))));
      const [classification,reason]=classify(c,fixtureRequired);
      const mat=pkgUi.get(inputId)?.item;
      const row={machineId,displayName,sectionName,inputId,sourceLabel:String(c.name ?? '').trim(),displayLabel:safeLabel(c.name),mode:c.mode ?? c.widget ?? null,currentGridSpan:c.gridSpan ?? null,compact:c.compact ?? null,materializedGridSpan:mat?.gridSpan ?? null,materializedCompact:mat?.config?.compact ?? null,classification,reason};
      rows.push(row); machineRows.push(row);
      if (!mat || row.currentGridSpan !== row.materializedGridSpan || row.compact !== row.materializedCompact) parity.push({machineId,displayName,sectionName,inputId,kind:!mat?'missing-ui-item':'layout-parity',expectedGridSpan:row.currentGridSpan,actualGridSpan:row.materializedGridSpan,expectedCompact:row.compact,actualCompact:row.materializedCompact});
      const issues=[];
      if (!row.displayLabel) issues.push('empty-label');
      if (row.displayLabel && SYMBOL_ONLY.test(row.displayLabel)) issues.push('symbol-only-label');
      if (row.displayLabel && DANGLING.test(row.displayLabel)) issues.push('dangling-particle');
      if (row.sourceLabel.endsWith('の回数') && row.displayLabel !== row.sourceLabel) issues.push('unsafe-no-count-shortening');
      if (issues.length) labels.push({...row,issues});
      const a=seen.get(row.displayLabel) ?? []; a.push(inputId); seen.set(row.displayLabel,a);
    }
    for (const [label,inputIds] of seen) if (label && inputIds.length>1) duplicates.push({machineId,displayName,sectionName,label,inputIds});
  }

  const missing=[...new Set(canonicalIds)].filter((id)=>!pkgInputs.has(id));
  if (missing.length) contractDrifts.push({machineId,displayName,reason:'canonical-feature-input-id-missing-in-package',missingInputIds:missing,expectedKnownDrift:KNOWN_DRIFT.has(machineId)});

  for (const f of fixturesByMachine.get(machineId) ?? []) {
    const requiredIds=f.ids ?? f.labels.map((re)=>machineRows.find((r)=>re.test(r.sourceLabel))?.inputId).filter(Boolean);
    const missingFixtureIds=f.ids ? f.ids.filter((id)=>!machineRows.some((r)=>r.inputId===id)) : f.labels.filter((re)=>!machineRows.some((r)=>re.test(r.sourceLabel))).map(String);
    const matched=machineRows.filter((r)=>requiredIds.includes(r.inputId));
    const featureNamePass=!f.featureName || (pkg.features?.features ?? []).some((feature)=>feature.name===f.featureName && requiredIds.some((id)=>feature.denominatorInputId===id || feature.numeratorInputId===id || (feature.denominatorInputIds ?? []).includes(id) || (feature.categoryInputIds ?? []).includes(id)));
    const classificationPass=missingFixtureIds.length===0 && requiredIds.length>0 && matched.every((r)=>r.classification==='AUTO-6');
    const canonicalLayoutPass=matched.length===requiredIds.length && matched.every((r)=>r.currentGridSpan===6);
    const materializedLayoutPass=matched.length===requiredIds.length && matched.every((r)=>r.materializedGridSpan===6);
    fixtureResults.push({id:f.id,machineId,displayName,requiredInputIds:requiredIds,missingFixtureIds,classificationPass,canonicalLayoutPass,materializedLayoutPass,featureNamePass,pass:classificationPass&&canonicalLayoutPass&&materializedLayoutPass&&featureNamePass,matched:matched.map((r)=>({inputId:r.inputId,label:r.sourceLabel,canonicalGridSpan:r.currentGridSpan,materializedGridSpan:r.materializedGridSpan}))});
  }
}
for (const f of fixtures) if (!fixtureResults.some((x)=>x.id===f.id)) fixtureResults.push({id:f.id,machineId:f.machineId,pass:false,reason:'fixture-machine-not-audited'});

const by=(c)=>rows.filter((x)=>x.classification===c);
const parityByMachine=[...new Set(parity.map((x)=>x.machineId))];
const reviewByMode=Object.fromEntries([...new Set(by('REVIEW').map((x)=>String(x.mode ?? 'UNKNOWN')))].sort().map((mode)=>[mode,by('REVIEW').filter((x)=>String(x.mode ?? 'UNKNOWN')===mode).length]));
const report={schemaVersion:'feature-ui-v2-audit-final-v1',mode:'READ_ONLY',policy:{sourceOfTruth:'research/<machineId>/ui-design-data.json',evidence:'Evidence inputs are excluded, not treated as Feature audit failures.',oddCount:'AUTO-6 remains half-width when odd-last.',sectionBoundary:'No cross-section pairing.',mutation:'No canonical or MachineData mutation.'},summary:{canonicalMachines:machines,featureSections:sections,featureInputs:rows.length,evidenceInputsExcluded:excludedEvidence.length,auto6:by('AUTO-6').length,keep12:by('KEEP-12').length,review:by('REVIEW').length,reviewByMode,labelIssues:labels.length,duplicateLabels:duplicates.length,contractDrifts:contractDrifts.length,unexpectedContractDrifts:contractDrifts.filter((x)=>!x.expectedKnownDrift).length,materializationDrifts:parity.length,materializationDriftMachines:parityByMachine.length,fixturePass:fixtureResults.filter((x)=>x.pass).length,fixtureTotal:fixtureResults.length},contractDrifts,materializationDrifts:parity,materializationDriftMachineIds:parityByMachine,fixtureResults,labelIssues:labels,duplicateLabels:duplicates,evidenceInputsExcluded:excludedEvidence,classifications:{AUTO_6:by('AUTO-6'),KEEP_12:by('KEEP-12'),REVIEW:by('REVIEW')}};
fs.mkdirSync(path.dirname(REPORT),{recursive:true});
fs.writeFileSync(REPORT,`${JSON.stringify(report,null,2)}\n`);
console.log(`Feature UI v2 FINAL READ_ONLY: machines=${machines} sections=${sections} featureInputs=${rows.length} evidenceExcluded=${excludedEvidence.length}`);
console.log(`AUTO-6=${report.summary.auto6} KEEP-12=${report.summary.keep12} REVIEW=${report.summary.review} reviewByMode=${JSON.stringify(reviewByMode)}`);
console.log(`labelIssues=${report.summary.labelIssues} duplicateLabels=${report.summary.duplicateLabels}`);
console.log(`contractDrifts=${report.summary.contractDrifts} unexpected=${report.summary.unexpectedContractDrifts}`);
console.log(`materializationDrifts=${report.summary.materializationDrifts} machines=${report.summary.materializationDriftMachines}`);
console.log(`MATERIALIZATION_MACHINES=${parityByMachine.join(',')}`);
for (const f of fixtureResults) console.log(`FIXTURE ${f.pass?'PASS':'FAIL'} ${f.id} canonical=${f.canonicalLayoutPass ?? false} materialized=${f.materializedLayoutPass ?? false}`);
for (const d of duplicates) console.log(`DUPLICATE ${d.machineId} | ${d.sectionName} | ${d.label} | ${d.inputIds.join(',')}`);
for (const issue of labels) console.log(`LABEL ${issue.machineId} | ${issue.sectionName} | ${issue.sourceLabel} -> ${issue.displayLabel} | ${issue.issues.join(',')}`);
if (contractDrifts.some((x)=>!x.expectedKnownDrift)) process.exitCode=3;
if (labels.length) process.exitCode=4;
