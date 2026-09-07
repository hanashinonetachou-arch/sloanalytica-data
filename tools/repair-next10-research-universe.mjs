import fs from 'node:fs';

const ROOT='research';
const DIFF_EXCL='推測計算に採用しないためDifficultyにも参加させない。';
const DIFF_PENDING='Observationで実戦時の露出率・試行量を確定する前にDifficultyへ推定値を持ち込まない。';
const settings=['SET_1','SET_2','SET_3','SET_4','SET_5','SET_6'];

function read(machine,file){return JSON.parse(fs.readFileSync(`${ROOT}/${machine}/${file}`,'utf8'));}
function write(machine,file,obj){fs.writeFileSync(`${ROOT}/${machine}/${file}`,JSON.stringify(obj,null,2)+'\n');}
function addById(arr,key,obj){if(!arr.some(x=>x[key]===obj[key])) arr.push(obj);}
function ensureInput(sel,input){addById(sel.inputs,'id',input);}
function nextOrder(sel){return Math.max(0,...sel.inputs.map(x=>Number(x.displayOrder)||0))+1;}
function evidenceInput(sel,id,name){
  ensureInput(sel,{id,name,type:'counter',category:'EVIDENCE',unit:'回',displayOrder:nextOrder(sel),inferenceRole:'INCLUDE_SUPPORT',defaultValue:''});
}
function addSelectionEvidence(sel,{researchEvidenceId,evidenceId,inputId,name,allowedSettings,deniedSettings}){
  evidenceInput(sel,inputId,name);
  addById(sel.evidence,'researchEvidenceId',{researchEvidenceId,evidenceId,inputId,name,displayName:name,allowedSettings,deniedSettings,notes:'ResearchでHard Evidenceとして検証済み。入力回数は成立有無の記録に使い、同一Evidenceの複数回出現で証拠強度を乗算しない。'});
}
function pushSummary(sel,kind,name,reason){
  const s=sel.selectionSummaryContract;
  if(!s[kind].some(x=>x.name===name)) s[kind].push({name,reason});
  s.evaluatedCount=s.selected.length+s.rejected.length;
  s.selectedCount=s.selected.length;
  s.rejectedCount=s.rejected.length;
}
function addSupport(sel,feature,summaryName,reason){
  addById(sel.features,'researchFeatureId',feature);
  pushSummary(sel,'selected',summaryName,reason);
}
function addExclude(sel,researchFeatureId,featureId,summaryName,reason){
  addById(sel.features,'researchFeatureId',{researchFeatureId,featureId,adoptionCategory:'EXCLUDE',difficultyParticipation:'EXCLUDE',difficultyExclusionReason:DIFF_EXCL,userFacingReason:reason});
  pushSummary(sel,'rejected',summaryName,reason);
}
function setCandidate(r,nameContains,target,note){
  const c=r.discoveryInventory.find(x=>x.name.includes(nameContains));
  if(c){c.transferStatus='RESOLVED';c.researchTarget=target;if(note)c.note=note;}
}
function addCandidate(r,name,target,note){
  const hit=r.discoveryInventory.find(x=>x.name===name);
  if(hit){hit.transferStatus='RESOLVED';hit.researchTarget=target;if(note)hit.note=note;return;}
  const nums=r.discoveryInventory.map(x=>Number(String(x.discoveryCandidateId||'').replace(/\D/g,''))).filter(Number.isFinite);
  const n=(Math.max(0,...nums)+1).toString().padStart(2,'0');
  r.discoveryInventory.push({discoveryCandidateId:`DC_${n}`,name,transferStatus:'RESOLVED',researchTarget:target,...(note?{note}:{})});
}
function valsFromDenoms(ds){return Object.fromEntries(settings.map((s,i)=>[s,{probability:1/ds[i],rawDisplay:`1/${ds[i]}`,numerator:1,denominator:ds[i]}]));}
function valsFromPct(ps){return Object.fromEntries(settings.map((s,i)=>[s,{probability:ps[i]/100,rawDisplay:`${ps[i]}%`,numerator:ps[i],denominator:100}]));}

