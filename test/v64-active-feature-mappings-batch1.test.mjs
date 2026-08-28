import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const expected={
  L_MONSTER_HUNTER_RISE_XA:['FEAT_AT_INITIAL','FEAT_REPLAY_THRESHOLD'],
  L_SHIN_IKKITOUSEN_V:['FEAT_CZ_INITIAL','FEAT_AT_INITIAL','FEAT_COMMON_BELL_1','FEAT_COMMON_BELL_11'],
  S_GRANBELM_ZX:['FEAT_AT_INITIAL','FEAT_MB_START_STAGE','FEAT_NAKAMI_NORMAL','FEAT_NAKAMI_05','FEAT_NAKAMI_55','FEAT_NAKAMI_99'],
  S_ODANOBUNA_ZENKOKU_SNT:['FEAT_AT_INITIAL','FEAT_AT_RUNTHROUGH_ATTACK']
};
const included=new Set(['INCLUDE_PRIMARY','INCLUDE_SUPPORT','INCLUDE_FALLBACK']);

for(const [machineId,featureIds] of Object.entries(expected)){
  test(`${machineId}: every active Selection Feature has a usable Observation v2 mapping`,()=>{
    const s=JSON.parse(fs.readFileSync(`research/${machineId}/selection-data.json`,'utf8'));
    const o=JSON.parse(fs.readFileSync(`research/${machineId}/machine-observation-data.json`,'utf8'));
    assert.equal(o.schemaVersion,'machine-observation-data-v2');
    const active=s.features.filter(f=>included.has(f.adoptionCategory)).map(f=>f.featureId).sort();
    assert.deepEqual(active,[...featureIds].sort());
    const mappings=new Map((o.featureMappings??[]).map(m=>[m.featureId,m]));
    const observations=new Set((o.observations??[]).map(x=>x.observationId));
    for(const featureId of active){
      const m=mappings.get(featureId);
      assert.ok(m,`${featureId}: mapping missing`);
      assert.equal(m.usableForInference,true,`${featureId}: must be usable for inference`);
      assert.notEqual(m.mappingType,'UNRESOLVED');
      assert.notEqual(m.mappingType,'INCOMPATIBLE');
      for(const id of m.observationIds??[]) assert.ok(observations.has(id),`${featureId}: unknown Observation ${id}`);
    }
  });
}

test('Granbelm Nakami mappings remain cycle-condition separated',()=>{
  const o=JSON.parse(fs.readFileSync('research/S_GRANBELM_ZX/machine-observation-data.json','utf8'));
  const ids=['FEAT_NAKAMI_NORMAL','FEAT_NAKAMI_05','FEAT_NAKAMI_55','FEAT_NAKAMI_99'];
  const mappings=new Map(o.featureMappings.map(m=>[m.featureId,m]));
  for(const id of ids){
    const m=mappings.get(id);
    assert.deepEqual(m.observationIds,['OBS_GRANBELM_MENU_HINTS']);
    assert.equal(m.collectionMethods[0],'MENU_READ');
    assert.match(m.notes,/条件/);
  }
  const menu=o.observations.find(x=>x.observationId==='OBS_GRANBELM_MENU_HINTS');
  assert.match(menu.notes,/異なる周期条件を混合しない/);
});
