import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MACHINE_IDS = [
  'S_GAMERA2',
  'S_WORD_OF_LIGHTS_2',
  'L_ZOMBIE_LAND_SAGA',
  'L_ONE_PUNCH_MAN',
];

let changedFiles = 0;
let changedFeatures = 0;

for (const machineId of MACHINE_IDS) {
  const file = path.join(ROOT, 'research', machineId, 'research-data.json');
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  let changed = false;

  for (const feature of data.features ?? []) {
    if (feature?.candidateModel !== 'multinomial') continue;
    if (feature.settingValues !== undefined) continue;
    feature.settingValues = {};
    changed = true;
    changedFeatures += 1;
  }

  if (changed) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8');
    changedFiles += 1;
  }
}

console.log(`Normalized multinomial ResearchData: ${changedFeatures} features / ${changedFiles} files`);
