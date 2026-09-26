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
  {inputId:"INP_NORMAL_REPRODUCTION_ENTRIES",multiplier:-20,observedZeroAllowed:true},
  {inputId:"INP_CZ_REPRODUCTION_GAMES",multiplier:-1,observedZeroAllowed:true},
  {inputId:"INP_AT_REPRODUCTION_GAMES",multiplier:-1,observedZeroAllowed:true},
 ]);
 const evidenceSections=pkg.ui.sections.filter(s=>["SEC_BONUS_END","SEC_KIRIN_VOICE","SEC_PAYOUT"].includes(s.id));
 for(const section of evidenceSections){
  const evidenceItem=section.items?.find(item=>item.id===section.evidenceGroupId) ?? section.items?.find(item=>item.interaction?.categoryCoverage==="NON_EXHAUSTIVE");
  const interaction=evidenceItem?.interaction;
  assert.equal(interaction?.categoryCoverage,"NON_EXHAUSTIVE");
  assert.equal(interaction?.totalOpportunities,"NOT_REQUIRED");
  assert.equal(interaction?.opportunityTracking?.type,"NONE");
  assert.equal(interaction?.absenceIsNegativeEvidence,false);
 }
 const bigHint=byId.get("FEAT_BIG_END_HINT_MULTINOMIAL");
 assert.equal(bigHint?.modelType,"multinomial");
 assert.equal(bigHint?.denominatorRule,"SUM_CATEGORY_COUNTS");
 assert.equal(bigHint?.categoryConditioning?.normalization,"SOURCE_CONDITIONAL_NO_RENORMALIZATION");
 assert.deepEqual(bigHint?.categoryConditioning?.excludedCategories,["EV_BONUS_END_2PLUS","EV_BONUS_END_4PLUS","EV_BONUS_END_5PLUS","EV_BONUS_END_6"]);
 const selection=JSON.parse(fs.readFileSync(path.join(ROOT,"repro-v8","S_REVUE_STARLIGHT_CX","selection-data.json"),"utf8"));
 assert.equal(pkg.machine?.machineDataVersion,selection.machineDataVersion);
 assert.equal(pkg.v8?.source,"REPRO_V8_UPSTREAM_ONLY");
 const sectionImportance=Object.fromEntries(pkg.ui.sections.map(section=>[section.id,section.importance]));
 assert.equal(sectionImportance.SEC_NORMAL,"主要");
 assert.equal(sectionImportance.SEC_CZ_END_LED,"主要");
 assert.equal(sectionImportance.SEC_SPECIFIC_BONUS,"補助");
 assert.equal(sectionImportance.SEC_BONUS_END,"補助");
 assert.equal(sectionImportance.SEC_KIRIN_VOICE,undefined);
 assert.equal(sectionImportance.SEC_PAYOUT,undefined);
 const summarySpecific=pkg.v8?.machineResearchSummary?.selection?.liveConditional?.find(x=>x.featureId==="FEAT_SPECIFIC_BONUS_5_AGG");
 assert.equal(summarySpecific?.importance,"補助");
 assert.equal(summarySpecific?.evaluation?.metric,"MAXIMUM_SELECTION_SCORE");
 assert.equal(summarySpecific?.evaluation?.status,"UPPER_BOUND_ONLY");
 assert.equal(summarySpecific?.evaluation?.userLabel,"設定判別スコア上限");
 assert.equal(summarySpecific?.evaluation?.value,39.14810014303639);
 assert.deepEqual(bigHint?.categoryInputIds,["INP_BIG_END_HIGH_WEAK","INP_BIG_END_HIGH_STRONG"]);
 assert.equal(bigHint?.denominatorInputId,"INP_BIG_END_DEFAULT");
 assert.deepEqual(bigHint?.categoryLabels,["DEFAULT","HIGH_WEAK","HIGH_STRONG"]);
 assert.deepEqual(bigHint?.categoryProbabilities?.SET_1,[0.9255,0.062,0.0125]);
 assert.deepEqual(bigHint?.categoryProbabilities?.SET_6,[0.831,0.094,0.075]);
 const bonusEnd=pkg.ui.sections.find(section=>section.id==="SEC_BONUS_END");
 assert.ok(bonusEnd?.items?.some(item=>item.id==="OBS_BIG_END_HINT"));
 assert.ok(bonusEnd?.items?.some(item=>item.id===bonusEnd.evidenceGroupId || item.interaction?.categoryCoverage==="NON_EXHAUSTIVE"));
 assert.equal(byId.has("FEAT_AT_END_KIRIN_HINT_MULTINOMIAL"),false);
 assert.equal(specificBonus?.numeratorInputId,"INP_SPECIFIC_BONUS_5_AGG");
 assert.equal(specificBonus?.exposureReconstruction?.termSetCompleteness,"COMPLETE_FOR_DEFINED_BROADER_GAME_SCOPE");
 assert.equal(specificBonus?.exposureReconstruction?.additionalExcludedTerms?.status,"NONE_WITHIN_DEFINED_SCOPE");
 assert.equal(specificBonus?.exposureReconstruction?.expression,"eligibleBonusLotteryGames = broaderGameCount - normalReproductionEntryCount*20 - czReproductionExcludedGames - atReproductionExcludedGames");
});


