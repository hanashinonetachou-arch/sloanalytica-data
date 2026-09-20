import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Some audit tests intentionally regenerate tracked diagnostics. Restore them after the suite so tests remain side-effect free.
const guardedPaths = [
  path.join(ROOT, 'machine-registry.json'),
  path.join(ROOT, 'reports', 'v64-observation-debt-classification.json'),
];
const guardedBackups = new Map(guardedPaths.map(filePath => [
  filePath,
  fs.existsSync(filePath) ? fs.readFileSync(filePath) : null,
]));
const testDir = path.join(ROOT, 'test');
// Historical M7 audit tests are preserved for explicit legacy runs, but no longer gate
// the active research/build regression suite. They depend on frozen audit reports and
// historical commit objects rather than the current Machine Research pipeline.
const legacyM7AuditTests = new Set([
  'm7-controlled-lineage-workqueue.test.mjs',
  'm7-full-fleet-migration-audit.test.mjs',
  'm7-lineage-resolution-plan.test.mjs',
  'm7-observation-contract-completion-audit.test.mjs',
  'm7-proof-formalization-batch1.test.mjs',
]);
const testFiles = fs.readdirSync(testDir)
  .filter(name => name.endsWith('.test.mjs') && !legacyM7AuditTests.has(name))
  .sort()
  .map(name => path.join('test', name));

let status = 1;
try {
  const r = spawnSync(process.execPath, ['--test', '--test-concurrency=1', ...testFiles], {
    cwd: ROOT,
    stdio: 'inherit',
    shell: false,
  });
  if (r.error) throw r.error;
  status = r.status ?? 1;
} finally {
  for (const [filePath, backup] of guardedBackups) {
    if (backup !== null) {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, backup);
    } else if (fs.existsSync(filePath)) {
      fs.rmSync(filePath, { force: true });
    }
  }
}

process.exit(status);