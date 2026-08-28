#!/usr/bin/env node
import fs from 'node:fs';

const targets=['L_SMASLO_DUNBINE_MF','S_OVERLORD_II_SX'];
const catalogPath='catalog.json';
const catalog=JSON.parse(fs.readFileSync(catalogPath,'utf8'));
const list=Array.isArray(catalog)?catalog:(catalog.machines??catalog.items??[]);

for(const machineId of targets){
  const item=list.find(x=>x.machineId===machineId);
  if(!item) throw new Error(`${machineId}: catalog entry missing`);
  const pkg=JSON.parse(fs.readFileSync(`machines/${machineId}/machine-package.json`,'utf8'));
  const features=Array.isArray(pkg.features)?pkg.features:(pkg.features?.features??[]);
  const models=new Set(features.filter(f=>f.probabilityEngineUsage!==false).map(f=>f.modelType).filter(Boolean));
  if(models.has('multinomial')) throw new Error(`${machineId}: generated package still contains multinomial; refusing catalog removal`);
  const before=[...(item.requiredCapabilities??[])];
  item.requiredCapabilities=before.filter(x=>x!=='multinomial');
  if(item.requiredCapabilities.includes('multinomial')) throw new Error(`${machineId}: stale multinomial capability remains`);
  console.log(`UPDATED ${machineId}: ${before.join(',')} -> ${item.requiredCapabilities.join(',')}`);
}

fs.writeFileSync(catalogPath,JSON.stringify(catalog,null,2)+'\n');
