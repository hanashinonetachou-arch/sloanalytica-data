#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT=process.cwd();
const checkedAt='2026-09-04';
const settings6=['SET_1','SET_2','SET_3','SET_4','SET_5','SET_6'];
const prob=n=>1/Number(n);
const vals=(settings,denoms)=>Object.fromEntries(settings.map((s,i)=>[s,{probability:prob(denoms[i]),rawDisplay:`1/${denoms[i]}`}]))
const source=(sourceId,publisher,url,sourceType='major_analysis',title='設定判別・解析')=>({sourceId,publisher,title,url,checkedAt,sourceType});
const feature=(id,name,trialUnit,denoms,settings,sourceRefs,notes='')=>({researchFeatureId:`RF_${id.replace(/^FEAT_/,'')}`,name,factStatus:'verified',candidateModel:'binomial',trialUnit,numeratorDefinition:`${name}の観測回数`,denominatorDefinition:`${trialUnit}の観測試行数`,settingValues:vals(settings,denoms),sourceRefs,crossSourceStatus:sourceRefs.length>1?'matched':'single_source',...(notes?{notes}:{})});

const machines=[
 {reg:211,id:'L_IZA_BANCHO_SB8',name:'いざ！番長',formal:'いざ！番長',model:'L/いざ番長/SB8',manufacturer:'サボハニ',date:'2025-06-02',settings:settings6,
  sources:[source('SRC_1GEKI','一撃','https://1geki.jp/slot/l_bancho_iza/0/'),source('SRC_NANA','なな徹','https://nana-press.com/kaiseki/machine/946/29280/')],
  features:[
   {fid:'FEAT_AT_INITIAL',label:'AT初当り',denoms:[386.9,368.5,375.8,332.4,351.6,312.1],trial:'AT初当りの対象となる通常時ゲーム',inputs:['INP_AT_INITIAL_COUNT','INP_AT_INITIAL_TRIALS'],role:'INCLUDE_PRIMARY'},
   {fid:'FEAT_COMMON_BELL_A',label:'共通ベルA',denoms:[74.9,74.5,72.7,64.0,60.1,58.0],trial:'共通ベルAを数える対象ゲーム',inputs:['INP_COMMON_BELL_A_COUNT','INP_COMMON_BELL_A_GAMES'],role:'INCLUDE_SUPPORT',notes:'ダイトモ自動カウントと手動観測は別取得経路。分子・分母を異なる経路から混在させない。'}],
  coverage:{machineMenu:'UNRESOLVED',dataCounter:'UNRESOLVED',linkedService:'FOUND',directPlay:'FOUND',endEvent:'FOUND',seatedState:'UNRESOLVED'},
  service:'ダイトモ',serviceFeature:'FEAT_COMMON_BELL_A'},
 {reg:212,id:'L_ZETTAI_SHOGEKI_PLATONIC_HEART_TK',name:'L 絶対衝激～PLATONIC HEART～',formal:'L 絶対衝激～PLATONIC HEART～',model:'L絶対衝激TK',manufacturer:'スパイキー',date:'2025-06-16',settings:settings6,
  sources:[source('SRC_NANA','なな徹','https://nana-press.com/kaiseki/machine/982/30181/')],features:[
   {fid:'FEAT_REAL_BONUS',label:'リアルボーナス',denoms:[163.0,162.2,161.4,156.0,146.3,139.7],trial:'リアルボーナス抽選の対象ゲーム',inputs:['INP_REAL_BONUS_COUNT','INP_REAL_BONUS_GAMES'],role:'INCLUDE_PRIMARY'},
   {fid:'FEAT_AT_INITIAL',label:'AT初当り',denoms:[336.3,328.2,318.6,299.4,278.8,264.7],trial:'AT初当りの対象となる通常時ゲーム',inputs:['INP_AT_INITIAL_COUNT','INP_AT_INITIAL_TRIALS'],role:'INCLUDE_PRIMARY'}],coverage:{machineMenu:'UNRESOLVED',dataCounter:'UNRESOLVED',linkedService:'CHECKED_NONE',directPlay:'FOUND',endEvent:'FOUND',seatedState:'UNRESOLVED'}},
 {reg:213,id:'L_WATASHI_NO_SHIAWASE_NA_KEKKON_PN',name:'わたしの幸せな結婚',formal:'わたしの幸せな結婚',model:'Lわたしの幸せな結婚PN',manufacturer:'KPE / コナミアミューズメント',date:'2025-07-07',settings:settings6,
  sources:[source('SRC_NANA','なな徹','https://nana-press.com/kaiseki/machine/979/30631/')],features:[
   {fid:'FEAT_BONUS_INITIAL',label:'ボーナス初当り',denoms:[290.8,286.5,277.3,255.3,251.4,249.4],trial:'ボーナス初当りの対象となる通常時ゲーム',inputs:['INP_BONUS_INITIAL_COUNT','INP_BONUS_INITIAL_TRIALS'],role:'INCLUDE_PRIMARY'},
   {fid:'FEAT_AT_INITIAL',label:'AT初当り',denoms:[594.3,583.4,558.8,494.7,484.3,479.4],trial:'AT初当りの対象となる通常時ゲーム',inputs:['INP_AT_INITIAL_COUNT','INP_AT_INITIAL_TRIALS'],role:'INCLUDE_PRIMARY'}],coverage:{machineMenu:'UNRESOLVED',dataCounter:'UNRESOLVED',linkedService:'FOUND',directPlay:'FOUND',endEvent:'FOUND',seatedState:'UNRESOLVED'},service:'eSLOT+'},
 {reg:214,id:'LB_TRIPLE_CROWN_SF4',name:'LBトリプルクラウン',formal:'LBトリプルクラウン',model:'LBTCSF4',manufacturer:'岡崎産業',date:'2025-07-07',settings:['SET_1','SET_2','SET_5','SET_6'],
  sources:[source('SRC_PWORLD','P-WORLD','https://www.p-world.co.jp/machine/database/10299'),source('SRC_HAZUSE','HAZUSE','https://hazuse.com/machine/pachislot/4S1919/')],features:[
   {fid:'FEAT_BIG',label:'BIG',denoms:[276.5,273.1,251.1,227.6],trial:'BIG抽選の対象ゲーム',inputs:['INP_BIG_COUNT','INP_BIG_GAMES'],role:'INCLUDE_PRIMARY'},
   {fid:'FEAT_REG',label:'REG',denoms:[414.8,392.4,346.8,302.0],trial:'REG抽選の対象ゲーム',inputs:['INP_REG_COUNT','INP_REG_GAMES'],role:'INCLUDE_PRIMARY'},
   {fid:'FEAT_CHERRY',label:'チェリー',denoms:[49.9,48.2,45.6,42.4],trial:'通常時のチェリーを数える対象ゲーム',inputs:['INP_CHERRY_COUNT','INP_CHERRY_GAMES'],role:'INCLUDE_SUPPORT'},
   {fid:'FEAT_PLUM',label:'プラム',denoms:[64.6,63.0,59.4,54.9],trial:'通常時のプラムを数える対象ゲーム',inputs:['INP_PLUM_COUNT','INP_PLUM_GAMES'],role:'INCLUDE_SUPPORT'}],coverage:{machineMenu:'CHECKED_NONE',dataCounter:'UNRESOLVED',linkedService:'CHECKED_NONE',directPlay:'FOUND',endEvent:'FOUND',seatedState:'UNRESOLVED'}},
 {reg:215,id:'LB_MATADOR_3_TT',name:'マタドールⅢ',formal:'マタドールⅢ',model:'LBマタドールⅢTT',manufacturer:'北電子',date:'2025-08-04',settings:settings6,
  sources:[source('SRC_OFFICIAL','北電子','https://www.kitadenshi.co.jp/slot/matador3/','official','マタドールⅢ 製品情報')],features:[
   {fid:'FEAT_BB',label:'BB',denoms:[278.9,268.6,260.1,244.5,231.6,219.9],trial:'BB抽選の対象ゲーム',inputs:['INP_BB_COUNT','INP_BB_GAMES'],role:'INCLUDE_PRIMARY'},
   {fid:'FEAT_RB',label:'RB',denoms:[434.0,417.4,402.1,362.1,334.4,299.3],trial:'RB抽選の対象ゲーム',inputs:['INP_RB_COUNT','INP_RB_GAMES'],role:'INCLUDE_PRIMARY'}],coverage:{machineMenu:'CHECKED_NONE',dataCounter:'UNRESOLVED',linkedService:'CHECKED_NONE',directPlay:'FOUND',endEvent:'FOUND',seatedState:'UNRESOLVED'}},
 {reg:216,id:'L_TENSEI_SHITARA_KEN_DESHITA_GT',name:'パチスロ 転生したら剣でした',formal:'パチスロ 転生したら剣でした',model:'L転生したら剣でしたGT',manufacturer:'グレードワン / コナミアミューズメント',date:'2025-08-04',settings:settings6,
  sources:[source('SRC_NANA','なな徹','https://nana-press.com/kaiseki/machine/996/31118/')],features:[{fid:'FEAT_AT_INITIAL',label:'AT初当り',denoms:[403.8,396.0,373.4,340.7,325.9,312.8],trial:'AT初当りの対象となる通常時ゲーム',inputs:['INP_AT_INITIAL_COUNT','INP_AT_INITIAL_TRIALS'],role:'INCLUDE_PRIMARY'}],coverage:{machineMenu:'UNRESOLVED',dataCounter:'UNRESOLVED',linkedService:'FOUND',directPlay:'FOUND',endEvent:'FOUND',seatedState:'UNRESOLVED'},service:'eSLOT+'},
 {reg:217,id:'L_DARLING_IN_THE_FRANXX_SA',name:'L ダーリン・イン・ザ・フランキス',formal:'L ダーリン・イン・ザ・フランキス',model:'LダーリンインザフランキスSA',manufacturer:'スパイキー',date:'2025-08-04',settings:settings6,
  sources:[source('SRC_NANA','なな徹','https://nana-press.com/kaiseki/machine/989/30969/')],features:[{fid:'FEAT_BONUS_INITIAL',label:'ボーナス初当り',denoms:[229.8,224.1,214.9,207.3,190.3,180.3],trial:'ボーナス初当りの対象となる通常時ゲーム',inputs:['INP_BONUS_INITIAL_COUNT','INP_BONUS_INITIAL_TRIALS'],role:'INCLUDE_PRIMARY'}],coverage:{machineMenu:'UNRESOLVED',dataCounter:'UNRESOLVED',linkedService:'CHECKED_NONE',directPlay:'FOUND',endEvent:'FOUND',seatedState:'UNRESOLVED'}},
 {reg:218,id:'L_SAKI_CHOJO_KESSEN_YR',name:'L咲-Saki- 頂上決戦',formal:'L咲-Saki- 頂上決戦',model:'L咲-Saki-頂上決戦YR',manufacturer:'サンスリー / SANYO',date:'2025-08-04',settings:settings6,
  sources:[source('SRC_1GEKI','一撃','https://1geki.jp/slot/l_saki/0/'),source('SRC_PWORLD','P-WORLD','https://www.p-world.co.jp/machine/database/10297')],features:[{fid:'FEAT_AT_INITIAL',label:'AT初当り',denoms:[398.4,386.4,365.5,336.3,304.2,284.0],trial:'AT初当りの対象となる通常時ゲーム',inputs:['INP_AT_INITIAL_COUNT','INP_AT_INITIAL_TRIALS'],role:'INCLUDE_PRIMARY'}],coverage:{machineMenu:'FOUND',dataCounter:'UNRESOLVED',linkedService:'CHECKED_NONE',directPlay:'FOUND',endEvent:'FOUND',seatedState:'UNRESOLVED'}},
 {reg:219,id:'S_KONOSUBA_ZR',name:'パチスロこの素晴らしい世界に祝福を！',formal:'パチスロこの素晴らしい世界に祝福を！',model:'S この素晴らしい世界に祝福を！ ZR',manufacturer:'ロデオ / サミー',date:'2022-04-04',settings:settings6,
  sources:[source('SRC_HAZUSE','HAZUSE','https://data.hazuse.com/?genre=208&machine_code=1S0949'),source('SRC_PACHINAVI','パチナビ','https://pachinavi.net/machines/konosuba/settei/')],features:[{fid:'FEAT_AT_INITIAL',label:'AT初当り',denoms:[261.5,251.6,247.5,233.5,230.8,216.9],trial:'AT初当りの対象となる通常時ゲーム',inputs:['INP_AT_INITIAL_COUNT','INP_AT_INITIAL_TRIALS'],role:'INCLUDE_PRIMARY'}],coverage:{machineMenu:'UNRESOLVED',dataCounter:'UNRESOLVED',linkedService:'FOUND',directPlay:'FOUND',endEvent:'FOUND',seatedState:'UNRESOLVED'},service:'マイスロ'},
 {reg:220,id:'S_RAKUEN_TSUHO_FS',name:'パチスロ楽園追放',formal:'パチスロ楽園追放',model:'S 楽園追放 FS',manufacturer:'サミー',date:'2021-09-06',settings:settings6,
  sources:[source('SRC_HAZUSE','HAZUSE','https://hazuse.com/machine/pachislot/1S0218/')],features:[
   {fid:'FEAT_INITIAL_AGG',label:'BB/RD/AT初当り合成',denoms:[164.5,160.1,147.9,134.0,121.3,111.1],trial:'BB/RD/AT初当り合成の対象となる通常時ゲーム',inputs:['INP_INITIAL_AGG_COUNT','INP_INITIAL_AGG_TRIALS'],role:'INCLUDE_PRIMARY'},
   {fid:'FEAT_COMMON_BELL',label:'共通ベル',denoms:[364.1,344.9,327.7,273.1,230.0,198.6],trial:'同じマイスロ結果画面のゲーム数',inputs:['INP_COMMON_BELL_COUNT','INP_MY_SLOT_TOTAL_GAMES'],role:'INCLUDE_SUPPORT',notes:'実機マイスロ結果画面で、共通ベル成立回数は同画面の「ゲーム数」と整合することを2026-09-04に確認。「通常ゲーム数」は分母に使わない。My Counter Lv4で未開放なら未観測。'}],coverage:{machineMenu:'UNRESOLVED',dataCounter:'UNRESOLVED',linkedService:'FOUND',directPlay:'FOUND',endEvent:'FOUND',seatedState:'UNRESOLVED'},service:'マイスロ',serviceFeature:'FEAT_COMMON_BELL'}
];

