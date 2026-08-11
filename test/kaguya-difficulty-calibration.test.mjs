import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { evaluateMachineDifficulty } from '../tools/evaluate-machine-difficulty.mjs';

test('Kaguya has no numeric inference Feature after practical selection',()=>{
  const r=JSON.parse(fs.readFileSync('research/L_KAGUYA_SAMA_JA/research-data.json','utf8'));
  const s=JSON.parse(fs.readFileSync('research/L_KAGUYA_SAMA_JA/selection-data.json','utf8'));
  const report=evaluateMachineDifficulty(r,s,{simulationsPerSetting:200});
  assert.equal(report.status,'NO_NUMERIC_FEATURES');
  assert.equal(report.coverage.includedNumericFeatureCount,0);
  assert.equal(report.targets.length,0);
  const bonus=report.featureTrialEstimates.find(x=>x.featureId==='FEAT_KAGUYA_BONUS_INITIAL');
  assert.ok(bonus.requiredTrials80>400000);
});
