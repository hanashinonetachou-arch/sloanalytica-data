import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('diagnostic canonical UI backlog inventory', () => {
  const researchRoot = path.join(ROOT, 'research');
  const backlog = fs.readdirSync(researchRoot, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .filter(machineId => fs.existsSync(path.join(researchRoot, machineId, 'selection-data.json')))
    .filter(machineId => !fs.existsSync(path.join(researchRoot, machineId, 'ui-design-data.json')))
    .sort();
  console.log(`CANONICAL_UI_BACKLOG_COUNT=${backlog.length}`);
  console.log(`CANONICAL_UI_BACKLOG_IDS=${JSON.stringify(backlog)}`);
  assert.ok(Array.isArray(backlog));
});
