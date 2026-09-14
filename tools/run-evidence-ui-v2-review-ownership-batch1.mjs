#!/usr/bin/env node
import { execSync } from 'node:child_process';
import fs from 'node:fs';
const ids=['L_ENEN_NO_SHOUBOUTAI_JG','S_HARD_BOILED_XX'];
const run=cmd=>execSync(cmd,{stdio:'inherit'});
run('node tools/migrate-evidence-ui-v2-review-ownership-batch1.mjs');
for(const id of ids){
  run(`node tools/validate-selection-data.mjs research/${id}/selection-data.json research/${id}/research-data.json`);
  run(`node tools/validate-machine-observation-data.mjs research/${id}/machine-observation-data.json`);
  run(`node tools/audit-ui-design-observation-linkage.mjs ${id} --strict-v2`);
  run(`node tools/four-layer-pipeline-gate.mjs ${id}`);
  run(`npm run machine:pipeline -- ${id} --check --skip-repo-checks`);
  run(`npm run machine:pipeline -- ${id} --skip-repo-checks`);
}
run('node tools/validate-ui-design-data.mjs .');
run('node tools/validate-evidence-ui-all.mjs');
for(const id of ids){
  run(`node tools/audit-ui-design-observation-linkage.mjs ${id} --strict-v2`);
  run(`node tools/four-layer-pipeline-gate.mjs ${id}`);
  const selection=JSON.parse(fs.readFileSync(`research/${id}/selection-data.json`,'utf8'));
  if((selection.evidenceUi?.groups??[]).length) throw new Error(`${id}: overlapping Evidence UI remains`);
  if(selection.evidenceReview?.ownershipPolicy!=='FEATURE_OWNS_OVERLAPPING_OBSERVATION') throw new Error(`${id}: ownership policy missing`);
  const ui=JSON.parse(fs.readFileSync(`research/${id}/ui-design-data.json`,'utf8'));
  if((ui.sectionOrder??[]).includes('設定確定・否定情報')) throw new Error(`${id}: legacy Evidence section remains`);
  if(ui.inputContracts?.INP_EVI_SETTING_FLOOR) throw new Error(`${id}: legacy Evidence input remains`);
  const pkg=JSON.parse(fs.readFileSync(`machines/${id}/machine-package.json`,'utf8'));
  const inputs=new Map((pkg.inputs?.inputs??[]).map(x=>[x.id,x]));
  if(inputs.has('INP_EVI_SETTING_FLOOR')) throw new Error(`${id}: generated package still contains legacy floor`);
}
const hbObs=JSON.parse(fs.readFileSync('research/S_HARD_BOILED_XX/machine-observation-data.json','utf8'));
if((hbObs.observations??[]).some(x=>x.observationId==='OBS_HARDBOILED_EVIDENCE')) throw new Error('S_HARD_BOILED_XX: duplicate Evidence observation remains');
console.log('Evidence UI v2 REVIEW ownership batch1: PASS');
