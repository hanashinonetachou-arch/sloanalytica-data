#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const ids=process.argv.slice(2).filter(a=>!a.startsWith('--'));
const strictV2=process.argv.includes('--strict-v2');
const researchRoot=path.join(root,'research');
const targets=ids.length?ids:fs.readdirSync(researchRoot,{withFileTypes:true}).filter(e=>e.isDirectory()&&!e.name.startsWith('_')).map(e=>e.name);
const errors=[]; const warnings=[]; let checked=0;
const read=f=>JSON.parse(fs.readFileSync(f,'utf8'));

for(const machineId of targets){
  const dir=path.join(researchRoot,machineId);
  const selFile=path.join(dir,'selection-data.json');
  const obsFile=path.join(dir,'machine-observation-data.json');
  if(!fs.existsSync(selFile)||!fs.existsSync(obsFile)) continue;
  const selection=read(selFile); const observation=read(obsFile); checked++;
  if(selection.machineId!==machineId) errors.push(`${machineId}: selection machineId mismatch`);
  if(observation.machineId!==machineId) errors.push(`${machineId}: observation machineId mismatch`);
  if(strictV2&&observation.schemaVersion!=='machine-observation-data-v2') errors.push(`${machineId}: Observation v2 required`);
  if(observation.schemaVersion!=='machine-observation-data-v2') { warnings.push(`${machineId}: legacy observation schema; feature linkage not enforced`); continue; }

  const mappingByFeature=new Map((observation.featureMappings??[]).map(m=>[m.featureId,m]));
  const adopted=(selection.features??[]).filter(f=>String(f.adoptionCategory??'').startsWith('INCLUDE'));
  for(const feature of adopted){
    const mapping=mappingByFeature.get(feature.featureId);
    if(!mapping){ errors.push(`${machineId}: adopted feature ${feature.featureId} has no Observation featureMapping`); continue; }
    if(mapping.mappingType==='INCOMPATIBLE') errors.push(`${machineId}: adopted feature ${feature.featureId} is INCOMPATIBLE in Observation`);
    if(mapping.mappingType==='UNRESOLVED'&&mapping.usableForInference===true) warnings.push(`${machineId}: ${feature.featureId} is usableForInference but mappingType is UNRESOLVED`);
  }
  const selectedIds=new Set((selection.features??[]).map(f=>f.featureId));
  for(const mapping of observation.featureMappings??[]) if(!selectedIds.has(mapping.featureId)) warnings.push(`${machineId}: Observation mapping references unknown Selection feature ${mapping.featureId}`);
}

for(const w of warnings) console.warn(`WARNING: ${w}`);
if(errors.length){ for(const e of errors) console.error(`ERROR: ${e}`); console.error(`Observation -> Selection linkage: FAIL (${errors.length} errors)`); process.exit(1); }
console.log(`Observation -> Selection linkage: PASS / machines ${checked} / warnings ${warnings.length}`);
