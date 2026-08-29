import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const selection=JSON.parse(fs.readFileSync('research/LB_CREA_BONUS_TRIGGER_A2/selection-data.json','utf8'));
const observation=JSON.parse(fs.readFileSync('research/LB_CREA_BONUS_TRIGGER_A2/machine-observation-data.json','utf8'));

test('Crea BT suppresses unverified predecessor inference while preserving seated inputs',()=>{
  const predecessor=selection.features.find(x=>x.featureId==='FEAT_PREDECESSOR_BONUS_OUTCOME');
  assert.equal(predecessor?.adoptionCategory,'EXCLUDE');
  assert.match(predecessor?.rejectionReason??'',/実機未確認/);
  for(const id of ['INP_PREDECESSOR_GAMES','INP_PREDECESSOR_BIG_COUNT','INP_PREDECESSOR_REG_COUNT']){
    assert.ok(selection.inputs.some(x=>x.id===id));
  }
});

test('Crea BT Observation v2 maps every remaining active inference Feature',()=>{
  assert.equal(observation.schemaVersion,'machine-observation-data-v2');
  const active=selection.features.filter(x=>['INCLUDE_PRIMARY','INCLUDE_SUPPORT','INCLUDE_FALLBACK'].includes(x.adoptionCategory)).map(x=>x.featureId).sort();
  const mapped=observation.featureMappings.filter(x=>x.usableForInference).map(x=>x.featureId).sort();
  assert.deepEqual(mapped,active);
  assert.equal(observation.sourceCoverage.linkedService,'FOUND');
  assert.equal(observation.sourceCoverage.seatedState,'UNRESOLVED');
});

test('Crea BT keeps self-play and BT trial universes separated',()=>{
  const bonus=observation.featureMappings.find(x=>x.featureId==='FEAT_BONUS_OUTCOME');
  const small=observation.featureMappings.find(x=>x.featureId==='FEAT_STANDALONE_SMALL_ROLE_OUTCOME');
  const trigger=observation.featureMappings.find(x=>x.featureId==='FEAT_BONUS_TRIGGER_COMPOSITION');
  const bt=observation.featureMappings.find(x=>x.featureId==='FEAT_BT_MISS_SHARE');
  assert.deepEqual(bonus?.observationIds,['OBS_CREA_DAITOMO_PLAY_BONUS']);
  assert.ok(small?.observationIds.includes('OBS_CREA_DAITOMO_SMALL_ROLES'));
  assert.ok(trigger?.observationIds.includes('OBS_CREA_DAITOMO_BONUS_TRIGGER'));
  assert.deepEqual(bt?.observationIds,['OBS_CREA_BT_JACIN','OBS_CREA_BT_MISS']);
  assert.equal(bt?.mappingType,'COMBINABLE');
});
