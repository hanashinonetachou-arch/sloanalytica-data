import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const load = path => JSON.parse(fs.readFileSync(new URL(path, import.meta.url), 'utf8'));
const research = load('../research/L_TOARU_ACCELERATOR_RZ/research-data.json');
const selection = load('../research/L_TOARU_ACCELERATOR_RZ/selection-data.json');
const observation = load('../research/L_TOARU_ACCELERATOR_RZ/machine-observation-data.json');
const rf = id => research.features.find(f => f.researchFeatureId === id);
const sf = id => selection.features.find(f => f.researchFeatureId === id);
const input = id => selection.inputs.find(i => i.id === id);

const typeIds = ['INP_CZ_ACCEL_COUNT', 'INP_CZ_LASTORDER_COUNT', 'INP_CZ_DUAL_COUNT'];

test('Accelerator preserves legacy CZ total as hidden compatibility input', () => {
  const legacy = input('INP_CZ_TOTAL_COUNT');
  assert.equal(legacy?.inputVisible, false);
  assert.deepEqual(input('INP_CZ_TOTAL_RESOLVED')?.derivedFromInputIds, ['INP_CZ_TOTAL_COUNT', ...typeIds]);
  assert.equal(input('INP_CZ_TOTAL_RESOLVED')?.derivedCalculation, 'sum');
  assert.equal(sf('RF_CZ_TOTAL')?.numeratorInputId, 'INP_CZ_TOTAL_RESOLVED');
});

test('Accelerator typed CZ total excludes legacy unknown-type history', () => {
  const typed = input('INP_CZ_TYPED_TOTAL');
  assert.equal(typed?.inputVisible, false);
  assert.equal(typed?.derivedCalculation, 'sum');
  assert.deepEqual(typed?.derivedFromInputIds, typeIds);
  assert.equal(sf('RF_CZ_TYPE_COMPOSITION')?.denominatorInputId, 'INP_CZ_TYPED_TOTAL');
});

test('Accelerator conditional CZ type composition is a complete distribution', () => {
  const composition = rf('RF_CZ_TYPE_COMPOSITION');
  assert.equal(composition?.candidateModel, 'multinomial');
  assert.deepEqual(composition?.categories, ['ACCEL_CZ', 'LASTORDER_CZ', 'DUAL_CZ']);
  for (const setting of research.machine.settings) {
    const dist = composition.settingDistributions[setting];
    const sum = Object.values(dist).reduce((a, b) => a + Number(b), 0);
    assert.ok(Math.abs(sum - 1) < 1e-12, `${setting} sum=${sum}`);
  }
});

test('Accelerator total-rate times conditional composition reproduces component rates within published rounding', () => {
  const composition = rf('RF_CZ_TYPE_COMPOSITION');
  const total = rf('RF_CZ_TOTAL');
  const componentIds = { ACCEL_CZ: 'RF_CZ_ACCEL', LASTORDER_CZ: 'RF_CZ_LASTORDER', DUAL_CZ: 'RF_CZ_DUAL' };
  for (const setting of research.machine.settings) {
    const totalP = Number(total.settingValues[setting].probability);
    for (const [category, featureId] of Object.entries(componentIds)) {
      const reconstructed = totalP * Number(composition.settingDistributions[setting][category]);
      const publishedComponent = Number(rf(featureId).settingValues[setting].probability);
      assert.ok(Math.abs(reconstructed - publishedComponent) < 3e-6, `${setting}/${category}`);
    }
  }
});

test('Accelerator Observation maps type counting to the new support feature', () => {
  const obs = observation.observations.find(o => o.observationId === 'OBS_CZ_TYPE_DIRECT');
  const mapping = observation.featureMappings.find(m => m.featureId === 'FEAT_CZ_TYPE_COMPOSITION');
  assert.equal(obs?.status, 'FOUND');
  assert.ok(mapping?.observationIds?.includes('OBS_CZ_TYPE_DIRECT'));
  assert.equal(mapping?.usableForInference, true);
  assert.equal(mapping?.usableForDifficulty, false);
});
