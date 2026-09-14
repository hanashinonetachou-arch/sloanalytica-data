#!/usr/bin/env node
import { execSync } from 'node:child_process';
import fs from 'node:fs';
const ids=['L_STRIKE_WITCHES2_TF','L_MACROSS_FRONTIER4_BA'];
const expected={
  L_STRIKE_WITCHES2_TF:{version:'0.1.1',inputs:['INP_EVI_NEUROI_BATTLE_END','INP_EVI_PAYOUT_DISPLAY'],obs:['OBS_EVI_NEUROI_BATTLE_END','OBS_EVI_PAYOUT_DISPLAY'],refs:['RE_END_2PLUS','RE_END_3PLUS','RE_END_4PLUS','RE_END_5PLUS','RE_END_6','RE_PAYOUT_4PLUS']},
  L_MACROSS_FRONTIER4_BA:{version:'0.1.1',inputs:['INP_EVI_BONUS_CONFIRM_CHARACTER','INP_EVI_UTAHIME_BONUS_END','INP_EVI_SONG_SELECTION'],obs:['OBS_EVI_BONUS_CONFIRM_CHARACTER','OBS_EVI_UTAHIME_BONUS_END','OBS_EVI_SONG_SELECTION'],refs:['RE_BONUS_CHAR_2PLUS','RE_BONUS_CHAR_5PLUS','RE_SONG_4PLUS','RE_UTAHIME_END_2PLUS','RE_UTAHIME_END_2_DENIED','RE_UTAHIME_END_6']}
};
const run=cmd=>execSync(cmd,{stdio:'inherit'});
run('node tools/migrate-evidence-ui-v2-batch9i-sw2-macross4.mjs');
for(const id of ids){
  run(`node tools/validate-selection-data.mjs research/${id}/selection-data.json research/${id}/research-data.json`);
  run(`node tools/validate-machine-observation-data.mjs research/${id}/machine-observation-data.json`);
}
run('node tools/validate-ui-design-data.mjs .');
for(const id of ids){
  run(`node tools/audit-ui-design-observation-linkage.mjs ${id} --strict-v2`);
  run(`node tools/four-layer-pipeline-gate.mjs ${id}`);
  run(`npm run machine:pipeline -- ${id} --check --skip-repo-checks`);
  run(`npm run machine:pipeline -- ${id} --skip-repo-checks`);
}
run('node tools/validate-evidence-ui-all.mjs');
run('node tools/validate-ui-design-data.mjs .');
for(const id of ids){
  run(`node tools/audit-ui-design-observation-linkage.mjs ${id} --strict-v2`);
  run(`node tools/four-layer-pipeline-gate.mjs ${id}`);
  const pkg=JSON.parse(fs.readFileSync(`machines/${id}/machine-package.json`,'utf8'));
  const inputIds=new Set((pkg.inputs?.inputs??[]).map(x=>x.id));
  for(const legacy of ['INP_EVI_SETTING_FLOOR','INP_EVI_SETTING_DENIAL']) if(inputIds.has(legacy)) throw new Error(`${id}: legacy input remains ${legacy}`);
  for(const iid of expected[id].inputs) if(!inputIds.has(iid)) throw new Error(`${id}: missing ${iid}`);
  if(pkg.machine?.machineDataVersion!==expected[id].version) throw new Error(`${id}: version mismatch ${pkg.machine?.machineDataVersion}`);
  const refs=new Set((pkg.evidence?.evidences??[]).flatMap(x=>x.sourceEvidenceRefs??[]));
  for(const ref of expected[id].refs) if(!refs.has(ref)) throw new Error(`${id}: missing ${ref}`);
  const obs=JSON.parse(fs.readFileSync(`research/${id}/machine-observation-data.json`,'utf8'));
  for(const legacyObs of ['OBS_SETTING_EVIDENCE','OBS_SW2_EVIDENCE','OBS_MACROSS_EVIDENCE']) if((obs.observations??[]).some(x=>x.observationId===legacyObs)) throw new Error(`${id}: legacy observation remains ${legacyObs}`);
  for(const oid of expected[id].obs) if(!(obs.observations??[]).some(x=>x.observationId===oid)) throw new Error(`${id}: missing ${oid}`);
  for(const p of [`machines/${id}/machine-package.json`,`research/${id}/statistics-report.json`,`research/${id}/difficulty-report.json`,`research/${id}/setting-band-report.json`]) if(!fs.existsSync(p)||fs.statSync(p).size===0) throw new Error(`${id}: missing ${p}`);
}
for(const p of ['catalog.json','difficulty-catalog.json','machine-registry.json']) if(!fs.existsSync(p)||fs.statSync(p).size===0) throw new Error(`missing ${p}`);
console.log('Evidence UI v2 batch9i SW2 + Macross4 generated contracts: PASS');
