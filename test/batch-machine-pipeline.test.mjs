import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeMachineIds, classifyMachineQuality } from '../tools/batch-machine-pipeline.mjs';

test('batch normalizes unique machine IDs', () => {
  assert.deepEqual(normalizeMachineIds(['A_ONE,B_TWO', 'A_ONE', 'C_THREE']), ['A_ONE', 'B_TWO', 'C_THREE']);
});

test('batch rejects invalid machine IDs', () => {
  assert.throws(() => normalizeMachineIds(['bad-id']), /invalid machineId/);
});

test('batch enforces 10-machine safety limit', () => {
  assert.throws(() => normalizeMachineIds(Array.from({ length: 11 }, (_, i) => `M_${i}`)), /batch size exceeds 10/);
});

test('clean validations classify PASS', () => {
  assert.deepEqual(classifyMachineQuality({
    researchValidation: { status: 'PASS', warnings: [] },
    selectionValidation: { ok: true, warnings: [] },
    research: { machine: { displayName: 'Machine' }, conflicts: [] },
  }), { status: 'PASS', reasons: [] });
});

test('warnings or provisional naming classify REVIEW', () => {
  const result = classifyMachineQuality({
    researchValidation: { status: 'PASS', warnings: [{ message: 'check source' }] },
    selectionValidation: { ok: true, warnings: [] },
    research: { machine: { displayName: 'Machine（暫定版）' }, conflicts: [] },
  });
  assert.equal(result.status, 'REVIEW');
  assert.equal(result.reasons.length, 2);
});

test('validation failure classifies BLOCKED', () => {
  assert.equal(classifyMachineQuality({
    researchValidation: { status: 'FAIL', warnings: [] },
    selectionValidation: { ok: true, warnings: [] },
    research: {},
  }).status, 'BLOCKED');
});
