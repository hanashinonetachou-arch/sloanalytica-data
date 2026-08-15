import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from 'node:url';
import { spawnSync } from "node:child_process";

const root=fileURLToPath(new URL("..",import.meta.url));
const cli=path.join(root,"tools","publish-machine-data.mjs");

function snapshotFiles(paths){
 return paths.map(filePath=>({filePath,exists:fs.existsSync(filePath),bytes:fs.existsSync(filePath)?fs.readFileSync(filePath):null}));
}
function restoreFiles(snapshot){
 for(const item of snapshot){
   if(item.exists){ fs.mkdirSync(path.dirname(item.filePath),{recursive:true}); fs.writeFileSync(item.filePath,item.bytes); }
   else fs.rmSync(item.filePath,{force:true});
 }
}
function publishArtifacts(id){
 const build=path.join(root,"build",id);
 return [path.join(build,"machine-package.approved.json"),path.join(build,"approval.json"),path.join(build,"publish-report.json")];
}

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
 const snapshot=snapshotFiles(publishArtifacts(id));
 try{
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
 }finally{ restoreFiles(snapshot); }
});
test("approval becomes invalid after approved package changes",()=>{
 const id="S_EUREKA_SEVEN_HIEVO_XS";
 const snapshot=snapshotFiles(publishArtifacts(id));
 try{
  const build=path.join(root,"build",id);
  const approved=path.join(build,"machine-package.approved.json");
  const golden=path.join(root,"machines",id,"machine-package.json");
  fs.copyFileSync(golden,approved);
  const a=spawnSync(process.execPath,[cli,"approve",id,approved],{cwd:root,encoding:"utf8"});
  assert.equal(a.status,0);
  const changed=JSON.parse(fs.readFileSync(approved,"utf8"));
  changed.machine.displayName=`${changed.machine.displayName} (changed)`;
  fs.writeFileSync(approved,JSON.stringify(changed,null,2)+"\n","utf8");
  const statusResult=spawnSync(process.execPath,[cli,"status",id],{cwd:root,encoding:"utf8"});
  assert.equal(statusResult.status,0);
  assert.equal(JSON.parse(statusResult.stdout).approvalValid,false);
 }finally{ restoreFiles(snapshot); }
});
test("approve canonicalizes CRLF package bytes to LF before hashing",()=>{
 const id="S_EUREKA_SEVEN_HIEVO_XS";
 const snapshot=snapshotFiles(publishArtifacts(id));
 const build=path.join(root,"build",id);
 const source=path.join(build,"machine-package.crlf-source.json");
 try{
  fs.mkdirSync(build,{recursive:true});
  const golden=path.join(root,"machines",id,"machine-package.json");
  const approved=path.join(build,"machine-package.approved.json");
  const lf=fs.readFileSync(golden,"utf8").replace(/\r\n/g,"\n");
  fs.writeFileSync(source,lf.replace(/\n/g,"\r\n"),"utf8");
  const a=spawnSync(process.execPath,[cli,"approve",id,source],{cwd:root,encoding:"utf8"});
  assert.equal(a.status,0,a.stderr||a.stdout);
  const bytes=fs.readFileSync(approved);
  assert.equal(bytes.includes(Buffer.from("\r\n")),false);
  assert.equal(bytes.toString("utf8"),`${JSON.stringify(JSON.parse(lf),null,2)}\n`);
 }finally{ fs.rmSync(source,{force:true}); restoreFiles(snapshot); }
});
