import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const run=id=>spawnSync(process.execPath,[path.join(ROOT,"tools","v8-machine-pipeline.mjs"),id,"--build"],{cwd:ROOT,encoding:"utf8"});
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
