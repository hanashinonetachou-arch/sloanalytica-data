import test from 'node:test';
import assert from 'node:assert/strict';
import {buildAppRuntime} from '../src/app-runtime-builder.ts';

const baseProjection=(overrides:any={})=>({
  manifestVersion:'8.5',
  batchId:'batch-test',
  machineId:'M',
  machineName:'Machine',
  settings:{status:'SOURCE_DERIVED',values:['SET_1','SET_6']},
  packagePolicy:{offlineCapable:true,containsImages:false,containsExecutableCode:false},
  activeFeatures:[{
    findingId:'f1',
    name:'ボーナス合成確率',
    model:'BERNOULLI',
    trialUniverse:'BONUS_ELIGIBLE_GAME_TRIAL',
    settingDistribution:{SET_1:'1/200',SET_6:'1/150'},
    score:{label:'設定判別スコア',status:'BLOCKED_UNRESOLVED',reason:'観測条件不足',importance:'有力'},
    runtimePolicyBinding:{metric:'PER_ELIGIBLE_TRIAL_POWER',value:7.25,thresholdSource:'RUNTIME_POLICY'},
  }],
  inactiveFeatures:[],
  runtimeUi:{
    numericSections:[{
      id:'OBS_f1',sourceFindingId:'f1',title:'ボーナス合成確率',
      score:{status:'BLOCKED_UNRESOLVED',reason:'観測条件不足'},
      perEligibleTrialPower:{value:7.25},
      description:'・数えるもの：ボーナス当選回数\n・基準：通常ゲーム数',
      inputs:[
        {id:'f1.eligibleTrialCount',label:'通常ゲーム数',role:'trial',mode:'NUMBER',directNumeric:true,quickAdd:[50]},
        {id:'f1.successCount',label:'ボーナス当選回数',role:'success',mode:'NUMBER',directNumeric:true,quickAdd:[1]},
      ],
    }],
    evidenceSections:[],
  },
  evidence:[],heldObservations:[],nonRuntimeCandidates:[],excludedDecisions:[],
  ...overrides,
});

test('PER adoption hides unavailable Selection Score reason and collapses explanation',()=>{
  const app=buildAppRuntime(baseProjection(),{path:'p'});
  const section=app.package.ui.v8Sections[0];
  const node=section.items[0];
  assert.match(section.description,/・数えるもの：ボーナス当選回数/);
  assert.match(section.description,/・基準：通常ゲーム数/);
  assert.doesNotMatch(section.description,/設定判別スコア|1回の判別力/);
  assert.deepEqual(section.descriptionPresentation,{collapsible:true,label:'説明',defaultExpanded:false});
  assert.equal(node.description,undefined);
  assert.doesNotMatch(section.description,/算出不可|観測条件不足/);
});

test('bonus-eligible game denominator can bind to normal-game session difference',()=>{
  const app=buildAppRuntime(baseProjection(),{path:'p'});
  const trial=app.package.ui.v8Sections[0].items[0].inputs[0];
  assert.deepEqual(trial.playDataBinding,{source:'PLAY_NORMAL_GAME_DELTA'});
});


test('PER feature without Selection Score importance still gets a visible importance label',()=>{
  const projection=baseProjection();
  delete projection.activeFeatures[0].score.importance;
  const app=buildAppRuntime(projection,{path:'p'});
  assert.equal(app.package.features.runtimeProjection[0].importance,'補助');
  assert.equal(app.package.v8.machineResearchSummary.adopted[0].importance,'補助');
});


test('conditional Bernoulli inputs use compact two-column labels',()=>{
  const projection=baseProjection({activeFeatures:[{...baseProjection().activeFeatures[0],trialUniverse:'MILE_CHARGE_4PLUS_END_TRIAL'}],runtimeUi:{...baseProjection().runtimeUi,numericSections:[{...baseProjection().runtimeUi.numericSections[0],description:'・数えるもの：温泉ステージへ移行した回数\n・基準：まいるチャージ4回以上で終了した回数',inputs:[{...baseProjection().runtimeUi.numericSections[0].inputs[0],label:'まいるチャージ4回以上で終了した回数'},{...baseProjection().runtimeUi.numericSections[0].inputs[1],label:'温泉ステージへ移行した回数'}]}]}});
  const app=buildAppRuntime(projection,{path:'p'});
  const inputs=app.package.ui.v8Sections[0].items[0].inputs;
  assert.equal(inputs[0].label,'まいるチャージ4回以上で終了した回数');
  assert.equal(inputs[0].gridSpan,6);
  assert.equal(inputs[1].label,'温泉ステージへ移行した回数');
  assert.equal(inputs[1].gridSpan,6);
});


test('numeric details are shown before metric guidance',()=>{
 const projection=baseProjection();projection.runtimeUi.numericSections[0].description+='\n・注意：REG系と炎炎ボーナスを混ぜずに記録します';
 const app=buildAppRuntime(projection,{path:'p'});
 assert.match(app.package.ui.v8Sections[0].description,/REG系と炎炎ボーナスを混ぜずに記録/);
});


test('multi-setting denial Evidence eliminates every denied setting with one counter',()=>{
 const projection:any=baseProjection({activeFeatures:[],runtimeUi:{numericSections:[],evidenceSections:[{id:'EVI_e',title:'アイテムくじ',evidenceItems:[{findingId:'e',label:'アイテムくじ',semanticType:'EXACT_CONSTRAINT',semanticCategories:[{label:'来栖の刀',meaning:'設定2・3否定',semanticType:'EXACT_CONSTRAINT'}]}]}]},evidence:[{evidenceItems:[{findingId:'e',label:'アイテムくじ',semanticType:'EXACT_CONSTRAINT',semanticCategories:[{label:'来栖の刀',meaning:'設定2・3否定',semanticType:'EXACT_CONSTRAINT'}]}]}]});
 projection.settings.values=['SET_1','SET_2','SET_3','SET_4','SET_5','SET_6'];
 const app=buildAppRuntime(projection,{path:'p'});
 assert.deepEqual(app.package.evidence.evidences[0].deniedSettings,['SET_2','SET_3']);
});


test('Evidence details replace stale unknown-probability fallback',()=>{
 const projection:any=baseProjection({activeFeatures:[],runtimeUi:{numericSections:[],evidenceSections:[{id:'EVI_e',title:'REG中の特殊キャラ',description:'・数えるもの：REG中の特殊キャラ\n・入力方法：確認するたび、該当する項目を1回加算します\n・注意：通常シナリオは別の設定推測入力で扱います',evidenceItems:[{findingId:'e',label:'REG中の特殊キャラ',details:['通常シナリオは別の設定推測入力で扱います。'],semanticType:'EXACT_CONSTRAINT',semanticCategories:[{label:'黒野',meaning:'設定4以上濃厚',semanticType:'EXACT_CONSTRAINT'}]}]}]},evidence:[{evidenceItems:[{findingId:'e',label:'REG中の特殊キャラ',details:['通常シナリオは別の設定推測入力で扱います。'],semanticType:'EXACT_CONSTRAINT',semanticCategories:[{label:'黒野',meaning:'設定4以上濃厚',semanticType:'EXACT_CONSTRAINT'}]}]}]});
 const app=buildAppRuntime(projection,{path:'p'});const section=app.package.ui.v8Sections[0];
 assert.match(section.description,/通常シナリオは別の設定推測入力/);assert.doesNotMatch(section.description,/設定別の出現率が公表・確認されていない/);
});
