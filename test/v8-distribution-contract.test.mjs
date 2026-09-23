import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const ids=fs.readdirSync(path.join(ROOT,"repro-v8"),{withFileTypes:true}).filter(x=>x.isDirectory()&&fs.existsSync(path.join(ROOT,"repro-v8",x.name,"canonical-ui.json"))).map(x=>x.name);
const run=(script,args=[])=>spawnSync(process.execPath,[path.join(ROOT,"tools",script),...args],{cwd:ROOT,encoding:"utf8"});

test("V8 distribution materialization is upstream-only and publish-ready for every materialized machine",()=>{
 assert.ok(ids.length>0,"no materialized V8 machines found");
 for(const id of ids){
  const prod=path.join(ROOT,"machines",id,"machine-package.json"), hidden=prod+".v8-distribution-hidden";
  const hadProd=fs.existsSync(prod); if(hadProd)fs.renameSync(prod,hidden);
  try{
   const r=run("prepare-v8-distribution.mjs",[id]);
   assert.equal(r.status,0,`${id}\n${r.stderr||r.stdout}`);
   const out=path.join(ROOT,"build",id,"machine-package.generated.json");
   const pkg=JSON.parse(fs.readFileSync(out,"utf8"));
   assert.equal(pkg.v8.source,"REPRO_V8_UPSTREAM_ONLY");
   assert.match(pkg.machine.machineDataVersion,/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/);
   assert.equal(pkg.machine.machineId,id);
  } finally { if(hadProd)fs.renameSync(hidden,prod); }
 }
});

test("publisher preserves catalog identity metadata and never derives V8 bytes from production package",()=>{
 const src=fs.readFileSync(path.join(ROOT,"tools","publish-machine-data.mjs"),"utf8");
 for(const field of ["introductionDate","machineType","gameType"]) assert.ok(src.includes(`existing?.${field}`));
 const prep=fs.readFileSync(path.join(ROOT,"tools","prepare-v8-distribution.mjs"),"utf8");
 assert.equal(prep.includes('machines",id'),false);
 assert.equal(prep.includes("productionPackage"),false);
});
