#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();

function patchFile(file, transforms){
  const p=path.join(root,file);
  let s=fs.readFileSync(p,'utf8');
  for(const {name, oldText, newText} of transforms){
    if(s.includes(newText)){
      console.log(`already patched: ${file} / ${name}`);
      continue;
    }
    if(!s.includes(oldText)) throw new Error(`patch point not found: ${file} / ${name}`);
    s=s.replace(oldText,newText);
    console.log(`patched: ${file} / ${name}`);
  }
  fs.writeFileSync(p,s,'utf8');
  return s;
}

const build=patchFile('tools/build-machine-data.mjs',[
  {
    name:'emit inferenceSettings',
    oldText:'    settings:research.machine.settings,\n    packagePolicy:{offlineCapable:true,containsImages:false,containsExecutableCode:false}',
    newText:'    settings:research.machine.settings,\n    ...(Array.isArray(research.machine.inferenceSettings)?{inferenceSettings:research.machine.inferenceSettings}:{}),\n    packagePolicy:{offlineCapable:true,containsImages:false,containsExecutableCode:false}'
  }
]);

const audit=patchFile('tools/audit-public-data.mjs',[
  {
    name:'validate inferenceSettings',
    oldText:"  const settings = machineData.machine.settings;\n  if (!Array.isArray(settings) || settings.length === 0 || settings.some(value => !isNonEmptyString(value))) issue(result, 'error', scope, 'machine.settingsは空でない設定ID配列である必要があります');\n  else for (const duplicate of duplicateValues(settings)) issue(result, 'error', scope, `machine.settingsが重複しています: ${duplicate}`);",
    newText:"  const settings = machineData.machine.settings;\n  if (!Array.isArray(settings) || settings.length === 0 || settings.some(value => !isNonEmptyString(value))) issue(result, 'error', scope, 'machine.settingsは空でない設定ID配列である必要があります');\n  else for (const duplicate of duplicateValues(settings)) issue(result, 'error', scope, `machine.settingsが重複しています: ${duplicate}`);\n  const inferenceSettings = machineData.machine.inferenceSettings ?? settings;\n  if (!Array.isArray(inferenceSettings) || inferenceSettings.length === 0 || inferenceSettings.some(value => !isNonEmptyString(value))) issue(result, 'error', scope, 'machine.inferenceSettingsは空でない設定ID配列である必要があります');\n  else {\n    for (const duplicate of duplicateValues(inferenceSettings)) issue(result, 'error', scope, `machine.inferenceSettingsが重複しています: ${duplicate}`);\n    for (const setting of inferenceSettings) if (!settings.includes(setting)) issue(result, 'error', scope, `machine.inferenceSettingsにmachine.settings未定義の設定があります: ${setting}`);\n  }"
  },
  {
    name:'feature probability scope',
    oldText:"      validateSettingProbabilityMap(map, Array.isArray(settings) ? settings : [], result, featureScope, feature?.calculationRole !== 'DISPLAY_ONLY');",
    newText:"      validateSettingProbabilityMap(map, Array.isArray(inferenceSettings) ? inferenceSettings : [], result, featureScope, feature?.calculationRole !== 'DISPLAY_ONLY');"
  }
]);

const requiredChecks=[
  [build,'inferenceSettings:research.machine.inferenceSettings','build-machine-data did not retain inferenceSettings'],
  [audit,'const inferenceSettings = machineData.machine.inferenceSettings ?? settings;','audit missing inferenceSettings declaration'],
  [audit,'validateSettingProbabilityMap(map, Array.isArray(inferenceSettings) ? inferenceSettings : []','audit still validates feature probabilities against machine.settings'],
];
for(const [text,needle,message] of requiredChecks){
  if(!text.includes(needle)) throw new Error(message);
}

console.log('INFERENCE SETTINGS CONTRACT PATCH: PASS');