// ---------------------------------------------------------------------------
// L_FIRE_FORCE_2: recover ordinary bonus-end distributions in addition to hard evidence.
// ---------------------------------------------------------------------------
{
 const m='L_FIRE_FORCE_2', r=read(m,'research-data.json'), s=read(m,'selection-data.json');
 const cats=['DEFAULT','WEAK','STRONG','ALL8','RED9','GOLD'];
 const distA=[
  [77,20,3,0,0,0],[74,22,4,0,0,0],[71,24,5,0,0,0],
  [63,26,6,5,0,0],[59,28,8,3,2,0],[55,30,9,3,2,1]
 ];
 const distB=[
  [86,11,3,0,0,0],[84,12,4,0,0,0],[83,13,4,0,0,0],
  [76,14,5,5,0,0],[73,16,6,3,2,0],[70,17,7,3,2,1]
 ];
 function feature(id,name,scope,dist){
  return {researchFeatureId:id,name,factStatus:'verified',candidateModel:'multinomial',trialUnit:'対象ボーナス終了1回',observationScope:scope,numeratorDefinition:'各終了画面の出現回数',denominatorDefinition:'終了画面カスタム非設定時の対象ボーナス終了画面確認総回数',categories:cats,distributionMode:'complete',settingValues:{},settingDistributions:Object.fromEntries(settings.map((x,i)=>[x,Object.fromEntries(cats.map((c,j)=>[c,dist[i][j]/100]))])),sourceRefs:['SRC_SETTING'],crossSourceStatus:'single_source_major',notes:'通常パターンとHard Evidenceが同一自然観測に混在。SelectionではALL8/RED9/GOLDを確率Featureから除外しEvidence側へ分離する。'};
 }
 addById(r.features,'researchFeatureId',feature('RF_BONUS_END_REG_GROUP','REG・アクセル・灰焰ボーナス終了画面振り分け','REG・アクセルボーナス・灰焰ボーナス終了時',distA));
 addById(r.features,'researchFeatureId',feature('RF_BONUS_END_ENEN','炎炎ボーナス終了画面振り分け','炎炎ボーナス終了時',distB));
 setCandidate(r,'ボーナス終了画面',['RF_BONUS_END_REG_GROUP','RF_BONUS_END_ENEN','RE_BONUS_END_4PLUS','RE_BONUS_END_5PLUS','RE_BONUS_END_6'],'通常パターンの設定別分布も公開済みのため確率Featureへ昇格。Hard Evidenceは同一観測から別処理する。');
 const labels=[['DEFAULT','デフォルト'],['WEAK','高設定示唆弱'],['STRONG','高設定示唆強']];
 for(const [suffix,label] of labels){ensureInput(s,{id:`INP_BONUS_END_REG_${suffix}`,name:`REG/アクセル/灰焰終了画面 ${label}`,type:'counter',category:'SEL_RF_BONUS_END_REG_GROUP',unit:'回',displayOrder:nextOrder(s),inferenceRole:'INCLUDE_SUPPORT',defaultValue:''});}
 for(const [suffix,label] of labels){ensureInput(s,{id:`INP_BONUS_END_ENEN_${suffix}`,name:`炎炎ボーナス終了画面 ${label}`,type:'counter',category:'SEL_RF_BONUS_END_ENEN',unit:'回',displayOrder:nextOrder(s),inferenceRole:'INCLUDE_SUPPORT',defaultValue:''});}
 const commonReason='ボーナス終了時に必ず観測できる通常画面の設定別分布が公開され、初当りFeatureとは別の条件付き情報を持つため補助Featureとして採用する。確定系画面はHard Evidence側へ分離して二重計上しない。';
 addSupport(s,{researchFeatureId:'RF_BONUS_END_REG_GROUP',featureId:'FEAT_BONUS_END_REG_GROUP',adoptionCategory:'INCLUDE_SUPPORT',weight:1,difficultyParticipation:'EXCLUDE',difficultyExclusionReason:DIFF_PENDING,userReason:commonReason,categoryExcludeLabels:['ALL8','RED9','GOLD'],normalizeRoundedCategoryProbabilities:true,numeratorInputId:'INP_BONUS_END_REG_DEFAULT',categoryInputIds:['INP_BONUS_END_REG_WEAK','INP_BONUS_END_REG_STRONG'],denominatorInputIds:['INP_BONUS_END_REG_DEFAULT','INP_BONUS_END_REG_WEAK','INP_BONUS_END_REG_STRONG'],inputTransform:'sum_inputs_to_trials'},'REG/アクセル/灰焰ボーナス終了画面振り分け',commonReason);
 addSupport(s,{researchFeatureId:'RF_BONUS_END_ENEN',featureId:'FEAT_BONUS_END_ENEN',adoptionCategory:'INCLUDE_SUPPORT',weight:1,difficultyParticipation:'EXCLUDE',difficultyExclusionReason:DIFF_PENDING,userReason:commonReason,categoryExcludeLabels:['ALL8','RED9','GOLD'],normalizeRoundedCategoryProbabilities:true,numeratorInputId:'INP_BONUS_END_ENEN_DEFAULT',categoryInputIds:['INP_BONUS_END_ENEN_WEAK','INP_BONUS_END_ENEN_STRONG'],denominatorInputIds:['INP_BONUS_END_ENEN_DEFAULT','INP_BONUS_END_ENEN_WEAK','INP_BONUS_END_ENEN_STRONG'],inputTransform:'sum_inputs_to_trials'},'炎炎ボーナス終了画面振り分け',commonReason);
 write(m,'research-data.json',r);write(m,'selection-data.json',s);
}

