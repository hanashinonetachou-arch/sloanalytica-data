import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const research = JSON.parse(fs.readFileSync(new URL('../research/L_TOARU_ACCELERATOR_RZ/research-data.json', import.meta.url), 'utf8'));
const byId = new Map((research.features ?? []).map(f => [f.researchFeatureId, f]));

function probability(featureId, setting) {
  return Number(byId.get(featureId)?.settingValues?.[setting]?.probability);
}

test('Accelerator SET_3 CZ components agree with published CZ total within rounding tolerance', () => {
  const accel = probability('RF_CZ_ACCEL', 'SET_3');
  const last = probability('RF_CZ_LASTORDER', 'SET_3');
  const dual = probability('RF_CZ_DUAL', 'SET_3');
  const total = probability('RF_CZ_TOTAL', 'SET_3');
  for (const value of [accel, last, dual, total]) assert.ok(Number.isFinite(value));
  assert.ok(Math.abs((accel + last + dual) - total) <= 1e-6);
});

test('Accelerator derived CZ outcome uses the same SET_3 DUAL_CZ probability as resolved scalar feature', () => {
  const dual = probability('RF_CZ_DUAL', 'SET_3');
  const outcome = Number(byId.get('RF_CZ_OUTCOME')?.settingDistributions?.SET_3?.DUAL_CZ);
  assert.equal(outcome, dual);
});

test('Accelerator SET_3 dual-CZ source conflict remains auditable', () => {
  const conflict = (research.conflicts ?? []).find(c => c.conflictId === 'CONFLICT_CZ_DUAL_SET3');
  assert.equal(conflict?.status, 'RESOLVED');
  assert.equal(conflict?.resolution, '1/1182.1');
  assert.ok((conflict?.candidates ?? []).some(c => c.sourceRef === 'SRC_NANA' && c.rawDisplay === '1/1058.9'));
  assert.ok((conflict?.candidates ?? []).some(c => c.sourceRef === 'SRC_1GEKI_CZ' && c.rawDisplay === '1/1182.1'));
});
