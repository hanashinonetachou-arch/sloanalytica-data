#!/usr/bin/env node
import fs from 'node:fs';

const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const write = (p, v) => fs.writeFileSync(p, JSON.stringify(v, null, 2) + '\n');
const prob = d => 1 / d;
const byRid = (arr, id) => arr.find(x => x.researchFeatureId === id);
const upsertBy = (arr, key, obj) => { const i=arr.findIndex(x=>x[key]===obj[key]); if(i>=0) arr[i]=obj; else arr.push(obj); };

function rebuildSummary(research, selection) {
  const names = new Map((research.features??[]).map(f=>[f.researchFeatureId,f.name]));
  const selected = (selection.features??[]).filter(f=>String(f.adoptionCategory).startsWith('INCLUDE'));
  const rejected = (selection.features??[]).filter(f=>f.adoptionCategory==='EXCLUDE');
  selection.selectionSummaryContract = {
    schemaVersion:'selection-summary-v1',
    evaluatedCount:(selection.features??[]).length,
    selectedCount:selected.length,
    rejectedCount:rejected.length,
    selected:selected.map(f=>({featureId:f.featureId,name:names.get(f.researchFeatureId)??f.featureId,reason:f.userReason??'採用'})),
    rejected:rejected.map(f=>({featureId:f.featureId,name:names.get(f.researchFeatureId)??f.featureId,reason:f.userFacingReason??f.rejectionReason??'不採用'}))
  };
}
function setExcluded(s,rid,reason){
  const f=byRid(s.features,rid); if(!f) throw new Error(`missing ${rid}`);
  Object.assign(f,{adoptionCategory:'EXCLUDE',difficultyParticipation:'EXCLUDE',difficultyExclusionReason:'推測計算に単独Featureとして採用しないためDifficultyにも参加させない。',userFacingReason:reason});
  for(const k of ['userReason','weight','numeratorInputId','denominatorInputId','denominatorInputIds','denominatorAdjustments','categoryInputIds','residualCategoryLabel','inputTransform']) delete f[k];
}
function markInput(s,id,role='INCLUDE_SUPPORT',category){ const x=s.inputs.find(i=>i.id===id); if(!x) throw new Error(`missing input ${id}`); x.inferenceRole=role; if(category)x.category=category; }
function multinomial({rid,name,trialUnit,scope,denominator,categories,distributions,sourceRefs,notes}){
  return {researchFeatureId:rid,name,factStatus:'verified',candidateModel:'multinomial',trialUnit,observationScope:scope,numeratorDefinition:`${categories.join(' / ')} の各出現回数`,denominatorDefinition:denominator,categories,distributionMode:'complete',settingValues:{},settingDistributions:distributions,sourceRefs,crossSourceStatus:sourceRefs.length>1?'cross_checked':'single_source_major',...(notes?{notes}:{})};
}

