import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const researchRoot = path.join(root, 'research');
const summaryPath = path.join(root, 'reports', 'setting-band-batch-report.json');

const dirs = fs.readdirSync(researchRoot, { withFileTypes: true })
  .filter(d => d.isDirectory() && !d.name.startsWith('_'))
  .map(d => d.name)
  .sort();

const results = [];
for (const machineId of dirs) {
  const researchPath = path.join('research', machineId, 'research-data.json');
  const selectionPath = path.join('research', machineId, 'selection-data.json');
  const outputPath = path.join('research', machineId, 'setting-band-report.json');
  if (!fs.existsSync(path.join(root, researchPath)) || !fs.existsSync(path.join(root, selectionPath))) {
    results.push({ machineId, status: 'SKIP', reason: 'research-data.json or selection-data.json missing' });
    continue;
  }

  process.stdout.write(`\n[${machineId}] setting-band refine...\n`);
  const run = spawnSync(process.execPath, [
    path.join('tools', 'refine-setting-band-games.mjs'),
    researchPath,
    selectionPath,
    outputPath,
  ], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

  if (run.stdout) process.stdout.write(run.stdout);
  if (run.stderr) process.stderr.write(run.stderr);
  if (run.status !== 0) {
    results.push({ machineId, status: 'ERROR', exitCode: run.status });
    continue;
  }

  const report = JSON.parse(fs.readFileSync(path.join(root, outputPath), 'utf8'));
  results.push({
    machineId,
    status: report.status,
    reason: report.reason ?? null,
    analyzableFeatureCount: report.analyzableFeatureIds?.length ?? 0,
    excludedAdoptedFeatureIds: report.excludedAdoptedFeatureIds ?? [],
    results: report.results ?? [],
  });
}

const counts = results.reduce((acc, r) => {
  acc[r.status] = (acc[r.status] ?? 0) + 1;
  return acc;
}, {});
const summary = {
  analyzerVersion: 'setting-band-discrimination-g-v1.0-batch',
  generatedAt: new Date().toISOString(),
  machineCount: results.length,
  counts,
  machines: results,
};
fs.mkdirSync(path.dirname(summaryPath), { recursive: true });
fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2) + '\n');

console.log('\n=== SETTING BAND BATCH SUMMARY ===');
console.log(`MACHINES: ${results.length}`);
for (const [status, count] of Object.entries(counts).sort()) console.log(`${status}: ${count}`);
console.log(`Report: ${path.relative(root, summaryPath)}`);

if (counts.ERROR) process.exit(1);
