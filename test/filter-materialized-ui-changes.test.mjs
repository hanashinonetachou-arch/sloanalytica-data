import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { hasMaterializedUiChange } from '../tools/filter-materialized-ui-changes.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relativePath => JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));
const machineId = 'L_AZURLANE_THE_ANIMATION_KN';
const packageData = read(`machines/${machineId}/machine-package.json`);
const design = read(`research/${machineId}/ui-design-data.json`);

test('lineage-only UI Design changes do not require generated artifacts', () => {
  const packageBefore = JSON.stringify(packageData);
  const before = structuredClone(design);
  delete before.generatedFrom.selection;
  delete before.generatedFrom.observation;
  const after = structuredClone(before);
  after.generatedFrom.selection = `research/${machineId}/selection-data.json`;
  after.generatedFrom.observation = `research/${machineId}/machine-observation-data.json`;

  assert.equal(hasMaterializedUiChange(packageData, before, after), false);
  assert.equal(JSON.stringify(packageData), packageBefore, 'comparison must not mutate machine-package data');
});

test('materialized UI Design changes still require generated artifacts', () => {
  const before = structuredClone(design);
  const after = structuredClone(design);
  const inputId = Object.keys(after.inputContracts)[0];
  after.inputContracts[inputId].name += '（回帰テスト）';

  assert.equal(hasMaterializedUiChange(packageData, before, after), true);
});

test('new or removed UI Design files require generated artifacts', () => {
  assert.equal(hasMaterializedUiChange(packageData, null, design), true);
  assert.equal(hasMaterializedUiChange(packageData, design, null), true);
});

test('MachineData workflow filters UI changes through canonical materialization', () => {
  const workflow = fs.readFileSync(path.join(ROOT, '.github/workflows/machine-pipeline.yml'), 'utf8');
  assert.match(workflow, /filter-materialized-ui-changes\.mjs/);
  assert.match(workflow, /has_machines == 'true'/);
  assert.match(workflow, /git commit -m 'chore: refresh generated MachineData artifacts'/);
});
