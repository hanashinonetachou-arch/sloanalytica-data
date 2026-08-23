import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validateUiDesignData, gateUiDesignData } from '../tools/validate-ui-design-data.mjs';

const reference=JSON.parse(fs.readFileSync(new URL('../research/S_REVUE_STARLIGHT_CX/ui-design-data.json',import.meta.url),'utf8'));

test('reference UI design validates',()=>{
  assert.deepEqual(validateUiDesignData(reference,{expectedMachineId:'S_REVUE_STARLIGHT_CX'}),[]);
  assert.equal(gateUiDesignData(reference).gate,'PASS');
});

test('derived input requires valid sources',()=>{
  const x=structuredClone(reference);
  x.inputContracts.INP_BLUE_BIG_COUNT.derivedFromInputIds=['MISSING'];
  assert.ok(validateUiDesignData(x).some(e=>e.includes('unknown derived source')));
});

test('unresolved UI design is non-blocking',()=>{
  const x=structuredClone(reference);
  x.status='PASS_WITH_UNRESOLVED';
  x.unresolved=[{id:'UI_X',reason:'observation detail unresolved'}];
  assert.equal(gateUiDesignData(x).gate,'PASS_WITH_UNRESOLVED');
});

test('manual review is distinct from research reopen',()=>{
  const x=structuredClone(reference);
  x.status='MANUAL_UI_REVIEW_REQUIRED';
  assert.equal(gateUiDesignData(x).gate,'MANUAL_UI_REVIEW_REQUIRED');
});
