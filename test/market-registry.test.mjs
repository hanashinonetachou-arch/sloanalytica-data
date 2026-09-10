import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from 'node:url';
import { spawnSync } from "node:child_process";
const root=fileURLToPath(new URL("..",import.meta.url));

test("market snapshot validates",()=>{
  const r=spawnSync(process.execPath,[path.join(root,"tools","validate-market-snapshot.mjs"),path.join(root,"market-snapshot.json")],{cwd:root,encoding:"utf8"});
  assert.equal(r.status,0);
  assert.match(r.stdout,/9機種/);
});

test("missing status consistently reports active unmatched market machines",()=>{
  const r=spawnSync(process.execPath,[path.join(root,"tools","machine-registry-status.mjs"),"--missing"],{cwd:root,encoding:"utf8"});
  assert.equal(r.status,0);
  const summary=r.stdout.match(/稼働中未収録候補: (\d+)（Registry (\d+) \/ Market未紐付け (\d+)）/);
  assert.ok(summary,"active-unmatched summary must be present");
  const total=Number(summary[1]);
  const registryUnmatched=Number(summary[2]);
  const marketUnmatched=Number(summary[3]);
  assert.equal(total,registryUnmatched+marketUnmatched,"summary total must equal Registry + Market unmatched counts");
  const detailLines=r.stdout.split(/\r?\n/).filter(line=>line.includes("市場:ACTIVE") && line.includes("アプリ:NOT_STARTED"));
  assert.equal(detailLines.length,total,"every active unmatched candidate must have one detail line");
});

test("market status separates scheduled machine",()=>{
  const r=spawnSync(process.execPath,[path.join(root,"tools","machine-registry-status.mjs"),"--market"],{cwd:root,encoding:"utf8"});
  assert.equal(r.status,0);
  assert.match(r.stdout,/導入予定未紐付け: 1/);
  assert.match(r.stdout,/喰霊/);
});

test("market merge never invents registry IDs for unmatched machines",()=>{
  const before=JSON.parse(fs.readFileSync(path.join(root,"machine-registry.json"),"utf8")).machines.length;
  const r=spawnSync(process.execPath,[path.join(root,"tools","merge-market-snapshot.mjs")],{cwd:root,encoding:"utf8"});
  assert.equal(r.status,0);
  const after=JSON.parse(fs.readFileSync(path.join(root,"machine-registry.json"),"utf8")).machines.length;
  assert.equal(after,before,"market merge must never create registry machines");
  const report=JSON.parse(fs.readFileSync(path.join(root,"reports","market-registry-merge.json"),"utf8"));
  assert.ok(Array.isArray(report.unmatched));
  assert.ok(report.unmatched.every(x=>x.registryMachineId===null),"all unmatched market rows must keep registryMachineId=null rather than inventing IDs");
});
