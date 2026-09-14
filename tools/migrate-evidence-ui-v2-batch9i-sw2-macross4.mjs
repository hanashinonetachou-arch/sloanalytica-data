#!/usr/bin/env node
import fs from 'node:fs';

const configs={
  L_STRIKE_WITCHES2_TF:{
    version:'0.1.1',
    legacyObsIds:['OBS_SW2_EVIDENCE','OBS_SETTING_EVIDENCE'],
    defs:[
      {groupId:'NEUROI_BATTLE_END',label:'ネウロイバトル終了画面',contractId:'EVI_UI_NEUROI_BATTLE_END',obsId:'OBS_EVI_NEUROI_BATTLE_END',sourceType:'END_EVENT',mode:'VISUAL_EVENT',specs:[['RE_END_2PLUS','END_2PLUS'],['RE_END_3PLUS','END_3PLUS'],['RE_END_4PLUS','END_4PLUS'],['RE_END_5PLUS','END_5PLUS'],['RE_END_6','END_6']]},
      {groupId:'PAYOUT_DISPLAY',label:'獲得枚数表示',contractId:'EVI_UI_PAYOUT_DISPLAY',obsId:'OBS_EVI_PAYOUT_DISPLAY',sourceType:'END_EVENT',mode:'VISUAL_EVENT',specs:[['RE_PAYOUT_4PLUS','PAYOUT_501_4PLUS']]}
    ],
    note:'旧設定下限をネウロイバトル終了画面と獲得枚数表示へ分離した。'
  },
  L_MACROSS_FRONTIER4_BA:{
    version:'0.1.1',
    legacyObsIds:['OBS_MACROSS_EVIDENCE','OBS_SETTING_EVIDENCE'],
    defs:[
      {groupId:'BONUS_CONFIRM_CHARACTER',label:'ボーナス確定時キャラ',contractId:'EVI_UI_BONUS_CONFIRM_CHARACTER',obsId:'OBS_EVI_BONUS_CONFIRM_CHARACTER',sourceType:'END_EVENT',mode:'VISUAL_EVENT',specs:[['RE_BONUS_CHAR_2PLUS','BONUS_CHAR_2PLUS'],['RE_BONUS_CHAR_5PLUS','BONUS_CHAR_5PLUS']]},
      {groupId:'UTAHIME_BONUS_END',label:'歌姫ボーナス終了画面',contractId:'EVI_UI_UTAHIME_BONUS_END',obsId:'OBS_EVI_UTAHIME_BONUS_END',sourceType:'END_EVENT',mode:'VISUAL_EVENT',specs:[['RE_UTAHIME_END_2PLUS','UTAHIME_END_2PLUS'],['RE_UTAHIME_END_2_DENIED','UTAHIME_END_DENY_2'],['RE_UTAHIME_END_6','UTAHIME_END_6']]},
      {groupId:'SONG_SELECTION',label:'AT・ボーナス中楽曲',contractId:'EVI_UI_SONG_SELECTION',obsId:'OBS_EVI_SONG_SELECTION',sourceType:'DIRECT_PLAY',mode:'AUDIO_EVENT',specs:[['RE_SONG_4PLUS','SONG_4PLUS']]}
    ],
    note:'旧設定下限・設定否定をボーナス確定時キャラ、歌姫ボーナス終了画面、AT・ボーナス中楽曲へ分離した。'
  }
};

for(const [id,cfg] of Object.entries(configs)){
  const base=`research/${id}`;
  const sp=`${base}/selection-data.json`,rp=`${base}/research-data.json`,op=`${base}/machine-observation-data.json`,up=`${base}/ui-design-data.json`;
  const selection=JSON.parse(fs.readFileSync(sp,'utf8'));
  const research=JSON.parse(fs.readFileSync(rp,'utf8'));
  const observation=JSON.parse(fs.readFileSync(op,'utf8'));
  const ui=JSON.parse(fs.readFileSync(up,'utf8'));
  const em=new Map((research.evidenceCandidates??[]).map(x=>[x.researchEvidenceId,x]));
  const groups=cfg.defs.map(d=>({
    groupId:d.groupId,label:d.label,selectionMode:'single',normalizationMode:'ALLOWED_SETTINGS',
    options:d.specs.map(([sourceEvidenceId,value])=>{
      const ev=em.get(sourceEvidenceId);
      if(!ev||ev.factStatus!=='verified') throw new Error(`${id}: invalid Research Evidence ${sourceEvidenceId}`);
      if(!Array.isArray(ev.allowedSettings)||ev.allowedSettings.length===0) throw new Error(`${id}: missing allowedSettings ${sourceEvidenceId}`);
      return {value,label:ev.name,allowedSettings:ev.allowedSettings,excludedSettings:ev.deniedSettings??[],sourceEvidenceIds:[sourceEvidenceId]};
    })
  }));
  selection.machineDataVersion=cfg.version;
  selection.evidence=[];
  selection.evidenceUi={groups};
  selection.evidenceReview=selection.evidenceReview??{policyVersion:1,exclusions:[]};
  fs.writeFileSync(sp,JSON.stringify(selection,null,2)+'\n');

  const replacementIds=new Set([...cfg.legacyObsIds,...cfg.defs.map(d=>d.obsId)]);
  observation.observations=(observation.observations??[]).filter(x=>!replacementIds.has(x.observationId));
  for(const d of cfg.defs){
    const g=groups.find(x=>x.groupId===d.groupId);
    observation.observations.push({observationId:d.obsId,sourceType:d.sourceType,observationMode:d.mode,status:'FOUND',label:d.label,categories:g.options.map(x=>x.label),timing:[`${d.label}を実際に確認した時`],excludedConditions:['未確認を非発生とみなさない'],sourceRefs:[],notes:'Evidence UI v2 Phase 2。設定下限・設定否定ではなく自然観測を記録する。'});
  }
  fs.writeFileSync(op,JSON.stringify(observation,null,2)+'\n');

  const sec=ui.sections?.['設定確定・否定情報'];
  if(!sec) throw new Error(`${id}: evidence section missing`);
  sec.inputIds=[];
  sec.evidenceIds=cfg.defs.map(d=>d.contractId);
  sec.description=sec.description??'';
  sec.collapsible=sec.collapsible??false;
  sec.defaultExpanded=sec.defaultExpanded??true;
  for(const iid of ['INP_EVI_SETTING_FLOOR','INP_EVI_SETTING_DENIAL']) delete ui.inputContracts?.[iid];
  ui.evidenceContracts={};
  for(const d of cfg.defs) ui.evidenceContracts[d.contractId]={label:d.label,selectionMode:'single',sourceEvidenceGroupId:d.groupId,inheritOptions:true};
  ui.auditNotes=[`Evidence UI v2 Phase 2正式移行。${cfg.note}`,'Research EvidenceのallowedSettings / deniedSettingsを唯一の設定制約ソースとし、Feature再選定は行っていない。'];
  fs.writeFileSync(up,JSON.stringify(ui,null,2)+'\n');
  console.log(`${id}: Evidence UI v2 batch9i canonical migration complete`);
}
