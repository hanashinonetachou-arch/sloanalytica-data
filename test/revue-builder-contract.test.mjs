import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildMachineData} from '../tools/build-machine-data.mjs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const r=read('research/S_REVUE_STARLIGHT_CX/research-data.json');
const s=read('research/S_REVUE_STARLIGHT_CX/selection-data.json');
const pkg=buildMachineData(r,s,null);
const byId=new Map(pkg.features.features.map(f=>[f.featureId,f]));
test('Revue conditional partial multinomials reproduce runtime contract',()=>{
  const blue=byId.get('FEAT_BLUE_BIG_CAUSE_PARTIAL');
  assert.equal(blue.modelType,'conditional_partial_multinomial');
  assert.equal(blue.conditionedOnInputId,'INP_BLUE_BIG_COUNT');
  assert.equal(blue.inputTransform,'sum_inputs_to_trials');
  assert.deepEqual(blue.denominatorInputIds,['INP_BLUE_OTHER_CONFIRMED','INP_BLUE_WATERMELON_CONFIRMED','INP_BLUE_CHANCE_CONFIRMED']);
  assert.deepEqual(blue.categoryProbabilities.SET_1,[0.361712062257,0.198547629218]);
  assert.equal(blue.categoryConditioning,undefined);
});
test('Revue named implicit residual multinomials reproduce runtime contract',()=>{
  const lamp=byId.get('FEAT_CZ_LAMP_MULTINOMIAL');
  assert.equal(lamp.modelType,'multinomial');
  assert.equal(lamp.inputTransform,'sum_inputs_to_trials');
  assert.equal(lamp.denominatorInputId,'INP_LAMP_WHITE_COUNT');
  assert.deepEqual(lamp.categoryInputIds,['INP_LAMP_GREEN_COUNT','INP_LAMP_RED_COUNT','INP_LAMP_PURPLE_COUNT']);
  assert.deepEqual(lamp.categoryProbabilities.SET_1,[0.331533153315,0.155715571557,0.154315431543,0.037103710371]);
  assert.equal(lamp.categoryConditioning,undefined);
});
test('Revue evidence mappings are reproducible from SelectionData',()=>{
  assert.equal(pkg.evidence.evidences.length,10);
  assert.equal(pkg.evidence.evidences[0].inputId,'INP_BIG_END_SET2_COUNT');
});
