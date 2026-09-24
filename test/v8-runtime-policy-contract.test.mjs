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
 const byId=new Map(pkg.features.features.map(x=>[x.featureId,x]));
 assert.equal(byId.get("FEAT_CZ_INITIAL").eligibility,"ELIGIBLE");
 assert.equal(byId.get("FEAT_CZ_INITIAL").evaluation.metric,"SELECTION_SCORE");
 assert.ok(byId.get("FEAT_CZ_INITIAL").evaluation.value>0);
 assert.equal(byId.get("FEAT_BIG_END_HINT_MULTINOMIAL").evaluation.metric,"PER_ELIGIBLE_TRIAL_POWER");
 assert.ok(byId.get("FEAT_BIG_END_HINT_MULTINOMIAL").evaluation.value>0);
 assert.equal(byId.get("FEAT_BIG_END_HINT_MULTINOMIAL").importance,"補助","per-trial evaluation uses provisional support importance");
 assert.equal(JSON.stringify(pkg).includes("thresholds"),false,"MachineData must not embed mutable Runtime Policy thresholds");
});
test("shared runtime policy has selection threshold and intentionally no per-trial threshold",()=>{
 const p=read("runtime-policy.json");
 assert.equal(p.schemaVersion,1);
 assert.equal(typeof p.thresholds.SELECTION_SCORE,"number");
 assert.equal(Object.hasOwn(p.thresholds,"PER_ELIGIBLE_TRIAL_POWER"),false);
});


test("per-eligible-trial power stays a distinct calibration axis and does not infer a production threshold",()=>{
 const policy=read("runtime-policy.json");
 assert.equal(Object.hasOwn(policy.thresholds,"PER_ELIGIBLE_TRIAL_POWER"),false,"production threshold remains unset until multi-fixture calibration supports one");
 const examples=[
  {bits:0.0005,power:0.1},
  {bits:0.005,power:1.0},
  {bits:0.016395578045057285,power:3.279115609011457},
  {bits:0.05,power:10.0},
  {bits:0.1,power:20.0}
 ];
 for(const x of examples) assert.ok(Math.abs(x.bits*200-x.power)<1e-12);
 assert.equal(examples[2].power>examples[1].power,true);
 assert.equal(examples[2].power<examples[3].power,true);
});