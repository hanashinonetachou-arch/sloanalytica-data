import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validateResearchData } from '../tools/validate-research-data.mjs';
import { validateSelectionData } from '../tools/validate-selection-data.mjs';
import { assessSelectionQuality } from '../tools/selection-quality-gate.mjs';
import { classifyMachineQuality } from '../tools/batch-machine-pipeline.mjs';

const readJson = path => JSON.parse(fs.readFileSync(path, 'utf8'));

test('Sister Quest explicit rounded multinomial normalization clears batch REVIEW', () => {
  const research = readJson('research/L_SISTER_QUEST_CA/research-data.json');
  const selection = readJson('research/L_SISTER_QUEST_CA/selection-data.json');
  const researchValidation = validateResearchData(research);
  const selectionValidation = validateSelectionData(selection, research);
  const selectionQuality = assessSelectionQuality(research, selection);
  const result = classifyMachineQuality({
    researchValidation,
    selectionValidation,
    selectionQuality,
    research,
    selection,
  });

  assert.equal(researchValidation.status, 'PASS');
  assert.equal(selectionValidation.ok, true, selectionValidation.errors.join(' / '));
  assert.equal(selectionQuality.status, 'PASS', [...selectionQuality.blockers, ...selectionQuality.reviews].join(' / '));
  assert.equal(result.status, 'PASS', result.reasons.join(' / '));
  assert.deepEqual(result.reasons, []);
});
