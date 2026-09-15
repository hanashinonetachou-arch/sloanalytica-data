import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const researchRoot = path.join(ROOT, 'research');
const readJson = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const exists = p => fs.existsSync(p);
const dirs = fs.readdirSync(researchRoot, {withFileTypes:true}).filter(d=>d.isDirectory()).map(d=>d.name).sort();
const migrated=[]; const legacy=[];
const settingValues = new Set(['SET_1','SET_2','SET_3','SET_4','SET_5','SET_6']);

function evidenceObservationProof(obs) {
  if (!obs || !Array.isArray(obs.observations)) return false;
  return obs.observations.some(o => o?.status === 'FOUND' && (
    String(o.observationId || '').includes('EVIDENCE') ||
    (Array.isArray(o.categories) && o.categories.some(c => /設定|確定|否定|トロフィー|終了画面|示唆/.test(String(c))))
  ));
}

function canonicalUiProof(ui, groups) {
  const contracts = ui?.evidenceContracts;
  if (!contracts || typeof contracts !== 'object') return false;
  const sections = ui?.sections || {};
  const placedEvidenceIds = new Set(Object.values(sections).flatMap(s => Array.isArray(s?.evidenceIds) ? s.evidenceIds : []));
  return groups.every(g => Object.entries(contracts).some(([evidenceId,c]) =>
    c?.sourceEvidenceGroupId === g.groupId && placedEvidenceIds.has(evidenceId)
  ));
}

function normalizationProof(groups) {
  return groups.every(g => {
    if (typeof g.normalizationSemantics === 'string' && g.normalizationSemantics.length > 0) return true;
    if (typeof g.normalizationMode === 'string' && g.normalizationMode.length > 0) return true;
    return false;
  });
}

function sharingClassification(sel, groups) {
  if (groups.every(g => g.featureSharing === 'NONE' || g.featureSharing === 'EXPLICIT' || Array.isArray(g.sharedFeatureIds))) {
    return {explicit:true, classification:'EXPLICIT'};
  }
  const featureInputIds = new Set((sel?.features || []).flatMap(f => [f?.inputId,f?.numeratorInputId,f?.denominatorInputId]).filter(Boolean));
  const groupInputIds = new Set(groups.map(g => g?.inputId).filter(Boolean));
  const directInputOverlap = [...groupInputIds].some(id => featureInputIds.has(id));
  return {explicit:false, classification: directInputOverlap ? 'POTENTIAL_SHARED_INPUT' : 'REVIEW_REQUIRED'};
}

for (const machineId of dirs) {
  const selPath=path.join(researchRoot,machineId,'selection-data.json');
  if(!exists(selPath)) continue;
  let sel; try { sel=readJson(selPath); } catch { continue; }
  if(sel?.evidence?.contractVersion==='selection-evidence-v2' || sel?.evidenceContract?.contractVersion==='selection-evidence-v2' || sel?.evidence?.version==='selection-evidence-v2') { migrated.push(machineId); continue; }
  const groups=sel?.evidenceUi?.groups;
  if(!Array.isArray(groups)||!groups.length) continue;
  const uiPath=path.join(researchRoot,machineId,'ui-design-data.json');
  const obsPath=path.join(researchRoot,machineId,'machine-observation-data.json');
  const researchPath=path.join(researchRoot,machineId,'research-data.json');
  let ui=null,obs=null,res=null;
  try{if(exists(uiPath))ui=readJson(uiPath)}catch{}
  try{if(exists(obsPath))obs=readJson(obsPath)}catch{}
  try{if(exists(researchPath))res=readJson(researchPath)}catch{}
  const options=groups.flatMap(g=>(g.options||[]).map(o=>({groupId:g.groupId,group:g,option:o})));
  const sourceIds=options.flatMap(x=>x.option.sourceEvidenceIds||[]);
  const denied=options.filter(x=>
    (Array.isArray(x.option.deniedSettings)&&x.option.deniedSettings.length) ||
    (Array.isArray(x.option.excludedSettings)&&x.option.excludedSettings.length)
  );
  const normalizationExplicit=normalizationProof(groups);
  const canonicalPlacementExplicit=canonicalUiProof(ui, groups);
  const observationExplicit=evidenceObservationProof(obs);
  const researchText=JSON.stringify(res||{});
  const lineageExplicit=sourceIds.length>0 && sourceIds.every(id=>researchText.includes(id));
  const sharing=sharingClassification(sel, groups);
  const featureSharingExplicit=sharing.explicit;
  const gaps=[];
  if(!lineageExplicit)gaps.push('RESEARCH_LINEAGE');
  if(!normalizationExplicit)gaps.push('NORMALIZATION');
  if(!observationExplicit)gaps.push('OBSERVATION');
  if(!canonicalPlacementExplicit)gaps.push('CANONICAL_UI');
  if(!featureSharingExplicit)gaps.push('FEATURE_SHARING');
  legacy.push({machineId,groupCount:groups.length,evidenceCount:options.length,groupIds:groups.map(g=>g.groupId),hasDeniedSettings:denied.length>0,deniedEvidenceCount:denied.length,featureSharingClassification:sharing.classification,proof:{lineageExplicit,normalizationExplicit,observationExplicit,canonicalPlacementExplicit,featureSharingExplicit},gaps});
}
const gapHistogram={};
for(const x of legacy) for(const gap of x.gaps) gapHistogram[gap]=(gapHistogram[gap]||0)+1;
const report={schemaVersion:'m7-third-pilot-candidate-audit-v2',generatedAt:new Date().toISOString(),legacyMachines:legacy.length,legacyGroups:legacy.reduce((n,x)=>n+x.groupCount,0),legacyEvidence:legacy.reduce((n,x)=>n+x.evidenceCount,0),alreadyMigrated:migrated,deniedCandidates:legacy.filter(x=>x.hasDeniedSettings),formalProofComplete:legacy.filter(x=>x.gaps.length===0),featureSharingOnly:legacy.filter(x=>x.gaps.length===1&&x.gaps[0]==='FEATURE_SHARING'),gapHistogram,machines:legacy};
fs.mkdirSync(path.join(ROOT,'tmp'),{recursive:true});
fs.writeFileSync(path.join(ROOT,'tmp','m7-third-pilot-candidates.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