// ---------------------------------------------------------------------------
// L_KABANERI_UNATO_KESSEN_XX: recover deterministic setting evidence only.
// Ordinary distributions remain numeric-insufficient.
// ---------------------------------------------------------------------------
{
 const m='L_KABANERI_UNATO_KESSEN_XX', r=read(m,'research-data.json'), s=read(m,'selection-data.json');
 const ev=[
  {researchEvidenceId:'RE_CHAR_BIBA_4PLUS',name:'カバネリボーナス中キャラ紹介・美馬',allowedSettings:['SET_4','SET_5','SET_6'],deniedSettings:['SET_1','SET_2','SET_3']},
  {researchEvidenceId:'RE_PAYOUT_456',name:'456枚OVER',allowedSettings:['SET_4','SET_5','SET_6'],deniedSettings:['SET_1','SET_2','SET_3']},
  {researchEvidenceId:'RE_PAYOUT_666',name:'666枚OVER',allowedSettings:['SET_6'],deniedSettings:['SET_1','SET_2','SET_3','SET_4','SET_5']},
  {researchEvidenceId:'RE_ST_END_6',name:'ST終了画面・無名&菖蒲',allowedSettings:['SET_6'],deniedSettings:['SET_1','SET_2','SET_3','SET_4','SET_5']}
 ];
 for(const e of ev)addById(r.evidenceCandidates,'researchEvidenceId',{...e,factStatus:'verified',sourceRefs:['SRC_SETTING','SRC_1GEKI_SETTING']});
 setCandidate(r,'キャラ紹介','RE_CHAR_BIBA_4PLUS','美馬は設定4以上。女性/男性の通常分布は傾向のみで完全な6設定出現率がないため確率Feature化しない。');
 setCandidate(r,'獲得枚数','RE_PAYOUT_456','456OVER=設定4以上、666OVER=設定6。');
 setCandidate(r,'ST終了画面','RE_ST_END_6','無名&菖蒲=設定6。設定6での出現率は当日総G帯に依存するため単純な設定別multinomialにはしない。');
 for(const e of ev)addSelectionEvidence(s,{...e,evidenceId:e.researchEvidenceId.replace(/^RE_/,'EVI_'),inputId:`INP_EVIDENCE_${e.researchEvidenceId.replace(/^RE_/,'')}`});
 write(m,'research-data.json',r);write(m,'selection-data.json',s);
}

