import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildNumericInferenceProfile } from '../tools/build-numeric-inference-profile.mjs';

test('Kaguya has one limited ending-frame numeric Feature while BONUS initial remains rejected',()=>{
  const r=JSON.parse(fs.readFileSync('research/L_KAGUYA_SAMA_JA/research-data.json','utf8'));
  const s=JSON.parse(fs.readFileSync('research/L_KAGUYA_SAMA_JA/selection-data.json','utf8'));
  const p=buildNumericInferenceProfile(r,s);
  assert.equal(p.profile,'LIMITED');
  assert.equal(p.presentationMode,'STANDARD_WITH_LIMITATION');
  assert.equal(p.summary.adoptedNumericFeatureCount,1);
  assert.ok(p.summary.hardEvidenceCount>0);
  assert.equal(p.adoptedNumericFeatures[0]?.featureId,'FEAT_KAGUYA_BONUS_END_FRAME');
  const frame=s.features.find(x=>x.featureId==='FEAT_KAGUYA_BONUS_END_FRAME');
  assert.equal(frame?.difficultyParticipation,'EXCLUDE');
  const bonus=p.rejectedFeatures.find(x=>x.featureId==='FEAT_KAGUYA_BONUS_INITIAL');
  assert.equal(bonus.rejectionReason,'BONUS初当りは1/362～1/335と設定差が小さいうえ、公開情報では確率に対応する厳密な集計区間を確認できず分母定義が暫定のため、数値Featureには不採用。');
  assert.ok(bonus.requiredTrials80>400000);
  assert.equal(bonus.requiredTrialsUnit,'G');
  assert.equal(bonus.metricStatus,'COMPUTED');
});

test('My Juggler V remains NORMAL numeric inference profile',()=>{
  const r=JSON.parse(fs.readFileSync('research/S_MY_JUGGLER_V_KD/research-data.json','utf8'));
  const s=JSON.parse(fs.readFileSync('research/S_MY_JUGGLER_V_KD/selection-data.json','utf8'));
  const p=buildNumericInferenceProfile(r,s);
  assert.equal(p.profile,'NORMAL');
  assert.equal(p.presentationMode,'STANDARD');
  assert.equal(p.summary.adoptedNumericFeatureCount,3);
});
