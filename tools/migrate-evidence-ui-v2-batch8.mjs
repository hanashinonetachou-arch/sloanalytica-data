#!/usr/bin/env node
import fs from 'node:fs';

const configs = [
  {
    id:'L_HIGURASHI_GOU_SS', version:'0.1.1',
    groups:[
      {groupId:'NIPAA_EVENT',label:'にぱー演出',selectionMode:'single',ids:['RE_NIPAA_2PLUS','RE_NIPAA_3PLUS','RE_NIPAA_4PLUS','RE_NIPAA_5PLUS','RE_NIPAA_6']},
      {groupId:'CZ_END_VOICE',label:'CZ終了時セリフ',selectionMode:'single',ids:['RE_CZ_VOICE_2PLUS','RE_CZ_VOICE_5PLUS']},
      {groupId:'BONUS_END_SCREEN',label:'ボーナス終了画面',selectionMode:'single',ids:['RE_BONUS_END_2PLUS','RE_BONUS_END_5PLUS','RE_BONUS_END_6']},
      {groupId:'TROPHY',label:'トロフィー',selectionMode:'single',ids:['RE_TROPHY_2PLUS','RE_TROPHY_4PLUS','RE_TROPHY_5PLUS','RE_TROPHY_6']},
      {groupId:'REG_CHARACTER',label:'REGキャラ紹介',selectionMode:'single',ids:['RE_REG_GOLD_4PLUS']}
    ]
  },
  {
    id:'L_BASILISK_KIZUNA2_TENZEN_ZN', version:'0.1.1',
    groups:[
      {groupId:'GENNOSUKE_BC_KILLS',label:'弦之介BC中撃破人数',selectionMode:'single',ids:['RE_KILLS_2PLUS','RE_KILLS_3PLUS','RE_KILLS_4PLUS','RE_KILLS_5PLUS','RE_KILLS_6']},
      {groupId:'BC_RED_LED_NO_BT',label:'通常時BC入賞時LED・BT非当選',selectionMode:'single',ids:['RE_BC_LED_RED_4PLUS']},
      {groupId:'SONIN_START_SCREEN',label:'争忍の刻開始画面',selectionMode:'single',ids:['RE_SONIN_WOMEN_4PLUS','RE_SONIN_GEN_OBORO_5PLUS','RE_SONIN_HUMMING_6']}
    ]
  },
  {
    id:'L_MONKEY_TURN5_CE', version:'0.1.1',
    groups:[
      {groupId:'AT_PAYOUT_DISPLAY',label:'AT獲得枚数表示',selectionMode:'single',ids:['RE_PAYOUT_4PLUS','RE_PAYOUT_5PLUS','RE_PAYOUT_6']},
      {groupId:'WEAK_RARE_AT_DIRECT',label:'弱レア役からのAT直撃',selectionMode:'single',ids:['RE_WEAK_RARE_DIRECT_4PLUS']}
    ]
  }
];

for (const cfg of configs) {
  const base=`research/${cfg.id}`;
  const sp=`${base}/selection-data.json`, rp=`${base}/research-data.json`, up=`${base}/ui-design-data.json`;
  const s=JSON.parse(fs.readFileSync(sp,'utf8'));
  const r=JSON.parse(fs.readFileSync(rp,'utf8'));
  const ui=JSON.parse(fs.readFileSync(up,'utf8'));
  const em=new Map((r.evidenceCandidates??[]).map(x=>[x.researchEvidenceId,x]));

  const groups=cfg.groups.map(g=>({
    groupId:g.groupId,
    label:g.label,
    selectionMode:g.selectionMode,
    normalizationMode:'ALLOWED_SETTINGS',
    options:g.ids.map(eid=>{
      const c=em.get(eid);
      if(!c || c.factStatus!=='verified') throw new Error(`${cfg.id}: invalid Research Evidence ${eid}`);
      return {
        value:eid.replace(/^RE_/,''),
        label:c.name,
        allowedSettings:c.allowedSettings??[],
        excludedSettings:c.deniedSettings??[],
        sourceEvidenceIds:[eid]
      };
    })
  }));

  s.machineDataVersion=cfg.version;
  s.evidenceUi={groups};
  fs.writeFileSync(sp,JSON.stringify(s,null,2)+'\n');

  const sec=ui.sections?.['設定確定・否定情報'];
  if(!sec) throw new Error(`${cfg.id}: evidence section missing`);
  sec.inputIds=(sec.inputIds??[]).filter(id=>!id.startsWith('INP_EVI_'));
  sec.evidenceIds=groups.map(g=>`EVI_UI_${g.groupId}`);
  sec.description=sec.description??'';
  sec.collapsible=sec.collapsible??false;
  sec.defaultExpanded=sec.defaultExpanded??true;
  for (const key of Object.keys(ui.inputContracts??{})) if (key.startsWith('INP_EVI_')) delete ui.inputContracts[key];
  ui.evidenceContracts=Object.fromEntries(groups.map(g=>[
    `EVI_UI_${g.groupId}`,
    {label:g.label,selectionMode:g.selectionMode,sourceEvidenceGroupId:g.groupId,inheritOptions:true}
  ]));
  ui.auditNotes=[
    'Evidence UI v2 Phase 2正式移行。設定結果ではなく実際に確認した演出・セリフ・終了画面・トロフィー・撃破人数・LED・獲得枚数表示・AT直撃を入力する。',
    '設定制約はResearch EvidenceのallowedSettings / deniedSettingsから導出し、Feature再選定は行っていない。'
  ];
  fs.writeFileSync(up,JSON.stringify(ui,null,2)+'\n');
}
