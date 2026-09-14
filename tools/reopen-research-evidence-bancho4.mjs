#!/usr/bin/env node
import fs from 'node:fs';
const id='L_OSU_BANCHO4_A3';
const base=`research/${id}`;
const rp=`${base}/research-data.json`,sp=`${base}/selection-data.json`,op=`${base}/machine-observation-data.json`,up=`${base}/ui-design-data.json`;
const r=JSON.parse(fs.readFileSync(rp,'utf8'));
const s=JSON.parse(fs.readFileSync(sp,'utf8'));
const o=JSON.parse(fs.readFileSync(op,'utf8'));
const u=JSON.parse(fs.readFileSync(up,'utf8'));
const old=new Map((r.evidenceCandidates??[]).map(x=>[x.researchEvidenceId,x]));
for(const eid of ['RE_FUJI_2PLUS','RE_END_4PLUS','RE_END_5PLUS','RE_END_6']) if(!old.has(eid)) throw new Error(`missing legacy Research Evidence ${eid}`);
const clone=(sourceId,newId,name,scope,sourceRefs=null)=>{const x=old.get(sourceId);return {...x,researchEvidenceId:newId,name,observationScope:scope,sourceRefs:sourceRefs??x.sourceRefs,notes:`Research reopen: natural observation face ${scope}; legacy ${sourceId} semantics/provenance preserved.`};};
r.evidenceCandidates=[
 clone('RE_FUJI_2PLUS','RE_END_SCREEN_FUJI_2PLUS','ボーナス・AT終了画面 富士山1回 設定2以上','ボーナス・AT終了画面'),
 clone('RE_END_4PLUS','RE_END_SCREEN_TEA_4PLUS','ボーナス・AT終了画面 茶摘み 設定4以上','ボーナス・AT終了画面'),
 clone('RE_END_5PLUS','RE_END_SCREEN_RQ_5PLUS','ボーナス・AT終了画面 レースクイーン 設定5以上','ボーナス・AT終了画面'),
 clone('RE_END_6','RE_END_SCREEN_HOTSPRING_6','ボーナス・AT終了画面 温泉 設定6','ボーナス・AT終了画面',['SRC_B4_NANA']),
 clone('RE_END_6','RE_AT_REG_FK_6','AT中REG F.K. 設定6','AT中レギュラーボーナス',['SRC_B4_NANA']),
 clone('RE_END_6','RE_ED_BELL_GOTETSU_6','エンディング中ベルカウンター 鋼鉄 設定6','エンディング中ベルカウンター',['SRC_B4_NANA'])
];
r.researchNotes=[...(r.researchNotes??[]),'2026-09-15 Evidence Research reopen: legacy RE_END_6 compressed three independent setting-6 routes (bonus/AT end-screen Onsen, AT REG F.K., ending bell-counter Gotetsu). Split by natural observation face. Existing end-screen 2+/4+/5+ evidence was retained and normalized into the same end-screen face.'];
fs.writeFileSync(rp,JSON.stringify(r,null,2)+'\n');
const opt=(value,label,eid)=>{const x=r.evidenceCandidates.find(y=>y.researchEvidenceId===eid); if(!x) throw new Error(`missing ${eid}`); return {value,label,allowedSettings:x.allowedSettings,excludedSettings:x.deniedSettings,sourceEvidenceIds:[eid]};};
s.machineDataVersion='0.1.1';
s.evidenceUi={groups:[
 {groupId:'BONUS_AT_END_SCREEN',label:'ボーナス・AT終了画面',selectionMode:'single',normalizationMode:'ALLOWED_SETTINGS',options:[
  opt('FUJI_1_2PLUS','富士山1回 設定2以上','RE_END_SCREEN_FUJI_2PLUS'),
  opt('TEA_4PLUS','茶摘み 設定4以上','RE_END_SCREEN_TEA_4PLUS'),
  opt('RACE_QUEEN_5PLUS','レースクイーン 設定5以上','RE_END_SCREEN_RQ_5PLUS'),
  opt('HOTSPRING_6','温泉 設定6','RE_END_SCREEN_HOTSPRING_6')]},
 {groupId:'AT_REG_CHARACTER',label:'AT中REG',selectionMode:'single',normalizationMode:'ALLOWED_SETTINGS',options:[
  opt('FK_6','F.K. 設定6','RE_AT_REG_FK_6')]},
 {groupId:'ED_BELL_COUNTER',label:'エンディング中ベルカウンター',selectionMode:'single',normalizationMode:'ALLOWED_SETTINGS',options:[
  opt('GOTETSU_6','鋼鉄 設定6','RE_ED_BELL_GOTETSU_6')]}
]};
s.evidenceReview={policyVersion:1,exclusions:[]};
fs.writeFileSync(sp,JSON.stringify(s,null,2)+'\n');
if(!(o.sources??[]).some(x=>x.sourceId==='OBS_SRC_B4_NANA_SETTING')) o.sources.push({sourceId:'OBS_SRC_B4_NANA_SETTING',publisher:'なな徹',title:'押忍！番長4 設定判別',url:'https://nana-press.com/kaiseki/machine/736/20454/',checkedAt:'2026-09-15',sourceType:'major_analysis'});
o.observations=(o.observations??[]).filter(x=>x.observationId!=='OBS_BANCHO4_EVIDENCE' && !['OBS_EVI_BONUS_AT_END_SCREEN','OBS_EVI_AT_REG_CHARACTER','OBS_EVI_ED_BELL_COUNTER'].includes(x.observationId));
o.observations.push(
 {observationId:'OBS_EVI_BONUS_AT_END_SCREEN',sourceType:'END_EVENT',observationMode:'VISUAL_EVENT',status:'FOUND',label:'ボーナス・AT終了画面',categories:['富士山','茶摘み','レースクイーン','温泉'],timing:['ボーナスまたはAT終了画面確認時'],excludedConditions:['未確認を非発生とみなさない'],sourceRefs:['OBS_SRC_B4_NANA_SETTING'],notes:'富士山は累積出現回数で最低設定が上がる。現Researchでは1回=設定2以上を保持。'},
 {observationId:'OBS_EVI_AT_REG_CHARACTER',sourceType:'END_EVENT',observationMode:'VISUAL_EVENT',status:'FOUND',label:'AT中REGのキャラクター',categories:['F.K.'],timing:['AT中レギュラーボーナス消化中'],excludedConditions:['通常時REGと混同しない','未確認を非発生とみなさない'],sourceRefs:['OBS_SRC_B4_NANA_SETTING'],notes:'F.K.出現は設定6濃厚。'},
 {observationId:'OBS_EVI_ED_BELL_COUNTER',sourceType:'END_EVENT',observationMode:'VISUAL_EVENT',status:'FOUND',label:'エンディング中ベルカウンター',categories:['鋼鉄'],timing:['エンディング中、ベルカウンター7pt到達でキャラ出現時'],excludedConditions:['未確認を非発生とみなさない'],sourceRefs:['OBS_SRC_B4_NANA_SETTING'],notes:'鋼鉄出現は設定6濃厚。'}
);
fs.writeFileSync(op,JSON.stringify(o,null,2)+'\n');
u.sections['設定確定・否定情報']={...(u.sections['設定確定・否定情報']??{}),inputIds:[],evidenceIds:['EVI_UI_BONUS_AT_END_SCREEN','EVI_UI_AT_REG_CHARACTER','EVI_UI_ED_BELL_COUNTER']};
delete u.inputContracts.INP_EVI_SETTING_FLOOR;
u.evidenceContracts={
 EVI_UI_BONUS_AT_END_SCREEN:{label:'ボーナス・AT終了画面',selectionMode:'single',sourceEvidenceGroupId:'BONUS_AT_END_SCREEN',inheritOptions:true},
 EVI_UI_AT_REG_CHARACTER:{label:'AT中REG',selectionMode:'single',sourceEvidenceGroupId:'AT_REG_CHARACTER',inheritOptions:true},
 EVI_UI_ED_BELL_COUNTER:{label:'エンディング中ベルカウンター',selectionMode:'single',sourceEvidenceGroupId:'ED_BELL_COUNTER',inheritOptions:true}
};
u.auditNotes=[...(u.auditNotes??[]),'Evidence Research reopen完了: RE_END_6に圧縮されていた温泉/F.K./ED鋼鉄を終了画面・AT中REG・EDベルカウンターの自然観測面へ分割した。'];
fs.writeFileSync(up,JSON.stringify(u,null,2)+'\n');
console.log(`${id}: Research Evidence reopen migration complete`);
