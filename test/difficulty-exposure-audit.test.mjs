import test from 'node:test';
import assert from 'node:assert/strict';
import {auditExposure} from '../tools/difficulty-exposure-audit.mjs';

test('phase9.4B-2 exposure audit identifies only evidence-backed/structurally exact exposures as usable',()=>{
  const r=auditExposure(process.cwd());
  assert.equal(r.ok,true);
  const cg=r.machines.find(m=>m.machineId==='S_CODE_GEASS_3_CC_FS');
  const tokyo=r.machines.find(m=>m.machineId==='L_TOKYO_GHOUL');
  assert.equal(cg.summary.usable,1);
  assert.equal(cg.features.find(f=>f.featureId==='FEAT_CHERRY_WATERMELON_MULTINOMIAL').status,'EXACT');
  assert.equal(tokyo.summary.usable,0);
  assert.equal(tokyo.gameBasis.status,'PROVISIONAL');
  assert.ok(tokyo.features.some(f=>f.status==='UNRESOLVED'));
});
