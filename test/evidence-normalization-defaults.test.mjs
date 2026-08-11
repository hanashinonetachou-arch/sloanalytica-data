import test from"node:test";import assert from"node:assert/strict";import fs from"node:fs";import path from"node:path";import{spawnSync}from"node:child_process";
const root=path.resolve(new URL("..",import.meta.url).pathname);
const spec=path.join(root,"build","L_TOKYO_GHOUL","evidence-ui.json");
const research=path.join(root,"research","L_TOKYO_GHOUL","research-data.json");
test("unselected means no Evidence",()=>{
 const p=spawnSync(process.execPath,[path.join(root,"tools","normalize-evidence.mjs"),spec,research,"{}"],{cwd:root,encoding:"utf8"});
 assert.equal(p.status,0);
 const out=JSON.parse(p.stdout);
 assert.equal(out.hasEvidence,false);
 assert.deepEqual(out.remainingSettings,["SET_1","SET_2","SET_3","SET_4","SET_5","SET_6"]);
});
test("SET_2_OR_HIGHER works",()=>{
 const p=spawnSync(process.execPath,[path.join(root,"tools","normalize-evidence.mjs"),spec,research,'{"SETTING_FLOOR":"SET_2_OR_HIGHER"}'],{cwd:root,encoding:"utf8"});
 assert.equal(p.status,0);
 const out=JSON.parse(p.stdout);
 assert.equal(out.hasEvidence,true);
 assert.deepEqual(out.remainingSettings,["SET_2","SET_3","SET_4","SET_5","SET_6"]);
});
