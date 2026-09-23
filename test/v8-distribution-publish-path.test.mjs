import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const id="L_SMASLO_KAIJI_KYOEN_FJ";
const run=(script,args=[])=>spawnSync(process.execPath,[path.join(ROOT,"tools",script),...args],{cwd:ROOT,encoding:"utf8"});
const copy=(src,dst)=>{fs.mkdirSync(path.dirname(dst),{recursive:true});fs.copyFileSync(src,dst);};

test("V8 approve/publish/catalog/registry path is reproducible without production package as build input",()=>{
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),"slo-v8-dist-"));
 const files=["catalog.json","machine-registry.json",`machines/${id}/machine-package.json`];
 const saved=new Map();
 for(const rel of files){const p=path.join(ROOT,rel);saved.set(rel,fs.existsSync(p)?fs.readFileSync(p):null);}
 const build=path.join(ROOT,"build",id);const buildSaved=fs.existsSync(build)?fs.mkdtempSync(path.join(os.tmpdir(),"slo-build-save-")):null;
 if(buildSaved) fs.cpSync(build,buildSaved,{recursive:true});
 try{
  const prep=run("prepare-v8-distribution.mjs",[id]);assert.equal(prep.status,0,prep.stderr||prep.stdout);
  const generated=path.join(build,"machine-package.generated.json");
  const approve=run("publish-machine-data.mjs",["approve",id,generated]);assert.equal(approve.status,0,approve.stderr||approve.stdout);
  const publish=run("publish-machine-data.mjs",["publish",id,"--apply","--defer-audit"]);assert.equal(publish.status,0,publish.stderr||publish.stdout);
  const target=run("audit-v8-distribution-target.mjs",[id]);assert.equal(target.status,0,target.stderr||target.stdout);
  const sync=run("sync-machine-registry.mjs");assert.equal(sync.status,0,sync.stderr||sync.stdout);
  const catalog=JSON.parse(fs.readFileSync(path.join(ROOT,"catalog.json"),"utf8"));
  const entry=catalog.machines.find(x=>x.machineId===id);assert.equal(entry.machineDataVersion,"0.2.0");
  const registry=JSON.parse(fs.readFileSync(path.join(ROOT,"machine-registry.json"),"utf8"));
  const reg=registry.machines.find(x=>x.machineId===id);assert.equal(reg?.machineDataVersion,"0.2.0");assert.equal(reg?.releaseDate,"2025-03-03");
 } finally {
  for(const [rel,bytes] of saved){const p=path.join(ROOT,rel);if(bytes===null)fs.rmSync(p,{force:true});else{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,bytes);}}
  fs.rmSync(build,{recursive:true,force:true});if(buildSaved){fs.mkdirSync(build,{recursive:true});fs.cpSync(buildSaved,build,{recursive:true});fs.rmSync(buildSaved,{recursive:true,force:true});}
  fs.rmSync(tmp,{recursive:true,force:true});
 }
});
