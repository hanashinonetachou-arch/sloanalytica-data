#!/usr/bin/env node
import fs from 'node:fs';

const configs=[
  {
    id:'L_ULTRAMAN_TIGA_KA',version:'0.1.1',legacyObsIds:['OBS_SETTING_EVIDENCE'],
    groups:[
      {groupId:'TC_TITLE',label:'TCタイトル',contractId:'EVI_UI_TC_TITLE',obsId:'OBS_EVI_TC_TITLE',sourceType:'DIRECT_PLAY',mode:'VISUAL_EVENT',timing:'TCタイトル確認時',specs:[['RE_TC_TITLE_6','TC_TITLE_ZEBRA']]},
      {groupId:'REG_CHARACTER',label:'REGキャラ',contractId:'EVI_UI_REG_CHARACTER',obsId:'OBS_EVI_REG_CHARACTER',sourceType:'END_EVENT',mode:'VISUAL_EVENT',timing:'REG中のキャラ確認時',specs:[['RE_REG_6','REG_GATANOZOA']]},
      {groupId:'PAYOUT_DISPLAY',label:'獲得枚数表示',contractId:'EVI_UI_PAYOUT_DISPLAY',obsId:'OBS_EVI_PAYOUT_DISPLAY',sourceType:'DIRECT_PLAY',mode:'VISUAL_EVENT',timing:'獲得枚数表示確認時',specs:[['RE_666_6','PAYOUT_666']]},
      {groupId:'UB_END_SCREEN',label:'UB終了画面',contractId:'EVI_UI_UB_END_SCREEN',obsId:'OBS_EVI_UB_END_SCREEN',sourceType:'END_EVENT',mode:'VISUAL_EVENT',timing:'UB終了画面確認時',specs:[['RE_UB_6','UB_END_GLITTER']]},
      {groupId:'ENDING_END_SCREEN',label:'エンディング終了画面',contractId:'EVI_UI_ENDING_END_SCREEN',obsId:'OBS_EVI_ENDING_END_SCREEN',sourceType:'END_EVENT',mode:'VISUAL_EVENT',timing:'エンディング終了画面確認時',specs:[['RE_END_6','ENDING_TIGA_3TYPES']]},
      {groupId:'TROPHY',label:'トロフィー',contractId:'EVI_UI_TROPHY',obsId:'OBS_EVI_TROPHY',sourceType:'END_EVENT',mode:'VISUAL_EVENT',timing:'トロフィー確認時',specs:[['RE_TROPHY_6','TROPHY_RAINBOW']]}
    ]
  },
  {
    id:'L_ZOMBIE_LAND_SAGA',version:'0.1.3',legacyObsIds:['OBS_SETTING_EVIDENCE'],
    groups:[
      {groupId:'ST_END_SCREEN',label:'ST終了画面',contractId:'EVI_UI_ST_END_SCREEN',obsId:'OBS_EVI_ST_END_SCREEN',sourceType:'END_EVENT',mode:'VISUAL_EVENT',timing:'ST終了画面確認時',specs:[['EV_ST_END_2PLUS','ST_END_2PLUS'],['EV_ST_END_4PLUS','ST_END_4PLUS'],['EV_ST_END_5PLUS','ST_END_5PLUS'],['EV_ST_END_6','ST_END_6']]},
      {groupId:'ENDING_VOICE',label:'エンディング幸太郎ボイス',contractId:'EVI_UI_ENDING_VOICE',obsId:'OBS_EVI_ENDING_VOICE',sourceType:'END_EVENT',mode:'AUDIO_EVENT',timing:'エンディング中の幸太郎ボイス確認時',specs:[['EV_ENDING_4PLUS','ENDING_VOICE_4PLUS'],['EV_ENDING_5PLUS','ENDING_VOICE_5PLUS'],['EV_ENDING_6','ENDING_VOICE_6']]}
    ]
  },
  {
    id:'S_FIRE_DRIFT',version:'0.1.1',legacyObsIds:['OBS_SETTING_EVIDENCE'],
    groups:[
      {groupId:'JAC_IN_SCREEN',label:'JAC IN画面',contractId:'EVI_UI_JAC_IN_SCREEN',obsId:'OBS_EVI_JAC_IN_SCREEN',sourceType:'DIRECT_PLAY',mode:'VISUAL_EVENT',timing:'BIG中JAC IN画面確認時',specs:[['EV_JAC_2PLUS','JAC_2PLUS'],['EV_JAC_4PLUS','JAC_4PLUS'],['EV_JAC_5PLUS','JAC_5PLUS'],['EV_JAC_6','JAC_6']]},
      {groupId:'SAMMY_TROPHY',label:'サミートロフィー',contractId:'EVI_UI_SAMMY_TROPHY',obsId:'OBS_EVI_SAMMY_TROPHY',sourceType:'END_EVENT',mode:'VISUAL_EVENT',timing:'ボーナス終了時のサミートロフィー確認時',specs:[['EV_TROPHY_2PLUS','TROPHY_BRONZE'],['EV_TROPHY_3PLUS','TROPHY_SILVER'],['EV_TROPHY_4PLUS','TROPHY_GOLD'],['EV_TROPHY_5PLUS','TROPHY_KIRIN'],['EV_TROPHY_6','TROPHY_RAINBOW']]}
    ]
  }
];

