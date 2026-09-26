import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const DIR=path.join(ROOT,"repro-v8","L_SMASLO_KAIJI_KYOEN_FJ");
const read=n=>JSON.parse(fs.readFileSync(path.join(DIR,n),"utf8"));
const md=read("phase6-machine-data-runtime-v84-production-calibration.json");
const sel=read("selection-data-v84-production-calibration.json");
const p4=read("phase4-observation-evidence-v84-production-calibration.json");
const ui=read("phase5-canonical-ui-v84-production-calibration.json");

const project=(contracts,thresholds)=>contracts.map(c=>{
 if(c.eligibility==="INELIGIBLE") return {featureId:c.featureId,runtimeStatus:"INACTIVE",runtimeReason:"INELIGIBLE"};
 if(c.runtimePolicyBinding?.mode!=="THRESHOLD") return {featureId:c.featureId,runtimeStatus:"ACTIVE",runtimeReason:"NOT_THRESHOLD_CONTROLLED"};
 assert.equal(c.runtimePolicyBinding.metric,c.evaluation.metric,"Runtime Policy metric must match evaluation metric");
 const t=thresholds[c.evaluation.metric];
 if(!Number.isFinite(t)) return {featureId:c.featureId,runtimeStatus:"ACTIVE",runtimeReason:"NO_RUNTIME_THRESHOLD"};
 return {featureId:c.featureId,runtimeStatus:c.evaluation.value>=t?"ACTIVE":"INACTIVE",runtimeReason:c.evaluation.value>=t?"THRESHOLD_MET":"THRESHOLD_NOT_MET"};
});

test("Phase 6 preserves immutable Candidate Contract and metric semantics",()=>{
 assert.deepEqual(md.candidateContracts,sel.candidateContracts);
 assert.equal(md.candidateContracts.filter(x=>x.eligibility==="ELIGIBLE").length,6);
 assert.equal(md.candidateContracts.filter(x=>x.eligibility==="INELIGIBLE").length,2);
 assert.equal(md.candidateContracts.filter(x=>x.runtimePolicyBinding?.mode==="THRESHOLD").length,4);
 for(const c of md.candidateContracts.filter(x=>x.runtimePolicyBinding?.mode==="THRESHOLD")) assert.equal(c.runtimePolicyBinding.metric,c.evaluation.metric);
 for(const c of md.candidateContracts.filter(x=>x.evaluation.metric==="MAXIMUM_SELECTION_SCORE")){
   assert.equal(c.evaluation.status,"UPPER_BOUND_ONLY");
   assert.equal(c.runtimePolicyBinding.mode,"NOT_THRESHOLD_CONTROLLED");
 }
});

test("joint small-role stays one MULTINOMIAL with derived OTHER",()=>{
 const c=md.candidateContracts.find(x=>x.featureId==="FEAT_SETTING_DIFFERENCE_SMALL_ROLE_JOINT");
 assert.equal(c.model,"MULTINOMIAL");
 const model=md.inferenceModels[c.featureId];
 assert.equal(model.model,"MULTINOMIAL");
 assert.deepEqual(model.categories,["WATERMELON","WEAK_CHANCE","WEAK_CHERRY","STRONG_CHERRY","OTHER"]);
 const obs=md.observationContracts.find(x=>x.featureId===c.featureId);
 assert.equal(obs.model,"MULTINOMIAL");
 assert.equal(obs.derived.length,1);
 assert.equal(obs.derived[0].id,"OBS_OTHER");
 assert.equal(ui.sections.find(x=>x.id==="SEC_SMALL_ROLE").derivedHidden[0].userInput,false);
 assert.equal(Object.keys(md.inferenceModels).filter(x=>/WATERMELON|WEAK_CHANCE|WEAK_CHERRY|STRONG_CHERRY/.test(x)).length,0);
});

