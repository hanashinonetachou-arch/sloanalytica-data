#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(process.argv[2]??'.');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const errors=[];
const catalog=read(path.join(root,'catalog.json'));
const diff=read(path.join(root,'difficulty-catalog.json'));
const machineIds=(catalog.machines??[]).map(x=>x.machineId);
if(machineIds.length!==101) errors.push(`catalog machine count expected 101, got ${machineIds.length}`);
if((diff.entries??[]).length!==101) errors.push(`difficulty catalog count expected 101, got ${(diff.entries??[]).length}`);
for(const id of machineIds){
 for(const rel of [`machines/${id}/machine-package.json`,`research/${id}/research-data.json`,`research/${id}/selection-data.json`]) if(!fs.existsSync(path.join(root,rel))) errors.push(`${id}: missing ${rel}`);
}
const e2e=fs.readFileSync(path.join(root,'tools','batch-e2e-orchestrator.mjs'),'utf8');
if(!e2e.includes("runNode('strict-batch-research-pipeline.mjs'")) errors.push('batch:e2e does not route Research through strict pipeline');
if(!e2e.includes("runNode('strict-batch-selection-pipeline.mjs'")) errors.push('batch:e2e does not route Selection through strict pipeline');
for(const rel of ['tools/audit-user-verified-ux-contracts.mjs','tools/audit-feature-dependency-phase9.mjs','tools/audit-difficulty-phase10.mjs','tools/audit-user-facing-phase11.mjs','PHASE12_AUDITED_BASELINE.md']) if(!fs.existsSync(path.join(root,rel))) errors.push(`missing baseline gate asset: ${rel}`);
console.log(`Phase 12 Baseline Audit: ${errors.length?'FAIL':'PASS'} / machines ${machineIds.length}`);
for(const e of errors) console.error(`ERROR ${e}`);
if(errors.length) process.exit(1);
