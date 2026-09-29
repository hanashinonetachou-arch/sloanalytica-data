import test from 'node:test';
import assert from 'node:assert/strict';
import {balancedAccuracyForBernoulliBands,buildHighLowDiscrimination} from '../src/high-low-discrimination.ts';

test('balanced accuracy rises with exposure for separated low/high bands',()=>{
  const d={'1':'1/250','2':'1/240','3':'1/230','4':'1/190','5':'1/180','6':'1/170'};
  const a=balancedAccuracyForBernoulliBands(d,1500);
  const b=balancedAccuracyForBernoulliBands(d,3000);
  const c=balancedAccuracyForBernoulliBands(d,7000);
  assert.ok(a>=0.5&&a<=1);
  assert.ok(b>a);
  assert.ok(c>b);
});

test('uses best single exact active feature and preserves unresolved active features as excluded only from HLD',()=>{
  const candidate:any={candidates:[
    {findingId:'weak',label:'弱い通常時要素',model:'BERNOULLI',runtimeInferenceAllowed:true,settingDistribution:{'1':'1/250','2':'1/245','3':'1/240','4':'1/225','5':'1/220','6':'1/215'},runtimePolicyBinding:{metric:'SELECTION_SCORE',value:6}},
    {findingId:'strong',label:'強い通常時要素',model:'BERNOULLI',runtimeInferenceAllowed:true,settingDistribution:{'1':'1/300','2':'1/290','3':'1/280','4':'1/190','5':'1/180','6':'1/170'},runtimePolicyBinding:{metric:'SELECTION_SCORE',value:30}},
    {findingId:'ending',label:'終了画面',model:'CATEGORICAL',runtimeInferenceAllowed:true,settingDistribution:{},runtimePolicyBinding:{metric:'PER_ELIGIBLE_TRIAL_POWER',value:12}},
  ]};
  const h:any=buildHighLowDiscrimination(candidate);
  assert.equal(h.status,'COMPUTED');
  assert.equal(h.method,'BEST_SINGLE_EXACT_ACTIVE_FEATURE');
  assert.equal(h.selectedFeatureId,'strong');
  assert.deepEqual(h.results.map((x:any)=>x.games),[1500,3000,7000]);
  assert.ok(h.results[2].balancedAccuracyPercent>h.results[0].balancedAccuracyPercent);
  assert.equal(h.excludedFeatures.find((x:any)=>x.findingId==='ending').reason,'BENCHMARK_EXPOSURE_UNRESOLVED');
});

test('remains not computed when no exact benchmark feature exists',()=>{
  const h:any=buildHighLowDiscrimination({candidates:[{findingId:'ending',model:'CATEGORICAL',runtimeInferenceAllowed:true,runtimePolicyBinding:{metric:'PER_ELIGIBLE_TRIAL_POWER',value:12}}]});
  assert.equal(h.status,'NOT_COMPUTED');
});
