#!/usr/bin/env node
import fs from 'node:fs';
const id='L_GIRLS_UND_PANZER_FINALE_H1';
const base=`research/${id}`;
const rp=`${base}/research-data.json`,sp=`${base}/selection-data.json`,op=`${base}/machine-observation-data.json`,up=`${base}/ui-design-data.json`;
const r=JSON.parse(fs.readFileSync(rp,'utf8'));
const s=JSON.parse(fs.readFileSync(sp,'utf8'));
const o=JSON.parse(fs.readFileSync(op,'utf8'));
const u=JSON.parse(fs.readFileSync(up,'utf8'));

const old=new Map((r.evidenceCandidates??[]).map(x=>[x.researchEvidenceId,x]));
for(const eid of ['RE_AT_END_2PLUS','RE_AT_END_3PLUS','RE_AT_END_4PLUS','RE_AT_END_5PLUS','RE_AT_END_6']) if(!old.has(eid)) throw new Error(`missing legacy Research Evidence ${eid}`);
const sourceFor=(setting)=>setting===2?'RE_AT_END_2PLUS':setting===3?'RE_AT_END_3PLUS':setting===4?'RE_AT_END_4PLUS':setting===5?'RE_AT_END_5PLUS':'RE_AT_END_6';
const clone=(sourceId,newId,name,observationScope)=>{
  const x=old.get(sourceId);
  return {...x,researchEvidenceId:newId,name,observationScope,sourceRefs:['SRC_GP_NANA'],notes:`Research reopen: legacy ${sourceId} compressed or abstracted natural observation faces; split to ${observationScope}.`};
};
const at=[
  [2,'RE_AT_END_STAMP_2PLUS','AT終了画面 可スタンプ 設定2以上'],
  [3,'RE_AT_END_STAMP_3PLUS','AT終了画面 吉スタンプ 設定3以上'],
  [4,'RE_AT_END_STAMP_4PLUS','AT終了画面 良スタンプ 設定4以上'],
  [5,'RE_AT_END_STAMP_5PLUS','AT終了画面 優スタンプ 設定5以上'],
  [6,'RE_AT_END_STAMP_6','AT終了画面 極スタンプ 設定6']
].map(([setting,newId,name])=>clone(sourceFor(setting),newId,name,'AT終了画面'));
const ed=[clone('RE_AT_END_4PLUS','RE_ED_END_4PLUS','エンディング終了画面 設定4以上','エンディング終了画面')];
const payout=[
  [4,'RE_PAYOUT_444_4PLUS','444枚OVER 設定4以上'],
  [5,'RE_PAYOUT_555_5PLUS','555枚OVER 設定5以上'],
  [6,'RE_PAYOUT_666_6','666枚OVER 設定6']
].map(([setting,newId,name])=>clone(sourceFor(setting),newId,name,'獲得枚数表示'));
const nagi=[
  [2,'RE_HIDDEN_NAGI_2PLUS','隠れ凪 青「一味違いますね」 設定2以上'],
  [3,'RE_HIDDEN_NAGI_3PLUS','隠れ凪 緑「何やら不思議な気配です」 設定3以上'],
  [4,'RE_HIDDEN_NAGI_4PLUS','隠れ凪 赤「良い予感がします」 設定4以上'],
  [5,'RE_HIDDEN_NAGI_5PLUS','隠れ凪 銀「遊び尽くしちゃいましょう」 設定5以上'],
  [6,'RE_HIDDEN_NAGI_6','隠れ凪 金「お肉～お肉～」 設定6']
].map(([setting,newId,name])=>clone(sourceFor(setting),newId,name,'打-WIN LITE 隠れ凪'));
r.evidenceCandidates=[...at,...ed,...payout,...nagi];
r.researchNotes=[...(r.researchNotes??[]),'2026-09-15 Evidence Research reopen: legacy 4+/5+/6 Evidence compressed AT/ED ending screens, payout displays, and Hidden Nagi into shared IDs. Rebuilt natural observation faces. Hidden Nagi 2+/3+ were also materialized from the already-cited NanaPress setting-analysis source so the natural Hidden Nagi face is complete.'];
fs.writeFileSync(rp,JSON.stringify(r,null,2)+'\n');

