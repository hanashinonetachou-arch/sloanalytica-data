import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const command = args[0];
const machineId = args[1];

function runNode(script, scriptArgs, label) {
  const r = spawnSync(process.execPath, [path.join(ROOT, 'tools', script), ...scriptArgs], { cwd: ROOT, stdio: 'inherit' });
  if (r.error) throw r.error;
  if (r.status !== 0) throw new Error(`${label} failed with exit code ${r.status}`);
}

const publish = spawnSync(process.execPath, [path.join(ROOT, 'tools', 'publish-machine-data.mjs'), ...args], { cwd: ROOT, stdio: 'inherit' });
if (publish.error) throw publish.error;
if (publish.status !== 0) process.exit(publish.status ?? 1);

if (command === 'publish' && machineId && args.includes('--apply')) {
  const researchDir = path.join(ROOT, 'research', machineId);
  const researchPath = path.join(researchDir, 'research-data.json');
  const selectionPath = path.join(researchDir, 'selection-data.json');
  const settingBandPath = path.join(researchDir, 'setting-band-report.json');

  if (!fs.existsSync(settingBandPath)) {
    if (!fs.existsSync(researchPath) || !fs.existsSync(selectionPath)) {
      throw new Error(`${machineId}: setting-band source data is missing`);
    }
    console.log(`Setting Band report missing; generating before difficulty catalog sync: ${machineId}`);
    runNode('refine-setting-band-games.mjs', [researchPath, selectionPath, settingBandPath], 'setting-band refinement');
  }
  runNode('sync-machine-difficulty-catalog.mjs', [machineId], 'difficulty catalog sync with setting band');
}

process.exit(0);