// ---------------------------------------------------------------------------
// L_UMINEKO_2_A1: recover missing public numeric candidates and evaluate them.
// ---------------------------------------------------------------------------
{
 const m='L_UMINEKO_2_A1', r=read(m,'research-data.json'), s=read(m,'selection-data.json');
 const logo=[[29.2,70.8],[25,75],[31.3,68.8],[25,75],[33.3,66.7],[25,75]];
 addById(r.features,'researchFeatureId',{researchFeatureId:'RF_LOGO_FLASH',name:'ステージチェンジ時ロゴ発光（小/大）',factStatus:'verified',candidateModel:'multinomial',trialUnit:'ロゴ発光ありの有効ステージチェンジ1回',observationScope:'ステージチェンジ時',numeratorDefinition:'ロゴ発光小/大の出現回数',denominatorDefinition:'ロゴ発光なしを除外した有効なロゴ発光確認回数',categories:['SMALL','LARGE'],distributionMode:'complete',settingValues:{},settingDistributions:Object.fromEntries(settings.map((x,i)=>[x,{SMALL:logo[i][0]/100,LARGE:logo[i][1]/100}])),sourceRefs:['SRC_1GEKI_SETTING'],crossSourceStatus:'cross_checked',notes:'ロゴ発光なしはサンプル除外。連続演出失敗後の強制発光など無効条件はObservationで除外する。'});
 const truth=[[45.3,40.6,12.5,1.6],[44.5,41,12.5,2],[43,41.4,12.5,3.1],[41.8,41.8,12.5,3.9],[40.6,42.2,12.5,4.7],[34.8,47.6,12.5,5.1]];
 addById(r.features,'researchFeatureId',{researchFeatureId:'RF_CYCLE_CEILING_TRUTH',name:'周期天井到達時・真実ポイント振り分け',factStatus:'verified',candidateModel:'multinomial',trialUnit:'周期天井到達1回',observationScope:'周期天井到達時',numeratorDefinition:'30/50/70/200ptの選択回数',denominatorDefinition:'周期天井に到達してポイントを確認した総回数',categories:['PT30','PT50','PT70','PT200'],distributionMode:'complete',settingValues:{},settingDistributions:Object.fromEntries(settings.map((x,i)=>[x,{PT30:truth[i][0]/100,PT50:truth[i][1]/100,PT70:truth[i][2]/100,PT200:truth[i][3]/100}])),sourceRefs:['SRC_1GEKI_SETTING'],crossSourceStatus:'cross_checked'});
 addById(r.features,'researchFeatureId',{researchFeatureId:'RF_ART_INHERIT_100G',name:'運命分岐モード転落後・引き継ぎ100G選択',factStatus:'verified',candidateModel:'binomial',trialUnit:'ART未突入で引き継ぎランプ点灯を確認した転落1回',observationScope:'運命分岐モード転落時（ART未突入）',numeratorDefinition:'100G継続が選択された回数',denominatorDefinition:'ART未突入で引き継ぎランプ点灯を確認した有効転落回数',settingValues:valsFromPct([12.5,13.3,14.1,14.8,16.4,20.3]),sourceRefs:['SRC_1GEKI_SETTING'],crossSourceStatus:'cross_checked'});
 addById(r.features,'researchFeatureId',{researchFeatureId:'RF_ROLE_1B',name:'1枚役B確率',factStatus:'verified',candidateModel:'binomial',trialUnit:'通常ゲーム',observationScope:'通常時',numeratorDefinition:'1枚役B成立回数',denominatorDefinition:'通常ゲーム',settingValues:valsFromDenoms([102.1,101.6,101.1,100.7,100.5,100.4]),sourceRefs:['SRC_1GEKI_SETTING'],crossSourceStatus:'cross_checked'});
 addById(r.features,'researchFeatureId',{researchFeatureId:'RF_ROLE_1C',name:'1枚役C確率',factStatus:'verified',candidateModel:'binomial',trialUnit:'通常ゲーム',observationScope:'通常時',numeratorDefinition:'1枚役C成立回数',denominatorDefinition:'通常ゲーム',settingValues:valsFromDenoms([114.2,113.8,113.0,112.6,111.8,111.5]),sourceRefs:['SRC_1GEKI_SETTING'],crossSourceStatus:'cross_checked'});
 addById(r.features,'researchFeatureId',{researchFeatureId:'RF_CONFIRM_A',name:'確定役A確率',factStatus:'verified',candidateModel:'binomial',trialUnit:'通常ゲーム',observationScope:'通常時',numeratorDefinition:'確定役A成立回数',denominatorDefinition:'通常ゲーム',settingValues:valsFromDenoms([16384,13107.2,10922.7,9362.3,8192,7281.8]),sourceRefs:['SRC_1GEKI_SETTING'],crossSourceStatus:'cross_checked',notes:'非常に低頻度だが成立1回の尤度差は大きいrare-event候補。'});
 addById(r.features,'researchFeatureId',{researchFeatureId:'RF_ART_COMMON_BELL',name:'ART中共通ベル',factStatus:'verified',candidateModel:'binomial',trialUnit:'ARTゲーム',observationScope:'ART中',numeratorDefinition:'ART中共通ベル成立回数',denominatorDefinition:'ARTゲーム',settingValues:valsFromDenoms([29.4,28.3,26.5,22.6,21.5,21.0]),sourceRefs:['SRC_1GEKI_SETTING'],crossSourceStatus:'cross_checked'});
 const q=[0.3121292023731048,0.3295840028566327,0.3498046875,0.3653846153846154,0.38026286478057475,0.39131449918281574];
 addById(r.features,'researchFeatureId',{researchFeatureId:'RF_SPECIFIC_BONUS_COMPOSITION',name:'ボーナス当選時・特定11種ボーナス構成比',factStatus:'verified',candidateModel:'binomial',trialUnit:'ボーナス初当り1回',observationScope:'ボーナス成立時',numeratorDefinition:'公開11種の特定ボーナスに該当した回数',denominatorDefinition:'ボーナス初当り総回数',settingValues:Object.fromEntries(settings.map((x,i)=>[x,{probability:q[i],rawDisplay:`derived from 1/${[606.8,560.1,512,478.4,448.9,428.3][i]} specific / 1/${[189.4,184.6,179.1,174.8,170.7,167.6][i]} total`,numerator:q[i]*100,denominator:100}])),sourceRefs:['SRC_1GEKI_SETTING'],crossSourceStatus:'derived_from_published_rates',notes:'総ボーナス確率と特定11種合算確率の公開値から、ボーナス成立を条件とした構成比へ変換。総ボーナス回数尤度との積でjoint factorizationとなり、同じ通常Gを二重Binomial化しない。'});
 setCandidate(r,'ロゴ発光','RF_LOGO_FLASH','小/大の完全分布が公開済み。発光なしはサンプル除外。');
 setCandidate(r,'小役/ボーナス重複内訳',['RF_ROLE_1B','RF_ROLE_1C','RF_CONFIRM_A','RF_ART_COMMON_BELL','RF_SPECIFIC_BONUS_COMPOSITION'],'小役確率と特定ボーナス構成の公開数値をResearchへ移管。Selectionで重複を制御する。');
 addCandidate(r,'周期天井到達時・真実ポイント振り分け','RF_CYCLE_CEILING_TRUTH');
 addCandidate(r,'運命分岐モード転落後・引き継ぎ継続G振り分け','RF_ART_INHERIT_100G','ART未突入時かつ引き継ぎランプ点灯時のみ有効。');
 // inputs and selection: observable independent/conditional features are adopted; overlapping weak role bins are explicitly rejected.
 for(const [id,name] of [['INP_LOGO_SMALL','ロゴ発光（小）'],['INP_LOGO_LARGE','ロゴ発光（大）']])ensureInput(s,{id,name,type:'counter',category:'SEL_RF_LOGO_FLASH',unit:'回',displayOrder:nextOrder(s),inferenceRole:'INCLUDE_SUPPORT',defaultValue:''});
 const logoReason='ステージチェンジ時に観測できる小/大の完全分布が公開され、奇偶情報を持つため補助Featureとして採用する。発光なしは分母から除外する。';
 addSupport(s,{researchFeatureId:'RF_LOGO_FLASH',featureId:'FEAT_LOGO_FLASH',adoptionCategory:'INCLUDE_SUPPORT',weight:1,difficultyParticipation:'EXCLUDE',difficultyExclusionReason:DIFF_PENDING,userReason:logoReason,numeratorInputId:'INP_LOGO_SMALL',categoryInputIds:['INP_LOGO_LARGE'],denominatorInputIds:['INP_LOGO_SMALL','INP_LOGO_LARGE'],inputTransform:'sum_inputs_to_trials'},'ステージチェンジ時ロゴ発光',logoReason);
 for(const [id,name] of [['INP_TRUTH_30','30pt'],['INP_TRUTH_50','50pt'],['INP_TRUTH_70','70pt'],['INP_TRUTH_200','200pt']])ensureInput(s,{id,name:`周期天井 真実ポイント ${name}`,type:'counter',category:'SEL_RF_CYCLE_CEILING_TRUTH',unit:'回',displayOrder:nextOrder(s),inferenceRole:'INCLUDE_SUPPORT',defaultValue:''});
 const truthReason='周期天井到達時に選択結果を直接観測でき、完全な設定別分布が公開されているため補助Featureとして採用する。';
 addSupport(s,{researchFeatureId:'RF_CYCLE_CEILING_TRUTH',featureId:'FEAT_CYCLE_CEILING_TRUTH',adoptionCategory:'INCLUDE_SUPPORT',weight:1,difficultyParticipation:'EXCLUDE',difficultyExclusionReason:DIFF_PENDING,userReason:truthReason,numeratorInputId:'INP_TRUTH_30',categoryInputIds:['INP_TRUTH_50','INP_TRUTH_70','INP_TRUTH_200'],denominatorInputIds:['INP_TRUTH_30','INP_TRUTH_50','INP_TRUTH_70','INP_TRUTH_200'],inputTransform:'sum_inputs_to_trials'},'周期天井到達時・真実ポイント振り分け',truthReason);
 ensureInput(s,{id:'INP_INHERIT_100G_COUNT',name:'引き継ぎ100G選択回数',type:'counter',category:'SEL_RF_ART_INHERIT_100G',unit:'回',displayOrder:nextOrder(s),inferenceRole:'INCLUDE_SUPPORT',defaultValue:''});
 ensureInput(s,{id:'INP_INHERIT_TRIALS',name:'ART未突入・引き継ぎランプ点灯の有効転落回数',type:'counter',category:'SEL_RF_ART_INHERIT_100G',unit:'回',displayOrder:nextOrder(s),inferenceRole:'INCLUDE_SUPPORT',defaultValue:''});
 const inhReason='ART未突入かつ引き継ぎランプ点灯という観測条件を再現でき、50G/100Gの設定別振り分けが公開されているため補助Featureとして採用する。';
 addSupport(s,{researchFeatureId:'RF_ART_INHERIT_100G',featureId:'FEAT_ART_INHERIT_100G',adoptionCategory:'INCLUDE_SUPPORT',weight:1,difficultyParticipation:'EXCLUDE',difficultyExclusionReason:DIFF_PENDING,userReason:inhReason,numeratorInputId:'INP_INHERIT_100G_COUNT',denominatorInputId:'INP_INHERIT_TRIALS'},'引き継ぎ100G選択率',inhReason);
 const roleWeak='通常ゲームを共通分母とする小役群を独立Binomialで複数採用すると同じゲーム情報を重ねて尤度を強める。設定差も小さいためResearchには保持するが単独Featureとしては不採用とする。';
 addExclude(s,'RF_ROLE_1B','FEAT_ROLE_1B','1枚役B確率',roleWeak);
 addExclude(s,'RF_ROLE_1C','FEAT_ROLE_1C','1枚役C確率',roleWeak);
 ensureInput(s,{id:'INP_CONFIRM_A_COUNT',name:'確定役A回数',type:'counter',category:'SEL_RF_CONFIRM_A',unit:'回',displayOrder:nextOrder(s),inferenceRole:'INCLUDE_SUPPORT',defaultValue:''});
 const caReason='通常時の発生率は極めて低いが設定1と6で2倍超の差があり、1回成立時の尤度情報が大きいrare-eventとして採用する。';
 addSupport(s,{researchFeatureId:'RF_CONFIRM_A',featureId:'FEAT_CONFIRM_A',adoptionCategory:'INCLUDE_SUPPORT',weight:1,difficultyParticipation:'EXCLUDE',difficultyExclusionReason:DIFF_PENDING,userReason:caReason,numeratorInputId:'INP_CONFIRM_A_COUNT',denominatorInputId:'INP_NORMAL_GAMES'},'確定役A確率',caReason);
 // Replace weaker ART miss by stronger common bell to avoid same-ART-game double counting.
 const miss=s.features.find(x=>x.researchFeatureId==='RF_ART_MISS');
 if(miss){Object.assign(miss,{adoptionCategory:'EXCLUDE',difficultyParticipation:'EXCLUDE',difficultyExclusionReason:DIFF_EXCL,userFacingReason:'ART中共通ベルと同一ARTゲームを分母とする排他的事象で、独立Binomialとして同時採用すると二重計上になる。設定差がより大きい共通ベルを代表Featureとして採用する。'});delete miss.userReason;}
 s.selectionSummaryContract.selected=s.selectionSummaryContract.selected.filter(x=>x.name!=='ART中ハズレ');
 pushSummary(s,'rejected','ART中ハズレ','ART中共通ベルと同一ARTゲームを分母とする排他的事象で、独立Binomialとして同時採用すると二重計上になる。設定差がより大きい共通ベルを代表Featureとして採用する。');
 ensureInput(s,{id:'INP_ART_COMMON_BELL_COUNT',name:'ART中共通ベル回数',type:'counter',category:'SEL_RF_ART_COMMON_BELL',unit:'回',displayOrder:nextOrder(s),inferenceRole:'INCLUDE_SUPPORT',defaultValue:''});
 const bellReason='ART中ゲームを再現可能な分母とし、既存ハズレより設定差が大きいため代表Featureとして採用する。ハズレは二重計上防止で不採用へ移す。';
 addSupport(s,{researchFeatureId:'RF_ART_COMMON_BELL',featureId:'FEAT_ART_COMMON_BELL',adoptionCategory:'INCLUDE_SUPPORT',weight:1,difficultyParticipation:'EXCLUDE',difficultyExclusionReason:DIFF_PENDING,userReason:bellReason,numeratorInputId:'INP_ART_COMMON_BELL_COUNT',denominatorInputId:'INP_ART_MISS_TRIALS'},'ART中共通ベル',bellReason);
 ensureInput(s,{id:'INP_SPECIFIC_BONUS_COUNT',name:'特定11種ボーナス回数',type:'counter',category:'SEL_RF_SPECIFIC_BONUS_COMPOSITION',unit:'回',displayOrder:nextOrder(s),inferenceRole:'INCLUDE_SUPPORT',defaultValue:''});
 const spReason='総ボーナス回数を分母とした条件付き構成比として評価することで、通常ゲーム上の総ボーナス尤度と二重計上せず、特定ボーナス内訳の追加情報だけを利用できる。';
 addSupport(s,{researchFeatureId:'RF_SPECIFIC_BONUS_COMPOSITION',featureId:'FEAT_SPECIFIC_BONUS_COMPOSITION',adoptionCategory:'INCLUDE_SUPPORT',weight:1,difficultyParticipation:'EXCLUDE',difficultyExclusionReason:DIFF_PENDING,userReason:spReason,numeratorInputId:'INP_SPECIFIC_BONUS_COUNT',denominatorInputId:'INP_BONUS_INITIAL_COUNT'},'特定11種ボーナス構成比',spReason);
 write(m,'research-data.json',r);write(m,'selection-data.json',s);
}

// ---------------------------------------------------------------------------
// L_AKUDAMA_DRIVE_TP: no newly public complete numeric setting feature found.
// Make the non-setting / numeric-insufficient classification explicit in Discovery notes.
// ---------------------------------------------------------------------------
{
 const m='L_AKUDAMA_DRIVE_TP', r=read(m,'research-data.json');
 for(const c of r.discoveryInventory){
   if(c.name.includes('CZ終了')||c.name.includes('ボイス')) c.note='再監査: CZ終了時ボイスはCZモード示唆であり設定差Featureではない。';
   if(c.name.includes('ST終了')) c.note='再監査: 通常パターンは奇偶/高設定示唆だが完全な設定別出現率は未公表。PUSH変化なし=設定4以上のHard Evidenceは既存RE_ST_NO_CHANGE_4PLUSで収載済み。';
 }
 write(m,'research-data.json',r);
}

console.log('Next10 isolated research-universe repair applied.');
