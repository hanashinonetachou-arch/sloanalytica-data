import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { validateResearchData } from '../tools/validate-research-data.mjs';
import { validateSelectionData } from '../tools/validate-selection-data.mjs';

const root = path.resolve('.');
const batchesDir = path.join(root, 'batches');
const manifests = fs.existsSync(batchesDir)
  ? fs.readdirSync(batchesDir).filter(name => name.endsWith('.json')).sort()
  : [];

test('batch manifests exist and are valid', () => {
  assert.ok(manifests.length >= 1, 'at least one batch manifest is required');
  for (const name of manifests) {
    const manifest = JSON.parse(fs.readFileSync(path.join(batchesDir, name), 'utf8'));
    assert.equal(manifest.schemaVersion, 'machine-batch-manifest-v1', `${name}: schemaVersion`);
    assert.ok(typeof manifest.batchId === 'string' && manifest.batchId.length > 0, `${name}: batchId`);
    assert.ok(Array.isArray(manifest.machineIds), `${name}: machineIds must be array`);
    assert.ok(manifest.machineIds.length >= 1 && manifest.machineIds.length <= 10, `${name}: batch size must be 1..10`);
    assert.equal(new Set(manifest.machineIds).size, manifest.machineIds.length, `${name}: duplicate machineIds`);
    for (const id of manifest.machineIds) assert.match(id, /^[A-Z0-9_]+$/, `${name}: invalid machineId ${id}`);
  }
});

for (const name of manifests) {
  const manifest = JSON.parse(fs.readFileSync(path.join(batchesDir, name), 'utf8'));
  for (const machineId of manifest.machineIds) {
    test(`${manifest.batchId}: Research/Selection validate: ${machineId}`, () => {
      const researchFile = path.join(root, 'research', machineId, 'research-data.json');
      const selectionFile = path.join(root, 'research', machineId, 'selection-data.json');
      assert.ok(fs.existsSync(researchFile), `${machineId}: ResearchData missing`);
      assert.ok(fs.existsSync(selectionFile), `${machineId}: SelectionData missing`);
      const research = JSON.parse(fs.readFileSync(researchFile, 'utf8'));
      const selection = JSON.parse(fs.readFileSync(selectionFile, 'utf8'));
      const rr = validateResearchData(research);
      const sr = validateSelectionData(selection, research);
      assert.equal(rr.status, 'PASS', JSON.stringify(rr.errors, null, 2));
      assert.equal(sr.errors.length, 0, JSON.stringify(sr.errors, null, 2));
      assert.equal(research.machine.machineId, machineId);
      assert.equal(selection.machineId, machineId);
    });
  }
}
