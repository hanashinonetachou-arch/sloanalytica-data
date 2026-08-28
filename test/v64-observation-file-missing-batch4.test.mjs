import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const included=new Set(['INCLUDE_PRIMARY','INCLUDE_SUPPORT','INCLUDE_FALLBACK']);
const cases={
  S_GAMERA2:['FEAT_REACHME_CDEF','FEAT_BONUS_FALLBACK','FEAT_BIG_END_SCREEN','FEAT_REG_PLAY_GAMERA'],
  S_WORD_OF_LIGHTS_2:['FEAT_BIG','FEAT_ROLE_4A','FEAT_BIG_END_SCREEN','FEAT_ADJUST_MAGIC']
};

for(const [machineId,expected] of Object.entries(cases)){
  test(`${machineId}: Observation v2 covers every active inference Feature`,()=>{
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
        const ob=observations.get(id);
        assert.ok(ob,`${featureId}: missing Observation ${id}`);
        assert.equal(ob.status,'FOUND');
      }
    }
  });
}

test('Gamera primary linked-service path is separate from manual bonus fallback',()=>{
  const o=JSON.parse(fs.readFileSync('research/S_GAMERA2/machine-observation-data.json','utf8'));
  const primary=o.featureMappings.find(x=>x.featureId==='FEAT_REACHME_CDEF');
  const fallback=o.featureMappings.find(x=>x.featureId==='FEAT_BONUS_FALLBACK');
  assert.deepEqual(primary.observationIds,['OBS_MYSLO_COUNTER']);
  assert.equal(primary.collectionMethods[0],'LINKED_SERVICE_READ');
  assert.ok(fallback.observationIds.includes('OBS_NORMAL_GAMES_MANUAL'));
  assert.ok(!fallback.observationIds.includes('OBS_MYSLO_COUNTER'));
});

test('Gamera ending screen is one four-category Numeric/Evidence observation',()=>{
  const o=JSON.parse(fs.readFileSync('research/S_GAMERA2/machine-observation-data.json','utf8'));
  const ob=o.observations.find(x=>x.observationId==='OBS_BIG_END_SCREEN');
  assert.deepEqual(ob.categories,['OTHER','EVEN','NOT_BAD','GAMERA']);
  assert.match(ob.notes,/一度だけ入力/);
  assert.match(ob.notes,/Evidence/);
});

test('Gamera REG monster observation is multi-label, not a multinomial claim',()=>{
  const o=JSON.parse(fs.readFileSync('research/S_GAMERA2/machine-observation-data.json','utf8'));
  const ob=o.observations.find(x=>x.observationId==='OBS_REG_MONSTER_FLAGS');
  assert.match(ob.notes,/複数種類/);
  assert.match(ob.notes,/排他的Multinomialにはしない/);
});

test('Word primary Unimemo path is separate from BIG fallback',()=>{
  const o=JSON.parse(fs.readFileSync('research/S_WORD_OF_LIGHTS_2/machine-observation-data.json','utf8'));
  const primary=o.featureMappings.find(x=>x.featureId==='FEAT_ROLE_4A');
  const fallback=o.featureMappings.find(x=>x.featureId==='FEAT_BIG');
  assert.deepEqual(primary.observationIds,['OBS_UNIMEMO_COUNTER']);
  assert.equal(primary.collectionMethods[0],'LINKED_SERVICE_READ');
  assert.ok(fallback.observationIds.includes('OBS_NORMAL_GAMES_MANUAL'));
  assert.ok(!fallback.observationIds.includes('OBS_UNIMEMO_COUNTER'));
});

test('Word screen and magic keep full natural-observation categories',()=>{
  const o=JSON.parse(fs.readFileSync('research/S_WORD_OF_LIGHTS_2/machine-observation-data.json','utf8'));
  assert.deepEqual(o.observations.find(x=>x.observationId==='OBS_BIG_END_SCREEN').categories,['TEMOYAN','HETARE','HEIBON','SUNRISE']);
  assert.deepEqual(o.observations.find(x=>x.observationId==='OBS_ADJUST_MAGIC').categories,['FLAME','BLIZZARD','METEO','WORD','THUNDER']);
});
