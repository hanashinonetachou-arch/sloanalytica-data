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
  if(artifact.status==="PROVISIONAL_PENDING_GENERIC_CALCULATOR_VERIFICATION") continue;
  const calculated=calculate(id,artifact.simulation?.samplesPerGroup??20000,artifact.simulation?.seed??20260920,null,path.join("repro-v8",id));
  assert.deepEqual(calculated,artifact.results,\`\${id} HighLow artifact must equal generic calculator output\`);
 }
});