function writeJson(p,obj){fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,JSON.stringify(obj,null,2)+'\n','utf8');}
function sourceRefs(m){return m.sources.map(s=>s.sourceId)}
function researchFor(m){
 const refs=sourceRefs(m);
 return {schemaVersion:'research-data-v1',machine:{machineId:m.id,displayName:m.name,formalName:m.formal,modelNumber:m.model,manufacturer:m.manufacturer,introductionDate:m.date,settings:m.settings,identitySourceRefs:[refs[0]]},researchedAt:checkedAt,sources:m.sources,features:m.features.map(f=>feature(f.fid,f.label,f.trial,f.denoms,m.settings,refs,f.notes)),evidenceCandidates:[],conflicts:[]};
}
function selectionFor(m){
 let order=10;const inputs=[],features=[],labels={};
 for(const f of m.features){
  const cat=`SEL_${f.fid}`;labels[cat]=f.label;
  const [num,den]=f.inputs;
  inputs.push({id:num,name:`${f.label} 回数`,category:cat,type:'counter',unit:'回',displayOrder:order++,inferenceRole:f.role,defaultValue:''});
  inputs.push({id:den,name:f.trial,category:cat,type:'integer',unit:'回',displayOrder:order++,inferenceRole:f.role,defaultValue:''});
  features.push({researchFeatureId:`RF_${f.fid.replace(/^FEAT_/,'')}`,featureId:f.fid,adoptionCategory:f.role,weight:1,numeratorInputId:num,denominatorInputId:den,userReason:`Gate B/Gate Cで採用済み。${f.trial}を分母とし、同じ観測経路の分子と組み合わせる。`,difficultyParticipation:'EXCLUDE',difficultyExclusionReason:'Gate D構築時点では実戦総GへのExposure換算を別監査するため、Difficulty校正へはまだ参加させない。'});
 }
 return {schemaVersion:'selection-data-v1',machineId:m.id,machineDataVersion:'0.1.0',inputs,features,evidence:[],evidenceDecisions:[],evidenceReview:{policyVersion:1,exclusions:[]},evidenceUi:{groups:[]},uiCategoryLabels:labels,difficultyAnalysis:{targetGames:[1500,3000,7000],targetGameBasis:{basisId:'UNRESOLVED_OBSERVATION',label:'Observationで確定する実戦Exposure',quality:'UNRESOLVED',crossMachineComparable:false,note:'Gate D numeric coreでは正しい入力分母を固定し、総G換算は別監査で確定する。'},calibrationAllowedExposureQualities:['EXACT','DERIVED']}};
}
function baseObs(m,f,idx){
 const isRakuenBell=m.id==='S_RAKUEN_TSUHO_FS'&&f.fid==='FEAT_COMMON_BELL';
 const sourceType=isRakuenBell?'LINKED_SERVICE':'DIRECT_PLAY';
 const mode=isRakuenBell?'LINKED_SERVICE_READ':'MANUAL_COUNTER';
 return {observationId:`OBS_${f.fid.replace(/^FEAT_/,'')}`,sourceType,observationMode:mode,status:isRakuenBell?'VERIFIED_ON_MACHINE':'FOUND',label:f.label,categories:[`${f.label} 回数`,f.trial],timing:[isRakuenBell?'同一マイスロ結果画面で共通ベル成立回数と「ゲーム数」を記録':`自己実戦中に「${f.trial}」を単位として記録`],excludedConditions:[`Researchで定義した「${f.trial}」以外を分母へ混ぜない`,'着席前累積値を自己実戦値へ混ぜない','未観測を観測済み0として扱わない'],sourceRefs:sourceRefs(m),notes:f.notes||'分子・分母を同一の観測試行母集団で記録する。'};
}
function observationFor(m){
 const observations=m.features.map(baseObs.bind(null,m));
 const mappings=m.features.map(f=>({featureId:f.fid,mappingType:'EXACT',observationIds:[`OBS_${f.fid.replace(/^FEAT_/,'')}`],collectionMethods:[m.id==='S_RAKUEN_TSUHO_FS'&&f.fid==='FEAT_COMMON_BELL'?'LINKED_SERVICE_READ':'MANUAL_COUNTER'],usableForInference:true,usableForDifficulty:false,notes:'Gate Cで確定した観測分母を変更しない。'}));
 if(m.id==='L_IZA_BANCHO_SB8'){
  const f=m.features.find(x=>x.fid==='FEAT_COMMON_BELL_A');
  observations.push({observationId:'OBS_COMMON_BELL_A_DAITOMO',sourceType:'LINKED_SERVICE',observationMode:'LINKED_SERVICE_READ',status:'FOUND',label:'共通ベルA（ダイトモ）',categories:['共通ベルA 回数',f.trial],timing:['ダイトモの同一遊技セッションで共通ベルAの自動カウント値を確認'],excludedConditions:['手動カウントの分子とダイトモ側の分母を混在させない','ダイトモの対象ゲーム定義が不明な値を自己実戦分母へ合算しない'],sourceRefs:sourceRefs(m),notes:'手動観測とは別provenanceの代替取得経路。UI入力面は増やさず、同じFeatureの値としてどちらか一方の一貫した経路を使う。'});
  const mp=mappings.find(x=>x.featureId==='FEAT_COMMON_BELL_A');mp.mappingType='OPTIONAL_SOURCE';mp.observationIds.push('OBS_COMMON_BELL_A_DAITOMO');mp.collectionMethods.push('LINKED_SERVICE_READ');mp.notes='手動またはダイトモの一貫した取得経路を使用し、経路間で分子/分母を混在させない。';
 }
 const fieldVerificationItems=[];
 if(m.service && !m.serviceFeature) fieldVerificationItems.push({verificationId:`VFY_${m.id}_SERVICE_FIELDS`,status:'WAITING_FOR_MACHINE',sourceType:'LINKED_SERVICE',priority:'MEDIUM',question:`${m.service}の機種固有表示項目と分母定義を実機で確認する。`,classification:'MACHINE_REQUIRED',webResearchStatus:'EXHAUSTED_2026-09-04'});
 if(m.id==='L_IZA_BANCHO_SB8') fieldVerificationItems.push({verificationId:`VFY_${m.id}_DIRECT_BIG_COMPOSITION`,status:'WAITING_FOR_MACHINE',sourceType:'DIRECT_PLAY',priority:'LOW',question:'将来、直撃BIGを再採用する場合にAT初当りとの包含関係を明示資料または実機仕様で確認する。',classification:'MACHINE_REQUIRED',webResearchStatus:'EXHAUSTED_2026-09-04'});
 return {schemaVersion:'machine-observation-data-v2',machineId:m.id,displayName:m.name,provisionalRegistrationId:m.reg,registrationId:null,releaseDate:m.date,researchedAt:checkedAt,sources:m.sources,sourceCoverage:m.coverage,observations,featureMappings:mappings,researchReopenRequests:[],fieldVerificationItems,fieldVerificationNotes:m.id==='S_RAKUEN_TSUHO_FS'?['2026-09-04: user-provided real My Slot screen verified common-bell denominator as same-screen ゲーム数, not 通常ゲーム数.']:[]};
}

for(const m of machines){
 const dir=path.join(ROOT,'research',m.id);
 writeJson(path.join(dir,'research-data.json'),researchFor(m));
 writeJson(path.join(dir,'selection-data.json'),selectionFor(m));
 writeJson(path.join(dir,'machine-observation-data.json'),observationFor(m));
}
writeJson(path.join(ROOT,'reports','batch-20260904-next10-gate-d-numeric-core.json'),{schemaVersion:'next10-gate-d-numeric-core-v1',generatedAt:new Date().toISOString(),status:'PARTIAL_GATE_D_FOUNDATION',machines:machines.map(m=>({machineId:m.id,activeFeatureIds:m.features.map(f=>f.fid)})),guards:{publicMainUntouched:true,evidenceMaterializationPending:true,referenceExplanationMaterializationPending:true,uiAndMachineDataPending:true,globalIdentityAuditDebtUnchanged:true},note:'Numeric Research/Selection/Observation core only. This report is not Gate D PASS.'});
console.log(`Generated numeric structured core ${machines.length}/10`);
