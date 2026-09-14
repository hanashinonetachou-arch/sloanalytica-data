#!/usr/bin/env node
import fs from 'node:fs';

const configs = [
  {
    id:'L_NYANKO_BIGBANG_MK', version:'0.1.1', groups:[
      {groupId:'TAMA_TROPHY', label:'玉ちゃんトロフィー', specs:[
        ['RE_TROPHY_BRONZE_2PLUS','TROPHY_BRONZE'],
        ['RE_TROPHY_SILVER_4PLUS','TROPHY_SILVER'],
        ['RE_TROPHY_ZEBRA_5PLUS','TROPHY_ZEBRA'],
        ['RE_TROPHY_RAINBOW_6','TROPHY_RAINBOW']
      ]},
      {groupId:'AT_END_SCREEN', label:'AT終了画面', specs:[
        ['RE_END_GOD_AWAKENED_4PLUS','GOD_AWAKENED'],
        ['RE_END_GOD_KIRA_6','GOD_KIRA']
      ]}
    ]
  },
  {
    id:'L_NOGIZAKA46_UD', version:'0.1.2', groups:[
      {groupId:'TAMA_TROPHY', label:'玉ちゃんトロフィー', specs:[
        ['RE_TROPHY_2PLUS','TROPHY_BRONZE'],
        ['RE_TROPHY_4PLUS','TROPHY_SILVER_GOLD'],
        ['RE_TROPHY_5PLUS','TROPHY_ZEBRA'],
        ['RE_TROPHY_6','TROPHY_RAINBOW']
      ]}
    ]
  },
  {
    id:'L_VALVRAVE_D', version:'0.1.2', groups:[
      {groupId:'CZ_BONUS_END_SCREEN', label:'CZ・BONUS終了画面', specs:[
        ['RE_END_RED5_2PLUS','RED_DORSIA_5'],
        ['RE_END_RED6_4PLUS','RED_DORSIA_6'],
        ['RE_END_GOLD_6','GOLD']
      ]}
    ]
  },
  {
    id:'L_SHINOBIDAMASHII3_A3', version:'0.1.1', groups:[
      {groupId:'AT_END_SCREEN', label:'AT終了画面', specs:[
        ['RE_END_2PLUS','FOREIGN_ARMY'],
        ['RE_END_4PLUS','HAYATE_VS_MAD'],
        ['RE_END_5PLUS','HIGH_FIVE'],
        ['RE_END_6','KAEDE']
      ]},
      {groupId:'AT_PAYOUT_DISPLAY', label:'AT中獲得枚数表示', specs:[
        ['RE_PAYOUT_456','PAYOUT_456'],
        ['RE_PAYOUT_666','PAYOUT_666']
      ]}
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

  s.machineDataVersion=cfg.version;
  s.evidenceUi={groups:cfg.groups.map(group=>({
    groupId:group.groupId,
    label:group.label,
    selectionMode:'single',
    normalizationMode:'ALLOWED_SETTINGS',
    options:group.specs.map(([eid,value])=>{
      const c=em.get(eid);
      if(!c||c.factStatus!=='verified') throw new Error(`${cfg.id}: invalid Research Evidence ${eid}`);
      return {
        value,
        label:c.name,
        allowedSettings:c.allowedSettings,
        excludedSettings:c.deniedSettings??[],
        sourceEvidenceIds:[eid]
      };
    })
  }))};
  fs.writeFileSync(sp,JSON.stringify(s,null,2)+'\n');

  const sec=ui.sections?.['設定確定・否定情報'];
  if(!sec) throw new Error(`${cfg.id}: evidence section missing`);
  sec.inputIds=[];
  sec.evidenceIds=cfg.groups.map(group=>`EVI_UI_${group.groupId}`);
  sec.description=sec.description??'';
  sec.collapsible=sec.collapsible??false;
  sec.defaultExpanded=sec.defaultExpanded??true;
  delete ui.inputContracts?.INP_EVI_SETTING_FLOOR;
  ui.evidenceContracts=Object.fromEntries(cfg.groups.map(group=>[
    `EVI_UI_${group.groupId}`,
    {label:group.label,selectionMode:'single',sourceEvidenceGroupId:group.groupId,inheritOptions:true}
  ]));
  ui.auditNotes=[
    'Evidence UI v2 Phase 2正式移行。設定結果ではなく実際に確認した画面・トロフィー・獲得枚数表示を入力する。',
    '設定制約はResearch EvidenceのallowedSettings / deniedSettingsから導出し、Feature再選定は行っていない。'
  ];
  fs.writeFileSync(up,JSON.stringify(ui,null,2)+'\n');
}
