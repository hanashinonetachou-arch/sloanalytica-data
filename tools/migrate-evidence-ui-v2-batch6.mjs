#!/usr/bin/env node
import fs from 'node:fs';

const configs = [
  {id:'L_SENGOKU_BASARA_GIGA_ZE',version:'0.1.2',groupId:'IKKIGAKE_RED_ICON_ADD',label:'一騎駆け赤アイコン加算',specs:[
    ['RE_ICON_222_2PLUS','ADD_222'],['RE_ICON_333_3PLUS','ADD_333'],['RE_ICON_444_456_4PLUS','ADD_444_456'],['RE_ICON_555_5PLUS','ADD_555'],['RE_ICON_666_6','ADD_666']
  ]},
  {id:'L_LOVEKYURE2_PS',version:'0.1.3',groupId:'ZETTAI_KUUIKI_END_VOICE',label:'絶対空域終了時ボイス',specs:[
    ['RE_ART_END_VOICE_2PLUS','VOICE_2PLUS'],['RE_ART_END_VOICE_3PLUS','VOICE_3PLUS'],['RE_ART_END_VOICE_4PLUS','VOICE_4PLUS'],['RE_ART_END_VOICE_5PLUS','VOICE_5PLUS'],['RE_ART_END_VOICE_6','VOICE_6']
  ]},
  {id:'L_HEY_ELITE_SALARYMAN_KAGAMI_PA4',version:'0.1.3',groupId:'BONUS_AT_END_SCREEN',label:'ボーナス・AT終了画面',specs:[
    ['RE_END_2PLUS','TRAINING'],['RE_END_4PLUS','BLACKJACK'],['RE_END_5PLUS','ELITE_GUYS'],['RE_END_6','PAJAMA_PARTY']
  ]}
];

for (const cfg of configs) {
  const base=`research/${cfg.id}`;
  const sp=`${base}/selection-data.json`, rp=`${base}/research-data.json`, up=`${base}/ui-design-data.json`;
  const s=JSON.parse(fs.readFileSync(sp,'utf8'));
  const r=JSON.parse(fs.readFileSync(rp,'utf8'));
  const ui=JSON.parse(fs.readFileSync(up,'utf8'));
  const em=new Map((r.evidenceCandidates??[]).map(x=>[x.researchEvidenceId,x]));
  const options=cfg.specs.map(([eid,value])=>{
    const c=em.get(eid);
    if(!c||c.factStatus!=='verified') throw new Error(`${cfg.id}: invalid Research Evidence ${eid}`);
    return {value,label:c.name,allowedSettings:c.allowedSettings,excludedSettings:c.deniedSettings??[],sourceEvidenceIds:[eid]};
  });
  s.machineDataVersion=cfg.version;
  s.evidenceUi={groups:[{groupId:cfg.groupId,label:cfg.label,selectionMode:'single',normalizationMode:'ALLOWED_SETTINGS',options}]};
  fs.writeFileSync(sp,JSON.stringify(s,null,2)+'\n');

  const sec=ui.sections?.['設定確定・否定情報'];
  if(!sec) throw new Error(`${cfg.id}: evidence section missing`);
  sec.inputIds=[];
  sec.evidenceIds=[`EVI_UI_${cfg.groupId}`];
  sec.description=sec.description??'';
  sec.collapsible=sec.collapsible??false;
  sec.defaultExpanded=sec.defaultExpanded??true;
  delete ui.inputContracts?.INP_EVI_SETTING_FLOOR;
  ui.evidenceContracts={
    [`EVI_UI_${cfg.groupId}`]:{label:cfg.label,selectionMode:'single',sourceEvidenceGroupId:cfg.groupId,inheritOptions:true}
  };
  ui.auditNotes=[
    'Evidence UI v2 Phase 2正式移行。設定結果ではなく実際に確認した演出を入力する。',
    '設定制約はResearch EvidenceのallowedSettings / deniedSettingsから導出し、Feature再選定は行っていない。'
  ];
  fs.writeFileSync(up,JSON.stringify(ui,null,2)+'\n');
}
