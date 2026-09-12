import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const report=JSON.parse(fs.readFileSync(path.join(ROOT,'reports','cross-sectional-v7-audit.json'),'utf8'));
const selectCode=code=>report.results.filter(r=>r.issues.some(x=>x.code===code)).map(r=>({machineId:r.machineId,displayName:r.displayName,classification:r.classification}));
const observationMessageCounts={};
for(const r of report.results) for(const x of r.issues.filter(x=>x.code==='OBSERVATION_VALIDATION')) observationMessageCounts[x.message]=(observationMessageCounts[x.message]??0)+1;
const sortedObservationMessages=Object.entries(observationMessageCounts).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));
const focus={
  schemaVersion:'cross-sectional-v7-focus-v1',
  generatedAt:new Date().toISOString(),
  counts:{
    missingObservation:selectCode('MISSING_OBSERVATION').length,
    missingUiDesign:selectCode('MISSING_UI_DESIGN').length,
    blankZeroMachines:selectCode('BLANK_ZERO_DEFAULT').length,
    observationValidationMachines:selectCode('OBSERVATION_VALIDATION').length,
    userFacingInternalTermMachines:selectCode('USER_FACING_INTERNAL_TERM').length,
    adoptedInputNoUiRouteMachines:selectCode('ADOPTED_INPUT_NO_UI_ROUTE').length,
  },
  missingObservation:selectCode('MISSING_OBSERVATION'),
  missingUiDesign:selectCode('MISSING_UI_DESIGN'),
  blankZeroMachines:selectCode('BLANK_ZERO_DEFAULT'),
  observationValidationMachines:selectCode('OBSERVATION_VALIDATION'),
  userFacingInternalTermMachines:selectCode('USER_FACING_INTERNAL_TERM'),
  adoptedInputNoUiRouteMachines:selectCode('ADOPTED_INPUT_NO_UI_ROUTE'),
  observationValidationMessageCounts:Object.fromEntries(sortedObservationMessages)
};
fs.writeFileSync(path.join(ROOT,'reports','cross-sectional-v7-focus.json'),JSON.stringify(focus,null,2)+'\n');
console.log(JSON.stringify({counts:focus.counts,missingObservation:focus.missingObservation,topObservationValidationMessages:sortedObservationMessages.slice(0,20)},null,2));
