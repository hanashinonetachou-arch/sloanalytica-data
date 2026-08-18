import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildMachineData } from '../tools/build-machine-data.mjs';

test('PREDECESSOR inputs become snapshot observations and render first', () => {
  const research = JSON.parse(fs.readFileSync('research/L_HIGURASHI_GOU_SS/research-data.json', 'utf8'));
  const selection = JSON.parse(fs.readFileSync('research/L_HIGURASHI_GOU_SS/selection-data.json', 'utf8'));
  const pkg = buildMachineData(research, selection);
  const predecessorInputs = pkg.inputs.inputs.filter(input => input.category === 'PREDECESSOR');
  assert.ok(predecessorInputs.length > 0);
  assert.ok(predecessorInputs.every(input => input.observationScope === 'PREDECESSOR_SNAPSHOT'));
  assert.equal(pkg.ui.sections[0]?.id, 'AUTO_PREDECESSOR');
});
