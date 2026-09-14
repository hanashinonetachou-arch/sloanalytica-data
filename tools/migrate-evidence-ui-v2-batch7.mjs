#!/usr/bin/env node
import fs from 'node:fs';

const configs = [
  {
    id:'L_MAHJONG_FIGHT_CLUB_KAKUSEI_KM', version:'0.1.2',
    groups:[
      {groupId:'BATTLE_END_SCREEN',label:'格闘倶楽部バトル終了画面',selectionMode:'single',ids:['RE_END_2PLUS','RE_END_6']},
      {groupId:'AT_END_VOICE',label:'AT終了時ボイス',selectionMode:'multi',ids:['RE_VOICE_TAKAMIYA_DENY_2_4','RE_VOICE_MORIYAMA_DENY_2','RE_VOICE_SASAKI_DENY_3','RE_VOICE_TAKIZAWA_DENY_4','RE_VOICE_KOJIMA_5PLUS']}
    ]
  },
  {
    id:'L_RING_NI_KAKERO1_FS', version:'0.1.1',
    groups:[
      {groupId:'ST_END_SCREEN',label:'ST終了画面',selectionMode:'single',ids:['RE_NAMI_2PLUS','RE_NAMI_3PLUS','RE_NAMI_4PLUS','RE_NAMI_5PLUS','RE_NAMI_6']},
      {groupId:'BIG_START_MUSIC',label:'BIG開始時楽曲',selectionMode:'single',ids:['RE_BIG_MUSIC_2PLUS','RE_BIG_MUSIC_4PLUS']},
      {groupId:'BIG_MUSIC',label:'BIG中楽曲',selectionMode:'single',ids:['RE_QUIZ_MUSIC_4PLUS']}
    ]
  },
  {
    id:'L_BAKI_L3', version:'0.1.2',
    groups:[
      {groupId:'AT_END_SCREEN',label:'AT終了画面',selectionMode:'single',ids:['RE_AT_END_2PLUS','RE_AT_END_4PLUS','RE_AT_END_5PLUS','RE_AT_END_6']},
      {groupId:'AT_PAYOUT_DISPLAY',label:'AT中獲得枚数表示',selectionMode:'single',ids:['RE_PAYOUT_333_3PLUS','RE_PAYOUT_456_4PLUS','RE_PAYOUT_555_5PLUS','RE_PAYOUT_666_6']}
    ]
  },
  {
    id:'L_GOLDEN_KAMUY_KR', version:'0.1.1',
    groups:[
      {groupId:'SAMMY_TROPHY',label:'サミートロフィー',selectionMode:'single',ids:['RE_TROPHY_2PLUS','RE_TROPHY_4PLUS','RE_TROPHY_5PLUS','RE_TROPHY_6']},
      {groupId:'PAYOUT_DISPLAY',label:'獲得枚数表示',selectionMode:'single',ids:['RE_PAYOUT_456','RE_PAYOUT_666']},
      {groupId:'GOLD_FRAME_PHOTO',label:'金枠写真',selectionMode:'single',ids:['RE_PHOTO_4PLUS']}
    ]
  },
  {
    id:'L_TOARU_INDEX_JC', version:'0.1.1',
    groups:[
      {groupId:'FUJIMARU_COIN',label:'藤丸コイン',selectionMode:'single',ids:['RE_COIN_2PLUS','RE_COIN_3PLUS','RE_COIN_4PLUS','RE_COIN_5PLUS','RE_COIN_6']},
      {groupId:'AT_PAYOUT_DISPLAY',label:'AT獲得枚数表示',selectionMode:'single',ids:['RE_PAYOUT_4PLUS']},
      {groupId:'AT_END_SCREEN',label:'AT終了画面',selectionMode:'single',ids:['RE_AT_END_5PLUS','RE_AT_END_6']}
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
    'Evidence UI v2 Phase 2正式移行。設定結果ではなく実際に確認した画面・ボイス・楽曲・トロフィー・獲得枚数表示・写真を入力する。',
    '設定制約はResearch EvidenceのallowedSettings / deniedSettingsから導出し、Feature再選定は行っていない。'
  ];
  fs.writeFileSync(up,JSON.stringify(ui,null,2)+'\n');
}
