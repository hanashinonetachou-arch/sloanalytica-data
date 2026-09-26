import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {compileV84CalibrationPackage} from "../tools/build-v84-calibration-package.mjs";
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),".."),D=path.join(ROOT,"repro-v8","L_SMASLO_KAIJI_KYOEN_FJ");
const read=n=>JSON.parse(fs.readFileSync(path.join(D,n),"utf8"));
const pkg=()=>compileV84CalibrationPackage({machineData:read("phase6-machine-data-runtime-v84-production-calibration.json"),runtimeBinding:read("phase6-runtime-binding-v84-production-calibration.json")});

test("Phase 7 compiler consumes only explicit Phase 6 calibration authority",()=>{
 const p=pkg();
 assert.equal(p.v8.source,"REPRO_V8_UPSTREAM_ONLY");
 assert.equal(p.v8.productionCalibration,true);
 assert.equal(p.provenance.legacyOracleUsed,false);
 assert.equal(p.features.candidates.length,8);
 assert.equal(p.features.features.length,6);
 assert.equal(p.features.runtimeProjection.filter(x=>x.runtimeStatus==="ACTIVE").length,6);
 assert.equal(p.features.runtimeProjection.filter(x=>x.runtimeStatus==="INACTIVE").length,2);
});
test("Phase 7 preserves metric boundaries and upper-bound status",()=>{
 const p=pkg(),m=new Map(p.features.candidates.map(x=>[x.featureId,x]));
 assert.equal(m.get("FEAT_SETTING_DIFFERENCE_SMALL_ROLE_JOINT").evaluation.metric,"SELECTION_SCORE");
 assert.equal(m.get("FEAT_CZ_SUCCESS").evaluation.metric,"PER_ELIGIBLE_TRIAL_POWER");
 assert.equal(m.get("FEAT_BONUS_INITIAL").evaluation.metric,"MAXIMUM_SELECTION_SCORE");
 assert.equal(m.get("FEAT_BONUS_INITIAL").evaluation.status,"UPPER_BOUND_ONLY");
 assert.equal(m.get("FEAT_BONUS_INITIAL").runtimePolicyBinding.mode,"NOT_THRESHOLD_CONTROLLED");
});
test("derived OTHER is represented by multinomial residual, never a user input",()=>{
 const p=pkg(),f=p.features.features.find(x=>x.featureId==="FEAT_SETTING_DIFFERENCE_SMALL_ROLE_JOINT");
 assert.equal(f.modelType,"multinomial");
 assert.equal(f.categoryProbabilities.SET_1.length,4);
 assert.ok(f.categoryProbabilities.SET_1.reduce((a,b)=>a+b,0)<1);
 assert.equal(f.derivedResidualCategory.id,"OBS_OTHER");
 assert.equal(p.inputs.inputs.some(x=>x.id==="OBS_OTHER"),false);
});
test("Red7 conditional denominator is exact category sum",()=>{
 const p=pkg(),f=p.features.features.find(x=>x.featureId==="FEAT_RED7_FIRST_BAR_BENEFIT");
 assert.equal(f.modelType,"multinomial");
 assert.equal(f.denominatorRule,"SUM_CATEGORY_COUNTS");
 assert.equal(f.categoryProbabilities.SET_1.length,3);
});
test("Evidence 22/22 preserves HARD/SOFT runtime responsibility",()=>{
 const p=pkg();
 assert.equal(p.evidence.evidences.length,22);
 assert.equal(p.evidence.evidences.filter(x=>x.type==="SETTING_CONSTRAINT").length,14);
 assert.equal(p.evidence.evidences.filter(x=>x.type==="DISPLAY_ONLY").length,8);
});
test("Canonical UI materialization has no INELIGIBLE feature and no derived residual input",()=>{
 const p=pkg(),serialized=JSON.stringify(p.ui);
 assert.equal(serialized.includes("FEAT_MODE_AFTER_CHAIN"),false);
 assert.equal(serialized.includes("FEAT_TONEGAWA_DIRECT_FROM_HIRAMEKI"),false);
 assert.equal(serialized.includes("OBS_OTHER"),true,"hidden derived declaration may remain");
 const visibleInputs=p.ui.sections.flatMap(s=>s.items??[]).flatMap(x=>x.inputs??[]).map(x=>x.id);
 assert.equal(visibleInputs.includes("OBS_OTHER"),false);
 assert.equal(p.ui.source,"CANONICAL_UI");
});
test("generic Phase 7 production tools contain no Kaiji identity",()=>{
 for(const name of ["build-v84-calibration-package.mjs","prepare-v8-distribution.mjs","v8-machine-pipeline.mjs"]){
  const src=fs.readFileSync(path.join(ROOT,"tools",name),"utf8");
  for(const token of ["L_SMASLO_KAIJI_KYOEN_FJ","Kaiji","カイジ"]) assert.equal(src.includes(token),false,name+" contains "+token);
 }
});
