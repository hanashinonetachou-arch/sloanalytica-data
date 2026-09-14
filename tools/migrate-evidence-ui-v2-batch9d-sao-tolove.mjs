#!/usr/bin/env node
import fs from 'node:fs';

const configs=[
  {
    id:'L_SAO_B2', version:'0.1.2',
    groupId:'BOSS_BATTLE_END_SCREEN', label:'ボスバトル終了画面',
    evidenceContractId:'EVI_UI_BOSS_BATTLE_END_SCREEN',
    obsId:'OBS_BOSS_BATTLE_END_SCREEN_EVIDENCE',
    obsTiming:'ボスバトル終了画面確認時',
    specs:[
      ['RE_AT_END_2PLUS','END_KIRITO_SILICA'],
      ['RE_AT_END_3PLUS','END_ASUNA_LIZ'],
      ['RE_AT_END_4PLUS','END_ASUNA_YUI'],
      ['RE_AT_END_5PLUS','END_KIRITO_SACHI'],
      ['RE_AT_END_6','END_UNIFORM']
    ],
    legacyObsIds:['OBS_SAO_EVIDENCE','OBS_SETTING_EVIDENCE']
  },
  {
    id:'L_TOLOVE_DARKNESS_S6', version:'0.1.1',
    groupId:'ST_END_STAMP', label:'ST終了画面スタンプ',
    evidenceContractId:'EVI_UI_ST_END_STAMP',
    obsId:'OBS_ST_END_STAMP_EVIDENCE',
    obsTiming:'ST終了画面のスタンプを実際に確認した時',
    specs:[
      ['RE_3PLUS','STAMP_KICHI'],
      ['RE_4PLUS','STAMP_RYO'],
      ['RE_5PLUS','STAMP_YU'],
      ['RE_6','STAMP_KIWAMI']
    ],
    legacyObsIds:['OBS_SETTING_EVIDENCE']
  }
];

for(const cfg of configs){
  const base=`research/${cfg.id}`;
  const sp=`${base}/selection-data.json`;
  const rp=`${base}/research-data.json`;
  const op=`${base}/machine-observation-data.json`;
  const up=`${base}/ui-design-data.json`;
  const selection=JSON.parse(fs.readFileSync(sp,'utf8'));
  const research=JSON.parse(fs.readFileSync(rp,'utf8'));
  const observation=JSON.parse(fs.readFileSync(op,'utf8'));
  const ui=JSON.parse(fs.readFileSync(up,'utf8'));
  const evidenceMap=new Map((research.evidenceCandidates??[]).map(x=>[x.researchEvidenceId,x]));

  const options=cfg.specs.map(([sourceEvidenceId,value])=>{
    const ev=evidenceMap.get(sourceEvidenceId);
    if(!ev) throw new Error(`${cfg.id}: missing Research Evidence ${sourceEvidenceId}`);
    if(ev.factStatus && ev.factStatus!=='verified') throw new Error(`${cfg.id}: Research Evidence not verified ${sourceEvidenceId}`);
    if(!Array.isArray(ev.allowedSettings)||!Array.isArray(ev.deniedSettings)) throw new Error(`${cfg.id}: incomplete Research Evidence settings ${sourceEvidenceId}`);
    return {value,label:ev.name,allowedSettings:ev.allowedSettings,excludedSettings:ev.deniedSettings,sourceEvidenceIds:[sourceEvidenceId]};
  });

  selection.machineDataVersion=cfg.version;
  selection.evidenceUi={groups:[{
    groupId:cfg.groupId,
    label:cfg.label,
    selectionMode:'single',
    normalizationMode:'ALLOWED_SETTINGS',
    options
  }]};
  fs.writeFileSync(sp,JSON.stringify(selection,null,2)+'\n');

  observation.observations=(observation.observations??[]).filter(x=>!cfg.legacyObsIds.includes(x.observationId));
  observation.observations.push({
    observationId:cfg.obsId,
    sourceType:'END_EVENT',
    observationMode:'VISUAL_EVENT',
    status:'FOUND',
    label:cfg.label,
    categories:options.map(x=>x.label),
    timing:[cfg.obsTiming],
    excludedConditions:['未確認を非発生とみなさない'],
    sourceRefs:[],
    notes:'Evidence UI v2 Phase 2。設定下限そのものではなく、実際に確認した自然観測を記録する。'
  });
  fs.writeFileSync(op,JSON.stringify(observation,null,2)+'\n');

  const sec=ui.sections?.['設定確定・否定情報'];
  if(!sec) throw new Error(`${cfg.id}: evidence section missing`);
  sec.inputIds=[];
  sec.evidenceIds=[cfg.evidenceContractId];
  sec.description=sec.description??'';
  sec.collapsible=sec.collapsible??false;
  sec.defaultExpanded=sec.defaultExpanded??true;
  delete ui.inputContracts?.INP_EVI_SETTING_FLOOR;
  ui.evidenceContracts=ui.evidenceContracts??{};
  for(const key of Object.keys(ui.evidenceContracts)) if(key.startsWith('EVI_UI_SETTING_')) delete ui.evidenceContracts[key];
  ui.evidenceContracts[cfg.evidenceContractId]={label:cfg.label,selectionMode:'single',sourceEvidenceGroupId:cfg.groupId,inheritOptions:true};
  ui.auditNotes=[
    'Evidence UI v2 Phase 2正式移行。設定結果ではなく、実際に観測した終了画面・スタンプを入力する。',
    'Research EvidenceのallowedSettings / deniedSettingsを唯一の設定制約ソースとし、既存Featureの再選定は行っていない。',
    `旧INP_EVI_SETTING_FLOORを廃止し、自然観測面${cfg.groupId}へ移行した。`
  ];
  fs.writeFileSync(up,JSON.stringify(ui,null,2)+'\n');
  console.log(`${cfg.id}: Evidence UI v2 batch9d canonical migration complete`);
}
