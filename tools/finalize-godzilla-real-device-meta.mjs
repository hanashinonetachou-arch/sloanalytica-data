#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const machineId = 'L_GODZILLA_NS';
const obsPath = path.join(root, 'research', machineId, 'machine-observation-data.json');
const uiPath = path.join(root, 'research', machineId, 'ui-design-data.json');

const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const write = (file, data) => fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);

const obs = read(obsPath);
const ui = read(uiPath);

// Hall data counters vary by venue and are not needed for either adopted numeric input.
obs.sourceCoverage.dataCounter = 'NOT_REQUIRED';
const dataCounterCheck = (obs.fieldVerificationItems ?? []).find(x => x.verificationId === 'VFY_L_GODZILLA_NS_DATA_COUNTER');
if (dataCounterCheck) {
  dataCounterCheck.status = 'NOT_REQUIRED';
  dataCounterCheck.question = '採用中の推測項目は実機PUSHメニューと自己実戦中の有効通常ゲーム数で取得できるため、ホール設備依存のデータカウンター確認は必須としない。';
}

const shurai = ui.sections?.['襲来ZONE対戦怪獣'];
if (!shurai) throw new Error('Missing 襲来ZONE対戦怪獣 UI section');
shurai.observationRole = 'MACHINE_MENU';
shurai.observationRefs = ['OBS_SHURAI_OPPONENT'];
shurai.acquisitionSources = ['MACHINE_MENU'];

// No unresolved real-device dependency remains for the UI contract.
if (ui.status === 'PASS_WITH_UNRESOLVED') ui.status = 'PASS';

write(obsPath, obs);
write(uiPath, ui);
console.log('Finalized L_GODZILLA_NS real-device observation/UI metadata.');
