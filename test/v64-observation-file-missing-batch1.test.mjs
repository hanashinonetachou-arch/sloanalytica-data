import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const cases={
  L_AKAME_GA_KILL_2:['FEAT_AT_INITIAL'],
  L_GOD_EATER_RESURRECTION:['FEAT_AT_INITIAL'],
  S_BUSOU_SHINKI:['FEAT_AT']
};
const included=new Set(['INCLUDE_PRIMARY','INCLUDE_SUPPORT','INCLUDE_FALLBACK']);

for(const [machineId,expectedActive] of Object.entries(cases)){
  test(`${machineId}: new Observation v2 covers every active inference Feature`,()=>{
    const s=JSON.parse(fs.readFileSync(`research/${machineId}/selection-data.json`,'utf8'));
    const o=JSON.parse(fs.readFileSync(`research/${machineId}/machine-observation-data.json`,'utf8'));
    assert.equal(o.schemaVersion,'machine-observation-data-v2');
    const active=s.features.filter(f=>included.has(f.adoptionCategory)).map(f=>f.featureId).sort();
    assert.deepEqual(active,[...expectedActive].sort());
    const observations=new Map(o.observations.map(x=>[x.observationId,x]));
    const mappings=new Map(o.featureMappings.map(x=>[x.featureId,x]));
    for(const featureId of active){
      const m=mappings.get(featureId);
      assert.ok(m,`${featureId}: Observation mapping missing`);
      assert.equal(m.usableForInference,true);
      assert.notEqual(m.mappingType,'UNRESOLVED');
      assert.notEqual(m.mappingType,'INCOMPATIBLE');
      for(const id of m.observationIds) {
        const ob=observations.get(id);
        assert.ok(ob,`${featureId}: unknown Observation ${id}`);
        assert.equal(ob.status,'FOUND');
      }
    }
    const basisCheck=o.fieldVerificationItems.find(x=>x.verificationId==='VERIFY_AT_GAME_BASIS');
    assert.ok(basisCheck,'game-basis field verification must remain explicit');
    assert.equal(basisCheck.status,'WAITING_FOR_MACHINE');
    assert.equal(basisCheck.priority,'HIGH');
  });
}
