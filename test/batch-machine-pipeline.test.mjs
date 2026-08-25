import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeMachineIds, classifyMachineQuality, deriveOverallStatus, generatedPaths } from '../tools/batch-machine-pipeline.mjs';

test('batch normalizes unique machine IDs', () => {
  assert.deepEqual(normalizeMachineIds(['A_ONE,B_TWO', 'A_ONE', 'C_THREE']), ['A_ONE', 'B_TWO', 'C_THREE']);
});

test('batch rejects invalid machine IDs', () => {
  assert.throws(() => normalizeMachineIds(['bad-id']), /invalid machineId/);
});

test('batch enforces 10-machine safety limit', () => {
  assert.throws(() => normalizeMachineIds(Array.from({ length: 11 }, (_, i) => `M_${i}`)), /batch size exceeds 10/);
});

test('batch rollback snapshot includes machine registry', () => {
  const paths = generatedPaths(['A_ONE']).map(p => p.replaceAll('\\', '/'));
  assert.ok(paths.some(p => p.endsWith('/machine-registry.json')));
});

test('clean validations and selection quality classify PASS', () => {
  assert.deepEqual(classifyMachineQuality({
    researchValidation: { status: 'PASS', warnings: [] },
    selectionValidation: { ok: true, warnings: [] },
    selectionQuality: { status: 'PASS', blockers: [], reviews: [] },
    research: { machine: { displayName: 'Machine' }, conflicts: [] },
  }), { status: 'PASS', reasons: [] });
});

test('selection quality blocker classifies BLOCKED before generation', () => {
  const result = classifyMachineQuality({
    researchValidation: { status: 'PASS', warnings: [] },
    selectionValidation: { ok: true, warnings: [] },
    selectionQuality: { status: 'BLOCKED', blockers: ['unclassified research feature: RF_X'], reviews: [] },
    research: { machine: { displayName: 'Machine' }, conflicts: [] },
  });
  assert.equal(result.status, 'BLOCKED');
  assert.deepEqual(result.reasons, ['Selection quality: unclassified research feature: RF_X']);
});

test('selection quality review classifies REVIEW', () => {
  const result = classifyMachineQuality({
    researchValidation: { status: 'PASS', warnings: [] },
    selectionValidation: { ok: true, warnings: [] },
    selectionQuality: { status: 'REVIEW', blockers: [], reviews: ['selected FEAT_X: reason is too generic'] },
    research: { machine: { displayName: 'Machine' }, conflicts: [] },
  });
  assert.equal(result.status, 'REVIEW');
  assert.ok(result.reasons.includes('Selection quality: selected FEAT_X: reason is too generic'));
});

test('warnings or provisional naming classify REVIEW', () => {
  const result = classifyMachineQuality({
    researchValidation: { status: 'PASS', warnings: [{ message: 'check source' }] },
    selectionValidation: { ok: true, warnings: [] },
    selectionQuality: { status: 'PASS', blockers: [], reviews: [] },
    research: { machine: { displayName: 'Machine（暫定版）' }, conflicts: [] },
  });
  assert.equal(result.status, 'REVIEW');
  assert.equal(result.reasons.length, 2);
});

test('validation failure classifies BLOCKED', () => {
  assert.equal(classifyMachineQuality({
    researchValidation: { status: 'FAIL', warnings: [] },
    selectionValidation: { ok: true, warnings: [] },
    selectionQuality: { status: 'PASS', blockers: [], reviews: [] },
    research: {},
  }).status, 'BLOCKED');
});

test('overall status prioritizes repository failure and BLOCKED over REVIEW', () => {
  assert.equal(deriveOverallStatus([{ status: 'PASS' }], false), 'BLOCKED');
  assert.equal(deriveOverallStatus([{ status: 'REVIEW' }, { status: 'BLOCKED' }], true), 'BLOCKED');
  assert.equal(deriveOverallStatus([{ status: 'PASS' }, { status: 'REVIEW' }], true), 'REVIEW');
  assert.equal(deriveOverallStatus([{ status: 'PASS' }], true), 'PASS');
});
