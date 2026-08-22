import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

test('Phase 12 audited 101-machine baseline is preserved while catalog may grow',()=>{
  const r=spawnSync(process.execPath,['tools/audit-phase12-baseline.mjs','.'],{encoding:'utf8'});
  assert.equal(r.status,0,`${r.stdout}\n${r.stderr}`);
  assert.match(r.stdout,/Phase 12 Baseline Audit: PASS \/ baseline 101 \/ current \d+/);
});

test('batch e2e uses strict Research and Selection pipelines',()=>{
  const text=fs.readFileSync('tools/batch-e2e-orchestrator.mjs','utf8');
  assert.match(text,/strict-batch-research-pipeline\.mjs/);
  assert.match(text,/strict-batch-selection-pipeline\.mjs/);
});
