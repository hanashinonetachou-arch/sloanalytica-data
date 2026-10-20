import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPORT = path.join(ROOT, 'reports', 'machine-data-health-v2.ci.json');

test('MachineData health v2 completes across the published build set', () => {
  const r = spawnSync(process.execPath, ['tools/audit-machine-data-health-v2.mjs', '--json-out', path.relative(ROOT, REPORT)], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  process.stdout.write(r.stdout ?? '');
  process.stderr.write(r.stderr ?? '');
  assert.equal(r.status, 0, 'health audit process must complete');
  const report = JSON.parse(fs.readFileSync(REPORT, 'utf8'));
  assert.ok(report.machineCount >= 100, `expected >=100 machine packages, got ${report.machineCount}`);
  assert.equal(report.machineCount, report.counts.PASS + report.counts.REVIEW + report.counts.HIGH_RISK);
  assert.ok(Array.isArray(report.priority));
  fs.rmSync(REPORT, {force:true});
});