test("conditional denominators remain exact and never expected-value completed",()=>{
 const cz=md.observationContracts.find(x=>x.featureId==="FEAT_CZ_UNPITENPU_INITIAL");
 assert.equal(cz.reconstruction.allowed,"EXACT_ONLY");
 assert.ok(cz.reconstruction.forbidden.some(x=>x.includes("期待値")));
 assert.equal(md.invariants.conditionalDenominatorExpectedValueCompletion,false);
 const red=md.observationContracts.find(x=>x.featureId==="FEAT_RED7_FIRST_BAR_BENEFIT");
 assert.equal(red.derived[0].id,"OBS_RED7_FIRST_BAR_TRIALS");
 assert.match(red.derived[0].formula,/CZ\+TONEGAWA_RUSH\+HANCHOU_RUSH/);
});

test("Evidence 22/22 preserves HARD/SOFT separation and MySlot unresolved",()=>{
 const items=md.evidence.groups.flatMap(x=>x.items);
 assert.equal(items.length,22);
 assert.equal(items.filter(x=>x.type==="HARD_SETTING_CONSTRAINT").length,14);
 assert.equal(items.filter(x=>x.type==="SOFT_INDICATION").length,8);
 assert.equal(md.evidence.policy.softIndicationMayBecomeNumericLikelihood,false);
 assert.equal(md.evidence.policy.absenceIsNegativeEvidence,false);
 assert.equal(md.linkedPlay.availableFieldsStatus,"UNRESOLVED");
 assert.deepEqual(md.linkedPlay.inferredFields,[]);
});

test("Runtime Policy projection is reversible without changing Candidate Contract",()=>{
 const frozen=structuredClone(md.candidateContracts);
 const normal=project(md.candidateContracts,{SELECTION_SCORE:5,PER_ELIGIBLE_TRIAL_POWER:0});
 assert.equal(normal.filter(x=>x.runtimeStatus==="ACTIVE").length,6);
 assert.equal(normal.filter(x=>x.runtimeStatus==="INACTIVE").length,2);
 const high=project(md.candidateContracts,{SELECTION_SCORE:100,PER_ELIGIBLE_TRIAL_POWER:100});
 assert.equal(high.filter(x=>x.runtimeStatus==="ACTIVE").length,2,"upper-bound LIVE candidates remain active because they are not threshold controlled");
 assert.equal(high.filter(x=>x.runtimeStatus==="INACTIVE").length,6);
 assert.deepEqual(md.candidateContracts,frozen);
 const restored=project(md.candidateContracts,{SELECTION_SCORE:5,PER_ELIGIBLE_TRIAL_POWER:0});
 assert.deepEqual(restored,normal);
});

test("Runtime UI projection can remove inactive numeric features and empty sections without resurrecting INELIGIBLE",()=>{
 const projected=project(md.candidateContracts,{SELECTION_SCORE:100,PER_ELIGIBLE_TRIAL_POWER:100});
 const active=new Set(projected.filter(x=>x.runtimeStatus==="ACTIVE").map(x=>x.featureId));
 const numeric=ui.sections.filter(x=>Array.isArray(x.numericFeatureIds));
 const visible=numeric.map(s=>({...s,numericFeatureIds:s.numericFeatureIds.filter(id=>active.has(id))})).filter(s=>s.numericFeatureIds.length>0);
 assert.deepEqual(visible.map(x=>x.id),["SEC_NORMAL"]);
 assert.ok(!visible.flatMap(x=>x.numericFeatureIds).includes("FEAT_MODE_AFTER_CHAIN"));
 assert.ok(!visible.flatMap(x=>x.numericFeatureIds).includes("FEAT_TONEGAWA_DIRECT_FROM_HIRAMEKI"));
 assert.equal(ui.rules.emptyNumericSectionMustDisappearAfterRuntimeProjection,true);
});

test("Phase 6 source authority remains Phase 1-5 calibration artifacts only",()=>{
 assert.equal(md.provenance.legacyOracleUsed,false);
 assert.equal(md.provenance.manifestVersion,"8.4");
 assert.equal(md.highLowDiscrimination.status,"DEFERRED_NOT_RECALCULATED_IN_PHASE_5");
 assert.equal(md.observationContracts.length,p4.observationContracts.length);
 assert.equal(md.canonicalUi.phase,"PHASE_5_CANONICAL_UI");
});