test("publish path fails closed on machineDataVersion downgrade and same-version content replacement",()=>{
 const src=fs.readFileSync(path.join(ROOT,"tools","publish-machine-data.mjs"),"utf8");
 assert.match(src,/machineDataVersion downgrade blocked/);
 assert.match(src,/machineDataVersion must increase when package content changes/);
 assert.match(src,/compareSemverCore\(nextVersion,existingVersion\)/);
});


test("MachineData preserves immutable Selection Candidate Contract for every materialized V8 machine",()=>{
 for(const id of ids){
  const r=run(id); assert.equal(r.status,0,`${id}\n${r.stderr||r.stdout}`);
  const selection=JSON.parse(fs.readFileSync(path.join(ROOT,"repro-v8",id,"selection-data.json"),"utf8"));
  const pkg=JSON.parse(fs.readFileSync(path.join(ROOT,"build",id,"machine-package.generated.json"),"utf8"));
  const expected=(selection.features??[]).map(feature=>({
   featureId:feature.featureId,
   ...(feature.eligibility!=null?{eligibility:feature.eligibility}:{}),
   ...(feature.evaluation!=null?{evaluation:structuredClone(feature.evaluation)}:{}),
   ...(feature.runtimePolicyBinding!=null?{runtimePolicyBinding:structuredClone(feature.runtimePolicyBinding)}:{}),
   ...(feature.importance!=null?{importance:feature.importance}:{})
  }));
  assert.deepEqual(pkg.features?.candidates,expected,`${id} Candidate Contract must be copied losslessly from Selection`);
  const runtimeIds=new Set((pkg.features?.features??[]).map(feature=>feature.featureId));
  for(const candidate of expected){
   if(candidate.eligibility==="INELIGIBLE") assert.equal(runtimeIds.has(candidate.featureId),false,`${id} ${candidate.featureId} INELIGIBLE candidate must not become a Runtime Feature`);
  }
 }
});

