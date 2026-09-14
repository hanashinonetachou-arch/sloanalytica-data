#!/usr/bin/env node
import fs from 'node:fs';
import { execSync } from 'node:child_process';

const id = 'L_HOKUTO_AD_XR';
const run = cmd => execSync(cmd, { stdio: 'inherit' });
const requireFile = p => {
  try { return !!execSync(`test -s '${p}' && echo ok`, { encoding: 'utf8' }).trim(); }
  catch { return false; }
};

run('node tools/migrate-evidence-ui-v2-batch9.mjs');
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

const selection = JSON.parse(fs.readFileSync(`research/${id}/selection-data.json`, 'utf8'));
const observation = JSON.parse(fs.readFileSync(`research/${id}/machine-observation-data.json`, 'utf8'));
const ui = JSON.parse(fs.readFileSync(`research/${id}/ui-design-data.json`, 'utf8'));
const pkg = JSON.parse(fs.readFileSync(`machines/${id}/machine-package.json`, 'utf8'));

const groupIds = new Set((selection.evidenceUi?.groups ?? []).map(x => x.groupId));
for (const expected of ['SAMMY_TROPHY', 'AT_END_TOUCH_VOICE']) {
  if (!groupIds.has(expected)) throw new Error(`${id}: missing evidence group ${expected}`);
}
if ((selection.evidenceUi?.groups ?? []).some(x => x.groupId === 'SETTING_FLOOR')) throw new Error(`${id}: legacy SETTING_FLOOR remains`);
const obsIds = new Set((observation.observations ?? []).map(x => x.observationId));
if (obsIds.has('OBS_SETTING_EVIDENCE')) throw new Error(`${id}: legacy OBS_SETTING_EVIDENCE remains`);
for (const expected of ['OBS_SAMMY_TROPHY', 'OBS_AT_END_TOUCH_VOICE']) {
  if (!obsIds.has(expected)) throw new Error(`${id}: missing natural observation ${expected}`);
}
if (ui.inputContracts?.INP_EVI_SETTING_FLOOR) throw new Error(`${id}: legacy canonical input remains`);
for (const expected of ['EVI_UI_SAMMY_TROPHY', 'EVI_UI_AT_END_TOUCH_VOICE']) {
  if (!ui.evidenceContracts?.[expected]) throw new Error(`${id}: missing canonical evidence contract ${expected}`);
}
const inputs = new Map((pkg.inputs?.inputs ?? []).map(x => [x.id, x]));
if (inputs.has('INP_EVI_SETTING_FLOOR')) throw new Error(`${id}: materialized legacy input remains`);
for (const expected of ['INP_EVI_SAMMY_TROPHY', 'INP_EVI_AT_END_TOUCH_VOICE']) {
  if (!inputs.has(expected)) throw new Error(`${id}: missing materialized input ${expected}`);
}
if (pkg.machine?.machineDataVersion !== '0.1.2') throw new Error(`${id}: machineDataVersion mismatch ${pkg.machine?.machineDataVersion}`);
const sourceRefs = new Set((pkg.evidence?.evidences ?? []).flatMap(x => x.sourceEvidenceRefs ?? []));
for (const expected of ['RE_TROPHY_GOLD_4PLUS', 'RE_TROPHY_KIRIN_5PLUS', 'RE_TROPHY_RAINBOW_6', 'RE_VOICE_YURIA_5PLUS']) {
  if (!sourceRefs.has(expected)) throw new Error(`${id}: missing sourceEvidenceRef ${expected}`);
}
for (const p of [`machines/${id}/machine-package.json`, `research/${id}/statistics-report.json`, `research/${id}/difficulty-report.json`, `research/${id}/setting-band-report.json`, 'catalog.json', 'difficulty-catalog.json', 'machine-registry.json']) {
  if (!requireFile(p)) throw new Error(`missing generated artifact: ${p}`);
}
console.log('Evidence UI v2 Batch 9 Hokuto formal gates: PASS');
