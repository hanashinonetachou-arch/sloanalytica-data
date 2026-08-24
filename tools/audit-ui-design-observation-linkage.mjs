#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const researchRoot=path.join(root,'research');
const ids=process.argv.slice(2).filter(a=>!a.startsWith('--'));
const strictV2=process.argv.includes('--strict-v2');
const targets=ids.length?ids:fs.readdirSync(researchRoot,{withFileTypes:true}).filter(e=>e.isDirectory()&&!e.name.startsWith('_')).map(e=>e.name);
const errors=[]; const warnings=[]; let checked=0;
const roleToSource={MACHINE_MENU:'MACHINE_MENU',DATA_COUNTER:'DATA_COUNTER',LINKED_SERVICE:'LINKED_SERVICE',DIRECT_PLAY:'DIRECT_PLAY',END_EVENT:'END_EVENT',SEATED_STATE:'SEATED_STATE'};
const read=f=>JSON.parse(fs.readFileSync(f,'utf8'));

for(const machineId of targets){
  const dir=path.join(researchRoot,machineId);
  const uiFile=path.join(dir,'ui-design-data.json');
  const obsFile=path.join(dir,'machine-observation-data.json');
  if(!fs.existsSync(uiFile)) continue;
  checked++;
  if(!fs.existsSync(obsFile)){ errors.push(`${machineId}: ui-design-data exists but machine-observation-data.json is missing`); continue; }
  const ui=read(uiFile); const obs=read(obsFile);
  if(ui.machineId!==machineId) errors.push(`${machineId}: ui-design machineId mismatch`);
  if(obs.machineId!==machineId) errors.push(`${machineId}: observation machineId mismatch`);
  const expected=`research/${machineId}/machine-observation-data.json`;
  if(ui.generatedFrom?.observation!==expected) errors.push(`${machineId}: ui generatedFrom.observation must be ${expected}`);
  if(strictV2&&obs.schemaVersion!=='machine-observation-data-v2') errors.push(`${machineId}: Observation v2 required by strict UI linkage`);
  if(obs.schemaVersion!=='machine-observation-data-v2') continue;
  const availableSources=new Set((obs.observations??[]).filter(o=>o.status==='FOUND'||o.status==='VERIFIED_ON_MACHINE').map(o=>o.sourceType));
  for(const [sectionName,section] of Object.entries(ui.sections??{})){
    const role=section?.observationRole;
    if(!role) continue;
    const source=roleToSource[role];
    if(!source){ warnings.push(`${machineId}/${sectionName}: unknown observationRole ${role}`); continue; }
    if(!availableSources.has(source)){
      const unresolved=(obs.fieldVerificationItems??[]).some(v=>v.sourceType===source&&v.status==='WAITING_FOR_MACHINE') || Object.values(obs.sourceCoverage??{}).includes('UNRESOLVED');
      if(unresolved) warnings.push(`${machineId}/${sectionName}: ${role} has no confirmed observation yet; retained as unresolved`);
      else errors.push(`${machineId}/${sectionName}: UI requires ${role} but Observation has no confirmed source`);
    }
  }
}
for(const w of warnings) console.warn(`WARNING: ${w}`);
if(errors.length){ for(const e of errors) console.error(`ERROR: ${e}`); console.error(`UI Design -> Observation linkage: FAIL (${errors.length} errors)`); process.exit(1); }
console.log(`UI Design -> Observation linkage: PASS / machines ${checked} / warnings ${warnings.length}`);
