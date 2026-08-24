#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const researchRoot=path.join(root,'research');
const reportPathArg=process.argv.find(a=>a.startsWith('--json-out='));
const reportPath=reportPathArg?reportPathArg.slice('--json-out='.length):null;
const CHECKED=new Set(['checked','available','confirmed']);
const NOT_AVAILABLE=new Set(['not_available','not-available','unavailable','none','unavailable_or_ended']);
const UNRESOLVED=new Set(['unresolved','unknown','pending','not_checked','not-checked','not_confirmed']);
const PARTIAL=new Set(['partially_confirmed','partial','partially_checked']);

function normalizeLegacy(block){
  if(!block||typeof block!=='object') return 'MISSING';
  const s=String(block.status??'').trim().toLowerCase();
  if(!s) return 'PRESENT_STATUS_MISSING';
  if(CHECKED.has(s)) return 'CHECKED';
  if(NOT_AVAILABLE.has(s)) return 'NOT_AVAILABLE';
  if(UNRESOLVED.has(s)) return 'UNRESOLVED';
  if(PARTIAL.has(s)) return 'PARTIALLY_CHECKED';
  return `OTHER:${s}`;
}
function normalizeV1(block){
  const s=String(block?.status??'').trim().toUpperCase();
  return ['CHECKED','NOT_AVAILABLE','UNRESOLVED'].includes(s)?s:(s?`OTHER:${s}`:'PRESENT_STATUS_MISSING');
}
function normalizeV2(status){
  const s=String(status??'').trim().toUpperCase();
  if(['FOUND','VERIFIED_ON_MACHINE'].includes(s)) return 'CHECKED';
  if(s==='CHECKED_NONE') return 'NOT_AVAILABLE';
  if(s==='UNRESOLVED') return 'UNRESOLVED';
  return s?`OTHER:${s}`:'PRESENT_STATUS_MISSING';
}
function items(block){
  if(!block||typeof block!=='object') return [];
  for(const k of ['availableData','retrievableItems','availableItems','displayItems']) if(Array.isArray(block[k])) return block[k];
  return [];
}
const count=block=>items(block).length;
const hasNotes=block=>typeof block?.notes==='string'&&block.notes.trim().length>0;
function explicitLegacyPredecessor(data){
  const direct=['predecessorDataResearch','seatedStartDataResearch','predecessorResearch','seatStartResearch'];
  if(direct.some(k=>data?.[k]&&typeof data[k]==='object')) return true;
  return /(着席|前任者|差分|predecessor|seat(?:ed)?\s*start)/i.test(JSON.stringify({menu:data?.machineMenuResearch,service:data?.linkedMachineServiceResearch,completeness:data?.researchCompleteness}));
}
function v2ObservationCount(obs,sourceType){
  return (obs?.observations??[]).filter(o=>o.sourceType===sourceType&&['FOUND','VERIFIED_ON_MACHINE'].includes(o.status)).length;
}
function checkedDetailsMissing(m){
  const missing=[];
  if(m.menuStatus==='CHECKED'&&m.menuAvailableDataCount===0) missing.push('MACHINE_MENU_AVAILABLE_DATA');
  if(m.serviceStatus==='CHECKED'&&m.serviceAvailableDataCount===0) missing.push('LINKED_SERVICE_AVAILABLE_DATA');
  if(m.sourceType==='OBSERVATION_V1'&&m.predecessorStatus==='CHECKED'&&m.predecessorAvailableDataCount===0&&!m.predecessorHasNotes) missing.push('PREDECESSOR_DATA_DETAILS');
  return missing;
}
function classify(m){
  const {menuStatus:menu,serviceStatus:service,predecessorStatus:pred}=m;
  if(m.sourceType==='OBSERVATION_V2'){
    const severe=[menu,service,pred].some(s=>s==='PRESENT_STATUS_MISSING'||s.startsWith('OTHER:'));
    if(severe) return 'REVIEW_SCHEMA';
    if(m.researchReopenRequired) return 'REVIEW_SCHEMA';
    if([menu,service,pred].includes('UNRESOLVED')||m.fieldVerificationWaiting) return 'UNRESOLVED';
    if(m.checkedDetailsMissing.length) return 'CHECKED_DETAILS_MISSING';
    return 'RESOLVED';
  }
  if(m.sourceType==='OBSERVATION_V1'){
    const severe=[menu,service,pred].some(s=>s==='PRESENT_STATUS_MISSING'||s.startsWith('OTHER:'));
    if(severe) return 'REVIEW_SCHEMA';
    if([menu,service,pred].includes('UNRESOLVED')) return 'UNRESOLVED';
    if(m.checkedDetailsMissing.length) return 'CHECKED_DETAILS_MISSING';
    return 'RESOLVED';
  }
  if(menu==='MISSING'&&service==='MISSING') return 'LEGACY_UNAUDITED';
  const severe=[menu,service].some(s=>s==='PRESENT_STATUS_MISSING'||s.startsWith('OTHER:'));
  if(severe) return 'REVIEW_SCHEMA';
  if(menu==='MISSING'||service==='MISSING') return 'PARTIAL_LEGACY';
  if(['UNRESOLVED','PARTIALLY_CHECKED'].includes(menu)||['UNRESOLVED','PARTIALLY_CHECKED'].includes(service)) return 'UNRESOLVED';
  if(m.checkedDetailsMissing.length) return 'CHECKED_DETAILS_MISSING';
  if(!m.predecessorAssessmentExplicit) return 'OBSERVATION_RESOLVED_PREDECESSOR_UNASSESSED';
  return 'RESOLVED';
}

