import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('Phase 9 dependency audit has no unresolved or high-risk double counting', () => {
  const out = path.join(os.tmpdir(), `sloanalytica-phase9-${process.pid}.json`);
  const r = spawnSync(process.execPath, ['tools/audit-feature-dependency-phase9.mjs', '.', out], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  assert.equal(r.status, 0, `${r.stdout}\n${r.stderr}`);
  const report = JSON.parse(fs.readFileSync(out, 'utf8'));
  fs.rmSync(out, { force: true });

  // Phase 12 fixes 101 published machines as the audited baseline, but a
  // pre-publish batch may legitimately generate additional machine packages.
  // This audit must therefore cover every package currently present rather
  // than hard-code the historical baseline count.
  assert.ok(report.summary.machineCount >= 101);
  assert.equal(report.summary.HIGH_RISK, 0);
  assert.equal(report.summary.REVIEW, 0);
  assert.equal(report.summary.PASS, report.summary.machineCount);
});