const option=(value,label,eid)=>{const x=r.evidenceCandidates.find(y=>y.researchEvidenceId===eid); if(!x) throw new Error(`missing split evidence ${eid}`); return {value,label,allowedSettings:x.allowedSettings,excludedSettings:x.deniedSettings,sourceEvidenceIds:[eid]};};
s.machineDataVersion='0.1.1';
s.evidenceUi={groups:[
  {groupId:'AT_END_STAMP',label:'AT終了画面',selectionMode:'single',normalizationMode:'ALLOWED_SETTINGS',options:[
    option('STAMP_KA_2PLUS','可スタンプ 設定2以上','RE_AT_END_STAMP_2PLUS'),
    option('STAMP_KICHI_3PLUS','吉スタンプ 設定3以上','RE_AT_END_STAMP_3PLUS'),
    option('STAMP_RYO_4PLUS','良スタンプ 設定4以上','RE_AT_END_STAMP_4PLUS'),
    option('STAMP_YU_5PLUS','優スタンプ 設定5以上','RE_AT_END_STAMP_5PLUS'),
    option('STAMP_KIWAMI_6','極スタンプ 設定6','RE_AT_END_STAMP_6')
  ]},
  {groupId:'ED_END_SCREEN',label:'エンディング終了画面',selectionMode:'single',normalizationMode:'ALLOWED_SETTINGS',options:[
    option('ED_4PLUS','設定4以上濃厚画面','RE_ED_END_4PLUS')
  ]},
  {groupId:'PAYOUT_DISPLAY',label:'獲得枚数表示',selectionMode:'single',normalizationMode:'ALLOWED_SETTINGS',options:[
    option('PAYOUT_444','444枚OVER 設定4以上','RE_PAYOUT_444_4PLUS'),
    option('PAYOUT_555','555枚OVER 設定5以上','RE_PAYOUT_555_5PLUS'),
    option('PAYOUT_666','666枚OVER 設定6','RE_PAYOUT_666_6')
  ]},
  {groupId:'HIDDEN_NAGI',label:'隠れ凪',selectionMode:'single',normalizationMode:'ALLOWED_SETTINGS',options:[
    option('NAGI_BLUE_2PLUS','青「一味違いますね」 設定2以上','RE_HIDDEN_NAGI_2PLUS'),
    option('NAGI_GREEN_3PLUS','緑「何やら不思議な気配です」 設定3以上','RE_HIDDEN_NAGI_3PLUS'),
    option('NAGI_RED_4PLUS','赤「良い予感がします」 設定4以上','RE_HIDDEN_NAGI_4PLUS'),
    option('NAGI_SILVER_5PLUS','銀「遊び尽くしちゃいましょう」 設定5以上','RE_HIDDEN_NAGI_5PLUS'),
    option('NAGI_GOLD_6','金「お肉～お肉～」 設定6','RE_HIDDEN_NAGI_6')
  ]}
]};
s.evidenceReview={policyVersion:1,exclusions:[]};
fs.writeFileSync(sp,JSON.stringify(s,null,2)+'\n');

