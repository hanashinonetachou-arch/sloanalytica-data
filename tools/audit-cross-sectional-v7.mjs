// Cross-sectional v7 diagnostic. Field verification is secondary; current structural/publicly resolvable work must continue.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { validateResearchData } from './validate-research-data.mjs';
import { validateSelectionData } from './validate-selection-data.mjs';
import { validateObservationObject } from './validate-machine-observation-data.mjs';
import { validateUiDesignData, gateUiDesignData } from './validate-ui-design-data.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPORT_JSON = path.join(ROOT, 'reports', 'cross-sectional-v7-audit.json');
const REPORT_MD = path.join(ROOT, 'reports', 'CROSS_SECTIONAL_V7_AUDIT.md');
const CLASS_RANK = { GREEN: 0, FIX: 1, FIELD_VERIFY: 2, RESEARCH_REOPEN: 3, BLOCKED: 4 };
const ADOPTED = new Set(['INCLUDE_PRIMARY','INCLUDE_SUPPORT','INCLUDE_FALLBACK','INCLUDE']);

function readJson(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
function exists(file) { return fs.existsSync(file); }
function isTestMachine(machine) {
  return String(machine?.machineId ?? '').includes('_TEST_') || String(machine?.displayName ?? '').startsWith('【テスト版】');
}
function sha256(file) { return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'); }
function issue(code, severity, message, extra={}) { return { code, severity, message, ...extra }; }
function raise(result, classification) {
  if (CLASS_RANK[classification] > CLASS_RANK[result.classification]) result.classification = classification;
}
function packageInputs(pkg) { return new Map((pkg?.inputs?.inputs ?? []).map(x => [x.id, x])); }
function packageFeatures(pkg) { return new Map((pkg?.features?.features ?? []).map(x => [x.featureId, x])); }
function adoptedFeatures(selection) { return (selection?.features ?? []).filter(f => ADOPTED.has(f?.adoptionCategory)); }
function selectionInputRefs(feature) {
  const keys=['numeratorInputId','denominatorInputId','successInputId','trialsInputId','countInputId','gamesInputId','inputId'];
  return [...new Set(keys.map(k => feature?.[k]).filter(Boolean))];
}
function observationPath(machineId) { return path.join(ROOT,'research',machineId,'machine-observation-data.json'); }
function uiPath(machineId) { return path.join(ROOT,'research',machineId,'ui-design-data.json'); }
function researchPath(machineId) { return path.join(ROOT,'research',machineId,'research-data.json'); }
function selectionPath(machineId) { return path.join(ROOT,'research',machineId,'selection-data.json'); }
function packagePath(machineId) { return path.join(ROOT,'machines',machineId,'machine-package.json'); }

const catalog = readJson(path.join(ROOT,'catalog.json'));
const canonical = (catalog.machines ?? []).filter(m => !isTestMachine(m));
const results=[];

for (const entry of canonical) {
  const id=entry.machineId;
  const result={
    machineId:id,
    displayName:entry.displayName ?? id,
    introductionDate:entry.introductionDate ?? null,
    classification:'GREEN',
    coverage:{ package:false, research:false, selection:false, observation:false, ui:false },
    issues:[],
    metrics:{ adoptedFeatures:0, fieldVerificationWaiting:0, researchReopenOpen:0, observationSchema:null, uiStatus:null }
  };
  const rp=researchPath(id), sp=selectionPath(id), op=observationPath(id), up=uiPath(id), pp=packagePath(id);
  result.coverage.package=exists(pp); result.coverage.research=exists(rp); result.coverage.selection=exists(sp); result.coverage.observation=exists(op); result.coverage.ui=exists(up);

  for (const [key,file] of [['package',pp],['research',rp],['selection',sp]]) {
    if (!exists(file)) {
      result.issues.push(issue(`MISSING_${key.toUpperCase()}`,'HARD',`${key} artifact is missing`));
      raise(result,'BLOCKED');
    }
  }
  if (!exists(op)) {
    result.issues.push(issue('MISSING_OBSERVATION','HARD','Gate C observation artifact is missing'));
    raise(result,'RESEARCH_REOPEN');
  }
  if (!exists(up)) {
    result.issues.push(issue('MISSING_UI_DESIGN','HARD','Canonical UI Design artifact is missing'));
    raise(result,'FIX');
  }

  let research=null,selection=null,observation=null,ui=null,pkg=null;
  try { if(exists(rp)) research=readJson(rp); } catch(e){ result.issues.push(issue('RESEARCH_JSON_INVALID','HARD',e.message)); raise(result,'BLOCKED'); }
  try { if(exists(sp)) selection=readJson(sp); } catch(e){ result.issues.push(issue('SELECTION_JSON_INVALID','HARD',e.message)); raise(result,'BLOCKED'); }
  try { if(exists(op)) observation=readJson(op); } catch(e){ result.issues.push(issue('OBSERVATION_JSON_INVALID','HARD',e.message)); raise(result,'FIX'); }
  try { if(exists(up)) ui=readJson(up); } catch(e){ result.issues.push(issue('UI_JSON_INVALID','HARD',e.message)); raise(result,'FIX'); }
  try { if(exists(pp)) pkg=readJson(pp); } catch(e){ result.issues.push(issue('PACKAGE_JSON_INVALID','HARD',e.message)); raise(result,'BLOCKED'); }

  if (research) {
    const vr=validateResearchData(research);
    if(vr.status!=='PASS') { for(const e of vr.errors??[]) result.issues.push(issue(`RESEARCH_${e.code??'VALIDATION'}`,'HARD',e.message??String(e))); raise(result,'BLOCKED'); }
    for(const w of vr.warnings??[]) result.issues.push(issue(`RESEARCH_WARNING_${w.code??'GENERIC'}`,'REVIEW',w.message??String(w)));
    if(research.machine?.machineId!==id){ result.issues.push(issue('RESEARCH_MACHINE_ID_MISMATCH','HARD',`research machineId=${research.machine?.machineId}`)); raise(result,'BLOCKED'); }
  }
  if (selection) {
    const vs=validateSelectionData(selection,research);
    if(!vs.ok){ for(const e of vs.errors??[]) result.issues.push(issue('SELECTION_VALIDATION','HARD',String(e))); raise(result,'BLOCKED'); }
    for(const w of vs.warnings??[]) result.issues.push(issue('SELECTION_WARNING','REVIEW',String(w)));
    if(selection.machineId!==id){ result.issues.push(issue('SELECTION_MACHINE_ID_MISMATCH','HARD',`selection machineId=${selection.machineId}`)); raise(result,'BLOCKED'); }
    const adopted=adoptedFeatures(selection); result.metrics.adoptedFeatures=adopted.length;
    const inputs=new Map((selection.inputs??[]).map(x=>[x.id,x]));
    for(const input of selection.inputs??[]) {
      if(String(input?.inferenceRole??'').startsWith('INCLUDE') && input.defaultValue===0) {
        result.issues.push(issue('BLANK_ZERO_DEFAULT','HARD',`${input.id} defaults to 0 although blank/unobserved must remain distinguishable`,{inputId:input.id}));
        raise(result,'FIX');
      }
    }
    for(const feature of adopted) {
      const refs=selectionInputRefs(feature);
      for(const ref of refs) if(!inputs.has(ref)) { result.issues.push(issue('SELECTION_INPUT_REF_MISSING','HARD',`${feature.featureId} references missing input ${ref}`,{featureId:feature.featureId,inputId:ref})); raise(result,'BLOCKED'); }
    }
    const shared=selection.denominatorSharingContract?.sharedGroups ?? [];
    for(const group of shared) {
      const expectedId=group.denominatorInputId ?? group.sharedDenominatorInputId ?? null;
      const featureIds=group.featureIds ?? group.memberFeatureIds ?? [];
      if(expectedId) for(const fid of featureIds){
        const f=(selection.features??[]).find(x=>x.featureId===fid);
        if(f && f.denominatorInputId!==expectedId){ result.issues.push(issue('DENOMINATOR_SHARING_MISMATCH','HARD',`${fid} does not use shared denominator ${expectedId}`,{featureId:fid})); raise(result,'FIX'); }
      }
    }
  }
  if (observation) {
    result.metrics.observationSchema=observation.schemaVersion ?? null;
    const vo=validateObservationObject(observation,`research/${id}/machine-observation-data.json`);
    if(!vo.ok){ for(const e of vo.errors) result.issues.push(issue('OBSERVATION_VALIDATION','HARD',e)); raise(result,'FIX'); }
    if(observation.schemaVersion==='machine-observation-data-v1') { result.issues.push(issue('OBSERVATION_LEGACY_V1','REVIEW','Observation remains in v1 compatibility mode')); raise(result,'RESEARCH_REOPEN'); }
    const reopen=(observation.researchReopenRequests??[]).filter(x=>x.status==='RESEARCH_REOPEN_REQUIRED');
    result.metrics.researchReopenOpen=reopen.length;
    if(reopen.length){ result.issues.push(issue('OPEN_RESEARCH_REOPEN','HARD',`${reopen.length} research reopen request(s) remain`)); raise(result,'RESEARCH_REOPEN'); }
    const field=(observation.fieldVerificationItems??[]).filter(x=>x.status==='WAITING_FOR_MACHINE');
    result.metrics.fieldVerificationWaiting=field.length;
    if(field.length){ result.issues.push(issue('FIELD_VERIFICATION_WAITING','FIELD',`${field.length} field verification item(s) remain`)); raise(result,'FIELD_VERIFY'); }
    if(selection && observation.schemaVersion==='machine-observation-data-v2') {
      const mappings=new Map((observation.featureMappings??[]).map(x=>[x.featureId,x]));
      for(const feature of adoptedFeatures(selection)) {
        const map=mappings.get(feature.featureId);
        if(!map){ result.issues.push(issue('ADOPTED_FEATURE_NO_OBSERVATION_MAPPING','HARD',`${feature.featureId} has no Observation mapping`,{featureId:feature.featureId})); raise(result,'RESEARCH_REOPEN'); continue; }
        if(map.mappingType==='UNRESOLVED'||map.usableForInference===false){ result.issues.push(issue('ADOPTED_FEATURE_OBSERVATION_UNUSABLE','HARD',`${feature.featureId} observation is ${map.mappingType}/usable=${map.usableForInference}`,{featureId:feature.featureId})); raise(result,'RESEARCH_REOPEN'); }
      }
    }
  }
  if (ui) {
    result.metrics.uiStatus=ui.status ?? null;
    const errors=validateUiDesignData(ui,{expectedMachineId:id});
    if(errors.length){ for(const e of errors) result.issues.push(issue('UI_VALIDATION','HARD',e)); raise(result,'FIX'); }
    const gate=gateUiDesignData(ui).gate;
    if(gate==='MANUAL_UI_REVIEW_REQUIRED'||gate==='PASS_WITH_UNRESOLVED'||gate==='DRAFT'){ result.issues.push(issue('UI_REVIEW_PENDING','FIELD',`UI gate=${gate}`)); raise(result,'FIELD_VERIFY'); }
    if(selection){
      for(const feature of adoptedFeatures(selection)) for(const ref of selectionInputRefs(feature)) {
        if(!ui.inputContracts?.[ref]) { result.issues.push(issue('ADOPTED_INPUT_NO_UI_ROUTE','HARD',`${feature.featureId}/${ref} has no canonical UI input contract`,{featureId:feature.featureId,inputId:ref})); raise(result,'FIX'); }
      }
    }
    const userText=[];
    for(const s of Object.values(ui.sections??{})) userText.push(s?.title,s?.description);
    for(const c of Object.values(ui.inputContracts??{})) userText.push(c?.name,c?.description);
    const internal=/\b(?:Gate|Feature|Evidence|schema|enum)\b/i;
    const hit=userText.filter(x=>typeof x==='string'&&internal.test(x));
    if(hit.length){ result.issues.push(issue('USER_FACING_INTERNAL_TERM','REVIEW',`Internal terminology appears in ${hit.length} UI text value(s)`)); raise(result,'FIX'); }
  }
  if (pkg) {
    if(pkg.machine?.machineId!==id){ result.issues.push(issue('PACKAGE_MACHINE_ID_MISMATCH','HARD',`package machineId=${pkg.machine?.machineId}`)); raise(result,'BLOCKED'); }
    if(entry.machineDataVersion!==pkg.machine?.machineDataVersion){ result.issues.push(issue('CATALOG_VERSION_MISMATCH','HARD',`catalog=${entry.machineDataVersion}, package=${pkg.machine?.machineDataVersion}`)); raise(result,'FIX'); }
    const actualSize=fs.statSync(pp).size, actualSha=sha256(pp);
    if(entry.packageSizeBytes!==actualSize){ result.issues.push(issue('CATALOG_SIZE_MISMATCH','HARD',`catalog=${entry.packageSizeBytes}, actual=${actualSize}`)); raise(result,'FIX'); }
    if(entry.sha256!==actualSha){ result.issues.push(issue('CATALOG_SHA_MISMATCH','HARD',`catalog sha256 differs from package`)); raise(result,'FIX'); }
    if(selection){
      const pInputs=packageInputs(pkg), pFeatures=packageFeatures(pkg);
      for(const feature of adoptedFeatures(selection)) {
        const pf=pFeatures.get(feature.featureId);
        if(!pf){ result.issues.push(issue('ADOPTED_FEATURE_NOT_MATERIALIZED','HARD',`${feature.featureId} missing from MachineData`,{featureId:feature.featureId})); raise(result,'FIX'); continue; }
        if(pf.probabilityEngineUsage===false || pf.calculationRole==='DISPLAY_ONLY'){ result.issues.push(issue('ADOPTED_FEATURE_NOT_IN_INFERENCE','HARD',`${feature.featureId} is materialized but excluded from inference`,{featureId:feature.featureId})); raise(result,'FIX'); }
        for(const ref of selectionInputRefs(feature)) if(!pInputs.has(ref)){ result.issues.push(issue('ADOPTED_INPUT_NOT_MATERIALIZED','HARD',`${feature.featureId}/${ref} missing from MachineData inputs`,{featureId:feature.featureId,inputId:ref})); raise(result,'FIX'); }
      }
      const evidenceGroups=selection.evidenceUi?.groups ?? [];
      if(evidenceGroups.length && (pkg.evidence?.evidences??[]).length===0){ result.issues.push(issue('EVIDENCE_NOT_MATERIALIZED','HARD','Selection has Evidence UI but MachineData has no evidences')); raise(result,'FIX'); }
    }
  }
  results.push(result);
}

const classCounts=Object.fromEntries(Object.keys(CLASS_RANK).map(k=>[k,results.filter(r=>r.classification===k).length]));
const coverage={};
for(const key of ['package','research','selection','observation','ui']) coverage[key]=results.filter(r=>r.coverage[key]).length;
const issueCounts={};
for(const r of results) for(const x of r.issues) issueCounts[x.code]=(issueCounts[x.code]??0)+1;
const report={
  schemaVersion:'cross-sectional-v7-audit-v1',
  generatedAt:new Date().toISOString(),
  branch:process.env.GITHUB_REF_NAME??null,
  canonicalMachineCount:results.length,
  excludedTestMachineCount:(catalog.machines??[]).filter(isTestMachine).length,
  classificationCounts:classCounts,
  coverage,
  issueCounts:Object.fromEntries(Object.entries(issueCounts).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))),
  classificationPolicy:{priority:['BLOCKED','RESEARCH_REOPEN','FIELD_VERIFY','FIX','GREEN'],note:'Diagnostic first pass. REVIEW heuristics are surfaced but only raise classification where explicitly coded.'},
  results
};
fs.mkdirSync(path.dirname(REPORT_JSON),{recursive:true});
fs.writeFileSync(REPORT_JSON,JSON.stringify(report,null,2)+'\n');

