import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('Manifest v8.5 production runtime-policy baseline is fixed and complete',()=>{
  const file=path.resolve('config/runtime-policy-v8.5.json');
  const c=JSON.parse(fs.readFileSync(file,'utf8'));
  assert.equal(c.schemaVersion,'runtime-policy-config-v1');
  assert.equal(c.manifestVersion,'8.5');
  assert.deepEqual(c.thresholds,{
    SELECTION_SCORE:{status:'FIXED',value:5},
    PER_ELIGIBLE_TRIAL_POWER:{status:'FIXED',value:0},
  });
});