// ===== Triple Crown Seven =====
{
  const dir='research/LB_TRIPLE_CROWN_SEVEN_FG', rp=`${dir}/research-data.json`, sp=`${dir}/selection-data.json`;
  const r=read(rp), s=read(sp);
  const bb=byRid(r.features,'RF_BB_INITIAL'), rb=byRid(r.features,'RF_RB_INITIAL'), ch=byRid(r.features,'RF_CHERRY'), pl=byRid(r.features,'RF_PLUM');
  const settings=Object.keys(bb.settingValues);

  const bonusDist={}, roleDist={};
  for(const set of settings){
    const pBB=bb.settingValues[set].probability,pRB=rb.settingValues[set].probability,pC=ch.settingValues[set].probability,pP=pl.settingValues[set].probability;
    bonusDist[set]={BB:pBB,RB:pRB,NO_BONUS:1-pBB-pRB};
    roleDist[set]={CHERRY:pC,PLUM:pP,OTHER:1-pC-pP};
  }
  upsertBy(r.features,'researchFeatureId',multinomial({rid:'RF_BONUS_OUTCOME',name:'BB・RB出現構成',trialUnit:'通常ゲーム1G',scope:'通常時',denominator:'通常ゲーム',categories:['BB','RB','NO_BONUS'],distributions:bonusDist,sourceRefs:['SRC_SETTING'],notes:'BB/RBを別々の独立Binomialにせず、通常1Gの排他的結果として一体評価するderived Research候補。'}));
  upsertBy(r.features,'researchFeatureId',multinomial({rid:'RF_SMALL_ROLE_COMPOSITION',name:'通常時小役構成（チェリー・プラム・その他）',trialUnit:'通常ゲーム1G',scope:'通常時',denominator:'通常ゲーム',categories:['CHERRY','PLUM','OTHER'],distributions:roleDist,sourceRefs:['SRC_SETTING'],notes:'チェリー/プラムを同じ通常1G上の排他的カテゴリとして一体評価するderived Research候補。'}));

  const newRows={
    RF_SPECIFIC_BONUS_SINGLE_BB:['単独BB実質出現率',{SET_1:5957.8,SET_2:5461.3,SET_5:4096.0,SET_6:2849.4}],
    RF_SPECIFIC_BONUS_SINGLE_RB:['単独RB実質出現率',{SET_1:13107.2,SET_2:13107.2,SET_5:10922.7,SET_6:8192.0}],
    RF_SPECIFIC_BONUS_REPLAY_BB:['リプレイ+BB実質出現率',{SET_1:293.9,SET_2:291.3,SET_5:274.2,SET_6:257.0}],
    RF_SPECIFIC_BONUS_REPLAY_RB:['リプレイ+RB実質出現率',{SET_1:668.7,SET_2:668.7,SET_5:612.5,SET_6:560.1}],
    RF_SPECIFIC_BONUS_PLUM_BB:['プラム+BB実質出現率',{SET_1:6553.6,SET_2:5957.8,SET_5:4369.1,SET_6:2978.9}],
    RF_SPECIFIC_BONUS_PLUM_RB:['プラム+RB実質出現率',{SET_1:16384.0,SET_2:13107.2,SET_5:10922.7,SET_6:8192.0}]
  };
  for(const [rid,[name,ds]] of Object.entries(newRows)){
    const settingValues=Object.fromEntries(Object.entries(ds).map(([set,d])=>[set,{probability:prob(d),rawDisplay:`1/${d}`} ]));
    upsertBy(r.features,'researchFeatureId',{researchFeatureId:rid,name,factStatus:'verified',candidateModel:'binomial',trialUnit:'通常ゲーム',observationScope:'通常時',numeratorDefinition:name.replace('実質出現率','')+'回数',denominatorDefinition:'通常ゲーム',settingValues,sourceRefs:['SRC_PWORLD','SRC_HAZUSE'],crossSourceStatus:'cross_checked',notes:'公開されたボーナス契機別実質出現率。単独Featureではなく、ボーナス成立後の条件付き構成への分解をSelectionで評価する。'});
  }
  const cherryBB=byRid(r.features,'RF_SPECIFIC_BONUS_CHERRY_BB'), cherryRB=byRid(r.features,'RF_SPECIFIC_BONUS_CHERRY_RB');
  const sourceDenoms={
    SINGLE_BB:newRows.RF_SPECIFIC_BONUS_SINGLE_BB[1],SINGLE_RB:newRows.RF_SPECIFIC_BONUS_SINGLE_RB[1],
    REPLAY_BB:newRows.RF_SPECIFIC_BONUS_REPLAY_BB[1],REPLAY_RB:newRows.RF_SPECIFIC_BONUS_REPLAY_RB[1],
    CHERRY_BB:Object.fromEntries(settings.map(set=>[set,1/cherryBB.settingValues[set].probability])),CHERRY_RB:Object.fromEntries(settings.map(set=>[set,1/cherryRB.settingValues[set].probability])),
    PLUM_BB:newRows.RF_SPECIFIC_BONUS_PLUM_BB[1],PLUM_RB:newRows.RF_SPECIFIC_BONUS_PLUM_RB[1]
  };
  const triggerDist={};
  for(const set of settings){
    const raw=Object.fromEntries(Object.entries(sourceDenoms).map(([cat,ds])=>[cat,1/ds[set]]));
    const total=Object.values(raw).reduce((a,b)=>a+b,0);
    triggerDist[set]=Object.fromEntries(Object.entries(raw).map(([cat,v])=>[cat,v/total]));
  }
  const triggerResearch=multinomial({rid:'RF_BONUS_TRIGGER_COMPOSITION',name:'ボーナス当選契機の構成',trialUnit:'ボーナス成立1回',scope:'通常時ボーナス成立時',denominator:'BB+RBの総成立回数',categories:['SINGLE_BB','SINGLE_RB','REPLAY_BB','REPLAY_RB','CHERRY_BB','CHERRY_RB','PLUM_BB','PLUM_RB'],distributions:triggerDist,sourceRefs:['SRC_PWORLD','SRC_HAZUSE'],notes:'公開8カテゴリの実質出現率合計が各設定のBB/RB総確率と丸め誤差内で一致するため、ボーナス成立を条件とする構成比に正規化して評価する。公開原値はcomponentRateDenominatorsに保持。'});
  triggerResearch.componentRateDenominators=Object.fromEntries(settings.map(set=>[set,Object.fromEntries(Object.entries(sourceDenoms).map(([cat,ds])=>[cat,ds[set]]))]));
  upsertBy(r.features,'researchFeatureId',triggerResearch);

  // Existing single-candidate rows are retained but represented by joint/conditional models.
  setExcluded(s,'RF_BB_INITIAL','BBの設定差は、BB/RB/非当選を通常1Gの排他的結果として扱う「ボーナス出現構成」に統合して利用するため、独立Binomialとしては不採用とする。情報自体は推測から捨てていない。');
  setExcluded(s,'RF_RB_INITIAL','RBの設定差は、BB/RB/非当選を通常1Gの排他的結果として扱う「ボーナス出現構成」に統合して利用するため、独立Binomialとしては不採用とする。情報自体は推測から捨てていない。');
  setExcluded(s,'RF_CHERRY','チェリーの設定差は、チェリー/プラム/その他を通常1Gの排他的結果として扱う小役Multinomialへ統合して利用するため、独立Binomialとしては不採用とする。');
  setExcluded(s,'RF_PLUM','プラムには設定1約1/64.63～設定6約1/55.54の設定差がある。チェリーと同じ通常1G上の排他的カテゴリなので、チェリー/プラム/その他のMultinomialへ統合して情報を利用し、プラム単独Binomialだけを不採用とする。');
  setExcluded(s,'RF_SPECIFIC_BONUS_CHERRY_BB','チェリー+BBの設定差は、総ボーナス発生率とは分離した「ボーナス当選契機の構成」に統合して利用する。通常G分母の単独Binomialでは親のボーナス/小役情報を再利用するため、単独Featureとしては不採用とする。');
  setExcluded(s,'RF_SPECIFIC_BONUS_CHERRY_RB','チェリー+RBの設定差は、総ボーナス発生率とは分離した「ボーナス当選契機の構成」に統合して利用する。通常G分母の単独Binomialでは親のボーナス/小役情報を再利用するため、単独Featureとしては不採用とする。');
  for(const rid of Object.keys(newRows)) upsertBy(s.features,'researchFeatureId',{researchFeatureId:rid,featureId:rid.replace(/^RF_/,'FEAT_'),adoptionCategory:'EXCLUDE',difficultyParticipation:'EXCLUDE',difficultyExclusionReason:'推測計算に単独Featureとして採用しないためDifficultyにも参加させない。',userFacingReason:`${byRid(r.features,rid).name}の設定差は「ボーナス当選契機の構成」に条件付き統合して利用するため、通常ゲームを分母とする単独Featureとしては不採用とする。`});
  byRid(s.features,'RF_BT_REPLAY_BB').userFacingReason='BT中リプレイ+BB in BBには設定差があるが、設定1↔6でも80%識別目安が約111,474 BTゲーム、最も厳しい設定1↔2のJS情報量は約3.38e-8/trial（95%比較目安約28,374,158 trial）と極めて小さい。通常の1日実戦で設定推測結果へ実質的な追加寄与を得にくいため不採用とする。';

  upsertBy(s.features,'researchFeatureId',{researchFeatureId:'RF_BONUS_OUTCOME',featureId:'FEAT_BONUS_OUTCOME',adoptionCategory:'INCLUDE_PRIMARY',weight:1,numeratorInputId:'INP_BB_INITIAL_COUNT',categoryInputIds:['INP_RB_INITIAL_COUNT'],denominatorInputId:'INP_NORMAL_GAMES',residualCategoryLabel:'NO_BONUS',difficultyParticipation:'EXCLUDE',difficultyExclusionReason:'今回の実機ReopenではSelection整合を先に確定し、Difficulty再計算はObservation再同期後に行う。',userReason:'BB・RBを別々の独立Binomialにせず、通常1GごとのBB/RB/非当選という排他的な結果として一体評価する。'});
  upsertBy(s.features,'researchFeatureId',{researchFeatureId:'RF_SMALL_ROLE_COMPOSITION',featureId:'FEAT_SMALL_ROLE_COMPOSITION',adoptionCategory:'INCLUDE_SUPPORT',weight:1,numeratorInputId:'INP_CHERRY_COUNT',categoryInputIds:['INP_PLUM_COUNT'],denominatorInputId:'INP_NORMAL_GAMES',residualCategoryLabel:'OTHER',difficultyParticipation:'EXCLUDE',difficultyExclusionReason:'今回の実機ReopenではSelection整合を先に確定し、Difficulty再計算はObservation再同期後に行う。',userReason:'チェリーとプラムはいずれも公開設定差があり、同じ通常1G上の排他的カテゴリとしてMultinomialへ統合すれば非成立情報の二重計上を避けながら両方の情報を利用できる。'});

  const triggerInputs=[['INP_TRIGGER_SINGLE_BB','単独BB',26],['INP_TRIGGER_SINGLE_RB','単独RB',27],['INP_TRIGGER_REPLAY_BB','リプレイ+BB',28],['INP_TRIGGER_REPLAY_RB','リプレイ+RB',29],['INP_TRIGGER_CHERRY_BB','チェリー+BB',30],['INP_TRIGGER_CHERRY_RB','チェリー+RB',31],['INP_TRIGGER_PLUM_BB','プラム+BB',32]];
  for(const [id,name,order] of triggerInputs) upsertBy(s.inputs,'id',{id,name,type:'counter',category:'SEL_RF_BONUS_TRIGGER_COMPOSITION',unit:'回',displayOrder:order,inferenceRole:'INCLUDE_SUPPORT',defaultValue:''});
  upsertBy(s.features,'researchFeatureId',{researchFeatureId:'RF_BONUS_TRIGGER_COMPOSITION',featureId:'FEAT_BONUS_TRIGGER_COMPOSITION',adoptionCategory:'INCLUDE_SUPPORT',weight:1,numeratorInputId:'INP_TRIGGER_SINGLE_BB',denominatorInputId:'INP_BB_INITIAL_COUNT',denominatorAdjustments:[{inputId:'INP_RB_INITIAL_COUNT',multiplier:1}],categoryInputIds:['INP_TRIGGER_SINGLE_RB','INP_TRIGGER_REPLAY_BB','INP_TRIGGER_REPLAY_RB','INP_TRIGGER_CHERRY_BB','INP_TRIGGER_CHERRY_RB','INP_TRIGGER_PLUM_BB'],residualCategoryLabel:'PLUM_RB',difficultyParticipation:'EXCLUDE',difficultyExclusionReason:'ボーナス成立回数を条件分母とする構成Featureのため、通常ゲーム基準Difficultyへ重ねて参加させない。',userReason:'公開された単独/リプレイ/チェリー/プラム×BB/RBの8カテゴリ実質出現率は、各設定で合計がBB/RB総確率と一致する。総ボーナス発生率とは分離し、ボーナス成立後の契機構成として条件付き評価することで追加情報だけを安全に利用する。'});
  markInput(s,'INP_BB_INITIAL_COUNT','INCLUDE_PRIMARY'); markInput(s,'INP_RB_INITIAL_COUNT','INCLUDE_PRIMARY');
  markInput(s,'INP_CHERRY_COUNT','INCLUDE_SUPPORT','SEL_RF_SMALL_ROLE_COMPOSITION'); markInput(s,'INP_PLUM_COUNT','INCLUDE_SUPPORT','SEL_RF_SMALL_ROLE_COMPOSITION');

  const rbg=byRid(r.features,'RF_RB_BGM');
  rbg.trialUnit='BB後100G以内の連チャン条件を満たすRB入賞1回'; rbg.observationScope='BB後100G以内の連チャン中のRB入賞時'; rbg.denominatorDefinition='BB後100G以内の連チャン条件を満たすRB入賞回数（途中にRBを挟んでも条件継続中は対象）'; rbg.notes='安里屋ユンタ選択率はBB後100G以内の連チャン条件を満たすRBのみを母数とする。';
  rebuildSummary(r,s); write(rp,r); write(sp,s);
}

