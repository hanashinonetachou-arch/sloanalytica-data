import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const machines=['S_ULTRA_MIRACLE_JUGGLER_KT','S_NEO_IM_JUGGLER_EX_KK'];

for(const machineId of machines){
  const selection=JSON.parse(fs.readFileSync(`research/${machineId}/selection-data.json`,'utf8'));
  const observation=JSON.parse(fs.readFileSync(`research/${machineId}/machine-observation-data.json`,'utf8'));

  test(`${machineId}: unverified predecessor data cannot participate in inference`,()=>{
    const predecessor=selection.features.find(x=>x.featureId==='FEAT_PREDECESSOR_BONUS_OUTCOME');
    const self=selection.features.find(x=>x.featureId==='FEAT_SELF_BONUS_OUTCOME');
    assert.ok(predecessor);
    assert.equal(predecessor.adoptionCategory,'EXCLUDE');
    assert.match(predecessor.rejectionReason,/実機未確認/);
    assert.ok(self);
    assert.equal(self.adoptionCategory,'INCLUDE_PRIMARY');
    assert.equal(observation.schemaVersion,'machine-observation-data-v1');
    assert.equal(observation.predecessorData.usableForInference,false);
  });
}