if(!fs.existsSync(researchRoot)){console.error(`research directory not found: ${researchRoot}`);process.exit(2);}
const dirs=fs.readdirSync(researchRoot,{withFileTypes:true}).filter(e=>e.isDirectory()&&!e.name.startsWith('_')).map(e=>e.name).sort();
const machines=[];
for(const machineId of dirs){
  const researchPath=path.join(researchRoot,machineId,'research-data.json');
  if(!fs.existsSync(researchPath)) continue;
  let research;
  try{research=JSON.parse(fs.readFileSync(researchPath,'utf8'));}catch(e){machines.push({machineId,displayName:machineId,classification:'INVALID_RESEARCH_JSON',error:String(e?.message??e)});continue;}
  const obsPath=path.join(researchRoot,machineId,'machine-observation-data.json');
  let m;
  if(fs.existsSync(obsPath)){
    try{
      const obs=JSON.parse(fs.readFileSync(obsPath,'utf8'));
      if(obs.schemaVersion==='machine-observation-data-v2'){
        m={machineId,displayName:obs.displayName??research?.machine?.displayName??machineId,researchedAt:obs.researchedAt??null,sourceType:'OBSERVATION_V2',menuStatus:normalizeV2(obs.sourceCoverage?.machineMenu),menuAvailableDataCount:v2ObservationCount(obs,'MACHINE_MENU'),serviceStatus:normalizeV2(obs.sourceCoverage?.linkedService),serviceAvailableDataCount:v2ObservationCount(obs,'LINKED_SERVICE'),predecessorStatus:normalizeV2(obs.sourceCoverage?.seatedState),predecessorAvailableDataCount:v2ObservationCount(obs,'SEATED_STATE')+v2ObservationCount(obs,'DATA_COUNTER'),predecessorHasNotes:true,predecessorAssessmentExplicit:true,researchReopenRequired:(obs.researchReopenRequests??[]).some(r=>r.status==='RESEARCH_REOPEN_REQUIRED'),fieldVerificationWaiting:(obs.fieldVerificationItems??[]).some(v=>v.status==='WAITING_FOR_MACHINE')};
      }else{
        m={machineId,displayName:obs.displayName??research?.machine?.displayName??machineId,researchedAt:obs.researchedAt??null,sourceType:'OBSERVATION_V1',menuStatus:normalizeV1(obs.machineMenu),menuAvailableDataCount:count(obs.machineMenu),serviceStatus:normalizeV1(obs.linkedService),serviceAvailableDataCount:count(obs.linkedService),predecessorStatus:normalizeV1(obs.predecessorData),predecessorAvailableDataCount:count(obs.predecessorData),predecessorHasNotes:hasNotes(obs.predecessorData),predecessorAssessmentExplicit:true,researchReopenRequired:false,fieldVerificationWaiting:false};
      }
    }catch{
      m={machineId,displayName:research?.machine?.displayName??machineId,sourceType:'OBSERVATION_V1',menuStatus:'OTHER:INVALID_JSON',menuAvailableDataCount:0,serviceStatus:'OTHER:INVALID_JSON',serviceAvailableDataCount:0,predecessorStatus:'OTHER:INVALID_JSON',predecessorAvailableDataCount:0,predecessorHasNotes:false,predecessorAssessmentExplicit:true,researchReopenRequired:false,fieldVerificationWaiting:false};
    }
  }else{
    const explicit=explicitLegacyPredecessor(research);
    m={machineId,displayName:research?.machine?.displayName??machineId,researchedAt:research?.researchedAt??null,sourceType:'LEGACY_RESEARCH_DATA',menuStatus:normalizeLegacy(research?.machineMenuResearch),menuAvailableDataCount:count(research?.machineMenuResearch),serviceStatus:normalizeLegacy(research?.linkedMachineServiceResearch),serviceAvailableDataCount:count(research?.linkedMachineServiceResearch),predecessorStatus:explicit?'LEGACY_EXPLICIT':'UNASSESSED',predecessorAvailableDataCount:0,predecessorHasNotes:explicit,predecessorAssessmentExplicit:explicit,researchReopenRequired:false,fieldVerificationWaiting:false};
  }
  m.checkedDetailsMissing=checkedDetailsMissing(m);
  m.classification=classify(m);
  machines.push(m);
}
const order=['INVALID_RESEARCH_JSON','LEGACY_UNAUDITED','REVIEW_SCHEMA','PARTIAL_LEGACY','CHECKED_DETAILS_MISSING','UNRESOLVED','OBSERVATION_RESOLVED_PREDECESSOR_UNASSESSED','RESOLVED'];
const counts=Object.fromEntries(order.map(k=>[k,0]));
for(const m of machines) counts[m.classification]=(counts[m.classification]??0)+1;
const summary={schemaVersion:'machine-observation-research-audit-v4.2',generatedAt:new Date().toISOString(),machineCount:machines.length,standaloneObservationFiles:machines.filter(m=>m.sourceType.startsWith('OBSERVATION_')).length,observationV2Files:machines.filter(m=>m.sourceType==='OBSERVATION_V2').length,legacyResearchFallback:machines.filter(m=>m.sourceType==='LEGACY_RESEARCH_DATA').length,counts,menuStatusCounts:{},serviceStatusCounts:{},predecessorStatusCounts:{},checkedDetailsMissingCounts:{}};
for(const m of machines){summary.menuStatusCounts[m.menuStatus]=(summary.menuStatusCounts[m.menuStatus]??0)+1;summary.serviceStatusCounts[m.serviceStatus]=(summary.serviceStatusCounts[m.serviceStatus]??0)+1;summary.predecessorStatusCounts[m.predecessorStatus]=(summary.predecessorStatusCounts[m.predecessorStatus]??0)+1;for(const k of m.checkedDetailsMissing??[]) summary.checkedDetailsMissingCounts[k]=(summary.checkedDetailsMissingCounts[k]??0)+1;}
const report={summary,machines};
console.log('Machine Observation Research Audit');
console.log(`machines: ${summary.machineCount}`);console.log(`standalone observation files: ${summary.standaloneObservationFiles}`);console.log(`observation v2 files: ${summary.observationV2Files}`);console.log(`legacy research fallback: ${summary.legacyResearchFallback}`);for(const k of order) console.log(`${k}: ${counts[k]??0}`);
for(const k of order){const rows=machines.filter(m=>m.classification===k);if(!rows.length||k==='RESOLVED') continue;console.log(`\n[${k}]`);for(const r of rows) console.log(`- ${r.machineId} | ${r.displayName} | source=${r.sourceType} | menu=${r.menuStatus} | service=${r.serviceStatus} | predecessor=${r.predecessorStatus}${r.checkedDetailsMissing?.length?` | missing=${r.checkedDetailsMissing.join(',')}`:''}`);}
if(reportPath){const abs=path.resolve(root,reportPath);fs.mkdirSync(path.dirname(abs),{recursive:true});fs.writeFileSync(abs,`${JSON.stringify(report,null,2)}\n`);console.log(`\nreport: ${path.relative(root,abs)}`);}
if((counts.INVALID_RESEARCH_JSON??0)>0||(counts.REVIEW_SCHEMA??0)>0) process.exitCode=1;
