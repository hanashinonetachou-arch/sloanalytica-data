import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {normalizeSelectionRuntimeContract} from '../tools/normalize-selection-runtime-contract.mjs';

const base=new URL('../repro-v8/S_REVUE_STARLIGHT_CX/',import.meta.url);
const selection=JSON.parse(fs.readFileSync(new URL('selection-data.json',base),'utf8'));
const summary=JSON.parse(fs.readFileSync(new URL('machine-research-summary.json',base),'utf8'));

test('Revue v8.4 Selection is reproducibly normalized from Selection + Summary',()=>{
 const regenerated=normalizeSelectionRuntimeContract(selection,summary);
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
