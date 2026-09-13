import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {auditSelectionPolicyMigration} from '../tools/audit-selection-policy-migration.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('final canonical UI and safety-removal inventory is fully closed', () => {
  const researchRoot = path.join(root, 'research');
  const selectionMachines = fs.readdirSync(researchRoot, {withFileTypes: true})
    .filter(d => d.isDirectory() && !d.name.startsWith('_'))
    .map(d => d.name)
    .filter(id => fs.existsSync(path.join(researchRoot, id, 'selection-data.json')))
    .sort();

  const canonicalMissing = selectionMachines.filter(id =>
    !fs.existsSync(path.join(researchRoot, id, 'ui-design-data.json'))
  );

  const migration = auditSelectionPolicyMigration(root);
  const nonPass = migration.machines
    .filter(m => m.status !== 'PASS')
    .map(m => ({machineId: m.machineId, status: m.status, diffs: m.diffs?.map(d => d.type) ?? []}));

  const summary = {
    selection: selectionMachines.length,
    canonicalMissing: canonicalMissing.length,
    canonicalMissingIds: canonicalMissing,
    migrationReview: migration.summary.review,
    migrationBlocked: migration.summary.blocked,
    reviewedSafetyChanges: migration.summary.reviewedSafetyChanges,
    migrationNonPass: nonPass
  };
  console.log('FINAL_CANONICAL_AUDIT', JSON.stringify(summary));

  assert.equal(selectionMachines.length, 270);
  assert.deepEqual(canonicalMissing, []);
  assert.equal(migration.summary.review, 0);
  assert.equal(migration.summary.blocked, 0);
  assert.equal(migration.summary.reviewedSafetyChanges, 0);
  assert.deepEqual(nonPass, []);
});
