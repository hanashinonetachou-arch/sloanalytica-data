import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

test('Phase 11 user-facing audit has no ERROR or unresolved REVIEW',()=>{
 const root=path.resolve('.');
 const out=path.join(os.tmpdir(),`sloanalytica-phase11-${process.pid}.json`);
 const run=spawnSync(process.execPath,[path.join(root,'tools','audit-user-facing-phase11.mjs'),root,out],{encoding:'utf8'});
 assert.equal(run.status,0,`${run.stdout}\n${run.stderr}`);
 const report=JSON.parse(fs.readFileSync(out,'utf8'));
 // Phase 12 preserves 101 published machines as the audited baseline, while
 // pre-publish batches may add generated packages before catalog publication.
 assert.ok(report.summary.machineCount>=101);
 assert.equal(report.summary.error,0,run.stdout);
 assert.equal(report.summary.review,0,run.stdout);
 assert.equal(report.summary.pass,report.summary.machineCount,run.stdout);
 fs.rmSync(out,{force:true});
});
