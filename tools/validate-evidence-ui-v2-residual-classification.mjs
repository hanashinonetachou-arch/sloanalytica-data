#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const classificationPath='EVIDENCE_UI_V2_PHASE2_RESIDUAL_CLASSIFICATION.json';
const data=JSON.parse(fs.readFileSync(classificationPath,'utf8'));
if(data.schemaVersion!=='evidence-ui-v2-phase2-residual-classification-v1') throw new Error('unexpected classification schemaVersion');
const allowed=new Set(['REVIEW','RESEARCH_REOPEN']);
const entries=data.residuals??[];
const ids=entries.map(x=>x.machineId);
if(new Set(ids).size!==ids.length) throw new Error('duplicate machineId in residual classification');
for(const x of entries){
  if(!allowed.has(x.classification)) throw new Error(`${x.machineId}: residual classification must be REVIEW or RESEARCH_REOPEN`);
  if(!x.blockingLayer||!x.reason||!x.requiredUpstreamAction) throw new Error(`${x.machineId}: incomplete residual classification`);
  for(const file of ['research-data.json','selection-data.json','ui-design-data.json']){
    if(!fs.existsSync(path.join('research',x.machineId,file))) throw new Error(`${x.machineId}: missing ${file}`);
  }
}

const residual=[];
for(const ent of fs.readdirSync('research',{withFileTypes:true})){
  if(!ent.isDirectory()) continue;
  const id=ent.name;
  const sp=path.join('research',id,'selection-data.json');
  if(!fs.existsSync(sp)) continue;
  const s=JSON.parse(fs.readFileSync(sp,'utf8'));
  const groups=s.evidenceUi?.groups??[];
  const legacyGroup=groups.some(g=>g.groupId==='SETTING_FLOOR'||g.label==='確認した設定下限');
  const legacyInput=(s.inputs??[]).some(i=>i.id==='INP_SETTING_FLOOR'||i.id==='INP_EVI_SETTING_FLOOR'||i.name==='確認した設定下限');
  const legacyEvidence=(s.evidence??[]).some(e=>e.inputId==='INP_SETTING_FLOOR'||e.inputId==='INP_EVI_SETTING_FLOOR');
  if(legacyGroup||legacyInput||legacyEvidence) residual.push(id);
}
residual.sort();
const classified=[...ids].sort();
if(JSON.stringify(residual)!==JSON.stringify(classified)){
  const missing=residual.filter(x=>!classified.includes(x));
  const stale=classified.filter(x=>!residual.includes(x));
  throw new Error(`residual/classification mismatch: unclassified=${JSON.stringify(missing)} stale=${JSON.stringify(stale)}`);
}
const counts=entries.reduce((a,x)=>(a[x.classification]=(a[x.classification]??0)+1,a),{});
console.log(JSON.stringify({status:'PASS',residualCount:residual.length,counts,residual},null,2));
