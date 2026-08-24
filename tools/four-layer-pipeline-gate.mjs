#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { validateObservationObject } from './validate-machine-observation-data.mjs';

const root=process.cwd();
const ids=process.argv.slice(2).filter(a=>!a.startsWith('--'));
if(!ids.length){ console.error('Usage: node tools/four-layer-pipeline-gate.mjs <MACHINE_ID...>'); process.exit(2); }
const errors=[]; const unresolved=[];
const read=f=>JSON.parse(fs.readFileSync(f,'utf8'));

for(const machineId of ids){
  const dir=path.join(root,'research',machineId);
  const files={
    research:path.join(dir,'research-data.json'),
    selection:path.join(dir,'selection-data.json'),
    observation:path.join(dir,'machine-observation-data.json'),
    ui:path.join(dir,'ui-design-data.json'),
  };
  for(const [layer,file] of Object.entries(files)) if(!fs.existsSync(file)) errors.push(`${machineId}: missing ${layer} layer (${path.relative(root,file)})`);
  if(Object.values(files).some(f=>!fs.existsSync(f))) continue;
  const selection=read(files.selection); const observation=read(files.observation); const ui=read(files.ui);
  if(selection.machineId!==machineId||observation.machineId!==machineId||ui.machineId!==machineId) errors.push(`${machineId}: machineId mismatch across layers`);
  if(observation.schemaVersion!=='machine-observation-data-v2') errors.push(`${machineId}: Observation v2 is required for the four-layer pipeline`);
  const valid=validateObservationObject(observation,path.relative(root,files.observation));
  errors.push(...valid.errors);
  if((observation.researchReopenRequests??[]).some(r=>r.status==='RESEARCH_REOPEN_REQUIRED')) errors.push(`${machineId}: Observation requests Research reopen`);
  const adopted=(selection.features??[]).filter(f=>String(f.adoptionCategory??'').startsWith('INCLUDE'));
  const mapped=new Map((observation.featureMappings??[]).map(m=>[m.featureId,m]));
  for(const feature of adopted) if(!mapped.has(feature.featureId)) errors.push(`${machineId}: adopted ${feature.featureId} has no Observation mapping`);
  const expectedObs=`research/${machineId}/machine-observation-data.json`;
  const expectedSel=`research/${machineId}/selection-data.json`;
  if(ui.generatedFrom?.selection!==expectedSel) errors.push(`${machineId}: UI Design does not reference current Selection layer`);
  if(ui.generatedFrom?.observation!==expectedObs) errors.push(`${machineId}: UI Design does not reference current Observation layer`);
  const hasUnresolved=Object.values(observation.sourceCoverage??{}).includes('UNRESOLVED') || (observation.observations??[]).some(o=>o.status==='UNRESOLVED') || (observation.featureMappings??[]).some(m=>m.mappingType==='UNRESOLVED') || (observation.fieldVerificationItems??[]).some(v=>v.status==='WAITING_FOR_MACHINE');
  if(hasUnresolved) unresolved.push(machineId);
}

if(errors.length){ for(const e of errors) console.error(`ERROR: ${e}`); console.error(`Four-layer Pipeline Gate: FAIL / machines ${ids.length} / errors ${errors.length}`); process.exit(1); }
console.log(`Four-layer Pipeline Gate: PASS / machines ${ids.length} / unresolved ${unresolved.length}`);
if(unresolved.length) console.log(`PASS_WITH_UNRESOLVED: ${unresolved.join(', ')}`);
