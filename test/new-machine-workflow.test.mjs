import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from 'node:url';
import { spawnSync } from "node:child_process";

const root=fileURLToPath(new URL("..",import.meta.url));
const cli=path.join(root,"tools","new-machine-workflow.mjs");

test("workflow help is available",()=>{
 const r=spawnSync(process.execPath,[cli,"help"],{cwd:root,encoding:"utf8"});
 assert.equal(r.status,0);
 assert.match(r.stdout,/READY|Research|run/);
});
test("workflow rejects invalid machineId",()=>{
 const r=spawnSync(process.execPath,[cli,"status","bad-id"],{cwd:root,encoding:"utf8"});
 assert.notEqual(r.status,0);
 assert.match(r.stderr,/machineId/);
});
test("workflow status is read-only",()=>{
 const id="S_EUREKA_SEVEN_HIEVO_XS";
 const before=fs.readFileSync(path.join(root,"machines",id,"machine-package.json"),"utf8");
 const r=spawnSync(process.execPath,[cli,"status",id],{cwd:root,encoding:"utf8"});
 assert.equal(r.status,0);
 const after=fs.readFileSync(path.join(root,"machines",id,"machine-package.json"),"utf8");
 assert.equal(after,before);
});
