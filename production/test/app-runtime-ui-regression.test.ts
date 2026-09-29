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
      inputs:[
        {id:'f1.eligibleTrialCount',label:'観測機会数',role:'trial',mode:'NUMBER',directNumeric:true,quickAdd:[50]},
        {id:'f1.successCount',label:'該当回数',role:'success',mode:'NUMBER',directNumeric:true,quickAdd:[1]},
      ],
    }],
    evidenceSections:[],
  },
  evidence:[],heldObservations:[],nonRuntimeCandidates:[],excludedDecisions:[],
  ...overrides,
});

test('PER adoption hides unavailable Selection Score reason and collapses explanation',()=>{
  const app=buildAppRuntime(baseProjection(),{path:'p'});
  const node=app.package.ui.v8Sections[0].items[0];
  assert.equal(node.description,'1回の判別力：7.250');
  assert.deepEqual(node.descriptionPresentation,{collapsible:true,label:'説明',defaultExpanded:false});
  assert.doesNotMatch(node.description,/算出不可|観測条件不足/);
});

test('bonus-eligible game denominator can bind to normal-game session difference',()=>{
  const app=buildAppRuntime(baseProjection(),{path:'p'});
  const trial=app.package.ui.v8Sections[0].items[0].inputs[0];
  assert.deepEqual(trial.playDataBinding,{source:'PLAY_NORMAL_GAME_DELTA'});
});
