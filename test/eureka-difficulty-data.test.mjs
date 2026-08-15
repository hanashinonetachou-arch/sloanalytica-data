import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {evaluateMachineDifficulty} from '../tools/evaluate-machine-difficulty.mjs';
test('Eureka TYPE-ART scores both adopted numeric Features with explicit estimated exposure',()=>{
 const r=JSON.parse(fs.readFileSync('research/S_EUREKA_SEVEN_HIEVO_XS/research-data.json'));
 const s=JSON.parse(fs.readFileSync('research/S_EUREKA_SEVEN_HIEVO_XS/selection-data.json'));
 const d=evaluateMachineDifficulty(r,s,{simulationsPerSetting:300});
 assert.equal(d.status,'COMPLETE');
 assert.equal(d.coverage.inferenceNumericFeatureCount,2);
 assert.equal(d.coverage.analyzableFeatureCount,2);
 assert.equal(d.coverage.explicitlyExcludedNumericFeatureCount,0);
 assert.equal(d.scoreConfidence.level,'LOW_MEDIUM');
});
test('Eureka is SCORED in standalone Difficulty Catalog',()=>{
 const d=JSON.parse(fs.readFileSync('difficulty-catalog.json'));
 const e=d.entries.find(x=>x.machineId==='S_EUREKA_SEVEN_HIEVO_XS').difficulty;
 assert.equal(e.status,'SCORED');
 assert.deepEqual(e.rawScores,[{games:1500,rawScore:15},{games:3000,rawScore:23},{games:7000,rawScore:34}]);
 assert.deepEqual(e.scores,[{games:1500,score:39},{games:3000,score:59},{games:7000,score:88}]);
});
