import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const selection=JSON.parse(fs.readFileSync('research/L_INITIAL_D_2ND/selection-data.json','utf8'));
const generated=JSON.parse(fs.readFileSync('build/L_INITIAL_D_2ND/machine-package.generated.json','utf8'));

test('Initial D 2nd keeps AT initial hit display-only and LB/bell as numeric inference',()=>{
  const byId=new Map(generated.features.features.map(f=>[f.featureId,f]));
  assert.equal(byId.get('FEAT_LB_INITIAL')?.probabilityEngineUsage,true);
  assert.equal(byId.get('FEAT_BELL_NORMAL')?.probabilityEngineUsage,true);
  assert.equal(byId.get('FEAT_AT_INITIAL_REFERENCE')?.probabilityEngineUsage,false);
});

test('Initial D 2nd bell denominator UI preserves nav-exclusion condition',()=>{
  const input=selection.inputs.find(i=>i.id==='INP_BELL_TARGET_GAMES');
  assert.match(input?.name??'',/押し順ナビ区間を除外/);
});

test('Initial D 2nd 86 OVER occurrence state is single-select',()=>{
  const group=selection.evidenceUi.groups.find(g=>g.groupId==='INITIAL_D_PAYOUT_86_COUNT');
  assert.equal(group?.selectionMode,'single');
  assert.deepEqual(group?.options.map(o=>o.value),['OVER_86_1_2','OVER_86_3','OVER_86_4']);
});
