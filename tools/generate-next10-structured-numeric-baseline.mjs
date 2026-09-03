#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..');
const OUT_DATE='2026-09-04';
const write=(p,v)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n','utf8');};
const p=(den)=>1/den;
const vals=(settings,denoms)=>Object.fromEntries(settings.map((s,i)=>[`SET_${s}`,{probability:p(denoms[i]),rawDisplay:`1/${denoms[i]}`} ]));
const feature=(id,name,settings,denoms,trial='通常時ゲーム',status='verified',notes='公開設定別数値。Gate Bの採否はSelectionDataで管理する。')=>({researchFeatureId:id,name,factStatus:status,candidateModel:'binomial',trialUnit:trial,numeratorDefinition:`${name}の観測回数`,denominatorDefinition:`${name}が定義される${trial}`,settingValues:denoms?vals(settings,denoms):{},sourceRefs:['SRC_PRIMARY'],crossSourceStatus:'single_source',notes});
const pending=(id,name,trial='公開条件を満たす対象試行')=>({researchFeatureId:id,name,factStatus:'pending',candidateModel:'unknown',trialUnit:trial,numeratorDefinition:`${name}の条件成立回数`,denominatorDefinition:`${name}が定義される公開上の正しい対象試行`,settingValues:{},sourceRefs:['SRC_PRIMARY'],crossSourceStatus:'single_source',notes:'Gate AでDiscovery→Research追跡済み。完全な条件別表または観測分母が未確定のため、数値を捏造せずResearch候補として保持する。'});

