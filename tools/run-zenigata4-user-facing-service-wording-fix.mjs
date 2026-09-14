#!/usr/bin/env node
import { execSync } from 'node:child_process';
import fs from 'node:fs';

const id='L_ZENIGATA4_L1';
const run=cmd=>execSync(cmd,{stdio:'inherit'});

run('node tools/fix-zenigata4-user-facing-service-wording.mjs');
run(`node tools/validate-research-data.mjs research/${id}/research-data.json`);
run(`node tools/validate-selection-data.mjs research/${id}/selection-data.json research/${id}/research-data.json`);
run(`node tools/validate-machine-observation-data.mjs research/${id}/machine-observation-data.json`);
run('node tools/validate-ui-design-data.mjs .');
run(`node tools/audit-ui-design-observation-linkage.mjs ${id} --strict-v2`);
run(`node tools/four-layer-pipeline-gate.mjs ${id}`);
run(`node tools/guard-machine-pipeline.mjs single ${id}`);
run('npm run audit:ui-service-names');

const research=JSON.parse(fs.readFileSync(`research/${id}/research-data.json`,'utf8'));
const forbidden=/打-WIN LITE/;
for(const ev of research.evidenceCandidates??[]){
  if(forbidden.test(String(ev.name??''))||forbidden.test(String(ev.observationScope??''))) throw new Error(`${id}: branded user-facing Research Evidence text remains in ${ev.researchEvidenceId}`);
}
const pkg=JSON.parse(fs.readFileSync(`machines/${id}/machine-package.json`,'utf8'));
const serialized=JSON.stringify(pkg);
if(forbidden.test(serialized)) throw new Error(`${id}: branded user-facing text remains in generated MachineData`);
for(const ref of ['RE_DWIN_2PLUS','RE_DWIN_3PLUS','RE_DWIN_4PLUS','RE_DWIN_5PLUS','RE_DWIN_6']){
  if(!serialized.includes(ref)) throw new Error(`${id}: sourceEvidenceRef lost ${ref}`);
}
const linked=research.linkedMachineServiceResearch;
if(!linked?.checkedServices?.includes('打-WIN LITE')) throw new Error(`${id}: Research provenance/linked-service record was incorrectly removed`);
console.log('Zenigata4 user-facing service wording fix: PASS');
