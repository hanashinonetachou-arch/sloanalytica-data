#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function read(rel){ return fs.readFileSync(path.join(root, rel), 'utf8'); }
function write(rel, s){ fs.writeFileSync(path.join(root, rel), s, 'utf8'); }

function patchBuilder(){
  const rel = 'tools/build-machine-data.mjs';
  let s = read(rel);
  const marker = '...(Array.isArray(research.machine.inferenceSettings)?{inferenceSettings:research.machine.inferenceSettings}:{}),';
  if (s.includes(marker)) {
    console.log('builder: already patched');
    return;
  }
  const re = /(\n\s*settings:\s*research\.machine\.settings,\s*\n)/;
  if (!re.test(s)) throw new Error('builder patch point not found');
  s = s.replace(re, `$1    ...(Array.isArray(research.machine.inferenceSettings)?{inferenceSettings:research.machine.inferenceSettings}:{}),\n`);
  write(rel, s);
  console.log('builder: patched');
}

function patchAuditor(){
  const rel = 'tools/audit-public-data.mjs';
  let s = read(rel);

  if (!s.includes('const inferenceSettings = machineData.machine.inferenceSettings ?? settings;')) {
    const re = /(const settings = machineData\.machine\.settings;\s*\n\s*if \(!Array\.isArray\(settings\)[\s\S]*?machine\.settingsが重複しています: \$\{duplicate\}`\);\s*\n)/;
    const m = s.match(re);
    if (!m) throw new Error('auditor settings patch point not found');
    const addition = [
      '  const inferenceSettings = machineData.machine.inferenceSettings ?? settings;',
      "  if (!Array.isArray(inferenceSettings) || inferenceSettings.length === 0 || inferenceSettings.some(value => !isNonEmptyString(value))) issue(result, 'error', scope, 'machine.inferenceSettingsは空でない設定ID配列である必要があります');",
      '  else {',
      "    for (const duplicate of duplicateValues(inferenceSettings)) issue(result, 'error', scope, `machine.inferenceSettingsが重複しています: ${duplicate}`);",
      "    for (const setting of inferenceSettings) if (!settings.includes(setting)) issue(result, 'error', scope, `machine.inferenceSettingsにmachine.settings未定義の設定があります: ${setting}`);",
      '  }',
      ''
    ].join('\n');
    s = s.replace(re, m[1] + addition);
    console.log('auditor: inferenceSettings block patched');
  } else {
    console.log('auditor: inferenceSettings block already patched');
  }

  const oldCall = "validateSettingProbabilityMap(map, Array.isArray(settings) ? settings : [], result, featureScope, feature?.calculationRole !== 'DISPLAY_ONLY');";
  const newCall = "validateSettingProbabilityMap(map, Array.isArray(inferenceSettings) ? inferenceSettings : [], result, featureScope, feature?.calculationRole !== 'DISPLAY_ONLY');";
  if (!s.includes(newCall)) {
    if (!s.includes(oldCall)) throw new Error('auditor probability-map patch point not found');
    s = s.replace(oldCall, newCall);
    console.log('auditor: probability map patched');
  } else {
    console.log('auditor: probability map already patched');
  }

  write(rel, s);
}

function verify(){
  const build = read('tools/build-machine-data.mjs');
  const audit = read('tools/audit-public-data.mjs');
  const checks = [
    ['builder inferenceSettings emit', build.includes('inferenceSettings:research.machine.inferenceSettings')],
    ['auditor inferenceSettings block', audit.includes('const inferenceSettings = machineData.machine.inferenceSettings ?? settings;')],
    ['auditor feature probability scope', audit.includes('validateSettingProbabilityMap(map, Array.isArray(inferenceSettings) ? inferenceSettings : [], result, featureScope')],
  ];
  for (const [name, ok] of checks) {
    console.log(`${ok ? 'OK' : 'NG'}: ${name}`);
    if (!ok) throw new Error(`verification failed: ${name}`);
  }
  console.log('INFERENCE SETTINGS CONTRACT PATCH V3: PASS');
}

patchBuilder();
patchAuditor();
verify();