test("Runtime Projection is metric-driven, reversible, and preserves Candidate Contract",()=>{
 const compiler=fs.readFileSync(path.join(ROOT,"tools","compile-v8-machine-package.mjs"),"utf8");
 assert.match(compiler,/const metric=candidate\.evaluation\?\.metric/);
 assert.match(compiler,/const threshold=thresholds\[metric\]/);
 assert.match(compiler,/binding\?\.mode!=='THRESHOLD'/);
 const original=JSON.parse(fs.readFileSync(path.join(ROOT,"runtime-policy.json"),"utf8"));
 const policyPath=path.join(ROOT,"runtime-policy.json");
 try{
  for(const [threshold,expected] of [[5,['ACTIVE','ACTIVE','ACTIVE']],[80,['INACTIVE','ACTIVE','ACTIVE']],[90,['INACTIVE','INACTIVE','ACTIVE']],[5,['ACTIVE','ACTIVE','ACTIVE']]]){
   fs.writeFileSync(policyPath,JSON.stringify({...original,thresholds:{...original.thresholds,SELECTION_SCORE:threshold}},null,2)+'\n');
   const r=run("S_REVUE_STARLIGHT_CX"); assert.equal(r.status,0,r.stderr||r.stdout);
   const pkg=JSON.parse(fs.readFileSync(path.join(ROOT,"build","S_REVUE_STARLIGHT_CX","machine-package.generated.json"),"utf8"));
   const projection=new Map(pkg.features.runtimeProjection.map(x=>[x.featureId,x]));
   assert.deepEqual(['FEAT_AT_INITIAL','FEAT_CZ_INITIAL','FEAT_CZ_FAKE_END_LED'].map(id=>projection.get(id)?.runtimeStatus),expected);
   assert.equal(projection.get('FEAT_SPECIFIC_BONUS_5_AGG')?.runtimeStatus,'ACTIVE');
   assert.equal(projection.get('FEAT_BIG_END_HINT_MULTINOMIAL')?.runtimeStatus,'ACTIVE');
   assert.equal(projection.get('FEAT_AT_END_KIRIN_HINT_MULTINOMIAL')?.runtimeStatus,'INACTIVE');
   const selection=JSON.parse(fs.readFileSync(path.join(ROOT,'repro-v8','S_REVUE_STARLIGHT_CX','selection-data.json'),'utf8'));
   const expectedCandidates=(selection.features??[]).map(feature=>({featureId:feature.featureId,...(feature.eligibility!=null?{eligibility:feature.eligibility}:{}),...(feature.evaluation!=null?{evaluation:structuredClone(feature.evaluation)}:{}),...(feature.runtimePolicyBinding!=null?{runtimePolicyBinding:structuredClone(feature.runtimePolicyBinding)}:{}),...(feature.importance!=null?{importance:feature.importance}:{})}));
   assert.deepEqual(pkg.features.candidates,expectedCandidates);
  }
  fs.writeFileSync(policyPath,JSON.stringify({...original,thresholds:{...original.thresholds,MAXIMUM_SELECTION_SCORE:40,PER_ELIGIBLE_TRIAL_POWER:3.3}},null,2)+'\n');
  const r=run("S_REVUE_STARLIGHT_CX"); assert.equal(r.status,0,r.stderr||r.stdout);
  const pkg=JSON.parse(fs.readFileSync(path.join(ROOT,"build","S_REVUE_STARLIGHT_CX","machine-package.generated.json"),"utf8"));
  const projection=new Map(pkg.features.runtimeProjection.map(x=>[x.featureId,x]));
  assert.equal(projection.get('FEAT_SPECIFIC_BONUS_5_AGG')?.runtimeStatus,'ACTIVE','NOT_THRESHOLD_CONTROLLED candidate ignores same-name policy keys');
  assert.equal(projection.get('FEAT_BIG_END_HINT_MULTINOMIAL')?.runtimeStatus,'INACTIVE');
  assert.equal(projection.get('FEAT_BIG_END_HINT_MULTINOMIAL')?.runtimeReason,'THRESHOLD_NOT_MET');
  fs.writeFileSync(policyPath,JSON.stringify(original,null,2)+'\n');
  const rollback=run("S_REVUE_STARLIGHT_CX"); assert.equal(rollback.status,0,rollback.stderr||rollback.stdout);
  const rollbackPkg=JSON.parse(fs.readFileSync(path.join(ROOT,"build","S_REVUE_STARLIGHT_CX","machine-package.generated.json"),"utf8"));
  const rollbackProjection=new Map(rollbackPkg.features.runtimeProjection.map(x=>[x.featureId,x]));
  assert.equal(rollbackProjection.get('FEAT_BIG_END_HINT_MULTINOMIAL')?.runtimeStatus,'ACTIVE','same Candidate Contract reactivates without Selection rerun');
 } finally { fs.writeFileSync(policyPath,JSON.stringify(original,null,2)+'\n'); }
});

