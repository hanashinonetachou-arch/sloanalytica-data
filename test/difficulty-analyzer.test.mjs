import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateMachineDifficulty} from '../tools/evaluate-machine-difficulty.mjs';

function research(p1=.10,p2=.30){return {machine:{machineId:'TEST',settings:['SET_1','SET_2']},features:[{researchFeatureId:'RF_A',name:'A',candidateModel:'binomial',settingValues:{SET_1:{probability:p1},SET_2:{probability:p2}}}]};}
function selection(withExposure=true){return {machineId:'TEST',machineDataVersion:'0.0.1',features:[{researchFeatureId:'RF_A',featureId:'FEAT_A',adoptionCategory:'INCLUDE_PRIMARY',weight:1,...(withExposure?{difficultyExposure:{mode:'per_game',factor:1}}:{})}]};}

test('difficulty score rises with more games for a separable feature',()=>{
  const r=evaluateMachineDifficulty(research(),selection(),{targets:[50,200,1000],simulationsPerSetting:1200,seed:1});
  assert.equal(r.status,'COMPLETE');
  assert.equal(r.targets.length,3);
  assert.ok(r.targets[1].score>=r.targets[0].score);
  assert.ok(r.targets[2].score>=r.targets[1].score);
  assert.ok(r.targets[2].score>70);
});

test('missing exposure is reported and never inferred',()=>{
  const r=evaluateMachineDifficulty(research(),selection(false),{targets:[1500],simulationsPerSetting:100,seed:1});
  assert.equal(r.status,'NOT_CONFIGURED');
  assert.deepEqual(r.coverage.missingDifficultyExposureFeatureIds,['FEAT_A']);
  assert.equal(r.targets.length,0);
});

test('indistinguishable feature produces near-zero score and no finite trial estimate',()=>{
  const r=evaluateMachineDifficulty(research(.1,.1),selection(),{targets:[1000],simulationsPerSetting:800,seed:2});
  assert.ok(r.targets[0].score<=3);
  assert.equal(r.featureTrialEstimates[0].requiredTrials80,null);
});
