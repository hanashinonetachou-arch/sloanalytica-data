#!/usr/bin/env node
import fs from 'node:fs';
import { execSync } from 'node:child_process';

const specs = {
  L_AKAME_GA_KILL_2: {
    version:'0.1.1', groups:['AT_END_SCREEN','NAMI_PANEL'], observations:['OBS_AT_END_SCREEN','OBS_NAMI_PANEL'], inputs:['INP_EVI_AT_END_SCREEN','INP_EVI_NAMI_PANEL'], refs:['EV_AT_END_2PLUS','EV_AT_END_4PLUS','EV_AT_END_5PLUS','EV_NAMI_6']
  },
  L_BOUNTY_ANGEL: {
    version:'0.1.2', groups:['BONUS_CONFIRM_SCREEN','COSPLAY_CHALLENGE','ENDING_VOICE'], observations:['OBS_BONUS_CONFIRM_SCREEN','OBS_COSPLAY_CHALLENGE','OBS_ENDING_VOICE'], inputs:['INP_EVI_BONUS_CONFIRM_SCREEN','INP_EVI_COSPLAY_CHALLENGE','INP_EVI_ENDING_VOICE'], refs:['EV_BONUS_SCREEN_6','EV_COSPLAY_4PLUS','EV_ENDING_VOICE_6']
  }
};
const ids = Object.keys(specs);
const run = cmd => execSync(cmd,{stdio:'inherit'});
const requireFile = p => { try { return !!execSync(`test -s '${p}' && echo ok`,{encoding:'utf8'}).trim(); } catch { return false; } };

run('node tools/migrate-evidence-ui-v2-batch9b.mjs');
for (const id of ids) {
  run(`node tools/validate-selection-data.mjs research/${id}/selection-data.json research/${id}/research-data.json`);
  run(`node tools/validate-machine-observation-data.mjs research/${id}/machine-observation-data.json`);
}
run('node tools/validate-ui-design-data.mjs .');
for (const id of ids) {
  run(`node tools/audit-ui-design-observation-linkage.mjs ${id} --strict-v2`);
  run(`node tools/four-layer-pipeline-gate.mjs ${id}`);
  run(`npm run machine:pipeline -- ${id} --check --skip-repo-checks`);
}
for (const id of ids) run(`npm run machine:pipeline -- ${id} --skip-repo-checks`);
run('node tools/validate-evidence-ui-all.mjs');
run('node tools/validate-ui-design-data.mjs .');
for (const id of ids) {
  run(`node tools/audit-ui-design-observation-linkage.mjs ${id} --strict-v2`);
  run(`node tools/four-layer-pipeline-gate.mjs ${id}`);
}
for (const [id,spec] of Object.entries(specs)) {
  const selection=JSON.parse(fs.readFileSync(`research/${id}/selection-data.json`,'utf8'));
  const observation=JSON.parse(fs.readFileSync(`research/${id}/machine-observation-data.json`,'utf8'));
  const ui=JSON.parse(fs.readFileSync(`research/${id}/ui-design-data.json`,'utf8'));
  const pkg=JSON.parse(fs.readFileSync(`machines/${id}/machine-package.json`,'utf8'));
  const groups=new Set((selection.evidenceUi?.groups??[]).map(x=>x.groupId));
  if(groups.has('SETTING_FLOOR')) throw new Error(`${id}: legacy SETTING_FLOOR remains`);
  for(const g of spec.groups) if(!groups.has(g)) throw new Error(`${id}: missing group ${g}`);
  const obs=new Set((observation.observations??[]).map(x=>x.observationId));
  if(obs.has('OBS_SETTING_EVIDENCE')) throw new Error(`${id}: legacy OBS_SETTING_EVIDENCE remains`);
  for(const o of spec.observations) if(!obs.has(o)) throw new Error(`${id}: missing observation ${o}`);
  if(ui.inputContracts?.INP_EVI_SETTING_FLOOR) throw new Error(`${id}: legacy canonical input remains`);
  const inputs=new Map((pkg.inputs?.inputs??[]).map(x=>[x.id,x]));
  if(inputs.has('INP_EVI_SETTING_FLOOR')) throw new Error(`${id}: materialized legacy input remains`);
  for(const iid of spec.inputs) if(!inputs.has(iid)) throw new Error(`${id}: missing materialized input ${iid}`);
  if(pkg.machine?.machineDataVersion!==spec.version) throw new Error(`${id}: version mismatch ${pkg.machine?.machineDataVersion}`);
  const refs=new Set((pkg.evidence?.evidences??[]).flatMap(x=>x.sourceEvidenceRefs??[]));
  for(const ref of spec.refs) if(!refs.has(ref)) throw new Error(`${id}: missing sourceEvidenceRef ${ref}`);
  for(const p of [`machines/${id}/machine-package.json`,`research/${id}/statistics-report.json`,`research/${id}/difficulty-report.json`,`research/${id}/setting-band-report.json`]) if(!requireFile(p)) throw new Error(`missing generated artifact: ${p}`);
}
for(const p of ['catalog.json','difficulty-catalog.json','machine-registry.json']) if(!requireFile(p)) throw new Error(`missing generated artifact: ${p}`);
console.log('Evidence UI v2 Batch 9b formal gates: PASS');
