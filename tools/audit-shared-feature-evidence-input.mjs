#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT=process.cwd();
const TARGETS=[
  'S_MOMOKYUN_SWORD_DX','S_SHIN_ORE_NO_SORA_ST','S_MORE_CHIBARIYO_NB_30','S_OKIDOKI_GOLD_GS',
  'L_SALARYMAN_KINTARO_ET','L_NYANKO_DAISENSO_CHOSHINSOKU_KB','L_NANATSU_NO_MAKEN_PU',
  'L_DISCUP_ULTRA_REMIX_XR','L_STAR_HANAHANA_MX','L_SHIN_EVANGELION',
];
const INCLUDE=new Set(['INCLUDE_PRIMARY','INCLUDE_SUPPORT','INCLUDE_FALLBACK']);
// These are established user-facing pachislot terms/acronyms, not internal enum leakage.
const USER_FACING_TOKENS=new Set(['BIG','REG','AT','CZ','ST','ART','BT','RB','BB']);
const readJson=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const arr=v=>Array.isArray(v)?v:[];
const uniq=v=>[...new Set(v.filter(Boolean))];
const eventInputs=f=>uniq([f?.numeratorInputId,...arr(f?.numeratorInputIds),...arr(f?.categoryInputIds),...arr(f?.optionalCategoryInputIds)]);
const hasNumericResearch=f=>{
  const values=Object.values(f?.settingValues??{}).filter(v=>v&&typeof v==='object');
  const dists=Object.values(f?.settingDistributions??{}).filter(v=>v&&typeof v==='object');
  return values.length>=2 || dists.length>=2;
};
const collectResearchTargets=(node,out=[])=>{
  if(Array.isArray(node)){ for(const v of node) collectResearchTargets(v,out); return out; }
  if(!node||typeof node!=='object') return out;
  if(Array.isArray(node.researchTarget)) out.push(node.researchTarget.filter(x=>typeof x==='string'));
  for(const v of Object.values(node)) collectResearchTargets(v,out);
  return out;
};
const rawTokenLeak=(name,categories)=>{
  if(typeof name!=='string') return false;
  for(const c of categories){
    if(typeof c==='string' && /^[A-Z][A-Z0-9_]{2,}$/.test(c) && !USER_FACING_TOKENS.has(c) && name.includes(c)) return true;
  }
  const tokens=name.match(/(?:^|[\s（(])([A-Z][A-Z0-9_]{2,})(?=$|[\s）)])/gu)??[];
  return tokens.some(raw=>{
    const token=raw.trim().replace(/^[（(]/u,'').replace(/[）)]$/u,'');
    return !USER_FACING_TOKENS.has(token);
  });
};