const machines=[
{
 id:'L_IZA_BANCHO_SB8',display:'いざ！番長',formal:'いざ！番長',model:'L/いざ番長/SB8',manufacturer:'サボハニ',date:'2025-06-02',settings:[1,2,3,4,5,6],source:['6確','いざ！番長 解析｜天井・設定差・やめどき・打ち方','https://www.kaku6.jp/slot/izabancho/','major_analysis'],
 fs:[feature('RF_AT_INITIAL','AT初当り',[1,2,3,4,5,6],[386.9,368.5,375.8,332.4,351.6,312.1]),feature('RF_COMMON_BELL_A','共通ベルA',[1,2,3,4,5,6],[74.9,74.5,72.7,64.0,60.1,58.0],'共通ベルAを同一路線で数える対象ゲーム'),feature('RF_DIRECT_BIG','直撃BIG',[1,2,3,4,5,6],[7865.6,6922.5,5970.3,2660.1,3214.4,2247.2]),feature('RF_WEAK_CHERRY','弱チェリー',[1,2,3,4,5,6],[79.9,79.6,79.3,78.9,78.3,77.6]),pending('RF_MODE_STATE','モード・規定G・状態移行')],
 active:{RF_AT_INITIAL:'FEAT_AT_INITIAL',RF_COMMON_BELL_A:'FEAT_COMMON_BELL_A'},refs:{RF_DIRECT_BIG:'AT初当りとの構成関係が未証明のためREFERENCE。',RF_WEAK_CHERRY:'7000G情報量が極小のため数値不採用。',RF_MODE_STATE:'条件別分母未確定のためREFERENCE。'},linked:['FOUND','ダイトモ']
},
{
 id:'L_ZETTAI_SHOGEKI_PLATONIC_HEART_TK',display:'L 絶対衝激～PLATONIC HEART～',formal:'L 絶対衝激～PLATONIC HEART～',model:'L絶対衝激TK',manufacturer:'スパイキー',date:'2025-06-16',settings:[1,2,3,4,5,6],source:['一撃','絶対衝激（スマスロ）解析攻略','https://1geki.jp/slot/l_zetai/','major_analysis'],
 fs:[feature('RF_REAL_BONUS','リアルボーナス',[1,2,3,4,5,6],[163.0,162.2,161.4,156.0,146.3,139.7]),feature('RF_AT_INITIAL','AT初当り',[1,2,3,4,5,6],[336.3,328.2,318.6,299.4,278.8,264.7]),pending('RF_CZ','CZ'),pending('RF_ROLE_TO_HIGH','成立役→高確移行','指定状態での契機役成立回数')],
 active:{RF_REAL_BONUS:'FEAT_REAL_BONUS',RF_AT_INITIAL:'FEAT_AT_INITIAL'},refs:{RF_CZ:'同一条件の観測分母が未確定のためREFERENCE。',RF_ROLE_TO_HIGH:'状態条件付き分母のためREFERENCE。'},linked:['CHECKED_NONE',null]
},
{
 id:'L_WATASHI_NO_SHIAWASE_NA_KEKKON_PN',display:'わたしの幸せな結婚',formal:'わたしの幸せな結婚',model:'Lわたしの幸せな結婚PN',manufacturer:'コナミアミューズメント',date:'2025-07-07',settings:[1,2,3,4,5,6],source:['HAZUSE','わたしの幸せな結婚 設定推測','https://hazuse.com/machine/pachislot/5S0052/','major_analysis'],
 fs:[feature('RF_BONUS_INITIAL','ボーナス初当り',[1,2,3,4,5,6],[290.8,286.5,277.3,255.3,251.4,249.4]),feature('RF_AT_INITIAL','AT初当り',[1,2,3,4,5,6],[594.3,583.4,558.8,494.7,484.3,479.4]),pending('RF_CZ','CZ'),pending('RF_BONUS_THROUGH','ボーナススルー天井分布','対象となるボーナススルー系列')],
 active:{RF_BONUS_INITIAL:'FEAT_BONUS_INITIAL',RF_AT_INITIAL:'FEAT_AT_INITIAL'},refs:{RF_CZ:'観測分母未確定のためREFERENCE。',RF_BONUS_THROUGH:'条件付き系列分布のためREFERENCE。'},linked:['FOUND','eSLOT+']
},
{
 id:'LB_TRIPLE_CROWN_SF4',display:'LBトリプルクラウン',formal:'LBトリプルクラウン',model:'LBTCSF4',manufacturer:'岡崎産業',date:'2025-07-07',settings:[1,2,5,6],source:['P-WORLD','LBトリプルクラウン 機種情報','https://www.p-world.co.jp/machine/database/10299','major_analysis'],
 fs:[feature('RF_BIG','BIG',[1,2,5,6],[276.5,273.1,251.1,227.6]),feature('RF_REG','REG',[1,2,5,6],[414.8,392.4,346.8,302.0]),feature('RF_BONUS_AGG','ボーナス合算',[1,2,5,6],[165.9,161.0,145.6,129.8]),feature('RF_CHERRY','チェリー',[1,2,5,6],[49.9,48.2,45.6,42.4]),feature('RF_PLUM','プラム',[1,2,5,6],[64.6,63.0,59.4,54.9]),pending('RF_ROLE_BONUS_OVERLAP','役別ボーナス同時当選','同じ役の成立回数')],
 active:{RF_BIG:'FEAT_BIG',RF_REG:'FEAT_REG',RF_CHERRY:'FEAT_CHERRY',RF_PLUM:'FEAT_PLUM'},refs:{RF_BONUS_AGG:'BIG+REGの決定論的集約のため数値重複。',RF_ROLE_BONUS_OVERLAP:'採用役・ボーナス観測を再利用するためREFERENCE。'},linked:['CHECKED_NONE',null],menu:'CHECKED_NONE'
},
{
 id:'LB_MATADOR_3_TT',display:'マタドールⅢ',formal:'マタドールⅢ',model:'LBマタドールⅢTT',manufacturer:'北電子',date:'2025-08-04',settings:[1,2,3,4,5,6],source:['北電子','マタドールⅢ 製品情報','https://www.kitadenshi.co.jp/slot/matador3/','official'],
 fs:[feature('RF_BB','BB',[1,2,3,4,5,6],[278.9,268.6,260.1,244.5,231.6,219.9]),feature('RF_RB','RB',[1,2,3,4,5,6],[434.0,417.4,402.1,362.1,334.4,299.3]),feature('RF_BONUS_AGG','ボーナス合算',[1,2,3,4,5,6],[169.8,163.4,157.9,146.0,136.8,126.8]),feature('RF_BT_ONE_COIN','BT中1枚役',[1,2,3,4,5,6],[8192,4096,2048,512,256,64],'BTゲーム')],
 active:{RF_BB:'FEAT_BB',RF_RB:'FEAT_RB'},refs:{RF_BONUS_AGG:'BB+RBの決定論的集約のため数値重複。',RF_BT_ONE_COIN:'BTゲーム分母と一日Exposureが不安定なためREFERENCE。'},linked:['CHECKED_NONE',null],menu:'CHECKED_NONE'
},
{
 id:'L_TENSEI_SHITARA_KEN_DESHITA_GT',display:'パチスロ 転生したら剣でした',formal:'パチスロ 転生したら剣でした',model:'L転生したら剣でしたGT',manufacturer:'コナミアミューズメント',date:'2025-08-04',settings:[1,2,3,4,5,6],source:['HAZUSE','パチスロ 転生したら剣でした 設定推測','https://hazuse.com/machine/pachislot/5S0141/','major_analysis'],
 fs:[feature('RF_AT_INITIAL','AT初当り',[1,2,3,4,5,6],[403.8,396.0,373.4,340.7,325.9,312.8]),feature('RF_CZ','CZ初当り',[1,2,3,4,5,6],[215.8,214.2,211.0,204.8,201.2,197.8]),feature('RF_BONUS_INITIAL','ボーナス初当り',[1,2,3,4,5,6],[398.6,388.7,380.8,352.0,335.0,316.8]),pending('RF_WEAK_CHANCE_STATE','状態別弱チャンス役→ボーナス','指定状態の弱チャンス役成立回数')],
 active:{RF_AT_INITIAL:'FEAT_AT_INITIAL'},refs:{RF_CZ:'ATへの上流経路で独立乗算を避ける。',RF_BONUS_INITIAL:'ATへの上流経路で独立乗算を避ける。',RF_WEAK_CHANCE_STATE:'状態条件付き分母のためREFERENCE。'},linked:['FOUND','eSLOT+']
},
{
 id:'L_DARLING_IN_THE_FRANXX_SA',display:'L ダーリン・イン・ザ・フランキス',formal:'L ダーリン・イン・ザ・フランキス',model:'LダーリンインザフランキスSA',manufacturer:'スパイキー',date:'2025-08-04',settings:[1,2,3,4,5,6],source:['P-WORLD','L ダーリン・イン・ザ・フランキス 機種情報','https://www.p-world.co.jp/machine/database/10319','major_analysis'],
 fs:[feature('RF_BONUS_INITIAL','ボーナス初当り',[1,2,3,4,5,6],[229.8,224.1,214.9,207.3,190.3,180.3]),feature('RF_BONUS_HIGH_INITIAL','ボーナス高確率',[1,2,3,4,5,6],[343.0,334.1,320.1,298.9,270.3,252.3]),feature('RF_CZ_COMBINED','CZ合成',[1,2,3,4,5,6],[126.6,127.3,125.5,126.6,121.2,119.1]),pending('RF_CONNECT_LEVEL','コネクトチャンス初期レベル','コネクトチャンス開始1回'),pending('RF_FRANXX_HIGH_TRANSITION','フランクス高確移行','非高確集中状態の対象契機')],
 active:{RF_BONUS_INITIAL:'FEAT_BONUS_INITIAL'},refs:{RF_BONUS_HIGH_INITIAL:'総ボーナス初当りの状態別subsetのためREFERENCE。',RF_CZ_COMBINED:'非単調かつ構成重複リスクのためREFERENCE。',RF_CONNECT_LEVEL:'条件付き試行のためREFERENCE。',RF_FRANXX_HIGH_TRANSITION:'状態条件付き分母のためREFERENCE。'},linked:['CHECKED_NONE',null]
},
{
 id:'L_SAKI_CHOJO_KESSEN_YR',display:'L咲-Saki- 頂上決戦',formal:'L咲-Saki- 頂上決戦',model:'L咲-Saki-頂上決戦YR',manufacturer:'SANYO',date:'2025-08-04',settings:[1,2,3,4,5,6],source:['P-WORLD','L咲-Saki- 頂上決戦 機種情報','https://www.p-world.co.jp/machine/database/10297','major_analysis'],
 fs:[feature('RF_AT_INITIAL','AT初当り',[1,2,3,4,5,6],[398.4,386.4,365.5,336.3,304.2,284.0]),feature('RF_CZ','CZ初当り',[1,2,3,4,5,6],[184.0,181.7,176.5,168.5,158.5,154.2]),pending('RF_CYCLE_STATE','周期・ライバルモード・状態'),pending('RF_KIYOSUMI_TRIAL','清澄トライアル','清澄トライアル機会')],
 active:{RF_AT_INITIAL:'FEAT_AT_INITIAL'},refs:{RF_CZ:'AT上流経路のため独立乗算を避ける。',RF_CYCLE_STATE:'条件付き分母未確定のためREFERENCE。',RF_KIYOSUMI_TRIAL:'条件付き分母未確定のためREFERENCE。'},linked:['CHECKED_NONE',null],menu:'FOUND_FOR_EVIDENCE_RECOVERY'
},
{
 id:'S_KONOSUBA_ZR',display:'パチスロこの素晴らしい世界に祝福を！',formal:'パチスロこの素晴らしい世界に祝福を！',model:'S この素晴らしい世界に祝福を！ ZR',manufacturer:'Sammy',date:'2022-04-04',settings:[1,2,3,4,5,6],source:['パチナビ','パチスロ この素晴らしい世界に祝福を！ 設定判別','https://pachinavi.net/machines/konosuba/settei/','major_analysis'],
 fs:[feature('RF_AT_INITIAL','AT初当り',[1,2,3,4,5,6],[261.5,251.6,247.5,233.5,230.8,216.9]),pending('RF_EMERGENCY_QUEST','緊急クエスト相手分布','緊急クエスト1回'),pending('RF_QUEST_RANK_SUCCESS','クエストランク別成功','指定ランクのクエスト試行'),pending('RF_BATH_INITIAL_POINTS','お風呂ゾーン初期ポイント','お風呂ゾーン突入1回'),pending('RF_BONUS_7_ALIGNMENT','ボーナス中7揃い','対象ボーナス中試行'),pending('RF_HIDDEN_MODE','隠れモード','対象モード移行機会')],
 active:{RF_AT_INITIAL:'FEAT_AT_INITIAL'},refs:{RF_EMERGENCY_QUEST:'条件付き分布のためREFERENCE。',RF_QUEST_RANK_SUCCESS:'ランク別試行のためREFERENCE。',RF_BATH_INITIAL_POINTS:'条件付き分布のためREFERENCE。',RF_BONUS_7_ALIGNMENT:'条件付き分母のためREFERENCE。',RF_HIDDEN_MODE:'観測・unlock条件付きのためREFERENCE。'},linked:['FOUND','マイスロ']
},
{
 id:'S_RAKUEN_TSUHO_FS',display:'パチスロ楽園追放',formal:'パチスロ楽園追放',model:'S 楽園追放 FS',manufacturer:'Sammy',date:'2021-09-06',settings:[1,2,3,4,5,6],source:['HAZUSE','パチスロ楽園追放 設定推測','https://hazuse.com/machine/pachislot/1S0218/','major_analysis'],
 fs:[feature('RF_INITIAL_AGG','BB/RD/AT初当り合成',[1,2,3,4,5,6],[164.5,160.1,147.9,134.0,121.3,111.1]),feature('RF_RD_INITIAL','RD初当り',[1,2,3,4,5,6],[323.1,308.1,270.8,226.7,190.2,165.4]),feature('RF_AT_INITIAL','AT初当り',[1,2,3,4,5,6],[575.1,542.4,484.9,412.1,353.1,310.0]),feature('RF_COMMON_BELL','共通ベル',[1,2,3,4,5,6],[364.1,344.9,327.7,273.1,230.0,198.6],'同じマイスロ結果画面のゲーム数'),pending('RF_STATE_ROLE_DRAW','状態×成立役別初当り抽選','指定状態の対象役成立回数'),pending('RF_NAH','NAH高確移行・覚醒チャレンジ','対象となるNAH機会')],
 active:{RF_INITIAL_AGG:'FEAT_INITIAL_AGG',RF_COMMON_BELL:'FEAT_COMMON_BELL'},refs:{RF_RD_INITIAL:'初当り合成の構成要素のため数値重複。',RF_AT_INITIAL:'初当り合成の構成要素のため数値重複。',RF_STATE_ROLE_DRAW:'状態条件付き分母のためREFERENCE。',RF_NAH:'条件付き分母のためREFERENCE。'},linked:['FOUND','マイスロ']
}
];

