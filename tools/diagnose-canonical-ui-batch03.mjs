#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
const ROOT=process.cwd();
const rr=path.join(ROOT,'research');
const mr=path.join(ROOT,'machines');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const exists=p=>fs.existsSync(p);
const missing=[];
for(const ent of fs.readdirSync(rr,{withFileTypes:true})){
  if(!ent.isDirectory()||ent.name.endsWith('_TEST_V66')) continue;
  const id=ent.name, d=path.join(rr,id);
  if(!exists(path.join(d,'selection-data.json'))) continue;
  if(exists(path.join(d,'ui-design-data.json'))) continue;
  const sel=read(path.join(d,'selection-data.json'));
  const obs=exists(path.join(d,'machine-observation-data.json'))?read(path.join(d,'machine-observation-data.json')):null;
  const pkg=exists(path.join(mr,id,'machine-package.json'))?read(path.join(mr,id,'machine-package.json')):null;
  const evidenceInputIds=[...new Set((sel.evidence??[]).map(x=>x.inputId).filter(Boolean))];
  const adopted=new Set();
  for(const f of sel.features??[]){
    if(!String(f.adoptionCategory??'').startsWith('INCLUDE')) continue;
    if(f.denominatorInputId) adopted.add(f.denominatorInputId);
    if(f.numeratorInputId) adopted.add(f.numeratorInputId);
    for(const x of f.categoryInputIds??[]) adopted.add(x);
  }
  const uiIds=new Set();
  for(const s of pkg?.ui?.sections??[]) for(const it of s.items??[]) if(it?.type==='input'&&it.inputId) uiIds.add(it.inputId);
  missing.push({machineId:id,observationSchema:obs?.schemaVersion??null,sectionCount:pkg?.ui?.sections?.length??0,adoptedInputCount:adopted.size,missingAdoptedInputIds:[...adopted].filter(x=>!uiIds.has(x)),evidenceInputCount:evidenceInputIds.length,missingEvidenceInputIds:evidenceInputIds.filter(x=>!uiIds.has(x))});
}
missing.sort((a,b)=>a.machineId.localeCompare(b.machineId));
const auditText=fs.readFileSync(path.join(ROOT,'tools','audit-selection-policy-migration.mjs'),'utf8');
const marker='const REVIEWED_ACTIVE_FEATURE_REMOVALS={';
const start=auditText.indexOf(marker);
const reviewed=[];
if(start>=0){
  const tail=auditText.slice(start+marker.length);
  const end=tail.indexOf('\n};');
  const block=end>=0?tail.slice(0,end):tail;
  for(const m of block.matchAll(/^\s*([A-Z0-9_]+):\{/gm)) reviewed.push(m[1]);
}
const out={schemaVersion:'batch03-diagnostic-v1',generatedAt:new Date().toISOString(),missingCanonicalUiCount:missing.length,reviewedSafetyRemovalExceptionCount:reviewed.length,reviewedSafetyRemovalMachineIds:reviewed,eligibleNoEvidenceNoException:missing.filter(x=>x.observationSchema==='machine-observation-data-v2'&&x.sectionCount>0&&!x.missingAdoptedInputIds.length&&x.evidenceInputCount===0&&!reviewed.includes(x.machineId)).map(x=>x.machineId),machines:missing};
fs.mkdirSync(path.join(ROOT,'reports'),{recursive:true});
fs.writeFileSync(path.join(ROOT,'reports','batch03-canonical-ui-diagnostic.json'),JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify({missingCanonicalUiCount:out.missingCanonicalUiCount,reviewedSafetyRemovalExceptionCount:out.reviewedSafetyRemovalExceptionCount,eligibleNoEvidenceNoExceptionCount:out.eligibleNoEvidenceNoException.length,first20:out.eligibleNoEvidenceNoException.slice(0,20),reviewed:reviewed},null,2));
