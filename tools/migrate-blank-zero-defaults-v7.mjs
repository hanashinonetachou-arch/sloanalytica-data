#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { resolveCatalogTimestamps } from './catalog-update-timestamp.mjs';

const ROOT=process.cwd();
const catalogPath=path.join(ROOT,'catalog.json');
const catalog=JSON.parse(fs.readFileSync(catalogPath,'utf8'));
const catalogById=new Map((catalog.machines??[]).map((m,i)=>[m.machineId,{m,i}]));
const changed=[];
let inputsChanged=0;
const now=new Date().toISOString();

function writeJson(file,value){fs.writeFileSync(file,JSON.stringify(value,null,2)+'\n');}
function hashAndSize(file){const buf=fs.readFileSync(file);return {sha256:crypto.createHash('sha256').update(buf).digest('hex'),packageSizeBytes:buf.length};}

for(const ent of fs.readdirSync(path.join(ROOT,'research'),{withFileTypes:true})){
  if(!ent.isDirectory()||ent.name.startsWith('_')) continue;
  const id=ent.name;
  const selectionPath=path.join(ROOT,'research',id,'selection-data.json');
  const packagePath=path.join(ROOT,'machines',id,'machine-package.json');
  if(!fs.existsSync(selectionPath)||!fs.existsSync(packagePath)) continue;
  const selection=JSON.parse(fs.readFileSync(selectionPath,'utf8'));
  const targets=(selection.inputs??[]).filter(x=>String(x?.inferenceRole??'').startsWith('INCLUDE')&&x.defaultValue===0);
  if(!targets.length) continue;
  const pkg=JSON.parse(fs.readFileSync(packagePath,'utf8'));
  const pInputs=new Map((pkg.inputs?.inputs??[]).map(x=>[x.id,x]));
  for(const sInput of targets){
    const pInput=pInputs.get(sInput.id);
    if(!pInput) throw new Error(`${id}/${sInput.id}: MachinePackage input missing`);
    if(pInput.defaultValue!==0 && pInput.defaultValue!=='') throw new Error(`${id}/${sInput.id}: unexpected MachinePackage defaultValue=${JSON.stringify(pInput.defaultValue)}`);
    sInput.defaultValue='';
    pInput.defaultValue='';
    if(sInput.minimum===undefined) sInput.minimum=0;
    if(pInput.minimum===undefined) pInput.minimum=0;
    inputsChanged++;
  }
  writeJson(selectionPath,selection);
  writeJson(packagePath,pkg);
  const catalogRef=catalogById.get(id);
  if(!catalogRef) throw new Error(`${id}: catalog entry missing`);
  const {sha256,packageSizeBytes}=hashAndSize(packagePath);
  const timestamps=resolveCatalogTimestamps(catalogRef.m,sha256,now);
  catalog.machines[catalogRef.i]={...catalogRef.m,sha256,packageSizeBytes,...timestamps};
  changed.push({machineId:id,inputIds:targets.map(x=>x.id),sha256,packageSizeBytes});
}

if(changed.length){catalog.generatedAt=now;writeJson(catalogPath,catalog);}
console.log(JSON.stringify({machinesChanged:changed.length,inputsChanged,changed},null,2));