import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {compileV8MachinePackage} from "../tools/compile-v8-machine-package.mjs";
import {materializeCanonicalUiV8} from "../tools/materialize-canonical-ui-v8-runtime.mjs";

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=(p)=>JSON.parse(fs.readFileSync(path.join(ROOT,p),"utf8"));
test("v8 compiler preserves runtime evaluation metadata without embedding policy",()=>{
 const id="S_REVUE_STARLIGHT_CX",base=`repro-v8/${id}`;
 const pkg=compileV8MachinePackage({
  research:read(`${base}/research-data.json`),selection:read(`${base}/selection-data.json`),
  observation:read(`${base}/observation-contract.json`),evidence:read(`${base}/evidence-contract.json`),
  highLow:read(`${base}/high-low-discrimination.json`),summary:read(`${base}/machine-research-summary.json`),
  canonical:read(`${base}/canonical-ui.json`),materializeUi:materializeCanonicalUiV8
 });
 const byId=new Map(pkg.features.candidates.map(x=>[x.featureId,x]));
 assert.ok(Array.isArray(pkg.features.candidates));
 assert.equal(pkg.runtimePolicyBaseline.thresholds.SELECTION_SCORE,5);
 assert.equal(byId.get("FEAT_CZ_INITIAL").eligibility,"ELIGIBLE");
 assert.equal(byId.get("FEAT_CZ_INITIAL").evaluation.metric,"SELECTION_SCORE");
 assert.ok(byId.get("FEAT_CZ_INITIAL").evaluation.value>0);
 assert.equal(byId.get("FEAT_BIG_END_HINT_MULTINOMIAL").evaluation.metric,"PER_ELIGIBLE_TRIAL_POWER");
 assert.ok(byId.get("FEAT_BIG_END_HINT_MULTINOMIAL").evaluation.value>0);
 assert.equal(byId.get("FEAT_BIG_END_HINT_MULTINOMIAL").importance,"補助","per-trial evaluation uses provisional support importance");
 assert.equal(pkg.features.candidates.every(x=>x.eligibility==="ELIGIBLE"),true);
 assert.equal(pkg.features.candidates.some(x=>x.featureId==="FEAT_AT_END_KIRIN_HINT_MULTINOMIAL"),false,"INELIGIBLE must never enter candidates");
 assert.equal(byId.get("FEAT_CZ_INITIAL").runtimePolicyBinding.mode,"THRESHOLD");
 assert.equal(byId.get("FEAT_CZ_INITIAL").runtimePolicyBinding.metric,"SELECTION_SCORE");
 assert.equal(byId.get("FEAT_BIG_END_HINT_MULTINOMIAL").runtimePolicyBinding.mode,"NOT_THRESHOLD_CONTROLLED");
 assert.equal(Object.hasOwn(pkg.runtimePolicyBaseline.thresholds,"PER_ELIGIBLE_TRIAL_POWER"),false);
});
test("shared runtime policy has selection threshold and intentionally no per-trial threshold",()=>{
 const p=read("runtime-policy.json");
 assert.equal(p.schemaVersion,1);
 assert.equal(typeof p.thresholds.SELECTION_SCORE,"number");
 assert.equal(Object.hasOwn(p.thresholds,"PER_ELIGIBLE_TRIAL_POWER"),false);
});


test("v8.4 candidate contract is complete enough for reversible runtime projection",()=>{
 const id="S_REVUE_STARLIGHT_CX",base=`repro-v8/${id}`;
 const pkg=compileV8MachinePackage({
  research:read(`${base}/research-data.json`),selection:read(`${base}/selection-data.json`),
  observation:read(`${base}/observation-contract.json`),evidence:read(`${base}/evidence-contract.json`),
  highLow:read(`${base}/high-low-discrimination.json`),summary:read(`${base}/machine-research-summary.json`),
  canonical:read(`${base}/canonical-ui.json`),materializeUi:materializeCanonicalUiV8
 });
 for(const c of pkg.features.candidates){
  assert.ok(c.featureId);
  assert.equal(c.eligibility,"ELIGIBLE");
  assert.ok(c.modelType);
  assert.ok(c.observationContract);
  assert.ok(c.evaluation);
  assert.ok(c.runtimePolicyBinding);
  assert.ok(c.uiBinding);
  assert.ok(c.summaryMetadata);
  assert.ok(Array.isArray(c.sourceResearchFeatureIds));
  if(c.runtimePolicyBinding.mode==="THRESHOLD"){
   assert.equal(c.runtimePolicyBinding.metric,"SELECTION_SCORE");
   assert.equal(typeof pkg.runtimePolicyBaseline.thresholds[c.runtimePolicyBinding.metric],"number");
  }
 }
});
