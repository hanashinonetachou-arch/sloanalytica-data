import test from 'node:test';
import assert from 'node:assert/strict';
import {buildEvaluation} from '../src/evaluation-builder.ts';
import {buildEligibility} from '../src/eligibility-builder.ts';

const source=()=>({
 batchId:'batch-20261008-009',machineId:'SYNTHETIC_CZ_AT',machineName:'dependency fixture',
 findings:[{
  findingId:'at-initial',label:'AT初当たり',observationType:'probability',
  trialUniverse:'NORMAL_GAME_TRIAL',settingDistribution:{'1':'1/400','6':'1/200'},
  sourceIds:['fixture'],dependencyGroupId:'cz-at-path',
  dependencyKind:'CAUSAL_PATH_OVERLAP',
  dependencyScopeAudit:{status:'UNRESOLVED_CAUSAL_OVERLAP',reason:'CZ success and AT share underlying hits'},
  liveObservation:{status:'DIRECT_EXACT',reason:'Synthetic exact counters do not resolve event overlap.'}
 }]
});
test('explicit unresolved dependency remains visible in Evaluation rather than getting dropped',()=>{
 const evaluation=buildEvaluation(source());
 assert.equal(evaluation.evaluations.length,1);
 assert.equal(evaluation.evaluations[0].dependencyScopeAudit?.status,'UNRESOLVED_CAUSAL_OVERLAP');
 assert.equal(evaluation.evaluations[0].dependency.status,'DEFERRED_TO_CANDIDATE_CONTRACT');
});
test('an exact counter cannot override unresolved causal overlap in Eligibility',()=>{
 const d=source();
 const elig=buildEligibility(buildEvaluation(d));
 const x=elig.decisions.find((x:any)=>x.findingId==='at-initial');
 assert.equal(x?.eligibility,'UNRESOLVED');
 assert.equal(x?.liveInferenceRoute,'NONE');
});
test('evaluation copies causal review to avoid mutation of persisted research object',()=>{
 const d=source(), evalResult=buildEvaluation(d);
 evalResult.evaluations[0].dependencyScopeAudit.status='EDITED_IN_TEST';
 assert.equal(d.findings[0].dependencyScopeAudit.status,'UNRESOLVED_CAUSAL_OVERLAP');
});
