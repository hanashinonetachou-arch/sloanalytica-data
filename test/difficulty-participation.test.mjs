import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { evaluateMachineDifficulty } from '../tools/evaluate-machine-difficulty.mjs';

test('My Juggler V excludes predecessor context but scores self-play Features',()=>{
  const r=JSON.parse(fs.readFileSync('research/S_MY_JUGGLER_V_KD/research-data.json','utf8'));
  const s=JSON.parse(fs.readFileSync('research/S_MY_JUGGLER_V_KD/selection-data.json','utf8'));
  const report=evaluateMachineDifficulty(r,s,{simulationsPerSetting:300});
  assert.equal(report.status,'COMPLETE');
  assert.equal(report.coverage.inferenceNumericFeatureCount,3);
  assert.equal(report.coverage.includedNumericFeatureCount,2);
  assert.equal(report.coverage.explicitlyExcludedNumericFeatureCount,1);
  assert.equal(report.coverage.analyzableFeatureCount,2);
  assert.ok(report.targets[2].score>=report.targets[0].score);
});