if(!(o.sources??[]).some(x=>x.sourceId==='OBS_SRC_GP_NANA_SETTING')) o.sources.push({sourceId:'OBS_SRC_GP_NANA_SETTING',publisher:'なな徹',title:'設定判別（設定差のある要素や設定示唆演出の詳細）',url:'https://nana-press.com/kaiseki/machine/678/19208/',checkedAt:'2026-09-15',sourceType:'major_analysis'});
o.observations=(o.observations??[]).filter(x=>x.observationId!=='OBS_AT_END_EVIDENCE' && !['OBS_EVI_AT_END_STAMP','OBS_EVI_ED_END_SCREEN','OBS_EVI_PAYOUT_DISPLAY','OBS_EVI_HIDDEN_NAGI'].includes(x.observationId));
o.observations.push(
  {observationId:'OBS_EVI_AT_END_STAMP',sourceType:'END_EVENT',observationMode:'VISUAL_EVENT',status:'FOUND',label:'AT終了画面のスタンプ',categories:['可スタンプ','吉スタンプ','良スタンプ','優スタンプ','極スタンプ'],timing:['AT終了画面確認時'],excludedConditions:['未確認を非発生とみなさない'],sourceRefs:['OBS_SRC_GP_NANA_SETTING'],notes:'Research reopen後の自然観測Evidence。'},
  {observationId:'OBS_EVI_ED_END_SCREEN',sourceType:'END_EVENT',observationMode:'VISUAL_EVENT',status:'FOUND',label:'エンディング終了画面',categories:['設定4以上濃厚画面'],timing:['エンディング終了画面確認時'],excludedConditions:['未確認を非発生とみなさない'],sourceRefs:['OBS_SRC_GP_NANA_SETTING'],notes:'Research reopen後の自然観測Evidence。'},
  {observationId:'OBS_EVI_PAYOUT_DISPLAY',sourceType:'END_EVENT',observationMode:'VISUAL_EVENT',status:'FOUND',label:'獲得枚数表示',categories:['444枚OVER','555枚OVER','666枚OVER'],timing:['ボーナス中の獲得枚数表示を確認した時'],excludedConditions:['未確認を非発生とみなさない'],sourceRefs:['OBS_SRC_GP_NANA_SETTING'],notes:'Research reopen後の自然観測Evidence。'},
  {observationId:'OBS_EVI_HIDDEN_NAGI',sourceType:'LINKED_SERVICE',observationMode:'LINKED_SERVICE_READ',status:'FOUND',label:'打-WIN LITE 隠れ凪',categories:['青 一味違いますね','緑 何やら不思議な気配です','赤 良い予感がします','銀 遊び尽くしちゃいましょう','金 お肉～お肉～'],timing:['打-WIN LITE開始後、1000G消化ごとの抽選結果をQR読取で確認した時'],excludedConditions:['打-WIN LITE未開始時は対象外','未確認を非発生とみなさない'],sourceRefs:['OBS_SRC_GP_NANA_SETTING'],notes:'Research reopen後の自然観測Evidence。'}
);
fs.writeFileSync(op,JSON.stringify(o,null,2)+'\n');

u.sections['設定確定・否定情報']={...(u.sections['設定確定・否定情報']??{}),inputIds:[],evidenceIds:['EVI_UI_AT_END_STAMP','EVI_UI_ED_END_SCREEN','EVI_UI_PAYOUT_DISPLAY','EVI_UI_HIDDEN_NAGI']};
delete u.inputContracts.INP_EVI_SETTING_FLOOR;
u.evidenceContracts={
  EVI_UI_AT_END_STAMP:{label:'AT終了画面',selectionMode:'single',sourceEvidenceGroupId:'AT_END_STAMP',inheritOptions:true},
  EVI_UI_ED_END_SCREEN:{label:'エンディング終了画面',selectionMode:'single',sourceEvidenceGroupId:'ED_END_SCREEN',inheritOptions:true},
  EVI_UI_PAYOUT_DISPLAY:{label:'獲得枚数表示',selectionMode:'single',sourceEvidenceGroupId:'PAYOUT_DISPLAY',inheritOptions:true},
  EVI_UI_HIDDEN_NAGI:{label:'隠れ凪',selectionMode:'single',sourceEvidenceGroupId:'HIDDEN_NAGI',inheritOptions:true}
};
u.auditNotes=[...(u.auditNotes??[]),'Evidence Research reopen完了: Researchで圧縮されていたAT/ED終了画面・獲得枚数表示・隠れ凪を自然観測面ごとに分割し、Selection/Observation/UIを新Research Evidence IDへ接続した。'];
fs.writeFileSync(up,JSON.stringify(u,null,2)+'\n');
console.log(`${id}: Research Evidence reopen migration complete`);