const inputDefs={
 FEAT_AT_INITIAL:['INP_AT_INITIAL_COUNT','INP_AT_INITIAL_TRIALS','AT初当り','AT初当りの対象となる通常時ゲーム'],
 FEAT_COMMON_BELL_A:['INP_COMMON_BELL_A_COUNT','INP_COMMON_BELL_A_GAMES','共通ベルA','共通ベルAを同一路線で数える対象ゲーム'],
 FEAT_REAL_BONUS:['INP_REAL_BONUS_COUNT','INP_REAL_BONUS_GAMES','リアルボーナス','リアルボーナス抽選の対象ゲーム'],
 FEAT_BONUS_INITIAL:['INP_BONUS_INITIAL_COUNT','INP_BONUS_INITIAL_TRIALS','ボーナス初当り','ボーナス初当りの対象となる通常時ゲーム'],
 FEAT_BIG:['INP_BIG_COUNT','INP_BIG_GAMES','BIG','BIG抽選の対象ゲーム'],FEAT_REG:['INP_REG_COUNT','INP_REG_GAMES','REG','REG抽選の対象ゲーム'],
 FEAT_CHERRY:['INP_CHERRY_COUNT','INP_CHERRY_GAMES','チェリー','チェリーを数える対象ゲーム'],FEAT_PLUM:['INP_PLUM_COUNT','INP_PLUM_GAMES','プラム','プラムを数える対象ゲーム'],
 FEAT_BB:['INP_BB_COUNT','INP_BB_GAMES','BB','BB抽選の対象ゲーム'],FEAT_RB:['INP_RB_COUNT','INP_RB_GAMES','RB','RB抽選の対象ゲーム'],
 FEAT_INITIAL_AGG:['INP_INITIAL_AGG_COUNT','INP_INITIAL_AGG_TRIALS','BB/RD/AT初当り合成','BB/RD/AT初当り合成の対象となる通常時ゲーム'],
 FEAT_COMMON_BELL:['INP_COMMON_BELL_COUNT','INP_MY_SLOT_TOTAL_GAMES','共通ベル','同じマイスロ結果画面のゲーム数']
};

