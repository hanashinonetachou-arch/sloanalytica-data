import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { mergeCanonicalMachineIdentity } from '../tools/merge-canonical-machine-identity.mjs';

test('published machine regeneration restores canonical identity fields', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sloanalytica-identity-'));
  try {
    fs.writeFileSync(path.join(root, 'machine-identity-metadata.json'), JSON.stringify({
      schemaVersion: 1,
      machines: [{
        machineId: 'TEST_MACHINE',
        introductionDate: '2025-03-03',
        machineType: 'SMART_SLOT',
        gameType: 'AT',
      }],
    }));

    const regenerated = {
      machine: {
        machineId: 'TEST_MACHINE',
        displayName: 'Test Machine',
        machineDataVersion: '0.1.0',
      },
    };

    const merged = mergeCanonicalMachineIdentity(regenerated, 'TEST_MACHINE', root);
    assert.equal(merged.machine.introductionDate, '2025-03-03');
    assert.equal(merged.machine.machineType, 'SMART_SLOT');
    assert.equal(merged.machine.gameType, 'AT');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('pre-publication generation remains valid when no canonical identity entry exists', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sloanalytica-identity-'));
  try {
    fs.writeFileSync(path.join(root, 'machine-identity-metadata.json'), JSON.stringify({ schemaVersion: 1, machines: [] }));
    const regenerated = { machine: { machineId: 'NEW_MACHINE', displayName: 'New Machine' } };
    const merged = mergeCanonicalMachineIdentity(regenerated, 'NEW_MACHINE', root);
    assert.deepEqual(merged, regenerated);
    assert.equal('introductionDate' in merged.machine, false);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('canonical identity merge rejects package machineId mismatch', () => {
  assert.throws(
    () => mergeCanonicalMachineIdentity({ machine: { machineId: 'WRONG' } }, 'EXPECTED', '/nonexistent'),
    /Machine package identity mismatch/,
  );
});
