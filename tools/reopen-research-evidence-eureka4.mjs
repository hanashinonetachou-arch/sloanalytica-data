#!/usr/bin/env node
import fs from 'node:fs';
const id='L_EUREKA_SEVEN4_HIEVO_KX';
const base=`research/${id}`;
const rp=`${base}/research-data.json`,sp=`${base}/selection-data.json`,op=`${base}/machine-observation-data.json`,up=`${base}/ui-design-data.json`;
const r=JSON.parse(fs.readFileSync(rp,'utf8'));
const s=JSON.parse(fs.readFileSync(sp,'utf8'));
const o=JSON.parse(fs.readFileSync(op,'utf8'));
const u=JSON.parse(fs.readFileSync(up,'utf8'));
const old=new Map((r.evidenceCandidates??[]).map(x=>[x.researchEvidenceId,x]));
for(const eid of ['RE_2PLUS','RE_3PLUS','RE_4PLUS','RE_5PLUS','RE_6']) if(!old.has(eid)) throw new Error(`missing legacy Research Evidence ${eid}`);
const clone=(sourceId,newId,name)=>{const x=old.get(sourceId);return {...x,researchEvidenceId:newId,name,notes:`Research reopen: legacy ${sourceId} compressed multiple/abstract observation faces; split into natural observation face.`};};
r.evidenceCandidates=[
 clone('RE_2PLUS','RE_TROPHY_2PLUS','銅トロフィー 設定2以上'),
 clone('RE_3PLUS','RE_TROPHY_3PLUS','銀トロフィー 設定3以上'),
 clone('RE_4PLUS','RE_TROPHY_4PLUS','金トロフィー 設定4以上'),
 clone('RE_5PLUS','RE_TROPHY_5PLUS','キリン柄トロフィー 設定5以上'),
 clone('RE_6','RE_TROPHY_6','レインボートロフィー 設定6'),
 clone('RE_2PLUS','RE_PAYOUT_174_2PLUS','174枚OVER 設定2以上'),
 clone('RE_4PLUS','RE_PAYOUT_456_4PLUS','456枚OVER 設定4以上'),
 clone('RE_6','RE_PAYOUT_331_666_6','331・666枚OVER 設定6')
];
r.researchNotes=[...(r.researchNotes??[]),'2026-09-15 Evidence Research reopen: legacy RE_2PLUS/RE_4PLUS/RE_6 compressed trophy and payout-number observation faces. Split into independent Research Evidence IDs; setting constraints and provenance preserved.'];
fs.writeFileSync(rp,JSON.stringify(r,null,2)+'\n');

s.machineDataVersion='0.1.2';
s.evidenceUi={groups:[
 {groupId:'SAMMY_TROPHY',label:'サミートロフィー',selectionMode:'single',normalizationMode:'ALLOWED_SETTINGS',options:[
  ['TROPHY_BRONZE','銅 設定2以上','RE_TROPHY_2PLUS'],['TROPHY_SILVER','銀 設定3以上','RE_TROPHY_3PLUS'],['TROPHY_GOLD','金 設定4以上','RE_TROPHY_4PLUS'],['TROPHY_KIRIN','キリン柄 設定5以上','RE_TROPHY_5PLUS'],['TROPHY_RAINBOW','レインボー 設定6','RE_TROPHY_6']].map(([value,label,eid])=>{const x=r.evidenceCandidates.find(y=>y.researchEvidenceId===eid);return {value,label,allowedSettings:x.allowedSettings,excludedSettings:x.deniedSettings,sourceEvidenceIds:[eid]};})},
 {groupId:'PAYOUT_DISPLAY',label:'獲得枚数表示',selectionMode:'single',normalizationMode:'ALLOWED_SETTINGS',options:[
  ['PAYOUT_174','174枚OVER 設定2以上','RE_PAYOUT_174_2PLUS'],['PAYOUT_456','456枚OVER 設定4以上','RE_PAYOUT_456_4PLUS'],['PAYOUT_331_666','331・666枚OVER 設定6','RE_PAYOUT_331_666_6']].map(([value,label,eid])=>{const x=r.evidenceCandidates.find(y=>y.researchEvidenceId===eid);return {value,label,allowedSettings:x.allowedSettings,excludedSettings:x.deniedSettings,sourceEvidenceIds:[eid]};})}
]};
s.evidenceReview={policyVersion:1,exclusions:[]};
fs.writeFileSync(sp,JSON.stringify(s,null,2)+'\n');

const existing=new Set((o.observations??[]).map(x=>x.observationId));
for(const row of [
 {observationId:'OBS_EVI_SAMMY_TROPHY',label:'サミートロフィー',categories:['銅','銀','金','キリン柄','レインボー']},
 {observationId:'OBS_EVI_PAYOUT_DISPLAY',label:'獲得枚数表示',categories:['174枚OVER','456枚OVER','331・666枚OVER']}
]) if(!existing.has(row.observationId)) o.observations.push({...row,sourceType:'END_EVENT',observationMode:'VISUAL_EVENT',status:'FOUND',timing:[`${row.label}を実際に確認した時`],excludedConditions:['未確認を非発生とみなさない'],sourceRefs:[],notes:'Research reopen後の自然観測Evidence。'});
fs.writeFileSync(op,JSON.stringify(o,null,2)+'\n');

u.sections['設定確定・否定情報']={...(u.sections['設定確定・否定情報']??{}),inputIds:[],evidenceIds:['EVI_UI_SAMMY_TROPHY','EVI_UI_PAYOUT_DISPLAY']};
delete u.inputContracts.INP_EVI_SETTING_FLOOR;
u.evidenceContracts={
 EVI_UI_SAMMY_TROPHY:{label:'サミートロフィー',selectionMode:'single',sourceEvidenceGroupId:'SAMMY_TROPHY',inheritOptions:true},
 EVI_UI_PAYOUT_DISPLAY:{label:'獲得枚数表示',selectionMode:'single',sourceEvidenceGroupId:'PAYOUT_DISPLAY',inheritOptions:true}
};
u.auditNotes=[...(u.auditNotes??[]),'Evidence Research reopen完了: Researchで圧縮されていたトロフィーと獲得枚数表示を自然観測面ごとに分割し、Selection/UIを新Research IDへ接続した。'];
fs.writeFileSync(up,JSON.stringify(u,null,2)+'\n');
console.log(`${id}: Research Evidence reopen migration complete`);
