#!/usr/bin/env node
import fs from 'node:fs';
const id='L_KENGAN_ASHURA_ND';
const base=`research/${id}`;
const rp=`${base}/research-data.json`,sp=`${base}/selection-data.json`,op=`${base}/machine-observation-data.json`,up=`${base}/ui-design-data.json`;
const r=JSON.parse(fs.readFileSync(rp,'utf8'));
const s=JSON.parse(fs.readFileSync(sp,'utf8'));
const o=JSON.parse(fs.readFileSync(op,'utf8'));
const u=JSON.parse(fs.readFileSync(up,'utf8'));
const old=new Map((r.evidenceCandidates??[]).map(x=>[x.researchEvidenceId,x]));
for(const eid of ['RE_END_2PLUS','RE_END_4PLUS','RE_END_6']) if(!old.has(eid)) throw new Error(`missing legacy Research Evidence ${eid}`);
const clone=(sourceId,newId,name,scope)=>{const x=old.get(sourceId);return {...x,researchEvidenceId:newId,name,observationScope:scope,notes:`Research reopen: legacy ${sourceId} compressed ending voice/lamp, AT end screen, and door-art observation faces; split to ${scope}.`};};
r.evidenceCandidates=[
 clone('RE_END_2PLUS','RE_ENDING_VOICE_2PLUS','エンディング 秋山ボイス・緑ランプ 設定2以上','エンディング中レア役成立時ボイス・トップランプ'),
 clone('RE_END_4PLUS','RE_ENDING_VOICE_4PLUS','エンディング 鞘香ボイス・赤ランプ 設定4以上','エンディング中レア役成立時ボイス・トップランプ'),
 clone('RE_END_6','RE_ENDING_VOICE_6','エンディング 迦楼羅ボイス・紫ランプ 設定6','エンディング中レア役成立時ボイス・トップランプ'),
 clone('RE_END_2PLUS','RE_AT_END_SCREEN_2PLUS','AT終了画面 秋山 設定2以上','AT終了画面'),
 clone('RE_END_4PLUS','RE_AT_END_SCREEN_4PLUS','AT終了画面 鞘香 設定4以上','AT終了画面'),
 clone('RE_END_6','RE_AT_END_SCREEN_6','AT終了画面 迦楼羅 設定6','AT終了画面'),
 clone('RE_END_2PLUS','RE_NIKO_DOOR_2PLUS','二虎流奥義伝授 極 扉絵 秋山 設定2以上','「二虎流奥義伝授 極」突入時の扉絵'),
 clone('RE_END_4PLUS','RE_NIKO_DOOR_4PLUS','二虎流奥義伝授 極 扉絵 鞘香 設定4以上','「二虎流奥義伝授 極」突入時の扉絵'),
 clone('RE_END_6','RE_NIKO_DOOR_6','二虎流奥義伝授 極 扉絵 迦楼羅 設定6','「二虎流奥義伝授 極」突入時の扉絵')
];
r.researchNotes=[...(r.researchNotes??[]),'2026-09-15 Evidence Research reopen: legacy RE_END_2PLUS/4PLUS/6 compressed three independent natural faces (ending voice/lamp, AT end screen, Niko-ryu Ogi Denshu Kiwami door art). Split into independent Research Evidence IDs with original setting constraints and provenance preserved.'];
fs.writeFileSync(rp,JSON.stringify(r,null,2)+'\n');
const opt=(value,label,eid)=>{const x=r.evidenceCandidates.find(y=>y.researchEvidenceId===eid);return {value,label,allowedSettings:x.allowedSettings,excludedSettings:x.deniedSettings,sourceEvidenceIds:[eid]};};
s.machineDataVersion='0.1.1';
s.evidenceUi={groups:[
 {groupId:'ENDING_VOICE_LAMP',label:'エンディング中ボイス・ランプ',selectionMode:'single',normalizationMode:'ALLOWED_SETTINGS',options:[
  opt('AKIYAMA_GREEN_2PLUS','秋山ボイス・緑 設定2以上','RE_ENDING_VOICE_2PLUS'),
  opt('SAYAKA_RED_4PLUS','鞘香ボイス・赤 設定4以上','RE_ENDING_VOICE_4PLUS'),
  opt('KARURA_PURPLE_6','迦楼羅ボイス・紫 設定6','RE_ENDING_VOICE_6')]},
 {groupId:'AT_END_SCREEN',label:'AT終了画面',selectionMode:'single',normalizationMode:'ALLOWED_SETTINGS',options:[
  opt('AKIYAMA_2PLUS','秋山 設定2以上','RE_AT_END_SCREEN_2PLUS'),
  opt('SAYAKA_4PLUS','鞘香 設定4以上','RE_AT_END_SCREEN_4PLUS'),
  opt('KARURA_6','迦楼羅 設定6','RE_AT_END_SCREEN_6')]},
 {groupId:'NIKO_DOOR_ART',label:'二虎流奥義伝授 極 突入時の扉絵',selectionMode:'single',normalizationMode:'ALLOWED_SETTINGS',options:[
  opt('AKIYAMA_2PLUS','秋山 設定2以上','RE_NIKO_DOOR_2PLUS'),
  opt('SAYAKA_4PLUS','鞘香 設定4以上','RE_NIKO_DOOR_4PLUS'),
  opt('KARURA_6','迦楼羅 設定6','RE_NIKO_DOOR_6')]}
]};
s.evidenceReview={policyVersion:1,exclusions:[]};
fs.writeFileSync(sp,JSON.stringify(s,null,2)+'\n');
o.observations=(o.observations??[]).filter(x=>x.observationId!=='OBS_KENGAN_EVIDENCE' && !['OBS_EVI_ENDING_VOICE_LAMP','OBS_EVI_AT_END_SCREEN','OBS_EVI_NIKO_DOOR_ART'].includes(x.observationId));
o.observations.push(
 {observationId:'OBS_EVI_ENDING_VOICE_LAMP',sourceType:'END_EVENT',observationMode:'AUDIO_EVENT',status:'FOUND',label:'エンディング中ボイス・トップランプ',categories:['秋山ボイス・緑','鞘香ボイス・赤','迦楼羅ボイス・紫'],timing:['エンディング中のレア役成立時'],excludedConditions:['未確認を非発生とみなさない'],sourceRefs:['SRC_KENGAN_1GEKI'],notes:'ボイスが主観測。トップランプ色は同一イベントの視覚的な識別補助。Research reopen後の自然観測Evidence。'},
 {observationId:'OBS_EVI_AT_END_SCREEN',sourceType:'END_EVENT',observationMode:'VISUAL_EVENT',status:'FOUND',label:'AT終了画面',categories:['秋山','鞘香','迦楼羅'],timing:['AT終了画面確認時'],excludedConditions:['未確認を非発生とみなさない'],sourceRefs:['SRC_KENGAN_1GEKI'],notes:'Research reopen後の自然観測Evidence。'},
 {observationId:'OBS_EVI_NIKO_DOOR_ART',sourceType:'END_EVENT',observationMode:'VISUAL_EVENT',status:'FOUND',label:'二虎流奥義伝授 極 突入時の扉絵',categories:['秋山','鞘香','迦楼羅'],timing:['「二虎流奥義伝授 極」突入時'],excludedConditions:['未確認を非発生とみなさない'],sourceRefs:['SRC_KENGAN_1GEKI'],notes:'Research reopen後の自然観測Evidence。'}
);
fs.writeFileSync(op,JSON.stringify(o,null,2)+'\n');
u.sections['設定確定・否定情報']={...(u.sections['設定確定・否定情報']??{}),inputIds:[],evidenceIds:['EVI_UI_ENDING_VOICE_LAMP','EVI_UI_AT_END_SCREEN','EVI_UI_NIKO_DOOR_ART']};
delete u.inputContracts.INP_EVI_SETTING_FLOOR;
u.evidenceContracts={
 EVI_UI_ENDING_VOICE_LAMP:{label:'エンディング中ボイス・ランプ',selectionMode:'single',sourceEvidenceGroupId:'ENDING_VOICE_LAMP',inheritOptions:true},
 EVI_UI_AT_END_SCREEN:{label:'AT終了画面',selectionMode:'single',sourceEvidenceGroupId:'AT_END_SCREEN',inheritOptions:true},
 EVI_UI_NIKO_DOOR_ART:{label:'二虎流奥義伝授 極 突入時の扉絵',selectionMode:'single',sourceEvidenceGroupId:'NIKO_DOOR_ART',inheritOptions:true}
};
u.auditNotes=[...(u.auditNotes??[]),'Evidence Research reopen完了: 終了示唆として圧縮されていたエンディング中ボイス・ランプ、AT終了画面、二虎流奥義伝授 極の扉絵を自然観測面ごとに分割した。'];
fs.writeFileSync(up,JSON.stringify(u,null,2)+'\n');
console.log(`${id}: Research Evidence reopen migration complete`);
