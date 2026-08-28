import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve('.');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const research=read(path.join(root,'research/S_MHW_ICEBORNE_ZF/research-data.json'));
const selection=read(path.join(root,'research/S_MHW_ICEBORNE_ZF/selection-data.json'));
const observation=read(path.join(root,'research/S_MHW_ICEBORNE_ZF/machine-observation-data.json'));
const rf=id=>(research.features??[]).find(f=>f.researchFeatureId===id);
const sf=id=>(selection.features??[]).find(f=>f.researchFeatureId===id);

test('CZ total plus conditional type composition forms the selected factorization',()=>{
  assert.equal(sf('RF_CZ_TOTAL').adoptionCategory,'INCLUDE_PRIMARY');
  const comp=sf('RF_CZ_TYPE_COMPOSITION');
  assert.ok(comp);
  assert.equal(comp.adoptionCategory,'INCLUDE_SUPPORT');
  assert.equal(comp.inputTransform,'sum_inputs_to_trials');
  assert.equal(comp.numeratorInputId,'INP_CZ_QUEST_COUNT');
  assert.deepEqual(comp.categoryInputIds,['INP_CZ_AIROU_COUNT','INP_CZ_SELIANA_COUNT']);
  assert.equal(comp.weight,1);
  for(const id of ['RF_CZ_QUEST','RF_CZ_AIROU','RF_CZ_SELIANA']) assert.equal(sf(id).adoptionCategory,'EXCLUDE');
});

test('derived CZ composition exactly normalizes published component rates',()=>{
  const comp=rf('RF_CZ_TYPE_COMPOSITION');
  assert.ok(comp);
  assert.deepEqual(comp.categories,['QUEST','AIROU','SELIANA']);
  for(const setting of research.machine.settings){
    const q=rf('RF_CZ_QUEST').settingValues[setting].probability;
    const a=rf('RF_CZ_AIROU').settingValues[setting].probability;
    const s=rf('RF_CZ_SELIANA').settingValues[setting].probability;
    const sum=q+a+s;
    const d=comp.settingDistributions[setting];
    assert.ok(Math.abs(d.QUEST-q/sum)<1e-12,`${setting} QUEST`);
    assert.ok(Math.abs(d.AIROU-a/sum)<1e-12,`${setting} AIROU`);
    assert.ok(Math.abs(d.SELIANA-s/sum)<1e-12,`${setting} SELIANA`);
    assert.ok(Math.abs(d.QUEST+d.AIROU+d.SELIANA-1)<1e-12,`${setting} sum`);
  }
});

test('CZ type inputs preserve unobserved versus observed-zero semantics',()=>{
  for(const id of ['INP_CZ_QUEST_COUNT','INP_CZ_AIROU_COUNT','INP_CZ_SELIANA_COUNT']){
    const input=(selection.inputs??[]).find(x=>x.id===id);
    assert.ok(input,id);
    assert.equal(input.defaultValue,null,`${id} defaultValue`);
  }
});

test('CZ type composition has an explicit Observation v2 mapping',()=>{
  assert.equal(observation.schemaVersion,'machine-observation-data-v2');
  const obs=(observation.observations??[]).find(x=>x.observationId==='OBS_CZ_TYPE_DIRECT');
  assert.ok(obs);
  assert.equal(obs.status,'FOUND');
  assert.match(obs.label,/CZ種類別/);
  const mapping=(observation.featureMappings??[]).find(x=>x.featureId==='FEAT_CZ_TYPE_COMPOSITION');
  assert.ok(mapping);
  assert.equal(mapping.mappingType,'COMBINABLE');
  assert.deepEqual(mapping.observationIds,['OBS_CZ_TYPE_DIRECT']);
  assert.equal(mapping.usableForInference,true);
  assert.equal(mapping.usableForDifficulty,true);
});

test('state-dependent and downstream candidates retain explicit non-causal blockers',()=>{
  assert.match(sf('RF_HIGH_FALL').userFacingReason,/未解決/);
  for(const id of ['RF_NORMAL_WEAK_CZ','RF_NORMAL_STRONG_CZ','RF_HIGH_WEAK_CZ','RF_HIGH_STRONG_CZ']){
    assert.match(sf(id).userFacingReason,/未解決/);
    assert.match(sf(id).userFacingReason,/joint likelihood/);
  }
  assert.match(sf('RF_AT_INITIAL').userFacingReason,/joint likelihood/);
  assert.match(sf('RF_AT_DIRECT').userFacingReason,/部分集合/);
  assert.match(sf('RF_LONG_FREEZE').userFacingReason,/極端に低頻度/);
});
