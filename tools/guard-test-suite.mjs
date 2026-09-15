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
const testFiles = fs.readdirSync(testDir)
  .filter(name => name.endsWith('.test.mjs'))
  .sort()
  .map(name => path.join('test', name));

function runTests(files, stdio = 'inherit') {
  return spawnSync(process.execPath, ['--test', '--test-concurrency=1', ...files], {
    cwd: ROOT,
    stdio,
    shell: false,
    encoding: stdio === 'pipe' ? 'utf8' : undefined,
  });
}

let status = 1;
try {
  const r = runTests(testFiles);
  if (r.error) throw r.error;
  status = r.status ?? 1;

  // Node's aggregate test runner can occasionally return non-zero without a useful
  // failing-file line in CI output. Preserve the failure, but rerun files one by one
  // only on that path so the actual offender is reported instead of weakening the gate.
  if (status !== 0) {
    console.error(`TEST SUITE FAILED: status=${String(r.status)} signal=${String(r.signal)}`);
    const failedFiles = [];
    for (const testFile of testFiles) {
      const single = runTests([testFile], 'pipe');
      if (single.error) throw single.error;
      if ((single.status ?? 1) !== 0) {
        failedFiles.push(testFile);
        console.error(`FAILED TEST FILE: ${testFile} status=${String(single.status)} signal=${String(single.signal)}`);
        if (single.stdout) process.stderr.write(single.stdout);
        if (single.stderr) process.stderr.write(single.stderr);
      }
    }
    if (failedFiles.length === 0) {
      console.error('FAILED TEST FILE: none reproduced individually; aggregate runner failure only');
    }
  }
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