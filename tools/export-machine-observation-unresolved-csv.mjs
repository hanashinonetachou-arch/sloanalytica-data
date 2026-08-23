#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const researchRoot=path.join(root,'research');
const registry=JSON.parse(fs.readFileSync(path.join(root,'machine-registry.json'),'utf8'));
const byId=new Map((registry.machines??[]).map(m=>[m.machineId,m]));
const args=process.argv.slice(2);
const getNum=(name)=>{const a=args.find(x=>x.startsWith(`--${name}=`)); if(!a) return null; const n=Number(a.slice(name.length+3)); return Number.isFinite(n)?n:null;};
const from=getNum('from-id'), to=getNum('to-id');
const outArg=args.find(x=>x.startsWith('--out='));
const outPath=path.resolve(root,outArg?outArg.slice(6):'reports/observation-unresolved.csv');
const csv=v=>`"${String(v??'').replaceAll('"','""')}"`;
const rows=[];
function include(machineId){ const id=byId.get(machineId)?.provisionalRegistrationId; if(from!=null&&!(id>=from)) return false; if(to!=null&&!(id<=to)) return false; return true; }
function pushBase(machineId,displayName,releaseDate,sourceType,observationId,status,question,priority,uiImpact,notes){
  const m=byId.get(machineId)??{};
  rows.push({provisionalRegistrationId:m.provisionalRegistrationId??'',registrationId:m.registrationId??'',machineId,displayName:displayName??m.displayName??machineId,releaseDate:releaseDate??m.releaseDate??'',releaseDateStatus:m.releaseDateStatus??'',sourceType,observationId,status,verificationQuestion:question??'',priority:priority??'',uiImpact:uiImpact??'',notes:notes??''});
}
if(fs.existsSync(researchRoot)) for(const entry of fs.readdirSync(researchRoot,{withFileTypes:true})){
  if(!entry.isDirectory()||entry.name.startsWith('_')||!include(entry.name)) continue;
  const file=path.join(researchRoot,entry.name,'machine-observation-data.json'); if(!fs.existsSync(file)) continue;
  let d; try{d=JSON.parse(fs.readFileSync(file,'utf8'));}catch{continue;}
  if(d.schemaVersion==='machine-observation-data-v1'){
    for(const [key,source] of [['machineMenu','MACHINE_MENU'],['linkedService','LINKED_SERVICE'],['predecessorData','SEATED_STATE']]) if(d[key]?.status==='UNRESOLVED') pushBase(entry.name,d.displayName,null,source,`LEGACY_${key.toUpperCase()}`,'UNRESOLVED',d[key]?.notes,'MEDIUM','UNKNOWN',d[key]?.notes);
    continue;
  }
  for(const [key,status] of Object.entries(d.sourceCoverage??{})) if(status==='UNRESOLVED') pushBase(entry.name,d.displayName,d.releaseDate,String(key).toUpperCase(),'SOURCE_COVERAGE','UNRESOLVED',`公開情報だけでは ${key} の確認が完了していません。`,'MEDIUM','UNKNOWN','');
  for(const o of d.observations??[]) if(o.status==='UNRESOLVED') pushBase(entry.name,d.displayName,d.releaseDate,o.sourceType,o.observationId,'UNRESOLVED',o.notes||o.label,'MEDIUM','UNKNOWN',o.notes);
  for(const m of d.featureMappings??[]) if(m.mappingType==='UNRESOLVED') pushBase(entry.name,d.displayName,d.releaseDate,'FEATURE_MAPPING',m.featureId,'UNRESOLVED',m.notes||`${m.featureId} の観測方法を確定する。`,'HIGH','INFERENCE',m.notes);
  for(const v of d.fieldVerificationItems??[]) if(v.status==='WAITING_FOR_MACHINE') pushBase(entry.name,d.displayName,d.releaseDate,v.sourceType,v.verificationId,'WAITING_FOR_MACHINE',v.question,v.priority,v.uiImpact??'UNKNOWN',v.notes);
}
rows.sort((a,b)=>Number(a.provisionalRegistrationId||1e9)-Number(b.provisionalRegistrationId||1e9)||a.machineId.localeCompare(b.machineId));
const headers=['provisionalRegistrationId','registrationId','machineId','displayName','releaseDate','releaseDateStatus','sourceType','observationId','status','verificationQuestion','priority','uiImpact','notes'];
fs.mkdirSync(path.dirname(outPath),{recursive:true});
fs.writeFileSync(outPath,[headers.join(','),...rows.map(r=>headers.map(h=>csv(r[h])).join(','))].join('\n')+'\n');
console.log(`Observation unresolved CSV: ${path.relative(root,outPath)} (${rows.length} rows)`);
