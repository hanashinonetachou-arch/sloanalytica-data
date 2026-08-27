#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const targets={
  S_SHIN_ORE_NO_SORA_ST:['SET_1','SET_3','SET_4','SET_5','SET_6'],
  S_OKIDOKI_GOLD_GS:['SET_1','SET_2','SET_3','SET_4','SET_5','SET_6'],
  L_NYANKO_DAISENSO_CHOSHINSOKU_KB:['SET_1','SET_2','SET_4','SET_5','SET_6'],
};

for(const [id,inferenceSettings] of Object.entries(targets)){
  const researchPath=path.join(root,'research',id,'research-data.json');
  if(!fs.existsSync(researchPath)) throw new Error(`missing ${researchPath}`);
  const research=JSON.parse(fs.readFileSync(researchPath,'utf8'));
  research.machine.inferenceSettings=inferenceSettings;
  fs.writeFileSync(researchPath,JSON.stringify(research,null,2)+'\n','utf8');
  console.log(`research inferenceSettings: ${id} -> ${inferenceSettings.join(',')}`);
}

const buildPath=path.join(root,'tools','build-machine-data.mjs');
let build=fs.readFileSync(buildPath,'utf8');
const buildNeedle='    settings:research.machine.settings,\n    packagePolicy:{offlineCapable:true,containsImages:false,containsExecutableCode:false}';
const buildReplacement='    settings:research.machine.settings,\n    ...(Array.isArray(research.machine.inferenceSettings)?{inferenceSettings:research.machine.inferenceSettings}:{}),\n    packagePolicy:{offlineCapable:true,containsImages:false,containsExecutableCode:false}';
if(!build.includes(buildReplacement)){
  if(!build.includes(buildNeedle)) throw new Error('build-machine-data patch point not found');
  build=build.replace(buildNeedle,buildReplacement);
  fs.writeFileSync(buildPath,build,'utf8');
  console.log('patched build-machine-data.mjs');
}

const auditPath=path.join(root,'tools','audit-public-data.mjs');
let audit=fs.readFileSync(auditPath,'utf8');
const auditNeedle='  const settings = machineData.machine.settings;\n  if (!Array.isArray(settings) || settings.length === 0 || settings.some(value => !isNonEmptyString(value))) issue(result, \'error\', scope, \'machine.settingsは空でない設定ID配列である必要があります\');\n  else for (const duplicate of duplicateValues(settings)) issue(result, \'error\', scope, `machine.settingsが重複しています: ${duplicate}`);';
const auditReplacement='  const settings = machineData.machine.settings;\n  if (!Array.isArray(settings) || settings.length === 0 || settings.some(value => !isNonEmptyString(value))) issue(result, \'error\', scope, \'machine.settingsは空でない設定ID配列である必要があります\');\n  else for (const duplicate of duplicateValues(settings)) issue(result, \'error\', scope, `machine.settingsが重複しています: ${duplicate}`);\n  const inferenceSettings = machineData.machine.inferenceSettings ?? settings;\n  if (!Array.isArray(inferenceSettings) || inferenceSettings.length === 0 || inferenceSettings.some(value => !isNonEmptyString(value))) issue(result, \'error\', scope, \'machine.inferenceSettingsは空でない設定ID配列である必要があります\');\n  else {\n    for (const duplicate of duplicateValues(inferenceSettings)) issue(result, \'error\', scope, `machine.inferenceSettingsが重複しています: ${duplicate}`);\n    for (const setting of inferenceSettings) if (!settings.includes(setting)) issue(result, \'error\', scope, `machine.inferenceSettingsにmachine.settings未定義の設定があります: ${setting}`);\n  }';
if(!audit.includes(auditReplacement)){
  if(!audit.includes(auditNeedle)) throw new Error('audit-public-data settings patch point not found');
  audit=audit.replace(auditNeedle,auditReplacement);
}
const mapNeedle='      validateSettingProbabilityMap(map, Array.isArray(settings) ? settings : [], result, featureScope, feature?.calculationRole !== \'DISPLAY_ONLY\');';
const mapReplacement='      validateSettingProbabilityMap(map, Array.isArray(inferenceSettings) ? inferenceSettings : [], result, featureScope, feature?.calculationRole !== \'DISPLAY_ONLY\');';
if(!audit.includes(mapReplacement)){
  if(!audit.includes(mapNeedle)) throw new Error('audit-public-data probability patch point not found');
  audit=audit.replace(mapNeedle,mapReplacement);
}
fs.writeFileSync(auditPath,audit,'utf8');
console.log('patched audit-public-data.mjs');
