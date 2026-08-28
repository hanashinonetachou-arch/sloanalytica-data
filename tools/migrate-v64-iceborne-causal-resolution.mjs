#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const MACHINE_ID='S_MHW_ICEBORNE_ZF';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');
const arr=v=>Array.isArray(v)?v:[];

export function migrate(root=process.cwd(),{apply=false}={}){
  const base=path.join(root,'research',MACHINE_ID);
  const researchPath=path.join(base,'research-data.json');
  const selectionPath=path.join(base,'selection-data.json');
  const observationPath=path.join(base,'machine-observation-data.json');
  const research=read(researchPath);
  const selection=read(selectionPath);
  const observation=read(observationPath);
  if(observation.schemaVersion!=='machine-observation-data-v2') throw new Error('Iceborne Observation v2 is required');
  const rf=id=>arr(research.features).find(f=>f.researchFeatureId===id);
  const sf=id=>arr(selection.features).find(f=>f.researchFeatureId===id);
  const total=rf('RF_CZ_TOTAL');
  const quest=rf('RF_CZ_QUEST');
  const airou=rf('RF_CZ_AIROU');
  const seliana=rf('RF_CZ_SELIANA');
  if(!total||!quest||!airou||!seliana) throw new Error('CZ total and component Research features are required');

  const settings=research.machine.settings;
  const dists={};
  const exposure={};
  for(const setting of settings){
    const q=Number(quest.settingValues?.[setting]?.probability);
    const a=Number(airou.settingValues?.[setting]?.probability);
    const s=Number(seliana.settingValues?.[setting]?.probability);
    const t=Number(total.settingValues?.[setting]?.probability);
    if(![q,a,s,t].every(Number.isFinite)) throw new Error(`${setting}: incomplete CZ probabilities`);
    const sum=q+a+s;
    if(!(sum>0)) throw new Error(`${setting}: invalid CZ component sum`);
    dists[setting]={QUEST:q/sum,AIROU:a/sum,SELIANA:s/sum};
    exposure[setting]=t;
  }

  const derived={
    researchFeatureId:'RF_CZ_TYPE_COMPOSITION',
    name:'CZ種類構成（クエスト・アイルーBINGO・セリエナ防衛戦）',
    factStatus:'verified',candidateModel:'multinomial',trialUnit:'CZ初当り1回',observationScope:'通常ゲーム中のCZ初当り',
    numeratorDefinition:'QUEST・AIROU・SELIANAの各CZ回数',denominatorDefinition:'CZ種類を判別したCZ初当り回数',
    settingValues:{},categories:['QUEST','AIROU','SELIANA'],settingDistributions:dists,distributionMode:'explicit_complete',
    sourceRefs:['SRC_NANA'],crossSourceStatus:'derived_from_verified_components',
    notes:'公開されているCZ種類別確率を各設定内で正規化した条件付き構成。CZ合算Binomial×本MultinomialはCZ種類別の完全Multinomialと同値で、公開値の丸め差だけを正規化する。'
  };
  const ri=research.features.findIndex(f=>f.researchFeatureId==='RF_CZ_TYPE_COMPOSITION');
  if(ri>=0) research.features[ri]=derived;
  else {
    const ti=research.features.findIndex(f=>f.researchFeatureId==='RF_CZ_TOTAL');
    research.features.splice(ti>=0?ti+1:research.features.length,0,derived);
  }
  research.machine.machineDataVersion='0.1.3';

  selection.machineDataVersion='0.1.3';
  selection.inputs??=[];
  const upsertInput=input=>{
    const i=selection.inputs.findIndex(x=>x.id===input.id);
    if(i>=0) selection.inputs[i]=input; else selection.inputs.push(input);
  };
  upsertInput({id:'INP_CZ_QUEST_COUNT',name:'クエスト',category:'CZ_TYPE',type:'counter',unit:'回',displayOrder:20,inferenceRole:'INCLUDE_SUPPORT',observationScope:'SELF_PLAY',defaultValue:null,uiQuickAdd:1});
  upsertInput({id:'INP_CZ_AIROU_COUNT',name:'アイルーBINGO',category:'CZ_TYPE',type:'counter',unit:'回',displayOrder:21,inferenceRole:'INCLUDE_SUPPORT',observationScope:'SELF_PLAY',defaultValue:null,uiQuickAdd:1});
  upsertInput({id:'INP_CZ_SELIANA_COUNT',name:'セリエナ防衛戦',category:'CZ_TYPE',type:'counter',unit:'回',displayOrder:22,inferenceRole:'INCLUDE_SUPPORT',observationScope:'SELF_PLAY',defaultValue:null,uiQuickAdd:1});
  selection.uiCategoryLabels??={};
  selection.uiCategoryLabels.CZ_TYPE='CZ種類';

  const resetExclude=(id,reason)=>{
    const f=sf(id);
    if(!f) throw new Error(`${id}: Selection feature missing`);
    const researchFeatureId=f.researchFeatureId, featureId=f.featureId;
    for(const k of Object.keys(f)) delete f[k];
    Object.assign(f,{researchFeatureId,featureId,adoptionCategory:'EXCLUDE',userFacingReason:reason});
  };

  resetExclude('RF_AT_INITIAL','AT初当りには設定差がありますが、採用済みCZ合算と同じ通常ゲームから生じる関連観測です。CZ合算とAT初当りを同時利用するjoint likelihood contractを現Engineで定義していないため、現版ではCZ合算を代表指標としてAT初当りは推測計算に使用しません。');
  for(const [id,label] of [['RF_CZ_QUEST','クエスト'],['RF_CZ_AIROU','アイルーBINGO'],['RF_CZ_SELIANA','セリエナ防衛戦']]){
    resetExclude(id,`${label}の通常G基準単独確率は、CZ合算の発生率と新設したCZ種類構成へ分解して評価します。単独Binomialでは使用しません。`);
  }
  resetExclude('RF_HIGH_FALL','高確中の状態転落率には設定差がありますが、通常/高確を実戦中に確実に識別して転落抽選の対象回数を数えられるかが未解決です。Observation条件が確定するまで推測計算に使用しません。');
  for(const id of ['RF_NORMAL_WEAK_CZ','RF_NORMAL_STRONG_CZ','RF_HIGH_WEAK_CZ','RF_HIGH_STRONG_CZ']){
    resetExclude(id,'状態別レア役からのCZ結果には設定差がありますが、通常/高確の実戦識別条件が未解決です。またCZ合算と同時利用する条件付きjoint likelihood contractも現Engineで定義していないため、現版では推測計算に使用しません。');
  }
  resetExclude('RF_AT_DIRECT','AT直撃はAT初当りの部分集合で、設定差は大きい一方で設定1でも約1/6万と低頻度です。親となるAT初当りを採用していない現構成でも、CZ合算と経路別に結合する尤度契約を定義していないため数値Featureには使用しません。特殊な告知契機による設定下限はEvidenceとして別に扱います。');
  resetExclude('RF_LONG_FREEZE','ロングフリーズは約1/17万～1/18万と極端に低頻度で、設定間の確率差もごく小さいため終日実戦の数値Featureとして識別力がありません。特殊な告知契機による設定下限はEvidenceとして別に扱います。');

  let comp=sf('RF_CZ_TYPE_COMPOSITION');
  if(!comp){
    comp={researchFeatureId:'RF_CZ_TYPE_COMPOSITION',featureId:'FEAT_CZ_TYPE_COMPOSITION'};
    const totalIndex=selection.features.findIndex(f=>f.researchFeatureId==='RF_CZ_TOTAL');
    selection.features.splice(totalIndex>=0?totalIndex+1:selection.features.length,0,comp);
  }
  for(const k of Object.keys(comp)) delete comp[k];
  Object.assign(comp,{
    researchFeatureId:'RF_CZ_TYPE_COMPOSITION',featureId:'FEAT_CZ_TYPE_COMPOSITION',adoptionCategory:'INCLUDE_SUPPORT',
    numeratorInputId:'INP_CZ_QUEST_COUNT',categoryInputIds:['INP_CZ_AIROU_COUNT','INP_CZ_SELIANA_COUNT'],inputTransform:'sum_inputs_to_trials',
    minimumSample:1,sampleRecommendation:30,weight:1,displayFormat:'percent',
    difficultyExposure:{mode:'setting_rate',trialsPerGameBySetting:exposure,quality:'DERIVED',basisId:'SELF_NORMAL_PLAY_GAMES'},difficultyParticipation:'INCLUDE',
    userReason:'CZ合算の発生率に加え、発生したCZがクエスト・アイルーBINGO・セリエナ防衛戦のどれだったかを条件付き構成として評価します。合算率との積は種類別CZの完全な確率分解になるため、同じCZを二重に数えません。'
  });

  selection.selectionNotes=[
    'CZは「合算発生率」と「発生時の種類構成」に因数分解して評価する。',
    '状態別レア役CZ・高確転落は通常/高確の実戦識別条件が未解決のためObservation確定待ち。',
    'AT初当り・AT直撃はCZとのjoint likelihood contractを実装するまで独立Feature化しない。',
    'ロングフリーズ数値率は極低頻度かつ設定差が小さいため不採用。特殊契機Evidenceは維持する。'
  ];

  observation.observations??=[];
  const typeObservation={
    observationId:'OBS_CZ_TYPE_DIRECT',sourceType:'DIRECT_PLAY',observationMode:'VISUAL_EVENT',status:'FOUND',
    label:'CZ種類別回数（クエスト・アイルーBINGO・セリエナ防衛戦）',categories:['numerator','composition'],timing:['各CZ当選時'],
    excludedConditions:[],sourceRefs:[],semanticNote:'3種類のCZは実戦中の名称・告知で区別できるため、当選ごとに手動カウント可能。内部状態の通常/高確識別は本Observationには不要。'
  };
  const oi=observation.observations.findIndex(o=>o.observationId==='OBS_CZ_TYPE_DIRECT');
  if(oi>=0) observation.observations[oi]=typeObservation; else observation.observations.push(typeObservation);
  observation.featureMappings??=[];
  const typeMapping={
    featureId:'FEAT_CZ_TYPE_COMPOSITION',mappingType:'COMBINABLE',observationIds:['OBS_CZ_TYPE_DIRECT'],
    collectionMethods:['MANUAL_COUNTER','VISUAL_EVENT'],usableForInference:true,usableForDifficulty:true
  };
  const mi=observation.featureMappings.findIndex(m=>m.featureId==='FEAT_CZ_TYPE_COMPOSITION');
  if(mi>=0) observation.featureMappings[mi]=typeMapping; else observation.featureMappings.push(typeMapping);
  const totalMapping=observation.featureMappings.find(m=>m.featureId==='FEAT_CZ_TOTAL');
  if(totalMapping && !totalMapping.observationIds.includes('OBS_CZ_TYPE_DIRECT')) totalMapping.observationIds.splice(1,0,'OBS_CZ_TYPE_DIRECT');

  if(apply){write(researchPath,research);write(selectionPath,selection);write(observationPath,observation);}
  return {machineId:MACHINE_ID,version:'0.1.3',composition:'RF_CZ_TYPE_COMPOSITION',observation:'OBS_CZ_TYPE_DIRECT',exposure};
}

const root=path.resolve(process.argv[2]??'.');
const apply=process.argv.includes('--apply');
if(apply) console.log('APPLIED '+JSON.stringify(migrate(root,{apply:true})));
else {
  const tmp=fs.mkdtempSync(path.join(process.env.RUNNER_TEMP??process.env.TMPDIR??'/tmp','slo-v64-iceborne-'));
  fs.cpSync(root,tmp,{recursive:true,filter:src=>!src.includes(`${path.sep}.git${path.sep}`)});
  console.log('DRY-RUN PASS '+JSON.stringify(migrate(tmp,{apply:true})));
}
