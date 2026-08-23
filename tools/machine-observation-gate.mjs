#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { validateObservationObject } from './validate-machine-observation-data.mjs';

const root=process.cwd();
const researchRoot=path.join(root,'research');
const registryPath=path.join(root,'machine-registry.json');
const registry=fs.existsSync(registryPath)?JSON.parse(fs.readFileSync(registryPath,'utf8')):{machines:[]};
const byId=new Map((registry.machines??[]).map(m=>[m.machineId,m]));

function parseRange(){
  let from=null,to=null;
  for(const a of process.argv.slice(2)){
    if(a.startsWith('--from-id=')) from=Number(a.slice(10));
    if(a.startsWith('--to-id=')) to=Number(a.slice(8));
  }
  return {from:Number.isFinite(from)?from:null,to:Number.isFinite(to)?to:null};
}
function inRange(machineId,range){
  const id=byId.get(machineId)?.provisionalRegistrationId;
  if(range.from!=null && !(id>=range.from)) return false;
  if(range.to!=null && !(id<=range.to)) return false;
  return true;
}
function gateFor(data){
  if(data.schemaVersion==='machine-observation-data-v1'){
    const unresolved=['machineMenu','linkedService','predecessorData'].some(k=>data[k]?.status==='UNRESOLVED');
    return unresolved?'PASS_WITH_UNRESOLVED':'PASS';
  }
  if((data.researchReopenRequests??[]).some(r=>r.status==='RESEARCH_REOPEN_REQUIRED')) return 'RESEARCH_REOPEN_REQUIRED';
  const unresolvedCoverage=Object.values(data.sourceCoverage??{}).some(v=>v==='UNRESOLVED');
  const unresolvedObservation=(data.observations??[]).some(o=>o.status==='UNRESOLVED');
  const unresolvedMapping=(data.featureMappings??[]).some(m=>m.mappingType==='UNRESOLVED');
  const waiting=(data.fieldVerificationItems??[]).some(v=>v.status==='WAITING_FOR_MACHINE');
  return unresolvedCoverage||unresolvedObservation||unresolvedMapping||waiting?'PASS_WITH_UNRESOLVED':'PASS';
}

const range=parseRange();
const rows=[]; const errors=[];
if(fs.existsSync(researchRoot)) for(const entry of fs.readdirSync(researchRoot,{withFileTypes:true})){
  if(!entry.isDirectory()||entry.name.startsWith('_')||!inRange(entry.name,range)) continue;
  const file=path.join(researchRoot,entry.name,'machine-observation-data.json');
  if(!fs.existsSync(file)) continue;
  try{
    const data=JSON.parse(fs.readFileSync(file,'utf8'));
    const validation=validateObservationObject(data,path.relative(root,file));
    if(!validation.ok){ errors.push(...validation.errors); continue; }
    const meta=byId.get(entry.name)??{};
    rows.push({provisionalRegistrationId:meta.provisionalRegistrationId??null,machineId:entry.name,displayName:data.displayName??meta.displayName??entry.name,schemaVersion:data.schemaVersion,gate:gateFor(data)});
  }catch(e){ errors.push(`${entry.name}: ${e.message}`); }
}
rows.sort((a,b)=>(a.provisionalRegistrationId??Number.MAX_SAFE_INTEGER)-(b.provisionalRegistrationId??Number.MAX_SAFE_INTEGER)||a.machineId.localeCompare(b.machineId));
if(errors.length){ for(const e of errors) console.error(`ERROR: ${e}`); process.exit(1); }
const counts={PASS:0,PASS_WITH_UNRESOLVED:0,RESEARCH_REOPEN_REQUIRED:0}; for(const r of rows) counts[r.gate]++;
console.log('Machine Observation Gate');
console.log(JSON.stringify({machines:rows.length,...counts},null,2));
for(const r of rows) console.log(`- provisionalId=${r.provisionalRegistrationId??'-'} | ${r.gate} | ${r.machineId} | ${r.displayName}`);
if(counts.RESEARCH_REOPEN_REQUIRED>0) process.exitCode=2;