test("Distribution publisher preserves the full approved MachinePackage bytes",()=>{
 const src=fs.readFileSync(path.join(ROOT,"tools","publish-machine-data.mjs"),"utf8");
 assert.match(src,/const approvedBytes=canonicalJsonBuffer\(p\.approved\)/);
 assert.match(src,/fs\.writeFileSync\(p\.target,approvedBytes\)/);
 assert.doesNotMatch(src,/delete\s+pkg\.features\??\.candidates/);
});

test("Revue MachineData Candidate Contract preserves v8.4 metric boundaries",()=>{
 const r=run("S_REVUE_STARLIGHT_CX"); assert.equal(r.status,0,r.stderr||r.stdout);
 const pkg=JSON.parse(fs.readFileSync(path.join(ROOT,"build","S_REVUE_STARLIGHT_CX","machine-package.generated.json"),"utf8"));
 const byId=new Map(pkg.features.candidates.map(x=>[x.featureId,x]));
 assert.deepEqual(byId.get("FEAT_AT_INITIAL"),{featureId:"FEAT_AT_INITIAL",eligibility:"ELIGIBLE",evaluation:{metric:"SELECTION_SCORE",value:75.7422585,status:"FORMAL"},runtimePolicyBinding:{mode:"THRESHOLD",metric:"SELECTION_SCORE"},importance:"主要"});
 assert.deepEqual(byId.get("FEAT_CZ_INITIAL"),{featureId:"FEAT_CZ_INITIAL",eligibility:"ELIGIBLE",evaluation:{metric:"SELECTION_SCORE",value:82.32755826,status:"FORMAL"},runtimePolicyBinding:{mode:"THRESHOLD",metric:"SELECTION_SCORE"},importance:"主要"});
 assert.deepEqual(byId.get("FEAT_CZ_FAKE_END_LED"),{featureId:"FEAT_CZ_FAKE_END_LED",eligibility:"ELIGIBLE",evaluation:{metric:"SELECTION_SCORE",value:92.54490548,status:"GUARANTEED_MINIMUM"},runtimePolicyBinding:{mode:"THRESHOLD",metric:"SELECTION_SCORE"},importance:"主要"});
 assert.equal(byId.get("FEAT_SPECIFIC_BONUS_5_AGG")?.evaluation?.metric,"MAXIMUM_SELECTION_SCORE");
 assert.equal(byId.get("FEAT_SPECIFIC_BONUS_5_AGG")?.evaluation?.value,39.14810014303639);
 assert.equal(byId.get("FEAT_SPECIFIC_BONUS_5_AGG")?.runtimePolicyBinding?.mode,"NOT_THRESHOLD_CONTROLLED");
 assert.equal(byId.get("FEAT_BIG_END_HINT_MULTINOMIAL")?.evaluation?.metric,"PER_ELIGIBLE_TRIAL_POWER");
 assert.equal(byId.get("FEAT_BIG_END_HINT_MULTINOMIAL")?.evaluation?.value,3.2791156090114573);
 assert.deepEqual(byId.get("FEAT_BIG_END_HINT_MULTINOMIAL")?.runtimePolicyBinding,{mode:"THRESHOLD",metric:"PER_ELIGIBLE_TRIAL_POWER"});
 assert.equal(byId.get("FEAT_AT_END_KIRIN_HINT_MULTINOMIAL")?.eligibility,"INELIGIBLE");
 assert.equal(byId.get("FEAT_AT_END_KIRIN_HINT_MULTINOMIAL")?.evaluation?.metric,"UNAVAILABLE");
 assert.equal(pkg.features.features.some(x=>x.featureId==="FEAT_AT_END_KIRIN_HINT_MULTINOMIAL"),false);
});
