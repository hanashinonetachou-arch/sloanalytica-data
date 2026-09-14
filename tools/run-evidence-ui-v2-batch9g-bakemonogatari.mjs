#!/usr/bin/env node
import { execSync } from 'node:child_process';
import fs from 'node:fs';

const id='L_SMASLO_BAKEMONOGATARI_KH';
const run=cmd=>execSync(cmd,{stdio:'inherit'});

run('node tools/migrate-evidence-ui-v2-batch9g-bakemonogatari.mjs');
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

const selection=JSON.parse(fs.readFileSync(`research/${id}/selection-data.json`,'utf8'));
if((selection.inputs??[]).some(x=>['INP_SETTING_FLOOR','INP_EVI_SETTING_FLOOR'].includes(x.id))) throw new Error(`${id}: legacy setting-floor input remains in Selection`);
if((selection.evidence??[]).length) throw new Error(`${id}: legacy Selection evidence[] remains`);
if((selection.evidenceUi?.groups??[]).length!==4) throw new Error(`${id}: expected 4 natural Evidence groups`);

const pkg=JSON.parse(fs.readFileSync(`machines/${id}/machine-package.json`,'utf8'));
const inputs=new Map((pkg.inputs?.inputs??[]).map(x=>[x.id,x]));
for(const legacy of ['INP_SETTING_FLOOR','INP_EVI_SETTING_FLOOR']) if(inputs.has(legacy)) throw new Error(`${id}: legacy generated input remains ${legacy}`);
for(const iid of ['INP_EVI_SAMMY_TROPHY','INP_EVI_AT_END_SCREEN','INP_EVI_PAYOUT_DISPLAY','INP_EVI_BONUS_CONFIRM_SCREEN']) if(!inputs.has(iid)) throw new Error(`${id}: missing natural Evidence input ${iid}`);
if(pkg.machine?.machineDataVersion!=='0.1.7') throw new Error(`${id}: version mismatch ${pkg.machine?.machineDataVersion}`);
const refs=new Set((pkg.evidence?.evidences??[]).flatMap(x=>x.sourceEvidenceRefs??[]));
for(const ref of ['RE_TROPHY_2','RE_TROPHY_3','RE_TROPHY_4','RE_TROPHY_5','RE_TROPHY_6','RE_END_4','RE_END_5','RE_END_6','RE_PAYOUT_174','RE_PAYOUT_543','RE_PAYOUT_331','RE_BONUS_SHINOBU_RED7']) if(!refs.has(ref)) throw new Error(`${id}: missing sourceEvidenceRef ${ref}`);
const obs=JSON.parse(fs.readFileSync(`research/${id}/machine-observation-data.json`,'utf8'));
for(const oid of ['OBS_EVI_SAMMY_TROPHY','OBS_EVI_AT_END_SCREEN','OBS_EVI_PAYOUT_DISPLAY','OBS_EVI_BONUS_CONFIRM_SCREEN']) if(!(obs.observations??[]).some(x=>x.observationId===oid)) throw new Error(`${id}: missing natural observation ${oid}`);
for(const legacy of ['OBS_BAKE_EVIDENCE','OBS_SETTING_EVIDENCE']) if((obs.observations??[]).some(x=>x.observationId===legacy)) throw new Error(`${id}: legacy abstract observation remains ${legacy}`);
for(const p of [`machines/${id}/machine-package.json`,`research/${id}/statistics-report.json`,`research/${id}/difficulty-report.json`,`research/${id}/setting-band-report.json`]) if(!fs.existsSync(p)||fs.statSync(p).size===0) throw new Error(`${id}: missing generated artifact ${p}`);
for(const p of ['catalog.json','difficulty-catalog.json','machine-registry.json']) if(!fs.existsSync(p)||fs.statSync(p).size===0) throw new Error(`missing generated artifact ${p}`);
console.log('Evidence UI v2 batch9g Bakemonogatari generated contracts: PASS');
