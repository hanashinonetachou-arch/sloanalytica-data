import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {evaluateMachineDifficulty} from '../tools/evaluate-machine-difficulty.mjs';
const root=new URL('..',import.meta.url).pathname;
const read=p=>JSON.parse(fs.readFileSync(`${root}/${p}`,'utf8'));

test('Code Geass applies only the exact per-game small-role exposure for final calibration',()=>{
  const research=read('research/S_CODE_GEASS_3_CC_FS/research-data.json');
  const selection=read('research/S_CODE_GEASS_3_CC_FS/selection-data.json');
  const f=selection.features.find(x=>x.featureId==='FEAT_CHERRY_WATERMELON_MULTINOMIAL');
  assert.deepEqual(f.difficultyExposure,{mode:'per_game',factor:1,quality:'EXACT',basisId:'NORMAL_AT_GAMES'});
  const r=evaluateMachineDifficulty(research,selection,{targets:[1500],simulationsPerSetting:200,seed:19});
  assert.equal(r.status,'COMPLETE');
  assert.equal(r.coverage.analyzableFeatureCount,1);
  assert.equal(r.coverage.explicitlyExcludedNumericFeatureCount,2);
  assert.equal(r.coverage.missingDifficultyExposureFeatureIds.length,0);
  assert.ok(r.coverage.explicitlyExcludedNumericFeatures.some(x=>x.featureId==='FEAT_RB_INFINITE_AT_BINOMIAL'));
  assert.ok(r.coverage.explicitlyExcludedNumericFeatures.some(x=>x.featureId==='FEAT_AT_END_SCREEN_MULTINOMIAL'));
});

test('Tokyo Ghoul provisional exposure is excluded from final scoring but available for explicit exploratory runs',()=>{
  const research=read('research/L_TOKYO_GHOUL/research-data.json');
  const selection=read('research/L_TOKYO_GHOUL/selection-data.json');
  const normal=evaluateMachineDifficulty(research,selection,{targets:[1500],simulationsPerSetting:200,seed:20});
  assert.equal(normal.status,'NOT_CONFIGURED');
  assert.equal(normal.coverage.analyzableFeatureCount,0);
  const exploratory=evaluateMachineDifficulty(research,selection,{targets:[1500],simulationsPerSetting:200,seed:20,allowedExposureQualities:['EXACT','DERIVED','PROVISIONAL']});
  assert.equal(exploratory.status,'COMPLETE');
  assert.equal(exploratory.coverage.analyzableFeatureCount,2);
  assert.equal(exploratory.coverage.explicitlyExcludedNumericFeatureCount,2);
  assert.equal(exploratory.coverage.missingDifficultyExposureFeatureIds.length,0);
});
