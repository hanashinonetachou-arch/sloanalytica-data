import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from 'node:url';
import { spawnSync } from "node:child_process";

const root=fileURLToPath(new URL("..",import.meta.url));
const cli=path.join(root,"tools","publish-machine-data.mjs");

test("publish help is available",()=>{
 const r=spawnSync(process.execPath,[cli,"help"],{cwd:root,encoding:"utf8"});
 assert.equal(r.status,0); assert.match(r.stdout,/DRY RUN|approve/);
});
test("publish rejects invalid machineId",()=>{
 const r=spawnSync(process.execPath,[cli,"status","bad-id"],{cwd:root,encoding:"utf8"});
 assert.notEqual(r.status,0);
});
test("dry run never mutates catalog",()=>{
 const id="S_EUREKA_SEVEN_HIEVO_XS";
 const build=path.join(root,"build",id); fs.mkdirSync(build,{recursive:true});
 const golden=path.join(root,"machines",id,"machine-package.json");
 const approved=path.join(build,"machine-package.approved.json");
 fs.copyFileSync(golden,approved);
 const a=spawnSync(process.execPath,[cli,"approve",id,approved],{cwd:root,encoding:"utf8"});
 assert.equal(a.status,0);
 const before=fs.readFileSync(path.join(root,"catalog.json"),"utf8");
 const d=spawnSync(process.execPath,[cli,"publish",id],{cwd:root,encoding:"utf8"});
 assert.equal(d.status,0); assert.match(d.stdout,/DRY_RUN_OK/);
 const after=fs.readFileSync(path.join(root,"catalog.json"),"utf8");
 assert.equal(after,before);
});
test("approval becomes invalid after approved package changes",()=>{
 const id="S_EUREKA_SEVEN_HIEVO_XS";
 const build=path.join(root,"build",id);
 const approved=path.join(build,"machine-package.approved.json");
 const golden=path.join(root,"machines",id,"machine-package.json");
 fs.copyFileSync(golden,approved);
 const a=spawnSync(process.execPath,[cli,"approve",id,approved],{cwd:root,encoding:"utf8"});
 assert.equal(a.status,0);
 fs.appendFileSync(approved,"\n");
 const s=spawnSync(process.execPath,[cli,"status",id],{cwd:root,encoding:"utf8"});
 assert.equal(s.status,0);
 assert.equal(JSON.parse(s.stdout).approvalValid,false);
 fs.copyFileSync(golden,approved);
});
