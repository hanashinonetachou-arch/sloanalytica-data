import test from "node:test";
import assert from "node:assert/strict";
import { projectRuntimeCandidates } from "../tools/compile-v8-machine-package.mjs";

const candidates = [
  {featureId:"F_SCORE",eligibility:"ELIGIBLE",evaluation:{metric:"SELECTION_SCORE",value:20,status:"FORMAL"},runtimePolicyBinding:{mode:"THRESHOLD",metric:"SELECTION_SCORE"},importance:"主要"},
  {featureId:"F_TRIAL",eligibility:"ELIGIBLE",evaluation:{metric:"PER_ELIGIBLE_TRIAL_POWER",value:3.2,status:"FORMAL"},runtimePolicyBinding:{mode:"THRESHOLD",metric:"PER_ELIGIBLE_TRIAL_POWER"},importance:"補助"},
  {featureId:"F_FIXED",eligibility:"ELIGIBLE",evaluation:{metric:"MAXIMUM_SELECTION_SCORE",value:99,status:"UPPER_BOUND_ONLY"},runtimePolicyBinding:{mode:"NOT_THRESHOLD_CONTROLLED"},importance:"補助"},
  {featureId:"F_BLOCKED",eligibility:"INELIGIBLE",evaluation:{metric:"UNAVAILABLE",value:null,status:"UNRESOLVED"},runtimePolicyBinding:{mode:"NOT_THRESHOLD_CONTROLLED"}}
];

const byId = xs => new Map(xs.map(x=>[x.featureId,x]));
const stripRuntime = xs => xs.map(({runtimeStatus,runtimeReason,...x})=>x);

test("generic Runtime Policy projection is reversible without mutating Candidate Contract",()=>{
  const original=structuredClone(candidates);
  const active=byId(projectRuntimeCandidates(candidates,{thresholds:{SELECTION_SCORE:5,PER_ELIGIBLE_TRIAL_POWER:0}}));
  assert.equal(active.get("F_SCORE").runtimeStatus,"ACTIVE");
  assert.equal(active.get("F_TRIAL").runtimeStatus,"ACTIVE");
  assert.equal(active.get("F_FIXED").runtimeReason,"NOT_THRESHOLD_CONTROLLED");
  assert.equal(active.get("F_BLOCKED").runtimeReason,"INELIGIBLE");

  const inactive=byId(projectRuntimeCandidates(candidates,{thresholds:{SELECTION_SCORE:25,PER_ELIGIBLE_TRIAL_POWER:3.3}}));
  assert.equal(inactive.get("F_SCORE").runtimeStatus,"INACTIVE");
  assert.equal(inactive.get("F_SCORE").runtimeReason,"THRESHOLD_NOT_MET");
  assert.equal(inactive.get("F_TRIAL").runtimeStatus,"INACTIVE");
  assert.equal(inactive.get("F_TRIAL").runtimeReason,"THRESHOLD_NOT_MET");
  assert.equal(inactive.get("F_FIXED").runtimeStatus,"ACTIVE");

  const restored=projectRuntimeCandidates(candidates,{thresholds:{SELECTION_SCORE:5,PER_ELIGIBLE_TRIAL_POWER:0}});
  assert.equal(byId(restored).get("F_TRIAL").runtimeStatus,"ACTIVE");
  assert.equal(byId(restored).get("F_TRIAL").runtimeReason,"THRESHOLD_MET");
  assert.deepEqual(stripRuntime(restored),original);
  assert.deepEqual(candidates,original,"projection must not mutate immutable Selection Candidate Contract");
});

test("generic Runtime Policy is metric-bound and fails closed on invalid candidate data",()=>{
  const mismatch={...structuredClone(candidates[1]),runtimePolicyBinding:{mode:"THRESHOLD",metric:"SELECTION_SCORE"}};
  assert.equal(projectRuntimeCandidates([mismatch],{thresholds:{SELECTION_SCORE:0}})[0].runtimeReason,"RUNTIME_POLICY_BINDING_MISMATCH");

  const unavailable={...structuredClone(candidates[1]),evaluation:{metric:"PER_ELIGIBLE_TRIAL_POWER",value:null,status:"UNRESOLVED"}};
  assert.equal(projectRuntimeCandidates([unavailable],{thresholds:{PER_ELIGIBLE_TRIAL_POWER:0}})[0].runtimeReason,"EVALUATION_UNAVAILABLE");

  const noThreshold=projectRuntimeCandidates([candidates[1]],{thresholds:{}})[0];
  assert.equal(noThreshold.runtimeStatus,"ACTIVE");
  assert.equal(noThreshold.runtimeReason,"NO_RUNTIME_THRESHOLD");
});
