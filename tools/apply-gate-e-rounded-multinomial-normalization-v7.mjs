import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

// Keep statistical/difficulty calculations semantically aligned with the runtime
// package probabilities when Selection explicitly opts into rounded-category
// normalization. ResearchData itself remains untouched.
const builderPath = path.join(ROOT, 'tools', 'build-machine-data.mjs');
let builder = fs.readFileSync(builderPath, 'utf8');
const oldBuilderLine = '  return excluded.size?probs.map(v=>v/sum):probs;';
const newBuilderLine = '  return (excluded.size||sf.normalizeRoundedCategoryProbabilities===true)?probs.map(v=>v/sum):probs;';
if (builder.includes(oldBuilderLine)) {
  builder = builder.replace(oldBuilderLine, newBuilderLine);
  fs.writeFileSync(builderPath, builder);
} else if (!builder.includes(newBuilderLine)) {
  throw new Error('build-machine-data.mjs normalization hook not found');
}

const targets = [
  ['L_TAKT_OP_DESTINY_M1', 'FEAT_CZ_TYPE', ['SET_2']],
  ['L_BIOHAZARD_RE3_ZD', 'FEAT_NE_POINT_DISTRIBUTION', ['SET_3','SET_4','SET_6']],
  ['L_BIG_DREAM_GOLDEN_PUSHER_KR', 'FEAT_STATION_INITIAL_BALLS', ['SET_6']],
];

let changed = 0;
for (const [machineId, featureId, expectedRoundedSettings] of targets) {
  const selectionPath = path.join(ROOT, 'research', machineId, 'selection-data.json');
  const researchPath = path.join(ROOT, 'research', machineId, 'research-data.json');
  const selection = JSON.parse(fs.readFileSync(selectionPath, 'utf8'));
  const research = JSON.parse(fs.readFileSync(researchPath, 'utf8'));
  const sf = (selection.features ?? []).find(x => x.featureId === featureId);
  if (!sf) throw new Error(`${machineId}/${featureId}: Selection feature not found`);
  if (sf.adoptionCategory === 'EXCLUDE') throw new Error(`${machineId}/${featureId}: feature is excluded`);
  const rf = (research.features ?? []).find(x => x.researchFeatureId === sf.researchFeatureId);
  if (!rf || rf.candidateModel !== 'multinomial') throw new Error(`${machineId}/${featureId}: Research multinomial not found`);

  const roundedSettings = [];
  for (const setting of research.machine?.settings ?? []) {
    const dist = rf.settingDistributions?.[setting];
    if (!dist) throw new Error(`${machineId}/${featureId}/${setting}: distribution missing`);
    const values = (rf.categories ?? []).map(cat => Number(dist[cat]));
    if (values.some(v => !Number.isFinite(v) || v < 0)) throw new Error(`${machineId}/${featureId}/${setting}: invalid probability`);
    const sum = values.reduce((a,b) => a+b, 0);
    const delta = Math.abs(sum - 1);
    if (delta > 0.005 + 1e-12) throw new Error(`${machineId}/${featureId}/${setting}: normalization exceeds 0.5%: ${sum}`);
    if (delta > 1e-6) roundedSettings.push(setting);
  }
  const actual = [...roundedSettings].sort().join(',');
  const expected = [...expectedRoundedSettings].sort().join(',');
  if (actual !== expected) throw new Error(`${machineId}/${featureId}: rounded settings drift: actual=${actual} expected=${expected}`);
  if (sf.normalizeRoundedCategoryProbabilities !== true) {
    sf.normalizeRoundedCategoryProbabilities = true;
    changed++;
  }
  fs.writeFileSync(selectionPath, JSON.stringify(selection, null, 2) + '\n');
  console.log(`PASS ${machineId}/${featureId}: explicit rounded multinomial normalization (${actual})`);
}

if (changed !== 3) throw new Error(`expected exactly 3 Selection changes, got ${changed}`);
console.log('PASS Gate E rounded multinomial remediation: Research values unchanged / Selection normalization contract enabled for 3 features');
