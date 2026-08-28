import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const included=new Set(['INCLUDE_PRIMARY','INCLUDE_SUPPORT','INCLUDE_FALLBACK']);
const cases={
  L_BOUNTY_ANGEL:['FEAT_AT','FEAT_RESET_AT_DIRECT'],
  L_ZOMBIE_LAND_SAGA:['FEAT_CZ_COMBINED','FEAT_WAF_SUCCESS','FEAT_CZ_HIGH_LENGTH']
};

for(const [machineId,expected] of Object.entries(cases)){
  test(`${machineId}: Observation v2 covers active inference Features`,()=>{
    const s=JSON.parse(fs.readFileSync(`research/${machineId}/selection-data.json`,'utf8'));
    const o=JSON.parse(fs.readFileSync(`research/${machineId}/machine-observation-data.json`,'utf8'));
    assert.equal(o.schemaVersion,'machine-observation-data-v2');
    const active=s.features.filter(f=>included.has(f.adoptionCategory)).map(f=>f.featureId).sort();
    assert.deepEqual(active,[...expected].sort());
    const observations=new Map(o.observations.map(x=>[x.observationId,x]));
    const mappings=new Map(o.featureMappings.map(x=>[x.featureId,x]));
    for(const featureId of active){
      const m=mappings.get(featureId);
      assert.ok(m,`${featureId}: mapping missing`);
      assert.equal(m.usableForInference,true);
      assert.notEqual(m.mappingType,'UNRESOLVED');
      assert.notEqual(m.mappingType,'INCOMPATIBLE');
      for(const id of m.observationIds){
        assert.ok(observations.has(id),`${featureId}: missing Observation ${id}`);
        assert.equal(observations.get(id).status,'FOUND');
      }
    }
  });
}

test('Bounty reset AT direct uses confirmed-reset sessions only',()=>{
  const o=JSON.parse(fs.readFileSync('research/L_BOUNTY_ANGEL/machine-observation-data.json','utf8'));
  const ob=o.observations.find(x=>x.observationId==='OBS_RESET_AT_DIRECT_OUTCOME');
  assert.ok(ob.excludedConditions.some(x=>x.includes('確認できない')));
  assert.match(ob.notes,/推測して試行へ入れない/);
  const m=o.featureMappings.find(x=>x.featureId==='FEAT_RESET_AT_DIRECT');
  assert.deepEqual(m.observationIds,['OBS_RESET_AT_DIRECT_OUTCOME']);
});

test('Zombie WAF denominator and success share one CZ natural observation',()=>{
  const o=JSON.parse(fs.readFileSync('research/L_ZOMBIE_LAND_SAGA/machine-observation-data.json','utf8'));
  const ob=o.observations.find(x=>x.observationId==='OBS_CZ_EVENT');
  assert.deepEqual(ob.categories,['WAF_SUCCESS','WAF_FAIL','HOUSE','SAGA_ROCK']);
  const cz=o.featureMappings.find(x=>x.featureId==='FEAT_CZ_COMBINED');
  const waf=o.featureMappings.find(x=>x.featureId==='FEAT_WAF_SUCCESS');
  assert.ok(cz.observationIds.includes('OBS_CZ_EVENT'));
  assert.deepEqual(waf.observationIds,['OBS_CZ_EVENT']);
});
