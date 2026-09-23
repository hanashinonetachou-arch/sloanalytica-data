import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const run=id=>spawnSync(process.execPath,[path.join(ROOT,"tools","v8-machine-pipeline.mjs"),id,"--build"],{cwd:ROOT,encoding:"utf8"});
const productionTools=["v8-machine-pipeline.mjs","build-v8-reference-package.mjs","compile-v8-machine-package.mjs","materialize-canonical-ui-v8-runtime.mjs","prepare-v8-distribution.mjs","audit-v8-distribution-target.mjs"];
const ids=fs.readdirSync(path.join(ROOT,"repro-v8"),{withFileTypes:true}).filter(x=>x.isDirectory()&&fs.existsSync(path.join(ROOT,"repro-v8",x.name,"canonical-ui.json"))).map(x=>x.name);

test("every materialized repro-v8 machine passes the generic production-line build",()=>{
 assert.ok(ids.length>0,"no repro-v8 machines found");
 for(const id of ids){const r=run(id);assert.equal(r.status,0,`${id}\n${r.stderr||r.stdout}`);}
});

test("materialized provenance-declared V8 packages preserve linked-play contract",()=>{
 for(const id of ids){
  const dir=path.join(ROOT,"repro-v8",id);
  const selection=JSON.parse(fs.readFileSync(path.join(dir,"selection-data.json"),"utf8"));
  if(!selection.provenance) continue;
  const summary=JSON.parse(fs.readFileSync(path.join(dir,"machine-research-summary.json"),"utf8"));
  assert.ok(selection.linkedPlayResearch,`${id} selection linked-play research missing`);
  assert.equal(selection.linkedPlayResearch.stage,"POST_SELECTION",`${id} linked-play stage`);
  assert.ok(["AVAILABLE","NOT_AVAILABLE","UNRESOLVED"].includes(selection.linkedPlayResearch.status),`${id} linked-play status`);
  assert.equal(summary.linkedPlay?.status,selection.linkedPlayResearch.status,`${id} linked-play status must survive Summary`);
  assert.ok(summary.linkedPlay?.automaticImportCapability!=null,`${id} automatic import capability must remain separate`);
 }
});

test("generic V8 production line contains no machine-specific identity",()=>{
 const src=fs.readFileSync(path.join(ROOT,"tools","v8-machine-pipeline.mjs"),"utf8");
 assert.equal(src.includes("L_SMASLO_KAIJI_KYOEN_FJ"),false);
 assert.equal(src.includes("Kaiji"),false);
});


test("next-machine readiness: production path is identity-agnostic",()=>{
 const forbidden=["L_SMASLO_KAIJI_KYOEN_FJ","Kaiji","カイジ"];
 for(const name of productionTools){
  const src=fs.readFileSync(path.join(ROOT,"tools",name),"utf8");
  for(const token of forbidden) assert.equal(src.includes(token),false,`${name} contains machine-specific token: ${token}`);
 }
});

test("next-machine readiness: upstream contract boundary is explicit and production-package independent",()=>{
 const pipeline=fs.readFileSync(path.join(ROOT,"tools","v8-machine-pipeline.mjs"),"utf8");
 const builder=fs.readFileSync(path.join(ROOT,"tools","build-v8-reference-package.mjs"),"utf8");
 const preparer=fs.readFileSync(path.join(ROOT,"tools","prepare-v8-distribution.mjs"),"utf8");
 for(const contract of ["research-data.json","selection-data.json","observation-contract.json","machine-research-summary.json","canonical-ui.json","high-low-discrimination.json"]){
  assert.match(pipeline,new RegExp(contract.replaceAll(".","\\.")),`pipeline must require ${contract}`);
 }
 assert.match(builder,/repro-v8/);
 assert.doesNotMatch(builder,/machines.*machine-package\.json/i,"builder must not consume production MachinePackage");
 assert.doesNotMatch(preparer,/machines.*machine-package\.json/i,"distribution preparation must not consume production MachinePackage");
 assert.match(pipeline,/REPRO_V8_UPSTREAM_ONLY/);
 assert.match(pipeline,/CANONICAL_UI/);
});

