#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT=process.cwd();
const researchRoot=path.join(ROOT,'research');
const machineRoot=path.join(ROOT,'machines');
const outPath=path.join(ROOT,'reports','missing-canonical-ui-v7-classification.json');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const exists=p=>fs.existsSync(p);

function adoptedInputIds(selection){
  const ids=new Set();
  for(const f of selection.features??[]){
    if(!String(f.adoptionCategory??'').startsWith('INCLUDE')) continue;
    for(const k of ['denominatorInputId','numeratorInputId']) if(f[k]) ids.add(f[k]);
    for(const id of f.categoryInputIds??[]) if(id) ids.add(id);
  }
  return [...ids].sort();
}
function uiInputIds(pkg){
  const ids=new Set();
  for(const s of pkg.ui?.sections??[]){
    for(const item of s.items??[]) if(item?.type==='input'&&item.inputId) ids.add(item.inputId);
  }
  return [...ids].sort();
}
function evidenceInputIds(selection){
  return [...new Set((selection.evidence??[]).map(x=>x.inputId).filter(Boolean))].sort();
}

const rows=[];
for(const ent of fs.readdirSync(researchRoot,{withFileTypes:true})){
  if(!ent.isDirectory()) continue;
  const id=ent.name;
  if(id.endsWith('_TEST_V66')) continue;
  const dir=path.join(researchRoot,id);
  const selectionPath=path.join(dir,'selection-data.json');
  const uiPath=path.join(dir,'ui-design-data.json');
  if(!exists(selectionPath)||exists(uiPath)) continue;
  const packagePath=path.join(machineRoot,id,'machine-package.json');
  const observationPath=path.join(dir,'machine-observation-data.json');
  if(!exists(packagePath)) continue;
  const selection=read(selectionPath); const pkg=read(packagePath);
  const observation=exists(observationPath)?read(observationPath):null;
  const adopted=adoptedInputIds(selection); const uiIds=uiInputIds(pkg);
  const uiSet=new Set(uiIds); const missingAdopted=adopted.filter(x=>!uiSet.has(x));
  const evidence=evidenceInputIds(selection); const missingEvidence=evidence.filter(x=>!uiSet.has(x));
  const sectionCount=pkg.ui?.sections?.length??0;
  let classification='AUTO_CANONICALIZE';
  const reasons=[];
  if(!observation||observation.schemaVersion!=='machine-observation-data-v2'){
    classification='REVIEW_OBSERVATION'; reasons.push('Observation v2 unavailable');
  }
  if(sectionCount===0){classification='REVIEW_EMPTY_PACKAGE_UI'; reasons.push('MachinePackage UI has no sections');}
  if(missingAdopted.length){classification='REVIEW_FEATURE_ROUTE'; reasons.push(`${missingAdopted.length} adopted input(s) absent from package UI`);}
  rows.push({machineId:id,classification,sectionCount,adoptedInputCount:adopted.length,missingAdoptedInputIds:missingAdopted,evidenceInputCount:evidence.length,missingEvidenceInputIds:missingEvidence,observationSchema:observation?.schemaVersion??null});
}
rows.sort((a,b)=>a.classification.localeCompare(b.classification)||a.machineId.localeCompare(b.machineId));
const counts={}; for(const r of rows) counts[r.classification]=(counts[r.classification]??0)+1;
const out={schemaVersion:'missing-canonical-ui-v7-classification-v1',generatedAt:new Date().toISOString(),machineCount:rows.length,classificationCounts:counts,policy:{AUTO_CANONICALIZE:'Observation v2 exists, MachinePackage UI has sections, and every adopted Feature input already has a visible package UI route. Canonicalization can preserve existing UI semantics without changing inference.',note:'Evidence input gaps are reported separately and do not by themselves authorize automatic redesign.'},machines:rows};
fs.mkdirSync(path.dirname(outPath),{recursive:true});
fs.writeFileSync(outPath,JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify({machineCount:rows.length,classificationCounts:counts,autoEvidenceGaps:rows.filter(x=>x.classification==='AUTO_CANONICALIZE'&&x.missingEvidenceInputIds.length).length},null,2));