const report={schemaVersion:'shared-feature-evidence-horizontal-audit-v1',generatedAt:new Date().toISOString(),targets:[],summary:{PASS:0,REVIEW:0,HIGH_RISK:0},issues:[]};
for(const machineId of TARGETS){
  const base=path.join(ROOT,'research',machineId);
  const researchPath=path.join(base,'research-data.json');
  const selectionPath=path.join(base,'selection-data.json');
  const packagePath=path.join(ROOT,'machines',machineId,'machine-package.json');
  const uiPath=path.join(base,'ui-design-data.json');
  if(!fs.existsSync(researchPath)||!fs.existsSync(selectionPath)){
    report.issues.push({severity:'HIGH_RISK',machineId,code:'MISSING_AUDIT_INPUT',detail:'research-data.json or selection-data.json missing'});
    continue;
  }
  const research=readJson(researchPath),selection=readJson(selectionPath);
  const pkg=fs.existsSync(packagePath)?readJson(packagePath):null;
  const ui=fs.existsSync(uiPath)?readJson(uiPath):null;
  const rfById=new Map(arr(research.features).map(f=>[f.researchFeatureId,f]));
  const reById=new Map(arr(research.evidenceCandidates).map(e=>[e.researchEvidenceId,e]));
  const sfByResearchId=new Map(arr(selection.features).map(f=>[f.researchFeatureId,f]));
  const seByResearchId=new Map(arr(selection.evidence).filter(e=>e.researchEvidenceId).map(e=>[e.researchEvidenceId,e]));
  const pkgFeatures=arr(pkg?.features?.features),pkgEvidence=arr(pkg?.evidence?.evidences);
  const machineIssues=[];

  const targetSets=collectResearchTargets(research.discoveryInventory??research);
  const pairs=new Map();
  for(const ids of targetSets){
    const rfs=ids.filter(id=>rfById.has(id)),res=ids.filter(id=>reById.has(id));
    for(const rf of rfs) for(const re of res) pairs.set(`${rf}::${re}`,{researchFeatureId:rf,researchEvidenceId:re});
  }
  for(const {researchFeatureId,researchEvidenceId} of pairs.values()){
    const rf=rfById.get(researchFeatureId),sf=sfByResearchId.get(researchFeatureId),se=seByResearchId.get(researchEvidenceId);
    if(!sf||!se||!hasNumericResearch(rf)) continue;
    if(!INCLUDE.has(sf.adoptionCategory)){
      machineIssues.push({severity:'REVIEW',code:'SHARED_SURFACE_NUMERIC_FEATURE_EXCLUDED',researchFeatureId,researchEvidenceId,featureId:sf.featureId,evidenceId:se.evidenceId,userReason:sf.userReason??null});
      continue;
    }
    const events=eventInputs(sf);
    if(!events.includes(se.inputId)) machineIssues.push({severity:'REVIEW',code:'SHARED_SURFACE_SEPARATE_INPUTS',researchFeatureId,researchEvidenceId,featureId:sf.featureId,evidenceId:se.evidenceId,featureEventInputs:events,evidenceInputId:se.inputId});
  }

  for(const e of arr(selection.evidence)){
    const declared=uniq(arr(e.sharedFeatureIds));
    if(!declared.length) continue;
    for(const featureId of declared){
      const sf=arr(selection.features).find(f=>f.featureId===featureId);
      if(!sf||!INCLUDE.has(sf.adoptionCategory)||!eventInputs(sf).includes(e.inputId)) machineIssues.push({severity:'HIGH_RISK',code:'INVALID_SELECTION_SHARED_CONTRACT',evidenceId:e.evidenceId,inputId:e.inputId,sharedFeatureId:featureId});
    }
    const pe=pkgEvidence.find(x=>x.id===e.evidenceId);
    if(pkg && (!pe || JSON.stringify(uniq(arr(pe.sharedFeatureIds)).sort())!==JSON.stringify(declared.slice().sort()))) machineIssues.push({severity:'HIGH_RISK',code:'SHARED_CONTRACT_NOT_PROPAGATED',evidenceId:e.evidenceId,selectionSharedFeatureIds:declared,packageSharedFeatureIds:uniq(arr(pe?.sharedFeatureIds))});
  }

  const featureUsers=new Map();
  for(const f of pkgFeatures) for(const inputId of eventInputs(f)){
    if(!featureUsers.has(inputId)) featureUsers.set(inputId,[]);
    featureUsers.get(inputId).push(f.featureId);
  }
  for(const e of pkgEvidence){
    const overlaps=uniq(featureUsers.get(e.inputId)??[]);
    if(!overlaps.length) continue;
    const declared=uniq(arr(e.sharedFeatureIds));
    if(!overlaps.every(id=>declared.includes(id))) machineIssues.push({severity:'HIGH_RISK',code:'UNDECLARED_PACKAGE_FEATURE_EVIDENCE_OVERLAP',evidenceId:e.id,inputId:e.inputId,featureIds:overlaps,sharedFeatureIds:declared});
  }

  const researchCategories=uniq(arr(research.features).flatMap(f=>arr(f.categories)));
  for(const input of arr(selection.inputs)) if(rawTokenLeak(input.name,researchCategories)) machineIssues.push({severity:'REVIEW',code:'USER_FACING_INTERNAL_TOKEN',inputId:input.id,name:input.name});
  const uiStrings=[];
  const walkUi=node=>{
    if(Array.isArray(node)) return node.forEach(walkUi);
    if(!node||typeof node!=='object') return;
    for(const [k,v] of Object.entries(node)){
      if(typeof v==='string' && /(label|title|name|display)/i.test(k)) uiStrings.push({key:k,value:v});
      else walkUi(v);
    }
  };
  if(ui) walkUi(ui);
  for(const s of uiStrings) if(rawTokenLeak(s.value,researchCategories)) machineIssues.push({severity:'REVIEW',code:'UI_INTERNAL_TOKEN',key:s.key,value:s.value});

  const severity=machineIssues.some(i=>i.severity==='HIGH_RISK')?'HIGH_RISK':machineIssues.some(i=>i.severity==='REVIEW')?'REVIEW':'PASS';
  report.targets.push({machineId,severity,issueCount:machineIssues.length});
  report.summary[severity]++;
  report.issues.push(...machineIssues.map(i=>({machineId,...i})));
}
const outPath=path.join(ROOT,'reports/shared-feature-evidence-horizontal-audit.json');
fs.mkdirSync(path.dirname(outPath),{recursive:true});
fs.writeFileSync(outPath,JSON.stringify(report,null,2)+'\n');
console.log(`Shared Feature/Evidence Horizontal Audit: PASS ${report.summary.PASS} / REVIEW ${report.summary.REVIEW} / HIGH_RISK ${report.summary.HIGH_RISK} / TOTAL ${TARGETS.length}`);
for(const t of report.targets) if(t.severity!=='PASS') console.log(`${t.severity}: ${t.machineId} (${t.issueCount})`);
const counts={}; for(const i of report.issues) counts[i.code]=(counts[i.code]??0)+1;
console.log(JSON.stringify({summary:report.summary,issueCounts:counts,report:outPath},null,2));
process.exitCode=report.summary.HIGH_RISK>0?1:0;