test("next-machine readiness: adding another materialized machine needs no production-line code edit",()=>{
 const pipeline=fs.readFileSync(path.join(ROOT,"tools","v8-machine-pipeline.mjs"),"utf8");
 assert.match(pipeline,/process\.argv\[2\]/,"machine identity must come from CLI input");
 assert.match(pipeline,/path\.join\(ROOT,"repro-v8",id\)/,"upstream source must be selected by machine ID");
 assert.doesNotMatch(pipeline,/switch\s*\(\s*id\s*\)|if\s*\(\s*id\s*===/,"pipeline must not branch on machine identity");
});


test("materialized V8 HighLow results are reproducible by the generic calculator",async()=>{
 const {calculate}=await import("../tools/calculate-high-low-discrimination.mjs");
 for(const id of ids){
  const highPath=path.join(ROOT,"repro-v8",id,"high-low-discrimination.json");
  if(!fs.existsSync(highPath)) continue;
  const artifact=JSON.parse(fs.readFileSync(highPath,"utf8"));
  if(artifact.schemaVersion==="high-low-discrimination-v8.4-repro"){
   const {calculateHighLow}=await import("../tools/high-low-discrimination-engine.mjs");
   const input=JSON.parse(fs.readFileSync(path.join(ROOT,"repro-v8",id,"high-low-discrimination-input.json"),"utf8"));
   assert.deepEqual(calculateHighLow(input),artifact.results,`${id} v8.4 HighLow artifact must equal generic HLD engine output`);
  }else{
   const calculated=calculate(id,artifact.status==="PROVISIONAL_PENDING_GENERIC_CALCULATOR_VERIFICATION"?20000:(artifact.simulation?.samplesPerGroup??20000),artifact.simulation?.seed??20260920,null,path.join("repro-v8",id));
   assert.deepEqual(calculated,artifact.results,`${id} HighLow artifact must equal generic calculator output`);
  }
 }
});


test("Revue v8.4 production package preserves conditional and categorical inference",()=>{
 const r=run("S_REVUE_STARLIGHT_CX"); assert.equal(r.status,0,r.stderr||r.stdout);
 const pkg=JSON.parse(fs.readFileSync(path.join(ROOT,"build","S_REVUE_STARLIGHT_CX","machine-package.generated.json"),"utf8"));
 const byId=new Map(pkg.features.features.map(x=>[x.featureId,x]));
 assert.equal(byId.get("FEAT_CZ_INITIAL")?.probabilityEngineUsage,true);
 assert.equal(byId.get("FEAT_AT_INITIAL")?.probabilityEngineUsage,true);
 assert.equal(byId.get("FEAT_CZ_FAKE_END_LED")?.modelType,"multinomial");
 assert.equal(byId.get("FEAT_CZ_FAKE_END_LED")?.categoryInputIds?.length,4);
 assert.equal(byId.get("FEAT_SPECIFIC_BONUS_5_AGG")?.adoptionCategory,"LIVE_CONDITIONAL");
 assert.equal(byId.get("FEAT_SPECIFIC_BONUS_5_AGG")?.inferenceGate,"EXACT_EXPOSURE_RECONSTRUCTION_COMPLETE");
 const specificBonus=byId.get("FEAT_SPECIFIC_BONUS_5_AGG");
 assert.equal(specificBonus?.runtimeInferenceEnabled,true);
 assert.equal(specificBonus?.runtimeBlockReason,undefined);
 assert.match(specificBonus?.denominatorInputId,/^DERIVED_.*ELIGIBLE_TRIALS$/);
 const exposureInput=pkg.inputs.inputs.find(x=>x.id===specificBonus.denominatorInputId);
 assert.equal(exposureInput?.derivedCalculation,"linear_combination");
 assert.deepEqual(exposureInput?.derivedTerms,[
  {inputId:"INP_BONUS_BROADER_GAMES",multiplier:1},
  {inputId:"INP_NORMAL_REPRODUCTION_ENTRIES",multiplier:-20},
  {inputId:"INP_CZ_REPRODUCTION_GAMES",multiplier:-1},
  {inputId:"INP_AT_REPRODUCTION_GAMES",multiplier:-1},
 ]);
 const evidenceSections=pkg.ui.sections.filter(s=>["SEC_BONUS_END","SEC_KIRIN_VOICE","SEC_PAYOUT"].includes(s.id));
 for(const section of evidenceSections){
  const interaction=section.items?.[0]?.interaction;
  assert.equal(interaction?.categoryCoverage,"NON_EXHAUSTIVE");
  assert.equal(interaction?.totalOpportunities,"NOT_REQUIRED");
  assert.equal(interaction?.opportunityTracking?.type,"NONE");
  assert.equal(interaction?.absenceIsNegativeEvidence,false);
 }
 assert.equal(specificBonus?.numeratorInputId,"INP_SPECIFIC_BONUS_5_AGG");
});
