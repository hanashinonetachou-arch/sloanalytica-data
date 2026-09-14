#!/usr/bin/env node
import fs from 'node:fs';

const configs = [
  {id:'L_KINNIKUMAN4_SLDC',version:'0.1.1',groupId:'ENDING_TROPHY',label:'エンディング終了時トロフィー',specs:[['RE_TROPHY_2PLUS','TROPHY_BRONZE'],['RE_TROPHY_6','TROPHY_RAINBOW']]},
  {id:'L_SAEKANO_SA3',version:'0.1.1',groupId:'PETIT_HEROINE_BONUS_END',label:'ぷちヒロインBONUS終了画面',specs:[['RE_PETIT_END_2PLUS','THREE_HEROINES'],['RE_PETIT_END_4PLUS','FOUR_CHARACTERS'],['RE_PETIT_END_6','ONSEN']]},
  {id:'L_KARAKURI_CIRCUS_G',version:'0.1.1',groupId:'AT_END_SCREEN',label:'AT終了画面',specs:[['RE_AT_END_2PLUS','ASHIHANA_GUY'],['RE_AT_END_4PLUS','SHIROGANE_MASARU_NARUMI'],['RE_AT_END_6','FRANCINE']]},
  {id:'L_YOSHIMUNE_RISING_SA2',version:'0.1.1',groupId:'AT_END_SCREEN',label:'AT終了画面',specs:[['RE_END_2PLUS','HIME'],['RE_END_4PLUS','HIME_CHIBIHIME'],['RE_END_5PLUS','ALLY_CHARACTERS'],['RE_END_6','OBANBURUMAI']]}
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
    'Evidence UI v2 Phase 2正式移行。設定結果ではなく実際に確認した終了画面・トロフィーを入力する。',
    '設定下限・否定設定はResearch Evidenceから導出し、Feature再選定は行っていない。'
  ];
  fs.writeFileSync(up,JSON.stringify(ui,null,2)+'\n');
}
