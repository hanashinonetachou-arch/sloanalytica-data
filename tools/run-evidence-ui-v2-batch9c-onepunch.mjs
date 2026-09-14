#!/usr/bin/env node
import { execSync } from 'node:child_process';
import fs from 'node:fs';

const id='L_ONE_PUNCH_MAN';
const run=cmd=>execSync(cmd,{stdio:'inherit'});

run('node tools/migrate-evidence-ui-v2-batch9c-onepunch.mjs');
run(`node tools/validate-selection-data.mjs research/${id}/selection-data.json research/${id}/research-data.json`);
run(`node tools/validate-machine-observation-data.mjs research/${id}/machine-observation-data.json`);
run('node tools/validate-ui-design-data.mjs .');
run(`node tools/audit-ui-design-observation-linkage.mjs ${id} --strict-v2`);
run(`node tools/four-layer-pipeline-gate.mjs ${id}`);
run(`npm run machine:pipeline -- ${id} --check --skip-repo-checks`);
run(`npm run machine:pipeline -- ${id} --skip-repo-checks`);
run('node tools/validate-evidence-ui-all.mjs');
run('node tools/validate-ui-design-data.mjs .');
run(`node tools/audit-ui-design-observation-linkage.mjs ${id} --strict-v2`);
run(`node tools/four-layer-pipeline-gate.mjs ${id}`);

const pkg=JSON.parse(fs.readFileSync(`machines/${id}/machine-package.json`,'utf8'));
const inputs=new Map((pkg.inputs?.inputs??[]).map(x=>[x.id,x]));
if(inputs.has('INP_EVI_SETTING_FLOOR')) throw new Error(`${id}: legacy setting-floor remains`);
if(!inputs.has('INP_EVI_BONUS_AT_END_SCREEN')) throw new Error(`${id}: natural Evidence input missing`);
if(pkg.machine?.machineDataVersion!=='0.1.3') throw new Error(`${id}: version mismatch ${pkg.machine?.machineDataVersion}`);
const refs=new Set((pkg.evidence?.evidences??[]).flatMap(x=>x.sourceEvidenceRefs??[]));
for(const ref of ['EV_END_2PLUS','EV_END_4PLUS','EV_END_6']) if(!refs.has(ref)) throw new Error(`${id}: missing sourceEvidenceRef ${ref}`);
const obs=JSON.parse(fs.readFileSync(`research/${id}/machine-observation-data.json`,'utf8'));
if(!(obs.observations??[]).some(x=>x.observationId==='OBS_BONUS_AT_END_SCREEN_EVIDENCE')) throw new Error(`${id}: natural Evidence observation missing`);
if((obs.observations??[]).some(x=>x.observationId==='OBS_SETTING_EVIDENCE')) throw new Error(`${id}: legacy abstract Evidence observation remains`);
for(const p of [`machines/${id}/machine-package.json`,`research/${id}/statistics-report.json`,`research/${id}/difficulty-report.json`,`research/${id}/setting-band-report.json`]) {
  if(!fs.existsSync(p)||fs.statSync(p).size===0) throw new Error(`${id}: missing generated artifact ${p}`);
}
for(const p of ['catalog.json','difficulty-catalog.json','machine-registry.json']) if(!fs.existsSync(p)||fs.statSync(p).size===0) throw new Error(`missing generated artifact ${p}`);
console.log('Evidence UI v2 batch9c One Punch generated contracts: PASS');
