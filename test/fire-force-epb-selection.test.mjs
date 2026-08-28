import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const research = JSON.parse(fs.readFileSync('research/L_ENEN_NO_SHOUBOUTAI_JG/research-data.json', 'utf8'));
const selection = JSON.parse(fs.readFileSync('research/L_ENEN_NO_SHOUBOUTAI_JG/selection-data.json', 'utf8'));

const rf = id => research.features.find(f => f.researchFeatureId === id);
const sf = id => selection.features.find(f => f.researchFeatureId === id);

test('Fire Force EPB-after-initial is explicitly selected as conditional support', () => {
  const feature = sf('RF_EPB_AFTER_INITIAL');
  assert.ok(feature, 'RF_EPB_AFTER_INITIAL must not disappear between Research and Selection');
  assert.equal(feature.featureId, 'FEAT_EPB_AFTER_INITIAL');
  assert.equal(feature.adoptionCategory, 'INCLUDE_SUPPORT');
  assert.equal(feature.numeratorInputId, 'INP_EPB_AFTER_INITIAL');
  assert.equal(feature.denominatorInputId, 'INP_BONUS_INITIAL');
  assert.equal(feature.weight, 1);
  assert.equal(feature.difficultyParticipation, 'INCLUDE');
});

test('Fire Force EPB input remains optional until actually observed', () => {
  const input = selection.inputs.find(i => i.id === 'INP_EPB_AFTER_INITIAL');
  assert.ok(input);
  assert.equal(input.type, 'counter');
  assert.equal(input.defaultValue, null);
  assert.equal(input.category, 'EPB_AFTER_INITIAL');
});

test('Fire Force EPB difficulty exposure equals the published initial-bonus rate by setting', () => {
  const feature = sf('RF_EPB_AFTER_INITIAL');
  assert.equal(feature.difficultyExposure.mode, 'setting_rate');
  assert.equal(feature.difficultyExposure.quality, 'DERIVED');
  const initial = rf('RF_INITIAL');
  const share = rf('RF_BONUS_SHARE');
  for (const setting of research.machine.settings) {
    const expected = initial.settingValues[setting].probability * share.settingValues[setting].probability;
    const actual = feature.difficultyExposure.trialsPerGameBySetting[setting];
    assert.ok(Math.abs(actual - expected) < 1e-15, `${setting}: exposure mismatch`);
  }
});

test('Fire Force EPB Research probabilities preserve the 40-45 percent setting progression', () => {
  const epb = rf('RF_EPB_AFTER_INITIAL');
  assert.deepEqual(
    research.machine.settings.map(s => epb.settingValues[s].probability),
    [0.40, 0.41, 0.43, 0.44, 0.45]
  );
});
