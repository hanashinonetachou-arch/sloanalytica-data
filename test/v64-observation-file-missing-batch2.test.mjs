import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const cases={
  S_FIRE_DRIFT:['FEAT_BONUS','FEAT_WEAK_CHERRY'],
  S_NINJA_JAJAMARU:['FEAT_REG','FEAT_SAKURA_VISIBLE_CLEAR'],
  L_ONE_PUNCH_MAN:['FEAT_SMALL_ROLE_MULTI']
};
const included=new Set(['INCLUDE_PRIMARY','INCLUDE_SUPPORT','INCLUDE_FALLBACK']);

for(const [machineId,expected] of Object.entries(cases)){
  test(`${machineId}: Observation v2 covers active inference Features`,()=>{
    const s=JSON.parse(fs.readFileSync(`research/${machineId}/selection-data.json`,'utf8'));
    const o=JSON.parse(fs.readFileSync(`research/${machineId}/machine-observation-data.json`,'utf8'));
    assert.equal(o.schemaVersion,'machine-observation-data-v2');
    const active=s.features.filter(f=>included.has(f.adoptionCategory)).map(f=>f.featureId).sort();
    assert.deepEqual(active,[...expected].sort());
    const obs=new Map(o.observations.map(x=>[x.observationId,x]));
    const maps=new Map(o.featureMappings.map(x=>[x.featureId,x]));
    for(const featureId of active){
      const m=maps.get(featureId);
      assert.ok(m,`${featureId}: mapping missing`);
      assert.equal(m.usableForInference,true);
      assert.notEqual(m.mappingType,'UNRESOLVED');
      assert.notEqual(m.mappingType,'INCOMPATIBLE');
      for(const id of m.observationIds){
        assert.ok(obs.has(id),`${featureId}: missing Observation ${id}`);
        assert.equal(obs.get(id).status,'FOUND');
      }
    }
  });
}

test('One Punch small roles are one mutually-exclusive observation universe',()=>{
  const o=JSON.parse(fs.readFileSync('research/L_ONE_PUNCH_MAN/machine-observation-data.json','utf8'));
  const ob=o.observations.find(x=>x.observationId==='OBS_SMALL_ROLE_OUTCOME');
  assert.deepEqual(ob.categories,['WEAK_CHERRY','WATERMELON','OTHER']);
  assert.match(ob.notes,/排他的/);
  const m=o.featureMappings.find(x=>x.featureId==='FEAT_SMALL_ROLE_MULTI');
  assert.deepEqual(m.observationIds,['OBS_SMALL_ROLE_OUTCOME']);
});

test('Ninja Sakura clear uses one conditional visual-event observation',()=>{
  const o=JSON.parse(fs.readFileSync('research/S_NINJA_JAJAMARU/machine-observation-data.json','utf8'));
  const ob=o.observations.find(x=>x.observationId==='OBS_SAKURA_MISS_CLEAR');
  assert.ok(ob.excludedConditions.includes('CZ中'));
  const m=o.featureMappings.find(x=>x.featureId==='FEAT_SAKURA_VISIBLE_CLEAR');
  assert.equal(m.mappingType,'EXACT');
  assert.deepEqual(m.observationIds,['OBS_SAKURA_MISS_CLEAR']);
});