// ===== Umineko 2 =====
{
  const dir='research/L_UMINEKO_2_A1',rp=`${dir}/research-data.json`,sp=`${dir}/selection-data.json`; const r=read(rp),s=read(sp);
  const miss=byRid(r.features,'RF_ART_MISS'),bell=byRid(r.features,'RF_ART_COMMON_BELL'); const settings=Object.keys(bell.settingValues),dists={};
  for(const set of settings){const m=miss.settingValues[set].probability,b=bell.settingValues[set].probability;dists[set]={MISS:m,COMMON_BELL:b,OTHER:1-m-b};}
  upsertBy(r.features,'researchFeatureId',multinomial({rid:'RF_ART_ROLE_COMPOSITION',name:'ART中役構成（ハズレ・共通ベル・その他）',trialUnit:'ARTゲーム1G',scope:'ART中',denominator:'ARTゲーム',categories:['MISS','COMMON_BELL','OTHER'],distributions:dists,sourceRefs:[...new Set([...(miss.sourceRefs??[]),...(bell.sourceRefs??[])])],notes:'ART中ハズレと共通ベルを同じART 1G上の排他的カテゴリとして一体評価するderived Research候補。'}));
  setExcluded(s,'RF_ART_MISS','ART中ハズレには設定差があるため情報自体は捨てない。ART中共通ベルと同じART 1G上の排他的カテゴリなので、ハズレ/共通ベル/その他のMultinomialへ統合して利用し、ハズレ単独Binomialだけを不採用とする。');
  setExcluded(s,'RF_ART_COMMON_BELL','ART中共通ベルの設定差は、ART中ハズレと合わせたハズレ/共通ベル/その他のMultinomialへ統合して利用するため、単独Binomialとしては不採用とする。');
  setExcluded(s,'RF_ROLE_1B','1枚役Bには設定差があるが、設定1↔6の80%識別目安が約2,606,522通常ゲーム、最も厳しい設定5↔6のJS情報量は約1.25e-9/trialと極めて小さい。通常の実戦ゲーム数では設定推測への追加寄与が実質的に得られないため不採用とする。');
  setExcluded(s,'RF_ROLE_1C','1枚役Cには設定差があるが、設定1↔6の80%識別目安が約1,432,045通常ゲーム、最も厳しい設定5↔6のJS情報量は約8.16e-9/trialと極めて小さい。通常の実戦ゲーム数では設定推測への追加寄与が実質的に得られないため不採用とする。');
  upsertBy(s.features,'researchFeatureId',{researchFeatureId:'RF_ART_ROLE_COMPOSITION',featureId:'FEAT_ART_ROLE_COMPOSITION',adoptionCategory:'INCLUDE_SUPPORT',weight:1,numeratorInputId:'INP_ART_MISS_COUNT',categoryInputIds:['INP_ART_COMMON_BELL_COUNT'],denominatorInputId:'INP_ART_MISS_TRIALS',residualCategoryLabel:'OTHER',difficultyParticipation:'EXCLUDE',difficultyExclusionReason:'今回の実機ReopenではSelection整合を先に確定し、Difficulty再計算はObservation再同期後に行う。',userReason:'ART中ハズレと共通ベルは同じART 1Gから生じる排他的カテゴリのため、独立Binomialではなくハズレ/共通ベル/その他のMultinomialとして一体評価する。共通ベル単独より追加の識別情報を安全に取り込める。'});
  for(const id of ['INP_ART_MISS_COUNT','INP_ART_MISS_TRIALS','INP_ART_COMMON_BELL_COUNT']) markInput(s,id,'INCLUDE_SUPPORT','SEL_RF_ART_ROLE_COMPOSITION');
  rebuildSummary(r,s); write(rp,r); write(sp,s);
}

console.log('Applied v6.14 joint/conditional Selection repair for Triple Crown and Umineko2.');