for(const m of machines){
 const src={sourceId:'SRC_PRIMARY',publisher:m.source[0],title:m.source[1],url:m.source[2],checkedAt:OUT_DATE,sourceType:m.source[3]};
 const research={schemaVersion:'research-data-v1',machine:{machineId:m.id,displayName:m.display,formalName:m.formal,modelNumber:m.model,manufacturer:m.manufacturer,introductionDate:m.date,settings:m.settings.map(s=>`SET_${s}`),identitySourceRefs:['SRC_PRIMARY']},researchedAt:OUT_DATE,sources:[src],features:m.fs,evidenceCandidates:[{researchEvidenceId:'RE_SETTING_HINTS',name:'設定示唆・確定情報',factStatus:'pending',allowedSettings:[],deniedSettings:[],sourceRefs:['SRC_PRIMARY'],notes:'Gate A/Bで個別の画面・音声・トロフィー等を追跡済み。数値baselineでは強度や確定条件を捏造せず、Evidence専用materialization工程へ持ち越す。'}],conflicts:[]};
 write(path.join(ROOT,'research',m.id,'research-data.json'),research);
 const inputs=[]; const sels=[]; let order=10;
 for(const rf of m.fs){
   const featId=m.active[rf.researchFeatureId];
   if(featId){const [num,den,label,trialLabel]=inputDefs[featId]; const cat=`SEL_${rf.researchFeatureId}`;inputs.push({id:num,name:`${label} 回数`,category:cat,type:'counter',unit:'回',displayOrder:order++,inferenceRole:'INCLUDE_PRIMARY',defaultValue:''},{id:den,name:trialLabel,category:cat,type:'integer',unit:'回',displayOrder:order++,inferenceRole:'INCLUDE_PRIMARY',defaultValue:''});sels.push({researchFeatureId:rf.researchFeatureId,featureId:featId,adoptionCategory:'INCLUDE_PRIMARY',weight:1,numeratorInputId:num,denominatorInputId:den,userReason:'Gate Bで依存関係・観測可能性・実戦情報量を監査し、代表数値Featureとして採用。',difficultyParticipation:'EXCLUDE',difficultyExclusionReason:'Gate D baselineではObservation Exposureの最終較正前のためDifficultyへ仮換算を持ち込まない。'});}
   else {sels.push({researchFeatureId:rf.researchFeatureId,featureId:`FEAT_${rf.researchFeatureId.replace(/^RF_/,'')}`,adoptionCategory:'EXCLUDE',weight:1,rejectionReason:m.refs[rf.researchFeatureId]??'Gate BでREFERENCE/数値不採用。',userFacingReason:m.refs[rf.researchFeatureId]??'Gate BでREFERENCE/数値不採用。',difficultyParticipation:'EXCLUDE'});}
 }
 const uiCategoryLabels={}; for(const i of inputs) uiCategoryLabels[i.category]=i.name.replace(/ 回数$/,'').replace(/の対象.*$/,'');
 const selection={schemaVersion:'selection-data-v1',machineId:m.id,machineDataVersion:'0.1.0',inputs,features:sels,evidence:[],evidenceDecisions:[],evidenceReview:{policyVersion:1,exclusions:[{researchEvidenceId:'RE_SETTING_HINTS',reason:'個別Evidenceカテゴリのhard/tendency意味を数値baselineで捏造しない。Evidence materialization工程で追加する。'}]},evidenceUi:{groups:[]},uiCategoryLabels,difficultyAnalysis:{targetGames:[1500,3000,7000],targetGameBasis:{basisId:'UNRESOLVED_OBSERVATION',label:'Observationで確定する実戦Exposure',quality:'UNRESOLVED',crossMachineComparable:false,note:'Gate D numeric baselineではDifficulty Exposureを別工程で確定する。'},calibrationAllowedExposureQualities:['EXACT','DERIVED']}};
 write(path.join(ROOT,'research',m.id,'selection-data.json'),selection);
 const observations=[]; const mappings=[];
 for(const [rf,featId] of Object.entries(m.active)){
   const [num,den,label,trialLabel]=inputDefs[featId];
   const special=m.id==='S_RAKUEN_TSUHO_FS'&&featId==='FEAT_COMMON_BELL';
   const daitomo=m.id==='L_IZA_BANCHO_SB8'&&featId==='FEAT_COMMON_BELL_A';
   const obsId=`OBS_${featId.replace(/^FEAT_/,'')}`;
   observations.push({observationId:obsId,sourceType:special?'LINKED_SERVICE':'DIRECT_PLAY',observationMode:special?'LINKED_SERVICE_RESULT':'MANUAL_COUNTER',status:'FOUND',label,categories:[`${label} 回数`,trialLabel],timing:[special?'マイスロ結果画面で同じセッションの「共通ベル成立回数」と「ゲーム数」を確認':`自己実戦中に「${trialLabel}」を単位として記録`],excludedConditions:special?['「通常ゲーム数」を共通ベル分母に使わない','My Counter Lv4等で共通ベル表示が未開放なら空欄とする','別セッションの分子・分母を混ぜない']:['着席前累積値を自己実戦値へ混ぜない','未観測を観測済み0として扱わない','Research定義と異なる試行母集団を混ぜない'],sourceRefs:['SRC_PRIMARY'],notes:special?'実機結果画面で9538G/33回=1/289.03…が表示1/289.04と整合。6078通常Gは不整合。':daitomo?'手動観測を基本routeとし、ダイトモ自動カウントを使う場合は同一母集団の分子・分母として別provenanceで扱う。':'Gate Cでactive numeric observationとして確定。'});
   mappings.push({featureId:featId,mappingType:'EXACT',observationIds:[obsId],collectionMethods:[special?'LINKED_SERVICE_RESULT':'MANUAL_COUNTER'],usableForInference:true,usableForDifficulty:false,notes:'Research/Selectionで定義された同一試行母集団を保持する。'});
 }
 const sourceCoverage={machineMenu:m.menu??'UNRESOLVED',dataCounter:'UNRESOLVED',linkedService:m.linked[0],directPlay:'FOUND',endEvent:'FOUND',seatedState:'UNRESOLVED'};
 const fieldVerificationItems=[];
 if(m.linked[0]==='FOUND' && m.id!=='S_RAKUEN_TSUHO_FS') fieldVerificationItems.push({verificationId:`VFY_${m.id}_LINKED_FIELDS`,status:'WAITING_FOR_MACHINE',sourceType:'LINKED_SERVICE',priority:'MEDIUM',question:`${m.linked[1]}の機種固有表示項目とResearch分母との一致を実機で確認する。`,classification:'MACHINE_REQUIRED',webResearchStatus:'EXHAUSTED_2026-09-04'});
 if(m.id==='L_IZA_BANCHO_SB8') fieldVerificationItems.push({verificationId:'VFY_L_IZA_BANCHO_SB8_DIRECT_BIG_COMPOSITION',status:'WAITING_FOR_MACHINE',sourceType:'DIRECT_PLAY',priority:'LOW',question:'直撃BIGと公開AT初当りの構成関係を将来再採用する場合に確認する。',classification:'MACHINE_REQUIRED',webResearchStatus:'EXHAUSTED_2026-09-04'});
 const observation={schemaVersion:'machine-observation-data-v2',machineId:m.id,displayName:m.display,researchedAt:OUT_DATE,sources:[src],sourceCoverage,observations,featureMappings:mappings,researchReopenRequests:[],fieldVerificationItems,fieldVerificationNotes:m.id==='S_RAKUEN_TSUHO_FS'?['2026-09-04: user-provided real My Slot screen reverified common-bell denominator as same-screen total ゲーム数, not 通常ゲーム数.']:[]};
 write(path.join(ROOT,'research',m.id,'machine-observation-data.json'),observation);
 console.log(`${m.id}: research=${m.fs.length} active=${Object.keys(m.active).length} evidence=staged`);
}
console.log('Generated numeric structured baseline 10/10. Evidence category materialization intentionally deferred; Gate D remains IN_PROGRESS.');
