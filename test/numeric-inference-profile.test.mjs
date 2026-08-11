import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildNumericInferenceProfile } from '../tools/build-numeric-inference-profile.mjs';

test('Kaguya is evidence-dominant and rejected BONUS initial exposes required trials',()=>{
  const r=JSON.parse(fs.readFileSync('research/L_KAGUYA_SAMA_JA/research-data.json','utf8'));
  const s=JSON.parse(fs.readFileSync('research/L_KAGUYA_SAMA_JA/selection-data.json','utf8'));
  const p=buildNumericInferenceProfile(r,s);
  assert.equal(p.profile,'EVIDENCE_DOMINANT');
  assert.equal(p.presentationMode,'REJECTED_FEATURES_FIRST');
  assert.equal(p.summary.adoptedNumericFeatureCount,0);
  assert.ok(p.summary.hardEvidenceCount>0);
  const bonus=p.rejectedFeatures.find(x=>x.featureId==='FEAT_KAGUYA_BONUS_INITIAL');
  assert.equal(bonus.rejectionReason,'設定差が小さい。');
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
