import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const registryPath = path.join(ROOT, 'machine-registry.json');
const registryBackup = fs.existsSync(registryPath) ? fs.readFileSync(registryPath) : null;
const testDir = path.join(ROOT, 'test');
const testFiles = fs.readdirSync(testDir)
  .filter(name => name.endsWith('.test.mjs'))
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
  if (registryBackup !== null) {
    fs.writeFileSync(registryPath, registryBackup);
  } else if (fs.existsSync(registryPath)) {
    fs.rmSync(registryPath, { force: true });
  }
}

process.exit(status);
