import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const s=JSON.parse(fs.readFileSync('research/L_INUYASHA2_FK/selection-data.json','utf8'));
const o=JSON.parse(fs.readFileSync('research/L_INUYASHA2_FK/machine-observation-data.json','utf8'));

test('Inuyasha2 white and blue BIG ending screens use complete shared-input distributions',()=>{
  for(const [fid,expected] of [['FEAT_WHITE_BIG_END',3],['FEAT_BLUE_BIG_END',3]]){
    const f=s.features.find(x=>x.featureId===fid); assert.ok(f); assert.equal(f.categoryExcludeLabels,undefined); assert.equal(f.categoryInputIds.length,expected);
  }
  const blue=s.features.find(x=>x.featureId==='FEAT_BLUE_BIG_END'); assert.equal(blue.normalizeRoundedCategoryProbabilities,true);
});

test('Inuyasha2 context-specific Evidence shares the exact BIG ending inputs',()=>{
  const expected={EVI_WHITE_BIG_SESSHOMARU_2PLUS:['INP_RF_WHITE_BIG_END_SESSHOMARU','FEAT_WHITE_BIG_END'],EVI_BLUE_BIG_INUYASHA_2PLUS:['INP_RF_BLUE_BIG_END_INUYASHA','FEAT_BLUE_BIG_END'],EVI_WHITE_BIG_PAIR_4PLUS:['INP_RF_WHITE_BIG_END_PAIR','FEAT_WHITE_BIG_END'],EVI_BLUE_BIG_PAIR_4PLUS:['INP_RF_BLUE_BIG_END_PAIR','FEAT_BLUE_BIG_END']};
  for(const [id,[inputId,featureId]] of Object.entries(expected)){ const e=s.evidence.find(x=>x.evidenceId===id); assert.ok(e); assert.equal(e.inputId,inputId); assert.deepEqual(e.sharedFeatureIds,[featureId]); }
});

test('Inuyasha2 Observation v2 maps full BIG ending distributions',()=>{
  assert.ok(o.featureMappings.some(x=>x.featureId==='FEAT_WHITE_BIG_END'&&x.observationIds.includes('OBS_WHITE_BIG_END_FULL')));
  assert.ok(o.featureMappings.some(x=>x.featureId==='FEAT_BLUE_BIG_END'&&x.observationIds.includes('OBS_BLUE_BIG_END_FULL')));
});
