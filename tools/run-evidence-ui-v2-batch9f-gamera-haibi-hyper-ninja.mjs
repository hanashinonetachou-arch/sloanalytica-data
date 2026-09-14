#!/usr/bin/env node
import { execSync } from 'node:child_process';
import fs from 'node:fs';

const configs=[
  {id:'S_GAMERA2',version:'0.1.3',inputs:['INP_EVI_PAYOUT_DISPLAY','INP_EVI_REG_END_SCREEN','INP_EVI_SAMMY_TROPHY'],obs:['OBS_EVI_PAYOUT_DISPLAY','OBS_EVI_REG_END_SCREEN','OBS_EVI_SAMMY_TROPHY'],refs:['EV_456','EV_666','EV_REG_MONSTERS','EV_REG_NO1','EV_TROPHY_BRONZE_2PLUS','EV_TROPHY_SILVER_3PLUS','EV_TROPHY_GOLD_4PLUS','EV_TROPHY_KIRIN_5PLUS','EV_TROPHY_RAINBOW_6']},
  {id:'S_HAIBI_RETURN_PA30',version:'0.1.1',inputs:['INP_EVI_FEATHER_LAMP'],obs:['OBS_EVI_FEATHER_LAMP'],refs:['RE_4PLUS','RE_6'],legacyObs:['OBS_HAIBI_EVIDENCE','OBS_SETTING_EVIDENCE']},
  {id:'S_HYPER_RUSH_SLC8',version:'0.1.2',inputs:['INP_EVI_BONUS_END_LAMP','INP_EVI_TROPHY'],obs:['OBS_EVI_BONUS_END_LAMP','OBS_EVI_TROPHY'],refs:['RE_4PLUS','RE_6'],legacyObs:['OBS_SETTING_EVIDENCE']},
  {id:'S_NINJA_JAJAMARU',version:'0.1.2',inputs:['INP_EVI_REG_END_SCREEN','INP_EVI_BIG_CHARACTER_CONDITION'],obs:['OBS_EVI_REG_END_SCREEN','OBS_EVI_BIG_CHARACTER_CONDITION'],refs:['EV_REG_PURPLE_5PLUS','EV_BIG_THREE_CHAR_6'],legacyObs:['OBS_SETTING_EVIDENCE']}
];
const run=cmd=>execSync(cmd,{stdio:'inherit'});

run('node tools/migrate-evidence-ui-v2-batch9f-gamera-haibi-hyper-ninja.mjs');
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
  for(const legacy of c.legacyObs??[]) if((obs.observations??[]).some(x=>x.observationId===legacy)) throw new Error(`${c.id}: legacy abstract Evidence observation remains ${legacy}`);
  for(const p of [`machines/${c.id}/machine-package.json`,`research/${c.id}/statistics-report.json`,`research/${c.id}/difficulty-report.json`,`research/${c.id}/setting-band-report.json`]) if(!fs.existsSync(p)||fs.statSync(p).size===0) throw new Error(`${c.id}: missing generated artifact ${p}`);
}
// Gamera2 must retain its pre-existing counter-based Evidence inputs alongside new natural Evidence UI.
{
  const pkg=JSON.parse(fs.readFileSync('machines/S_GAMERA2/machine-package.json','utf8'));
  const inputs=new Set((pkg.inputs?.inputs??[]).map(x=>x.id));
  for(const iid of ['INP_BIG_END_NOT_BAD','INP_BIG_END_GAMERA','INP_REG_MONSTER_CHILD_JIGER','INP_REG_MONSTER_BARUGON_EGG','INP_REG_MONSTER_WHEEL_GAMERA','INP_REG_MONSTER_SURF_GAMERA','INP_REG_MONSTER_NAGOYA','INP_REG_MONSTER_GREAT_GAMERA']) if(!inputs.has(iid)) throw new Error(`S_GAMERA2: existing Evidence/Feature input lost ${iid}`);
}
for(const p of ['catalog.json','difficulty-catalog.json','machine-registry.json']) if(!fs.existsSync(p)||fs.statSync(p).size===0) throw new Error(`missing generated artifact ${p}`);
console.log('Evidence UI v2 batch9f Gamera Haibi Hyper Ninja generated contracts: PASS');
