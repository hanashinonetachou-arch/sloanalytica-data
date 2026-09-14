#!/usr/bin/env node
import fs from 'node:fs';

const id='L_ONE_PUNCH_MAN';
const base=`research/${id}`;
const sp=`${base}/selection-data.json`;
const rp=`${base}/research-data.json`;
const op=`${base}/machine-observation-data.json`;
const up=`${base}/ui-design-data.json`;

const selection=JSON.parse(fs.readFileSync(sp,'utf8'));
const research=JSON.parse(fs.readFileSync(rp,'utf8'));
const observation=JSON.parse(fs.readFileSync(op,'utf8'));
const ui=JSON.parse(fs.readFileSync(up,'utf8'));
const evidenceMap=new Map((research.evidenceCandidates??[]).map(x=>[x.researchEvidenceId,x]));

const specs=[
  ['EV_END_2PLUS','END_SAITAMA_UNDERGROUND'],
  ['EV_END_4PLUS','END_SAITAMA_FIGHT'],
  ['EV_END_6','END_S_CLASS_HEROES']
];
const options=specs.map(([sourceEvidenceId,value])=>{
  const ev=evidenceMap.get(sourceEvidenceId);
  if(!ev) throw new Error(`${id}: missing Research Evidence ${sourceEvidenceId}`);
  if(!Array.isArray(ev.allowedSettings)||!Array.isArray(ev.deniedSettings)) throw new Error(`${id}: incomplete Research Evidence settings ${sourceEvidenceId}`);
  return {
    value,
    label:ev.name,
    allowedSettings:ev.allowedSettings,
    excludedSettings:ev.deniedSettings,
    sourceEvidenceIds:[sourceEvidenceId]
  };
});

selection.machineDataVersion='0.1.3';
selection.evidenceUi={groups:[{
  groupId:'BONUS_AT_END_SCREEN',
  label:'ボーナス/AT終了画面',
  selectionMode:'single',
  normalizationMode:'ALLOWED_SETTINGS',
  options
}]};
fs.writeFileSync(sp,JSON.stringify(selection,null,2)+'\n');

const obsId='OBS_BONUS_AT_END_SCREEN_EVIDENCE';
if(!(observation.observations??[]).some(x=>x.observationId===obsId)) {
  observation.observations.push({
    observationId:obsId,
    sourceType:'END_EVENT',
    observationMode:'VISUAL_EVENT',
    status:'FOUND',
    label:'ボーナス/AT終了画面',
    categories:options.map(x=>x.label),
    timing:['ボーナスまたはAT終了画面を実際に確認した時'],
    excludedConditions:['未確認を非発生とみなさない'],
    sourceRefs:[],
    notes:'Evidence UI v2 Phase 2。設定下限そのものではなく、実際に確認した終了画面を記録する。'
  });
}
fs.writeFileSync(op,JSON.stringify(observation,null,2)+'\n');

const sec=ui.sections?.['設定確定・否定情報'];
if(!sec) throw new Error(`${id}: evidence section missing`);
sec.inputIds=[];
sec.evidenceIds=['EVI_UI_BONUS_AT_END_SCREEN'];
sec.description=sec.description??'';
sec.collapsible=sec.collapsible??false;
sec.defaultExpanded=sec.defaultExpanded??true;
delete ui.inputContracts?.INP_EVI_SETTING_FLOOR;
ui.evidenceContracts=ui.evidenceContracts??{};
ui.evidenceContracts.EVI_UI_BONUS_AT_END_SCREEN={
  label:'ボーナス/AT終了画面',
  selectionMode:'single',
  sourceEvidenceGroupId:'BONUS_AT_END_SCREEN',
  inheritOptions:true
};
ui.auditNotes=[
  'Evidence UI v2 Phase 2正式移行。設定結果ではなく、実際に観測したボーナス/AT終了画面を入力する。',
  'Research EvidenceのallowedSettings / deniedSettingsを唯一の設定制約ソースとし、既存ベストショットEvidenceと数値Featureの再選定は行っていない。',
  '旧INP_EVI_SETTING_FLOORを廃止し、自然観測面BONUS_AT_END_SCREENへ移行した。'
];
fs.writeFileSync(up,JSON.stringify(ui,null,2)+'\n');

console.log(`${id}: Evidence UI v2 batch9c canonical migration complete`);
