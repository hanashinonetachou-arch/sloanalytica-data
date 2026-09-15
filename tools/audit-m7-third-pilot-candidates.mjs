import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const researchRoot = path.join(ROOT, 'research');
const readJson = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const exists = p => fs.existsSync(p);
const dirs = fs.readdirSync(researchRoot, {withFileTypes:true}).filter(d=>d.isDirectory()).map(d=>d.name).sort();
const migrated=[]; const legacy=[];
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
  const denied=options.filter(x=>Array.isArray(x.option.deniedSettings)&&x.option.deniedSettings.length);
  const normalizationExplicit=groups.every(g=>typeof g.normalizationSemantics==='string'&&g.normalizationSemantics.length>0);
  const evidenceInputIds=new Set();
  for(const g of groups){ if(g.inputId)evidenceInputIds.add(g.inputId); }
  const uiSections=ui?.sections||{};
  const placed=[...evidenceInputIds].filter(id=>Object.values(uiSections).some(s=>Array.isArray(s?.inputIds)&&s.inputIds.includes(id)));
  const canonicalPlacementExplicit=evidenceInputIds.size>0 && placed.length===evidenceInputIds.size;
  const observationText=JSON.stringify(obs||{});
  const observationExplicit=sourceIds.length>0 && sourceIds.every(id=>observationText.includes(id)) || Boolean(obs && JSON.stringify(obs).includes('EVIDENCE'));
  const researchText=JSON.stringify(res||{});
  const lineageExplicit=sourceIds.length>0 && sourceIds.every(id=>researchText.includes(id));
  const featureSharingExplicit=groups.every(g=>g.featureSharing==='NONE'||g.featureSharing==='EXPLICIT'||Array.isArray(g.sharedFeatureIds));
  const gaps=[];
  if(!lineageExplicit)gaps.push('RESEARCH_LINEAGE');
  if(!normalizationExplicit)gaps.push('NORMALIZATION');
  if(!observationExplicit)gaps.push('OBSERVATION');
  if(!canonicalPlacementExplicit)gaps.push('CANONICAL_UI');
  if(!featureSharingExplicit)gaps.push('FEATURE_SHARING');
  legacy.push({machineId,groupCount:groups.length,evidenceCount:options.length,groupIds:groups.map(g=>g.groupId),hasDeniedSettings:denied.length>0,deniedEvidenceCount:denied.length,proof:{lineageExplicit,normalizationExplicit,observationExplicit,canonicalPlacementExplicit,featureSharingExplicit},gaps});
}
const report={schemaVersion:'m7-third-pilot-candidate-audit-v1',generatedAt:new Date().toISOString(),legacyMachines:legacy.length,legacyGroups:legacy.reduce((n,x)=>n+x.groupCount,0),legacyEvidence:legacy.reduce((n,x)=>n+x.evidenceCount,0),alreadyMigrated:migrated,deniedCandidates:legacy.filter(x=>x.hasDeniedSettings),formalProofComplete:legacy.filter(x=>x.gaps.length===0),machines:legacy};
fs.mkdirSync(path.join(ROOT,'tmp'),{recursive:true});
fs.writeFileSync(path.join(ROOT,'tmp','m7-third-pilot-candidates.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
