import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const report=JSON.parse(fs.readFileSync(path.join(ROOT,'reports','cross-sectional-v7-audit.json'),'utf8'));
const selectCode=code=>report.results.filter(r=>r.issues.some(x=>x.code===code)).map(r=>({machineId:r.machineId,displayName:r.displayName,classification:r.classification}));

const normalizeObservationMessage=message=>String(message)
  .replace(/^research\/[A-Z0-9_]+\/machine-observation-data\.json:\s*/,'')
  .replace(/observations\[\d+\]/g,'observations[*]')
  .replace(/featureMappings\[\d+\]/g,'featureMappings[*]')
  .replace(/researchReopenRequests\[\d+\]/g,'researchReopenRequests[*]')
  .replace(/fieldVerificationItems\[\d+\]/g,'fieldVerificationItems[*]');
const observationRootCauseCounts={};
for(const r of report.results) for(const x of r.issues.filter(x=>x.code==='OBSERVATION_VALIDATION')) {
  const key=normalizeObservationMessage(x.message);
  observationRootCauseCounts[key]=(observationRootCauseCounts[key]??0)+1;
}
const sortedRootCauses=Object.entries(observationRootCauseCounts).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));

const fieldPriorityCounts={HIGH:0,MEDIUM:0,LOW:0};
const fieldMachinesByPriority={HIGH:new Set(),MEDIUM:new Set(),LOW:new Set()};
for(const r of report.results){
  const p=path.join(ROOT,'research',r.machineId,'machine-observation-data.json');
  if(!fs.existsSync(p)) continue;
  let observation;
  try{ observation=JSON.parse(fs.readFileSync(p,'utf8')); }catch{ continue; }
  for(const item of observation.fieldVerificationItems??[]){
    if(item?.status!=='WAITING_FOR_MACHINE') continue;
    const priority=['HIGH','MEDIUM','LOW'].includes(item.priority)?item.priority:'LOW';
    fieldPriorityCounts[priority]+=1;
    fieldMachinesByPriority[priority].add(r.machineId);
  }
}

const focus={
  schemaVersion:'cross-sectional-v7-focus-v2',
  generatedAt:new Date().toISOString(),
  counts:{
    missingObservation:selectCode('MISSING_OBSERVATION').length,
    missingUiDesign:selectCode('MISSING_UI_DESIGN').length,
    blankZeroMachines:selectCode('BLANK_ZERO_DEFAULT').length,
    observationValidationMachines:selectCode('OBSERVATION_VALIDATION').length,
    userFacingInternalTermMachines:selectCode('USER_FACING_INTERNAL_TERM').length,
    adoptedInputNoUiRouteMachines:selectCode('ADOPTED_INPUT_NO_UI_ROUTE').length,
  },
  fieldVerification:{
    itemCounts:fieldPriorityCounts,
    machineCounts:Object.fromEntries(Object.entries(fieldMachinesByPriority).map(([k,v])=>[k,v.size])),
    machineIds:Object.fromEntries(Object.entries(fieldMachinesByPriority).map(([k,v])=>[k,[...v].sort()])),
  },
  missingObservation:selectCode('MISSING_OBSERVATION'),
  missingUiDesign:selectCode('MISSING_UI_DESIGN'),
  blankZeroMachines:selectCode('BLANK_ZERO_DEFAULT'),
  observationValidationMachines:selectCode('OBSERVATION_VALIDATION'),
  userFacingInternalTermMachines:selectCode('USER_FACING_INTERNAL_TERM'),
  adoptedInputNoUiRouteMachines:selectCode('ADOPTED_INPUT_NO_UI_ROUTE'),
  observationValidationRootCauseCounts:Object.fromEntries(sortedRootCauses)
};
fs.writeFileSync(path.join(ROOT,'reports','cross-sectional-v7-focus.json'),JSON.stringify(focus,null,2)+'\n');
console.log(JSON.stringify({counts:focus.counts,fieldVerification:focus.fieldVerification.itemCounts,missingObservation:focus.missingObservation,topObservationValidationRootCauses:sortedRootCauses.slice(0,20)},null,2));
