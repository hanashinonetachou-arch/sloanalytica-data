#!/usr/bin/env node
import { execSync } from 'node:child_process';
import fs from 'node:fs';

const configs=[
  {id:'L_ULTRAMAN_TIGA_KA',version:'0.1.1',inputs:['INP_EVI_TC_TITLE','INP_EVI_REG_CHARACTER','INP_EVI_PAYOUT_DISPLAY','INP_EVI_UB_END_SCREEN','INP_EVI_ENDING_END_SCREEN','INP_EVI_TROPHY'],obs:['OBS_EVI_TC_TITLE','OBS_EVI_REG_CHARACTER','OBS_EVI_PAYOUT_DISPLAY','OBS_EVI_UB_END_SCREEN','OBS_EVI_ENDING_END_SCREEN','OBS_EVI_TROPHY'],refs:['RE_TC_TITLE_6','RE_REG_6','RE_666_6','RE_UB_6','RE_END_6','RE_TROPHY_6']},
  {id:'L_ZOMBIE_LAND_SAGA',version:'0.1.3',inputs:['INP_EVI_ST_END_SCREEN','INP_EVI_ENDING_VOICE'],obs:['OBS_EVI_ST_END_SCREEN','OBS_EVI_ENDING_VOICE'],refs:['EV_ST_END_2PLUS','EV_ST_END_4PLUS','EV_ST_END_5PLUS','EV_ST_END_6','EV_ENDING_4PLUS','EV_ENDING_5PLUS','EV_ENDING_6']},
  {id:'S_FIRE_DRIFT',version:'0.1.1',inputs:['INP_EVI_JAC_IN_SCREEN','INP_EVI_SAMMY_TROPHY'],obs:['OBS_EVI_JAC_IN_SCREEN','OBS_EVI_SAMMY_TROPHY'],refs:['EV_JAC_2PLUS','EV_JAC_4PLUS','EV_JAC_5PLUS','EV_JAC_6','EV_TROPHY_2PLUS','EV_TROPHY_3PLUS','EV_TROPHY_4PLUS','EV_TROPHY_5PLUS','EV_TROPHY_6']}
];
const run=cmd=>execSync(cmd,{stdio:'inherit'});

run('node tools/migrate-evidence-ui-v2-batch9e-tiga-zombie-fire.mjs');
for(const c of configs){
  run(`node tools/validate-selection-data.mjs research/${c.id}/selection-data.json research/${c.id}/research-data.json`);
  run(`node tools/validate-machine-observation-data.mjs research/${c.id}/machine-observation-data.json`);
}
run('node tools/validate-ui-design-data.mjs .');
for(const c of configs){
  run(`node tools/audit-ui-design-observation-linkage.mjs ${c.id} --strict-v2`);
  run(`node tools/four-layer-pipeline-gate.mjs ${c.id}`);
  run(`npm run machine:pipeline -- ${c.id} --check --skip-repo-checks`);
}
for(const c of configs) run(`npm run machine:pipeline -- ${c.id} --skip-repo-checks`);
run('node tools/validate-evidence-ui-all.mjs');
run('node tools/validate-ui-design-data.mjs .');
for(const c of configs){
  run(`node tools/audit-ui-design-observation-linkage.mjs ${c.id} --strict-v2`);
  run(`node tools/four-layer-pipeline-gate.mjs ${c.id}`);
}
for(const c of configs){
  const pkg=JSON.parse(fs.readFileSync(`machines/${c.id}/machine-package.json`,'utf8'));
  const inputs=new Map((pkg.inputs?.inputs??[]).map(x=>[x.id,x]));
  if(inputs.has('INP_EVI_SETTING_FLOOR')) throw new Error(`${c.id}: legacy setting-floor remains`);
  for(const iid of c.inputs) if(!inputs.has(iid)) throw new Error(`${c.id}: missing natural Evidence input ${iid}`);
  if(pkg.machine?.machineDataVersion!==c.version) throw new Error(`${c.id}: version mismatch ${pkg.machine?.machineDataVersion}`);
  const refs=new Set((pkg.evidence?.evidences??[]).flatMap(x=>x.sourceEvidenceRefs??[]));
  for(const ref of c.refs) if(!refs.has(ref)) throw new Error(`${c.id}: missing sourceEvidenceRef ${ref}`);
  const obs=JSON.parse(fs.readFileSync(`research/${c.id}/machine-observation-data.json`,'utf8'));
  for(const oid of c.obs) if(!(obs.observations??[]).some(x=>x.observationId===oid)) throw new Error(`${c.id}: missing natural Evidence observation ${oid}`);
  if((obs.observations??[]).some(x=>x.observationId==='OBS_SETTING_EVIDENCE')) throw new Error(`${c.id}: legacy abstract Evidence observation remains`);
  for(const p of [`machines/${c.id}/machine-package.json`,`research/${c.id}/statistics-report.json`,`research/${c.id}/difficulty-report.json`,`research/${c.id}/setting-band-report.json`]) if(!fs.existsSync(p)||fs.statSync(p).size===0) throw new Error(`${c.id}: missing generated artifact ${p}`);
}
for(const p of ['catalog.json','difficulty-catalog.json','machine-registry.json']) if(!fs.existsSync(p)||fs.statSync(p).size===0) throw new Error(`missing generated artifact ${p}`);
console.log('Evidence UI v2 batch9e Tiga Zombie Fire generated contracts: PASS');
