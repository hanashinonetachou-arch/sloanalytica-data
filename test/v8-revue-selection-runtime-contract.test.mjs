import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {normalizeSelectionRuntimeContract} from '../tools/normalize-selection-runtime-contract.mjs';
import {materializeCanonicalUiV8} from '../tools/materialize-canonical-ui-v8-runtime.mjs';

const base=new URL('../repro-v8/S_REVUE_STARLIGHT_CX/',import.meta.url);
const selection=JSON.parse(fs.readFileSync(new URL('selection-data.json',base),'utf8'));
const summary=JSON.parse(fs.readFileSync(new URL('machine-research-summary.json',base),'utf8'));

test('Revue v8.4 Selection is reproducibly normalized from Selection + Summary',()=>{
 const source={...selection,features:selection.features.map(({eligibility,importance,evaluation,runtimePolicyBinding,...feature})=>feature)};
 const regenerated=normalizeSelectionRuntimeContract(source,summary);
 assert.deepEqual(regenerated.features,selection.features,'checked-in Selection feature contracts must equal generic normalization output');
 const byId=new Map(selection.features.map(x=>[x.featureId,x]));
 const expected=[
  ['FEAT_AT_INITIAL','SELECTION_SCORE',75.7422585,'THRESHOLD','主要'],
  ['FEAT_CZ_INITIAL','SELECTION_SCORE',82.32755826,'THRESHOLD','主要'],
  ['FEAT_CZ_FAKE_END_LED','SELECTION_SCORE',92.54490548,'THRESHOLD','主要'],
  ['FEAT_SPECIFIC_BONUS_5_AGG','MAXIMUM_SELECTION_SCORE',39.14810014303639,'NOT_THRESHOLD_CONTROLLED','補助'],
  ['FEAT_BIG_END_HINT_MULTINOMIAL','PER_ELIGIBLE_TRIAL_POWER',3.2791156090114573,'NOT_THRESHOLD_CONTROLLED','補助'],
 ];
 for(const [id,metric,value,mode,importance] of expected){
  const x=byId.get(id);
  assert.equal(x?.eligibility,'ELIGIBLE',id);
  assert.equal(x?.evaluation?.metric,metric,id);
  assert.ok(Math.abs(x?.evaluation?.value-value)<1e-12,id);
  assert.equal(x?.runtimePolicyBinding?.mode,mode,id);
  assert.equal(x?.importance,importance,id);
 }
 const blocked=byId.get('FEAT_AT_END_KIRIN_HINT_MULTINOMIAL');
 assert.equal(blocked?.eligibility,'INELIGIBLE');
 assert.equal(blocked?.evaluation?.metric,'UNAVAILABLE');
 assert.equal(blocked?.evaluation?.value,null);
});


test('Revue CATEGORY_COUNTERS bind generically to Observation and FeatureDefinition inputs',()=>{
 const observation=JSON.parse(fs.readFileSync(new URL('observation-contract.json',base),'utf8'));
 const canonical=JSON.parse(fs.readFileSync(new URL('canonical-ui.json',base),'utf8'));
 const generatedPath=new URL('../build/S_REVUE_STARLIGHT_CX/machine-package.generated.json',import.meta.url);
 const generated=JSON.parse(fs.readFileSync(generatedPath,'utf8'));
 const ui=materializeCanonicalUiV8(canonical,{observationContract:observation,evidenceContract:generated.v8?.evidence});
 const obsByInput=new Map();
 for(const feature of observation.numeric??[]) for(const input of feature.inputs??[]){
  if(input.id&&!input.shared) obsByInput.set(input.id,{featureId:feature.featureId,inputId:input.engineInputId??input.id});
 }
 const featureInputs=new Map((generated.features?.features??[]).map(feature=>[
  feature.featureId,
  new Set([feature.numeratorInputId,...(feature.categoryInputIds??[]),...(feature.denominatorInputIds??[])].filter(Boolean))
 ]));
 const numericCategories=[];
 for(const section of ui.sections??[]) for(const node of [...(section.groups??[]),...(section.items??[])]){
  if(node.interaction?.type!=='CATEGORY_COUNTERS') continue;
  for(const category of node.interaction.categories??[]){
   const expected=obsByInput.get(category.id);
   if(!expected) continue; // Evidence CATEGORY_COUNTERS are governed by the Evidence contract, not numeric FeatureDefinition.
   numericCategories.push(category.id);
   assert.equal(category.featureId,expected.featureId,category.id);
   assert.equal(category.engineBinding?.inputId,expected.inputId,category.id);
   assert.equal(featureInputs.get(expected.featureId)?.has(expected.inputId),true,category.id);
  }
 }
 assert.deepEqual(numericCategories,[
  'INP_CZ_LED_WHITE','INP_CZ_LED_BLUE','INP_CZ_LED_GREEN','INP_CZ_LED_RED','INP_CZ_LED_PURPLE',
  'INP_BIG_END_DEFAULT','INP_BIG_END_HIGH_WEAK','INP_BIG_END_HIGH_STRONG'
 ]);
});


test('Revue exact-exposure exclusions preserve observed-zero semantics through generated package',()=>{
 const observation=JSON.parse(fs.readFileSync(new URL('observation-contract.json',base),'utf8'));
 const feature=observation.numeric.find(x=>x.featureId==='FEAT_SPECIFIC_BONUS_5_AGG');
 const zeroIds=['INP_NORMAL_REPRODUCTION_ENTRIES','INP_CZ_REPRODUCTION_GAMES','INP_AT_REPRODUCTION_GAMES'];
 for(const id of zeroIds){
  assert.equal(feature.exposureReconstruction.terms.find(x=>x.inputId===id)?.observedZeroAllowed,true,id);
  assert.equal(feature.inputs.find(x=>x.id===id)?.observedZeroAllowed,true,id);
 }
 const generated=JSON.parse(fs.readFileSync(new URL('../build/S_REVUE_STARLIGHT_CX/machine-package.generated.json',import.meta.url),'utf8'));
 const derived=generated.inputs.inputs.find(x=>x.id==='DERIVED_FEAT_SPECIFIC_BONUS_5_AGG_ELIGIBLE_TRIALS');
 for(const id of zeroIds) assert.equal(derived?.derivedTerms?.find(x=>x.inputId===id)?.observedZeroAllowed,true,'generated '+id);
});
