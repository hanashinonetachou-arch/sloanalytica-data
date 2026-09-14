#!/usr/bin/env node
import fs from 'node:fs';

const jobs={
L_KEIJI_SADO_ER:{version:'0.1.1',groups:[
 {groupId:'AT_END_SCREEN',label:'AT・夢戦モード終了画面',selectionMode:'single',normalizationMode:'ALLOWED_SETTINGS',options:[
  {value:'AT_END_KEIKATSU_NAOE',label:'景勝&直江 設定1否定',allowedSettings:['SET_2','SET_3','SET_4','SET_5','SET_6'],excludedSettings:['SET_1'],sourceEvidenceIds:['RE_AT_END_DENY_1']},
  {value:'AT_END_TAKASHIGE',label:'高茂 設定3否定',allowedSettings:['SET_1','SET_2','SET_4','SET_5','SET_6'],excludedSettings:['SET_3'],sourceEvidenceIds:['RE_AT_END_DENY_3']},
  {value:'AT_END_SAMANOSUKE',label:'左馬助 設定4以上',allowedSettings:['SET_4','SET_5','SET_6'],excludedSettings:['SET_1','SET_2','SET_3'],sourceEvidenceIds:['RE_AT_END_4PLUS']},
  {value:'AT_END_OFUU_MATSU_HOTARU',label:'おふう＆まつ＆蛍 設定5以上',allowedSettings:['SET_5','SET_6'],excludedSettings:['SET_1','SET_2','SET_3','SET_4'],sourceEvidenceIds:['RE_AT_END_5PLUS']}]},
 {groupId:'LOWER_UI_VOICE',label:'左下UIセリフ',selectionMode:'single',normalizationMode:'ALLOWED_SETTINGS',options:[
  {value:'UI_4PLUS',label:'これが何よりの証です 設定4以上',allowedSettings:['SET_4','SET_5','SET_6'],excludedSettings:['SET_1','SET_2','SET_3'],sourceEvidenceIds:['RE_UI_4PLUS']},
  {value:'UI_5PLUS',label:'全ては神の思召し 設定5以上',allowedSettings:['SET_5','SET_6'],excludedSettings:['SET_1','SET_2','SET_3','SET_4'],sourceEvidenceIds:['RE_UI_5PLUS']}]},
 {groupId:'PAYOUT_DISPLAY',label:'獲得枚数表示',selectionMode:'single',normalizationMode:'ALLOWED_SETTINGS',options:[
  {value:'PAYOUT_246',label:'246枚 設定2・4・6',allowedSettings:['SET_2','SET_4','SET_6'],excludedSettings:['SET_1','SET_3','SET_5'],sourceEvidenceIds:['RE_PAYOUT_246']},
  {value:'PAYOUT_4PLUS',label:'456/1456枚 設定4以上',allowedSettings:['SET_4','SET_5','SET_6'],excludedSettings:['SET_1','SET_2','SET_3'],sourceEvidenceIds:['RE_PAYOUT_4PLUS']},
  {value:'PAYOUT_5PLUS',label:'555枚 設定5以上',allowedSettings:['SET_5','SET_6'],excludedSettings:['SET_1','SET_2','SET_3','SET_4'],sourceEvidenceIds:['RE_PAYOUT_5PLUS']},
  {value:'PAYOUT_6',label:'666/1666枚 設定6',allowedSettings:['SET_6'],excludedSettings:['SET_1','SET_2','SET_3','SET_4','SET_5'],sourceEvidenceIds:['RE_PAYOUT_6']}]},
 {groupId:'KEIJI_OMIKUJI',label:'花の慶次おみくじ',selectionMode:'single',normalizationMode:'ALLOWED_SETTINGS',options:[
  {value:'OMIKUJI_HIDEYOSHI',label:'豊臣秀吉 設定6',allowedSettings:['SET_6'],excludedSettings:['SET_1','SET_2','SET_3','SET_4','SET_5'],sourceEvidenceIds:['RE_OMIKUJI_6']}]}],
 observations:[
  ['OBS_EVI_AT_END_SCREEN','AT・夢戦モード終了画面',['景勝&直江 設定1否定','高茂 設定3否定','左馬助 設定4以上','おふう＆まつ＆蛍 設定5以上']],
  ['OBS_EVI_LOWER_UI_VOICE','左下UIセリフ',['これが何よりの証です 設定4以上','全ては神の思召し 設定5以上']],
  ['OBS_EVI_PAYOUT_DISPLAY','獲得枚数表示',['246枚 設定2・4・6','456/1456枚 設定4以上','555枚 設定5以上','666/1666枚 設定6']],
  ['OBS_EVI_KEIJI_OMIKUJI','花の慶次おみくじ',['豊臣秀吉 設定6']]],
 contracts:[['EVI_UI_AT_END_SCREEN','AT・夢戦モード終了画面','AT_END_SCREEN'],['EVI_UI_LOWER_UI_VOICE','左下UIセリフ','LOWER_UI_VOICE'],['EVI_UI_PAYOUT_DISPLAY','獲得枚数表示','PAYOUT_DISPLAY'],['EVI_UI_KEIJI_OMIKUJI','花の慶次おみくじ','KEIJI_OMIKUJI']]},
L_MACROSS_FRONTIER4_BA:{version:'0.1.1',groups:[
 {groupId:'BONUS_CONFIRM_CHARACTER',label:'ボーナス確定時キャラ',selectionMode:'single',normalizationMode:'ALLOWED_SETTINGS',options:[
  {value:'CHAR_MISMATCH_2PLUS',label:'キャラ不一致 設定2以上',allowedSettings:['SET_2','SET_3','SET_4','SET_5','SET_6'],excludedSettings:['SET_1'],sourceEvidenceIds:['RE_BONUS_CHAR_2PLUS']},
  {value:'CHAR_STRONG_MISMATCH_5PLUS',label:'強いキャラ不一致 設定5以上',allowedSettings:['SET_5','SET_6'],excludedSettings:['SET_1','SET_2','SET_3','SET_4'],sourceEvidenceIds:['RE_BONUS_CHAR_5PLUS']}]},
 {groupId:'SONG_SELECTION',label:'AT・ボーナス中楽曲',selectionMode:'single',normalizationMode:'ALLOWED_SETTINGS',options:[
  {value:'SONG_MISMATCH_4PLUS',label:'特定不一致 設定4以上',allowedSettings:['SET_4','SET_5','SET_6'],excludedSettings:['SET_1','SET_2','SET_3'],sourceEvidenceIds:['RE_SONG_4PLUS']}]},
 {groupId:'UTAHIME_END_SCREEN',label:'歌姫ボーナス終了画面',selectionMode:'single',normalizationMode:'ALLOWED_SETTINGS',options:[
  {value:'UTAHIME_SHERYL_RANKA_WHITE',label:'シェリル＆ランカ（白） 設定2以上',allowedSettings:['SET_2','SET_3','SET_4','SET_5','SET_6'],excludedSettings:['SET_1'],sourceEvidenceIds:['RE_UTAHIME_END_2PLUS']},
  {value:'UTAHIME_BAND_WHITE',label:'バンドメンバー（白） 設定2否定',allowedSettings:['SET_1','SET_3','SET_4','SET_5','SET_6'],excludedSettings:['SET_2'],sourceEvidenceIds:['RE_UTAHIME_END_2_DENIED']},
  {value:'UTAHIME_SWIMSUIT_GOLD',label:'水着（金） 設定6',allowedSettings:['SET_6'],excludedSettings:['SET_1','SET_2','SET_3','SET_4','SET_5'],sourceEvidenceIds:['RE_UTAHIME_END_6']}]}],
 observations:[
  ['OBS_EVI_BONUS_CONFIRM_CHARACTER','ボーナス確定時キャラ',['キャラ不一致 設定2以上','強いキャラ不一致 設定5以上']],
  ['OBS_EVI_SONG_SELECTION','AT・ボーナス中楽曲',['特定不一致 設定4以上']],
  ['OBS_EVI_UTAHIME_END_SCREEN','歌姫ボーナス終了画面',['シェリル＆ランカ（白） 設定2以上','バンドメンバー（白） 設定2否定','水着（金） 設定6']]],
 contracts:[['EVI_UI_BONUS_CONFIRM_CHARACTER','ボーナス確定時キャラ','BONUS_CONFIRM_CHARACTER'],['EVI_UI_SONG_SELECTION','AT・ボーナス中楽曲','SONG_SELECTION'],['EVI_UI_UTAHIME_END_SCREEN','歌姫ボーナス終了画面','UTAHIME_END_SCREEN']]}
};

