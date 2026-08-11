import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateMachineDifficulty} from '../tools/evaluate-machine-difficulty.mjs';

function research(){return {
  machine:{machineId:'TEST_EVENT',settings:['SET_1','SET_2']},
  features:[
    {researchFeatureId:'RF_SOURCE',name:'Source event',candidateModel:'binomial',settingValues:{SET_1:{probability:.10},SET_2:{probability:.20}}},
    {researchFeatureId:'RF_CHILD',name:'Child outcome',candidateModel:'binomial',settingValues:{SET_1:{probability:.20},SET_2:{probability:.60}}}
  ]
};}
function selection(childQuality='DERIVED'){return {
  machineId:'TEST_EVENT',machineDataVersion:'0.0.1',
  difficultyAnalysis:{targetGames:[100,1000],targetGameBasis:{basisId:'PLAY_GAMES',label:'play games',quality:'EXACT',crossMachineComparable:true}},
  features:[
    {researchFeatureId:'RF_SOURCE',featureId:'FEAT_SOURCE',adoptionCategory:'INCLUDE_PRIMARY',weight:1,difficultyExposure:{mode:'per_game',factor:1,quality:'EXACT',basisId:'PLAY_GAMES'}},
    {researchFeatureId:'RF_CHILD',featureId:'FEAT_CHILD',adoptionCategory:'INCLUDE_SUPPORT',weight:1,difficultyExposure:{mode:'derived_event_rate',quality:childQuality,sourceFeatureId:'FEAT_SOURCE',eventMultiplier:1,basisId:'PLAY_GAMES'}}
  ]
};}

test('derived_event_rate resolves from an explicit source feature and remains analyzable',()=>{
  const r=evaluateMachineDifficulty(research(),selection(),{simulationsPerSetting:500,seed:4});
  assert.equal(r.status,'COMPLETE');
  assert.equal(r.coverage.analyzableFeatureCount,2);
  assert.equal(r.analyzerVersion,'difficulty-analyzer-v1.1');
  assert.equal(r.targetGameBasis.basisId,'PLAY_GAMES');
});

test('provisional event exposure is blocked by default and can be explicitly explored',()=>{
  const normal=evaluateMachineDifficulty(research(),selection('PROVISIONAL'),{targets:[500],simulationsPerSetting:200,seed:5});
  assert.equal(normal.status,'PARTIAL');
  assert.deepEqual(normal.coverage.blockedDifficultyExposureFeatures,[{featureId:'FEAT_CHILD',quality:'PROVISIONAL',mode:'derived_event_rate'}]);
  const exploratory=evaluateMachineDifficulty(research(),selection('PROVISIONAL'),{targets:[500],simulationsPerSetting:200,seed:5,allowedExposureQualities:['EXACT','DERIVED','PROVISIONAL']});
  assert.equal(exploratory.status,'COMPLETE');
});

test('derived_event_rate never invents a missing source feature',()=>{
  const s=selection();
  s.features[1].difficultyExposure.sourceFeatureId='DOES_NOT_EXIST';
  const r=evaluateMachineDifficulty(research(),s,{targets:[500],simulationsPerSetting:200,seed:6});
  assert.equal(r.status,'PARTIAL');
  assert.equal(r.coverage.analyzableFeatureCount,1);
});
