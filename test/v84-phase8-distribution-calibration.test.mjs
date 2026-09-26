import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const id="L_SMASLO_KAIJI_KYOEN_FJ";
const run=(script,args=[])=>spawnSync(process.execPath,[path.join(ROOT,"tools",script),...args],{cwd:ROOT,encoding:"utf8"});
const read=p=>JSON.parse(fs.readFileSync(p,"utf8"));
const sha=b=>crypto.createHash("sha256").update(b).digest("hex");

test("Phase 8 calibration publish is lossless through package/catalog/registry",()=>{
 const rel=[`machines/${id}/machine-package.json`,"catalog.json","machine-registry.json"];
 const saved=new Map(rel.map(x=>[x,fs.existsSync(path.join(ROOT,x))?fs.readFileSync(path.join(ROOT,x)):null]));
 const build=path.join(ROOT,"build",id);
 const buildSaved=fs.existsSync(build)?fs.mkdtempSync(path.join(process.env.RUNNER_TEMP??"/tmp","phase8-build-")):null;
 if(buildSaved) fs.cpSync(build,buildSaved,{recursive:true});
 try{
  const p=run("v8-machine-pipeline.mjs",[id,"--publish"]);
  assert.equal(p.status,0,p.stderr||p.stdout);
  const generated=fs.readFileSync(path.join(build,"machine-package.generated.json"));
  const approved=fs.readFileSync(path.join(build,"machine-package.approved.json"));
  const published=fs.readFileSync(path.join(ROOT,`machines/${id}/machine-package.json`));
  assert.equal(generated.equals(approved),true);
  assert.equal(approved.equals(published),true);
  const pkg=JSON.parse(published);
  assert.equal(pkg.features.candidates.length,8);
  assert.equal(pkg.features.features.length,6);
  assert.equal(pkg.features.runtimeProjection.filter(x=>x.runtimeStatus==="ACTIVE").length,6);
  assert.equal(pkg.features.runtimeProjection.filter(x=>x.runtimeStatus==="INACTIVE").length,2);
  assert.equal(pkg.evidence.evidences.length,22);
  assert.equal(pkg.features.features.some(x=>["FEAT_MODE_AFTER_CHAIN","FEAT_TONEGAWA_DIRECT_FROM_HIRAMEKI"].includes(x.featureId)),false);
  assert.equal(pkg.inputs.inputs.some(x=>x.id==="OBS_OTHER"),false);
  const joint=pkg.features.features.find(x=>x.featureId==="FEAT_SETTING_DIFFERENCE_SMALL_ROLE_JOINT");
  assert.equal(joint.modelType,"multinomial");
  assert.equal(joint.derivedResidualCategory.id,"OBS_OTHER");
  assert.equal(pkg.provenance.legacyOracleUsed,false);
  const catalog=read(path.join(ROOT,"catalog.json"));
  const entry=catalog.machines.find(x=>x.machineId===id);
  assert.equal(entry.machineDataVersion,pkg.machine.machineDataVersion);
  assert.equal(entry.packageSizeBytes,published.length);
  assert.equal(entry.sha256,sha(published));
  const registry=read(path.join(ROOT,"machine-registry.json"));
  assert.equal(registry.machines.find(x=>x.machineId===id).machineDataVersion,pkg.machine.machineDataVersion);
 } finally {
  for(const [r,b] of saved){const p=path.join(ROOT,r);if(b===null)fs.rmSync(p,{force:true});else{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,b);}}
  fs.rmSync(build,{recursive:true,force:true});
  if(buildSaved){fs.mkdirSync(build,{recursive:true});fs.cpSync(buildSaved,build,{recursive:true});fs.rmSync(buildSaved,{recursive:true,force:true});}
 }
});
