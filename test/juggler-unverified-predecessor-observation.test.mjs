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

    // The seated inputs may remain visible/recordable. Safety is enforced at the
    // Feature/Observation linkage layer, not by erasing the input presentation contract.
    const predecessorInputs=selection.inputs.filter(x=>x.observationScope==='PREDECESSOR_SNAPSHOT');
    assert.equal(predecessorInputs.length,3);
    assert.deepEqual(predecessorInputs.map(x=>x.id).sort(),['INP_PREDECESSOR_BIG_COUNT','INP_PREDECESSOR_GAMES','INP_PREDECESSOR_REG_COUNT']);

    if(observation.schemaVersion==='machine-observation-data-v1'){
      assert.equal(observation.predecessorData.usableForInference,false);
      return;
    }

    assert.equal(observation.schemaVersion,'machine-observation-data-v2');
    assert.equal(observation.sourceCoverage?.seatedState,'UNRESOLVED');
    const activeMappings=observation.featureMappings??[];
    assert.ok(activeMappings.some(x=>x.featureId==='FEAT_SELF_BONUS_OUTCOME'&&x.usableForInference===true));
    assert.ok(!activeMappings.some(x=>x.featureId==='FEAT_PREDECESSOR_BONUS_OUTCOME'&&x.usableForInference===true));
    const verification=(observation.fieldVerificationItems??[]).find(x=>x.priority==='HIGH'&&x.sourceType==='SEATED_STATE');
    assert.ok(verification,'predecessor source must remain explicit real-device verification debt');
    assert.match(verification.question,/前任者Feature|着席時|PREDECESSOR|推測不参加/i);
  });
}
