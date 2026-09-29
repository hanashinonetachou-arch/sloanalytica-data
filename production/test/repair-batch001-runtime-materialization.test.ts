import test from 'node:test';
import assert from 'node:assert/strict';
import {repairEvaluationDocument} from '../src/repair-batch001-runtime-materialization.ts';

test('repairs exact per-game benchmark into formal selection score',()=>{
  const source:any={evaluations:[{
    findingId:'f',
    observationType:'probability',
    trialUniverse:'NORMAL_GAME_TRIAL',
    benchmarkExposure:{status:'UPPER_BOUND_ONLY',maximumTrials:7000},
    evaluationCompleteness:'COMPLETE_LIKELIHOOD_BENCHMARK_UNRESOLVED',
    metrics:{maximumSelectionScore:12.5,selectionScore:{status:'BLOCKED_UNRESOLVED',value:null}}
  }]};
  const d=repairEvaluationDocument(source);
  assert.equal(d.evaluations[0].benchmarkExposure.status,'EXACT');
  assert.equal(d.evaluations[0].benchmarkExposure.trials,7000);
  assert.deepEqual(d.evaluations[0].metrics.selectionScore,{status:'COMPUTED',value:12.5});
  assert.equal(d.evaluations[0].selectionClass,'SUPPORT');
  assert.equal(d.evaluations[0].evaluationCompleteness,'COMPLETE');
  assert.equal(source.evaluations[0].metrics.selectionScore.status,'BLOCKED_UNRESOLVED');
});

test('does not invent score for conditional trial universe',()=>{
  const source:any={evaluations:[{
    findingId:'f',
    observationType:'conditional_probability',
    trialUniverse:'EVENT_TRIAL',
    benchmarkExposure:{status:'BLOCKED_UNRESOLVED'},
    evaluationCompleteness:'COMPLETE_LIKELIHOOD_BENCHMARK_UNRESOLVED',
    metrics:{perEligibleTrialPower:1.2,selectionScore:{status:'BLOCKED_UNRESOLVED',value:null}}
  }]};
  const d=repairEvaluationDocument(source);
  assert.deepEqual(d,source);
});