for(const cfg of configs){
  const base=`research/${cfg.id}`;
  const sp=`${base}/selection-data.json`,rp=`${base}/research-data.json`,op=`${base}/machine-observation-data.json`,up=`${base}/ui-design-data.json`;
  const selection=JSON.parse(fs.readFileSync(sp,'utf8'));
  const research=JSON.parse(fs.readFileSync(rp,'utf8'));
  const observation=JSON.parse(fs.readFileSync(op,'utf8'));
  const ui=JSON.parse(fs.readFileSync(up,'utf8'));
  const em=new Map((research.evidenceCandidates??[]).map(x=>[x.researchEvidenceId,x]));

  const groups=cfg.groups.map(g=>({
    groupId:g.groupId,label:g.label,selectionMode:'single',normalizationMode:'ALLOWED_SETTINGS',
    options:g.specs.map(([sourceEvidenceId,value])=>{
      const ev=em.get(sourceEvidenceId);
      if(!ev) throw new Error(`${cfg.id}: missing Research Evidence ${sourceEvidenceId}`);
      if(ev.factStatus && ev.factStatus!=='verified') throw new Error(`${cfg.id}: unverified Research Evidence ${sourceEvidenceId}`);
      if(!Array.isArray(ev.allowedSettings)||!Array.isArray(ev.deniedSettings)) throw new Error(`${cfg.id}: incomplete settings ${sourceEvidenceId}`);
      return {value,label:ev.name,allowedSettings:ev.allowedSettings,excludedSettings:ev.deniedSettings,sourceEvidenceIds:[sourceEvidenceId]};
    })
  }));
  selection.machineDataVersion=cfg.version;
  selection.evidenceUi={groups};
  fs.writeFileSync(sp,JSON.stringify(selection,null,2)+'\n');

  const newObsIds=new Set(cfg.groups.map(g=>g.obsId));
  observation.observations=(observation.observations??[]).filter(x=>!cfg.legacyObsIds.includes(x.observationId)&&!newObsIds.has(x.observationId));
  for(const g of cfg.groups){
    const group=groups.find(x=>x.groupId===g.groupId);
    observation.observations.push({
      observationId:g.obsId,sourceType:g.sourceType,observationMode:g.mode,status:'FOUND',label:g.label,
      categories:group.options.map(x=>x.label),timing:[g.timing],excludedConditions:['未確認を非発生とみなさない'],sourceRefs:[],
      notes:'Evidence UI v2 Phase 2。設定下限ではなく、実際に確認した自然観測を記録する。'
    });
  }
  fs.writeFileSync(op,JSON.stringify(observation,null,2)+'\n');

  const sec=ui.sections?.['設定確定・否定情報'];
  if(!sec) throw new Error(`${cfg.id}: evidence section missing`);
  sec.inputIds=[];
  sec.evidenceIds=cfg.groups.map(g=>g.contractId);
  sec.description=sec.description??'';
  sec.collapsible=sec.collapsible??false;
  sec.defaultExpanded=sec.defaultExpanded??true;
  delete ui.inputContracts?.INP_EVI_SETTING_FLOOR;
  ui.evidenceContracts={};
  for(const g of cfg.groups) ui.evidenceContracts[g.contractId]={label:g.label,selectionMode:'single',sourceEvidenceGroupId:g.groupId,inheritOptions:true};
  ui.auditNotes=[
    'Evidence UI v2 Phase 2正式移行。設定結果そのものではなく、実際に観測した画面・ボイス・トロフィー等を入力する。',
    'Research EvidenceのallowedSettings / deniedSettingsを唯一の設定制約ソースとし、既存Featureの再選定は行っていない。',
    'Legacyの設定下限圧縮をResearchで既に分離済みの自然観測面へ分割した。'
  ];
  fs.writeFileSync(up,JSON.stringify(ui,null,2)+'\n');
  console.log(`${cfg.id}: Evidence UI v2 batch9e canonical migration complete`);
}
