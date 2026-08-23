#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root=path.resolve(process.argv[2]??'.');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const errors=[];
const BASELINE_COMMIT='cfac75b0e42f8bacfd08d34a6663a652bd6a7385';
const BASELINE_COUNT=101;

function showBaselineCatalog(){
  return spawnSync('git',['show',`${BASELINE_COMMIT}:catalog.json`],{cwd:root,encoding:'utf8'});
}
function readBaselineCatalog(){
  let r=showBaselineCatalog();
  if(r.status!==0){
    // GitHub Actions regression workflows use shallow checkout. Fetch only the
    // immutable baseline commit needed by this audit, without changing HEAD.
    const fetch=spawnSync('git',['fetch','--no-tags','--depth=1','origin',BASELINE_COMMIT],{cwd:root,encoding:'utf8'});
    if(fetch.status===0) r=showBaselineCatalog();
    else {
      errors.push(`cannot fetch Phase 12 baseline commit ${BASELINE_COMMIT}: ${(fetch.stderr??'').trim()}`);
      return null;
    }
  }
  if(r.status!==0){
    errors.push(`cannot read Phase 12 baseline catalog from ${BASELINE_COMMIT}: ${(r.stderr??'').trim()}`);
    return null;
  }
  try{return JSON.parse(r.stdout);}catch(e){
    errors.push(`cannot parse Phase 12 baseline catalog: ${e.message}`);
    return null;
  }
}

const catalog=read(path.join(root,'catalog.json'));
const diff=read(path.join(root,'difficulty-catalog.json'));
const machineIds=(catalog.machines??[]).map(x=>x.machineId);
const difficultyIds=(diff.entries??[]).map(x=>x.machineId);
const machineIdSet=new Set(machineIds);
const difficultyIdSet=new Set(difficultyIds);

const baselineCatalog=readBaselineCatalog();
const baselineIds=(baselineCatalog?.machines??[]).map(x=>x.machineId);
if(baselineCatalog && baselineIds.length!==BASELINE_COUNT) errors.push(`baseline commit machine count expected ${BASELINE_COUNT}, got ${baselineIds.length}`);
if(machineIds.length<BASELINE_COUNT) errors.push(`catalog machine count must preserve at least ${BASELINE_COUNT}, got ${machineIds.length}`);
if(difficultyIds.length<BASELINE_COUNT) errors.push(`difficulty catalog count must preserve at least ${BASELINE_COUNT}, got ${difficultyIds.length}`);
if(machineIds.length!==difficultyIds.length) errors.push(`catalog/difficulty count mismatch: ${machineIds.length} vs ${difficultyIds.length}`);
for(const id of baselineIds){
  if(!machineIdSet.has(id)) errors.push(`baseline machine missing from catalog: ${id}`);
  if(!difficultyIdSet.has(id)) errors.push(`baseline machine missing from difficulty catalog: ${id}`);
}
for(const id of machineIds){
  if(!difficultyIdSet.has(id)) errors.push(`${id}: missing difficulty catalog entry`);
  for(const rel of [`machines/${id}/machine-package.json`,`research/${id}/research-data.json`,`research/${id}/selection-data.json`]) if(!fs.existsSync(path.join(root,rel))) errors.push(`${id}: missing ${rel}`);
}
const e2e=fs.readFileSync(path.join(root,'tools','batch-e2e-orchestrator.mjs'),'utf8');
if(!e2e.includes("runNode('strict-batch-research-pipeline.mjs'")) errors.push('batch:e2e does not route Research through strict pipeline');
if(!e2e.includes("runNode('strict-batch-selection-pipeline.mjs'")) errors.push('batch:e2e does not route Selection through strict pipeline');
for(const rel of ['tools/audit-user-verified-ux-contracts.mjs','tools/audit-feature-dependency-phase9.mjs','tools/audit-difficulty-phase10.mjs','tools/audit-user-facing-phase11.mjs','PHASE12_AUDITED_BASELINE.md']) if(!fs.existsSync(path.join(root,rel))) errors.push(`missing baseline gate asset: ${rel}`);
console.log(`Phase 12 Baseline Audit: ${errors.length?'FAIL':'PASS'} / baseline ${baselineIds.length||BASELINE_COUNT} / current ${machineIds.length}`);
for(const e of errors) console.error(`ERROR ${e}`);
if(errors.length) process.exit(1);