const rows=results.map(r=>`| ${r.machineId} | ${r.classification} | ${r.coverage.research?'✓':'—'} | ${r.coverage.selection?'✓':'—'} | ${r.coverage.observation?'✓':'—'} | ${r.coverage.ui?'✓':'—'} | ${r.coverage.package?'✓':'—'} | ${r.issues.map(x=>x.code).join(', ')||'—'} |`);
const topIssues=Object.entries(report.issueCounts).slice(0,20).map(([k,v])=>`- ${k}: ${v}`).join('\n')||'- none';
const md=`# SloAnalytica Cross-sectional Audit v7\n\nGenerated: ${report.generatedAt}\n\n## Summary\n\n- Canonical machines: ${report.canonicalMachineCount}\n- Excluded explicit test packages: ${report.excludedTestMachineCount}\n- GREEN: ${classCounts.GREEN}\n- FIX: ${classCounts.FIX}\n- FIELD_VERIFY: ${classCounts.FIELD_VERIFY}\n- RESEARCH_REOPEN: ${classCounts.RESEARCH_REOPEN}\n- BLOCKED: ${classCounts.BLOCKED}\n\n## Four-layer coverage\n\n- Research: ${coverage.research}/${results.length}\n- Selection: ${coverage.selection}/${results.length}\n- Observation: ${coverage.observation}/${results.length}\n- UI Design: ${coverage.ui}/${results.length}\n- MachinePackage: ${coverage.package}/${results.length}\n\n## Top issues\n\n${topIssues}\n\n## Machine matrix\n\n| machineId | class | Research | Selection | Observation | UI | Package | issues |\n|---|---|---:|---:|---:|---:|---:|---|\n${rows.join('\n')}\n`;
fs.writeFileSync(REPORT_MD,md);

console.log(JSON.stringify({canonicalMachineCount:report.canonicalMachineCount,classificationCounts:classCounts,coverage,issueCounts:report.issueCounts},null,2));
