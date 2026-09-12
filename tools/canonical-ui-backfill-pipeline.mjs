#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { materializeUiDesign } from './materialize-ui-design.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function readJson(p){ return JSON.parse(fs.readFileSync(p,'utf8')); }
function writeJson(p,v){ fs.mkdirSync(path.dirname(p),{recursive:true}); fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n','utf8'); }
function readIds(file){
  const text=fs.readFileSync(path.resolve(ROOT,file),'utf8').trim();
  if(!text) return [];
  if(text.startsWith('[')) return JSON.parse(text).map(String);
  return text.split(/\r?\n/).map(v=>v.trim()).filter(Boolean);
}
function snapshot(paths){ return new Map(paths.map(p=>[p,fs.existsSync(p)?fs.readFileSync(p):null])); }
function restore(s){ for(const [p,b] of s){ if(b===null){ if(fs.existsSync(p)) fs.rmSync(p,{force:true}); } else { fs.mkdirSync(path.dirname(p),{recursive:true}); fs.writeFileSync(p,b); } } }
function omitUiAllowed(pkg){
  const x=structuredClone(pkg);
  delete x.ui;
  for(const input of x.inputs?.inputs??[]){
    delete input.name;
    delete input.description;
    delete input.derivedCalculation;
    delete input.derivedFromInputIds;
  }
  if(x.metadata){
    delete x.metadata.uiDesignMaterialized;
    delete x.metadata.uiDesignSchemaVersion;
    delete x.metadata.uiDesignStatus;
  }
  return x;
}
export function assertUiOnlyPreservation(before,after,machineId='machine'){
  const a=JSON.stringify(omitUiAllowed(before));
  const b=JSON.stringify(omitUiAllowed(after));
  if(a!==b) throw new Error(`${machineId}: canonical UI backfill changed protected non-UI MachineData`);
  if(before.machine?.machineDataVersion!==after.machine?.machineDataVersion) throw new Error(`${machineId}: machineDataVersion changed during UI-only backfill`);
}
function runNpm(script){
  const npmExecPath=process.env.npm_execpath;
  let command,args;
  if(npmExecPath){ command=process.execPath; args=[npmExecPath,'run',script]; }
  else if(process.platform==='win32'){ command=process.env.ComSpec||'cmd.exe'; args=['/d','/s','/c',`npm run ${script}`]; }
  else { command='npm'; args=['run',script]; }
  const r=spawnSync(command,args,{cwd:ROOT,stdio:'inherit'});
  if(r.error) throw r.error;
  if(r.status!==0) throw new Error(`${script} failed with exit code ${r.status}`);
}
function updateCatalog(catalogPath,packages){
  const catalog=readJson(catalogPath);
  let changed=false;
  for(const {machineId,packagePath,pkg} of packages){
    const entry=(catalog.machines??[]).find(m=>m.machineId===machineId);
    if(!entry) throw new Error(`${machineId}: catalog entry missing for canonical UI backfill`);
    const bytes=fs.readFileSync(packagePath);
    const sha=crypto.createHash('sha256').update(bytes).digest('hex');
    if(entry.machineDataVersion!==pkg.machine?.machineDataVersion) throw new Error(`${machineId}: catalog/package version mismatch`);
    if(entry.sha256!==sha || entry.packageSizeBytes!==bytes.length){
      entry.sha256=sha;
      entry.packageSizeBytes=bytes.length;
      changed=true;
    }
  }
  if(changed){ catalog.generatedAt=new Date().toISOString(); writeJson(catalogPath,catalog); }
  return changed;
}
export function materializeBackfill(root,machineIds){
  const packages=[];
  for(const machineId of machineIds){
    const packagePath=path.join(root,'machines',machineId,'machine-package.json');
    const designPath=path.join(root,'research',machineId,'ui-design-data.json');
    if(!fs.existsSync(packagePath)) throw new Error(`${machineId}: existing machine-package.json is required for UI-only backfill`);
    if(!fs.existsSync(designPath)) throw new Error(`${machineId}: ui-design-data.json missing`);
    const before=readJson(packagePath);
    const design=readJson(designPath);
    const after=materializeUiDesign(before,design);
    assertUiOnlyPreservation(before,after,machineId);
    writeJson(packagePath,after);
    packages.push({machineId,packagePath,pkg:after});
    console.log(`UI-ONLY MATERIALIZED: ${machineId}`);
  }
  return packages;
}

function main(){
  const args=process.argv.slice(2);
  const fileIndex=args.indexOf('--file');
  if(fileIndex<0 || !args[fileIndex+1]) throw new Error('Usage: node tools/canonical-ui-backfill-pipeline.mjs --file machine_ids.txt');
  const machineIds=[...new Set(readIds(args[fileIndex+1]))];
  if(!machineIds.length) throw new Error('canonical UI backfill requires at least one machine');
  for(const id of machineIds) if(!/^[A-Z0-9_]+$/.test(id)) throw new Error(`invalid machineId: ${id}`);
  const catalogPath=path.join(ROOT,'catalog.json');
  const paths=[catalogPath,...machineIds.map(id=>path.join(ROOT,'machines',id,'machine-package.json'))];
  const saved=snapshot(paths);
  try{
    const packages=materializeBackfill(ROOT,machineIds);
    updateCatalog(catalogPath,packages);
    runNpm('test');
    runNpm('audit');
    runNpm('audit:ui-service-names');
    console.log(`CANONICAL UI BACKFILL PASS: ${machineIds.length} machine(s)`);
  }catch(error){
    restore(saved);
    console.error(`CANONICAL UI BACKFILL FAILED: ${error instanceof Error?error.message:String(error)}`);
    process.exit(1);
  }
}

const invoked=process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(invoked) main();