for(const [id,cfg] of Object.entries(jobs)){
 const base=`research/${id}`; const sp=`${base}/selection-data.json`,op=`${base}/machine-observation-data.json`,up=`${base}/ui-design-data.json`;
 const s=JSON.parse(fs.readFileSync(sp,'utf8')),o=JSON.parse(fs.readFileSync(op,'utf8')),u=JSON.parse(fs.readFileSync(up,'utf8'));
 s.machineDataVersion=cfg.version; s.evidenceUi={groups:cfg.groups}; s.evidenceReview={policyVersion:1,exclusions:[]}; fs.writeFileSync(sp,JSON.stringify(s,null,2)+'\n');
 o.observations=(o.observations??[]).filter(x=>!['OBS_SETTING_EVIDENCE','OBS_MACROSS_EVIDENCE'].includes(x.observationId));
 const ids=new Set(o.observations.map(x=>x.observationId));
 for(const [observationId,label,categories] of cfg.observations) if(!ids.has(observationId)) o.observations.push({observationId,sourceType:'END_EVENT',observationMode:'VISUAL_EVENT',status:'FOUND',label,categories,timing:[`${label}を実際に確認した時`],excludedConditions:['未確認を非発生とみなさない'],sourceRefs:[],notes:'Evidence UI v2 REVIEW解消。設定下限・否定・限定ではなく自然観測面として記録する。'});
 fs.writeFileSync(op,JSON.stringify(o,null,2)+'\n');
 const sec=u.sections['設定確定・否定情報']??{}; u.sections['設定確定・否定情報']={...sec,inputIds:[],evidenceIds:cfg.contracts.map(x=>x[0])};
 for(const k of Object.keys(u.inputContracts??{})) if(k.startsWith('INP_EVI_SETTING_')) delete u.inputContracts[k];
 u.evidenceContracts=Object.fromEntries(cfg.contracts.map(([key,label,group])=>[key,{label,selectionMode:'single',sourceEvidenceGroupId:group,inheritOptions:true}]));
 u.auditNotes=[...(u.auditNotes??[]),'Evidence UI v2 REVIEW解消: floor/denial/subsetを自然観測面へ再構成した。','同一の表示機会では選択肢が排他的なため各自然観測グループをsingleとし、別回の観測では保存時に最終的な設定制約へ正規化する。'];
 fs.writeFileSync(up,JSON.stringify(u,null,2)+'\n'); console.log(`${id}: natural Evidence semantics remediation complete`);
}
