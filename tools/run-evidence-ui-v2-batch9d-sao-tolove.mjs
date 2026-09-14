#!/usr/bin/env node
import { execSync } from 'node:child_process';
import fs from 'node:fs';

const configs=[
  {id:'L_SAO_B2',version:'0.1.2',input:'INP_EVI_BOSS_BATTLE_END_SCREEN',obs:'OBS_BOSS_BATTLE_END_SCREEN_EVIDENCE',refs:['RE_AT_END_2PLUS','RE_AT_END_3PLUS','RE_AT_END_4PLUS','RE_AT_END_5PLUS','RE_AT_END_6'],legacyObs:['OBS_SAO_EVIDENCE','OBS_SETTING_EVIDENCE']},
  {id:'L_TOLOVE_DARKNESS_S6',version:'0.1.1',input:'INP_EVI_ST_END_STAMP',obs:'OBS_ST_END_STAMP_EVIDENCE',refs:['RE_3PLUS','RE_4PLUS','RE_5PLUS','RE_6'],legacyObs:['OBS_SETTING_EVIDENCE']}
];
const run=cmd=>execSync(cmd,{stdio:'inherit'});

run('node tools/migrate-evidence-ui-v2-batch9d-sao-tolove.mjs');
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
  if(!inputs.has(c.input)) throw new Error(`${c.id}: natural Evidence input missing ${c.input}`);
  if(pkg.machine?.machineDataVersion!==c.version) throw new Error(`${c.id}: version mismatch ${pkg.machine?.machineDataVersion}`);
  const refs=new Set((pkg.evidence?.evidences??[]).flatMap(x=>x.sourceEvidenceRefs??[]));
  for(const ref of c.refs) if(!refs.has(ref)) throw new Error(`${c.id}: missing sourceEvidenceRef ${ref}`);
  const obs=JSON.parse(fs.readFileSync(`research/${c.id}/machine-observation-data.json`,'utf8'));
  if(!(obs.observations??[]).some(x=>x.observationId===c.obs)) throw new Error(`${c.id}: natural Evidence observation missing ${c.obs}`);
  for(const legacy of c.legacyObs) if((obs.observations??[]).some(x=>x.observationId===legacy)) throw new Error(`${c.id}: legacy abstract Evidence observation remains ${legacy}`);
  for(const p of [`machines/${c.id}/machine-package.json`,`research/${c.id}/statistics-report.json`,`research/${c.id}/difficulty-report.json`,`research/${c.id}/setting-band-report.json`]) if(!fs.existsSync(p)||fs.statSync(p).size===0) throw new Error(`${c.id}: missing generated artifact ${p}`);
}
for(const p of ['catalog.json','difficulty-catalog.json','machine-registry.json']) if(!fs.existsSync(p)||fs.statSync(p).size===0) throw new Error(`missing generated artifact ${p}`);
console.log('Evidence UI v2 batch9d SAO ToLOVE generated contracts: PASS');
