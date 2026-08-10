import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validateResearchData } from '../tools/validate-research-data.mjs';

const template = JSON.parse(fs.readFileSync(new URL('../research/_template/research-data.json', import.meta.url), 'utf8'));
const clone = () => structuredClone(template);

test('ResearchData template is valid', () => {
  const report = validateResearchData(clone());
  assert.equal(report.status, 'PASS');
  assert.equal(report.errors.length, 0);
});

test('unknown source reference fails', () => {
  const data = clone();
  data.features[0].sourceRefs = ['UNKNOWN'];
  const report = validateResearchData(data);
  assert.equal(report.status, 'FAIL');
  assert.ok(report.errors.some((e) => e.code === 'SOURCE_REF_UNKNOWN'));
});

test('probability outside 0..1 fails', () => {
  const data = clone();
  data.features[0].settingValues.SET_1.probability = 1.2;
  const report = validateResearchData(data);
  assert.equal(report.status, 'FAIL');
  assert.ok(report.errors.some((e) => e.code === 'PROBABILITY'));
});

test('evidence cannot reference nonexistent settings', () => {
  const data = clone();
  data.evidenceCandidates.push({
    researchEvidenceId: 'RE01', name: 'test', factStatus: 'verified',
    allowedSettings: ['SET_99'], deniedSettings: [], sourceRefs: ['SRC01']
  });
  const report = validateResearchData(data);
  assert.equal(report.status, 'FAIL');
  assert.ok(report.errors.some((e) => e.code === 'EVIDENCE_SETTING_UNKNOWN'));
});

test('ratio mismatch produces warning only', () => {
  const data = clone();
  data.features[0].settingValues.SET_1.probability = 0.02;
  const report = validateResearchData(data);
  assert.equal(report.status, 'PASS');
  assert.ok(report.warnings.some((e) => e.code === 'PROBABILITY_RATIO_MISMATCH'));
});
