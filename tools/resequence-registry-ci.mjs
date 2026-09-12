import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

function run(command, args) {
  const r = spawnSync(command, args, { stdio: 'inherit', encoding: 'utf8' });
  if (r.error) throw r.error;
  if (r.status !== 0) process.exit(r.status ?? 1);
}

const branch = process.env.GITHUB_HEAD_REF || process.env.GITHUB_REF_NAME || '';
if (branch !== 'chore/20260912-resequence-provisional-registration-ids') {
  console.log(`Registry resequence CI skipped on branch: ${branch || '<unknown>'}`);
  process.exit(0);
}

run(process.execPath, ['tools/sync-machine-registry.mjs']);
run(process.execPath, ['tools/validate-machine-registry.mjs', 'machine-registry.json']);

const catalog = JSON.parse(fs.readFileSync('catalog.json', 'utf8'));
const registry = JSON.parse(fs.readFileSync('machine-registry.json', 'utf8'));
const expected = [...catalog.machines].sort((a, b) =>
  a.introductionDate.localeCompare(b.introductionDate) || a.machineId.localeCompare(b.machineId)
);
const byId = new Map(registry.machines.map(machine => [machine.machineId, machine]));
if (registry.machines.length !== expected.length) {
  throw new Error(`Registry/catalog count mismatch: ${registry.machines.length} != ${expected.length}`);
}
for (let index = 0; index < expected.length; index += 1) {
  const source = expected[index];
  const machine = byId.get(source.machineId);
  if (!machine) throw new Error(`Missing registry machine: ${source.machineId}`);
  if (machine.provisionalRegistrationId !== index + 1) {
    throw new Error(`ID mismatch ${source.machineId}: ${machine.provisionalRegistrationId} != ${index + 1}`);
  }
  if (machine.releaseDate !== source.introductionDate) {
    throw new Error(`releaseDate mismatch ${source.machineId}: ${machine.releaseDate} != ${source.introductionDate}`);
  }
}
console.log(`Chronological provisional IDs verified: ${expected.length} machines`);

const diff = spawnSync('git', ['diff', '--quiet', '--', 'machine-registry.json']);
if (diff.status === 0) {
  console.log('machine-registry.json already up to date.');
  process.exit(0);
}
run('git', ['config', 'user.name', 'github-actions[bot]']);
run('git', ['config', 'user.email', '41898282+github-actions[bot]@users.noreply.github.com']);
run('git', ['add', 'machine-registry.json']);
run('git', ['commit', '-m', 'Registry: apply chronological provisional IDs']);
run('git', ['push', 'origin', `HEAD:${branch}`]);
