
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { evaluateMachineDifficulty } from '../tools/evaluate-machine-difficulty.mjs';

test('Kaguya final calibration blocks provisional bonus denominator',()=>{
  const r=JSON.parse(fs.readFileSync('research/L_KAGUYA_SAMA_JA/research-data.json','utf8'));
  const s=JSON.parse(fs.readFileSync('research/L_KAGUYA_SAMA_JA/selection-data.json','utf8'));
  const finalReport=evaluateMachineDifficulty(r,s,{simulationsPerSetting:200});
  assert.equal(finalReport.status,'NOT_CONFIGURED');
  assert.equal(finalReport.coverage.analyzableFeatureCount,0);
  const exploratory=evaluateMachineDifficulty(r,s,{simulationsPerSetting:400,allowedExposureQualities:['EXACT','DERIVED','PROVISIONAL']});
  assert.equal(exploratory.status,'COMPLETE');
  assert.equal(exploratory.coverage.analyzableFeatureCount,1);
  assert.ok(exploratory.targets[2].score>=exploratory.targets[0].score);
});
