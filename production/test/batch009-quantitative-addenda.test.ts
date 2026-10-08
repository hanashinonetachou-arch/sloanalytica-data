import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {validateCategoryRates} from '../src/batch009-rate-matrix.ts';

const root = path.resolve('batches', 'batch-20261008-009');
const read = (relative: string) => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
function validateRows(f: any, settings: Array<string|number>) {
  assert.deepEqual(Object.keys(f.settingPercentRows), settings.map(String));
  const table = {
    settings: settings.map(String),
    categories: f.categories,
    percentRows: settings.map((s) => f.settingPercentRows[String(s)])
  };
  assert.deepEqual(validateCategoryRates(table), [], f.findingId);
}
test('Sister Quest screen/monster categorical rates preserve six-setting coverage', () => {
  const d = read('research-quantitative-addenda/L_SISTER_QUEST_CA.json');
  assert.equal(d.status, 'SOURCE_CROSSCHECKED_NOT_CANONICAL');
  const screen = d.findings.find((f: any) => f.findingId === 'at-end-setting-distribution');
  const monster = d.findings.find((f: any) => f.findingId === 'at-monster-setting-distribution');
  assert.ok(screen && monster);
  validateRows(screen, [1,2,3,4,5,6]);
  validateRows(monster, [1,2,3,4,5,6]);
  assert.equal(screen.categories.length, 7);
  assert.equal(monster.categories.length, 4);
});
test('BIG島唄 conditional outcomes are source-tracked and omit nonexistent setting 4', () => {
  const d = read('research-quantitative-addenda/S_BIG_SHIMAUTA_E2_30.json');
  assert.deepEqual(d.settings, [1,2,3,5,6]);
  assert.equal(d.status, 'SOURCE_CROSSCHECKED_NOT_CANONICAL');
  for (const id of ['non-watermelon-non-confirmed-seesa-distribution','watermelon-seesa-distribution']) {
    const f = d.findings.find((x: any) => x.findingId === id);
    assert.ok(f);
    validateRows(f, d.settings);
  }
  assert.notEqual(d.findings[1].trialUniverse, d.findings[2].trialUniverse);
});
test('緑ドン reach-me replay retains all six public rates while research remains pending', () => {
  const d = read('research-evidence-staged/wave-1/L_MIDORIDON_VIVA_REVIVAL_FY.json');
  const f = d.findings.find((x: any) => x.findingId === 'reach-me-replay');
  assert.ok(f);
  assert.deepEqual(f.settingDistribution, {'1':'1/2978.9','2':'1/2978.9','3':'1/2520.6','4':'1/2520.6','5':'1/2048.0','6':'1/2048.0'});
  assert.notEqual(d.researchCompleteness.status, 'COMPLETE');
  assert.equal(f.liveObservation.status, 'REQUIRES_FINAL_SCOPE_VALIDATION');
});
test('バイオ5 special 256枚 is a noncontiguous setting constraint', () => {
  const d = read('research-evidence-reviewed/L_BIOHAZARD5_ZE.json');
  const f = d.evidenceCandidates.find((x: any) => x.findingId === 'special-medal');
  assert.ok(f);
  const c = f.semanticCategories.find((x: any) => x.label === '256枚OVER');
  assert.equal(c?.semanticType, 'EXACT_CONSTRAINT');
  assert.equal(c?.meaning, '設定2・5・6');
  assert.equal(f.semanticCategories.some((x: any) => x.label === '246枚OVER'), false);
});
