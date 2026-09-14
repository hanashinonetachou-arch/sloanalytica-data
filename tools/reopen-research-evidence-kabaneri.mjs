#!/usr/bin/env node
import fs from 'node:fs';
const id='S_KABANERI_ZR';
const base=`research/${id}`;
const rp=`${base}/research-data.json`,sp=`${base}/selection-data.json`,op=`${base}/machine-observation-data.json`,up=`${base}/ui-design-data.json`;
const r=JSON.parse(fs.readFileSync(rp,'utf8'));
const s=JSON.parse(fs.readFileSync(sp,'utf8'));
const o=JSON.parse(fs.readFileSync(op,'utf8'));
const u=JSON.parse(fs.readFileSync(up,'utf8'));
const old=new Map((r.evidenceCandidates??[]).map(x=>[x.researchEvidenceId,x]));
for(const eid of ['RE_2PLUS','RE_4PLUS','RE_5PLUS','RE_6']) if(!old.has(eid)) throw new Error(`missing legacy Research Evidence ${eid}`);
const clone=(sourceId,newId,name,scope)=>{const x=old.get(sourceId);return {...x,researchEvidenceId:newId,name,observationScope:scope,sourceRefs:['SRC_ANALYSIS'],notes:`Research reopen: split natural observation face ${scope}; setting constraints are directly supported by the existing NanaPress analysis source.`};};
r.evidenceCandidates=[
 clone('RE_2PLUS','RE_OMIKUJI_SMALL_2PLUS','おみくじ 小吉（銅） 設定2以上','おみくじ演出'),
 clone('RE_4PLUS','RE_OMIKUJI_MEDIUM_4PLUS','おみくじ 中吉（銀） 設定4以上','おみくじ演出'),
 clone('RE_6','RE_OMIKUJI_LARGE_6','おみくじ 大吉（金） 設定6','おみくじ演出'),
 clone('RE_4PLUS','RE_MUMEI_ADD_44_4PLUS','カバネリアタック・無名 上乗せ44 設定4以上','カバネリアタック・無名 連打上乗せ'),
 clone('RE_5PLUS','RE_MUMEI_ADD_55_5PLUS','カバネリアタック・無名 上乗せ55 設定5以上','カバネリアタック・無名 連打上乗せ'),
 clone('RE_6','RE_MUMEI_ADD_66_6','カバネリアタック・無名 上乗せ66 設定6','カバネリアタック・無名 連打上乗せ'),
 clone('RE_6','RE_MUMEI_ADD_77_6','カバネリアタック・無名 上乗せ77 設定6','カバネリアタック・無名 連打上乗せ'),
 clone('RE_6','RE_MUMEI_ADD_331_6','カバネリアタック・無名 上乗せ331 設定6','カバネリアタック・無名 連打上乗せ')
];
r.researchNotes=[...(r.researchNotes??[]),'2026-09-15 Evidence Research reopen: legacy RE_6 compressed Omikuji Daikichi and Mumei Attack 66/77/331 into one setting-6 Evidence. Rebuilt Omikuji and Mumei add-on as independent natural observation faces. The already-cited NanaPress source also directly supports Mumei 44=4+ and 55=5+, so the Mumei face was materialized completely without inferred constraints.'];
fs.writeFileSync(rp,JSON.stringify(r,null,2)+'\n');
const opt=(value,label,eid)=>{const x=r.evidenceCandidates.find(y=>y.researchEvidenceId===eid);if(!x)throw new Error(`missing ${eid}`);return {value,label,allowedSettings:x.allowedSettings,excludedSettings:x.deniedSettings,sourceEvidenceIds:[eid]};};
s.machineDataVersion='0.1.2';
s.evidenceUi={groups:[
 {groupId:'OMIKUJI',label:'おみくじ',selectionMode:'single',normalizationMode:'ALLOWED_SETTINGS',options:[
  opt('SMALL_2PLUS','小吉（銅） 設定2以上','RE_OMIKUJI_SMALL_2PLUS'),
  opt('MEDIUM_4PLUS','中吉（銀） 設定4以上','RE_OMIKUJI_MEDIUM_4PLUS'),
  opt('LARGE_6','大吉（金） 設定6','RE_OMIKUJI_LARGE_6')]},
 {groupId:'MUMEI_ADD_SETTING',label:'カバネリアタック・無名 上乗せ',selectionMode:'single',normalizationMode:'ALLOWED_SETTINGS',options:[
  opt('ADD_44_4PLUS','44 設定4以上','RE_MUMEI_ADD_44_4PLUS'),
  opt('ADD_55_5PLUS','55 設定5以上','RE_MUMEI_ADD_55_5PLUS'),
  opt('ADD_66_6','66 設定6','RE_MUMEI_ADD_66_6'),
  opt('ADD_77_6','77 設定6','RE_MUMEI_ADD_77_6'),
  opt('ADD_331_6','331 設定6','RE_MUMEI_ADD_331_6')]}
]};
s.evidenceReview={policyVersion:1,exclusions:[]};
fs.writeFileSync(sp,JSON.stringify(s,null,2)+'\n');
o.observations=(o.observations??[]).filter(x=>!['OBS_EVI_OMIKUJI','OBS_EVI_MUMEI_ADD_SETTING'].includes(x.observationId));
o.observations.push(
 {observationId:'OBS_EVI_OMIKUJI',sourceType:'DIRECT_PLAY',observationMode:'VISUAL_EVENT',status:'FOUND',label:'おみくじ設定示唆',categories:['小吉（銅）','中吉（銀）','大吉（金）'],timing:['通常時のおみくじ演出確認時'],excludedConditions:['通常見た目のCZ天井示唆おみくじと混同しない','未確認を非発生とみなさない'],sourceRefs:['OBS_SRC_KABANERI_ANALYSIS'],notes:'小吉=設定2以上、中吉=設定4以上、大吉=設定6。'},
 {observationId:'OBS_EVI_MUMEI_ADD_SETTING',sourceType:'DIRECT_PLAY',observationMode:'VISUAL_EVENT',status:'FOUND',label:'カバネリアタック・無名 連打上乗せ設定示唆',categories:['44','55','66','77','331'],timing:['カバネリアタック・無名のPUSH連打上乗せ時'],excludedConditions:['通常の上乗せ数と設定示唆の特定数字を混同しない','未確認を非発生とみなさない'],sourceRefs:['OBS_SRC_KABANERI_ANALYSIS'],notes:'44=設定4以上、55=設定5以上、66/77/331=設定6。'}
);
fs.writeFileSync(op,JSON.stringify(o,null,2)+'\n');
u.sections['設定確定・否定情報']={...(u.sections['設定確定・否定情報']??{}),inputIds:[],evidenceIds:['EVI_UI_OMIKUJI','EVI_UI_MUMEI_ADD_SETTING']};
delete u.inputContracts.INP_EVI_SETTING_FLOOR;
u.evidenceContracts={
 EVI_UI_OMIKUJI:{label:'おみくじ',selectionMode:'single',sourceEvidenceGroupId:'OMIKUJI',inheritOptions:true},
 EVI_UI_MUMEI_ADD_SETTING:{label:'カバネリアタック・無名 上乗せ',selectionMode:'single',sourceEvidenceGroupId:'MUMEI_ADD_SETTING',inheritOptions:true}
};
u.auditNotes=[...(u.auditNotes??[]),'Evidence Research reopen完了: 設定6Evidenceに圧縮されていたおみくじ大吉と無名上乗せ66/77/331を自然観測面へ分割し、無名上乗せ面は公開済み44/55も含めて完全な選択肢として構成した。'];
fs.writeFileSync(up,JSON.stringify(u,null,2)+'\n');
console.log(`${id}: Research Evidence reopen migration complete`);
