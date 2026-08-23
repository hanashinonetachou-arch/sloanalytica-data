import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validateUiDesignData, gateUiDesignData } from '../tools/validate-ui-design-data.mjs';

function read(machineId){
  return JSON.parse(fs.readFileSync(new URL(`../research/${machineId}/ui-design-data.json`,import.meta.url),'utf8'));
}

const reference=read('S_REVUE_STARLIGHT_CX');

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

test('pilot designs validate across A-type, BT and smart-slot AT',()=>{
  for(const machineId of ['S_MY_JUGGLER_V_KD','LB_SLOT_GALFY_A4','L_INITIAL_D_2ND']){
    const data=read(machineId);
    assert.deepEqual(validateUiDesignData(data,{expectedMachineId:machineId}),[],machineId);
    assert.equal(gateUiDesignData(data).gate,'PASS_WITH_UNRESOLVED',machineId);
  }
});

test('independent evidence group requires Selection source id',()=>{
  const x=structuredClone(read('LB_SLOT_GALFY_A4'));
  delete x.evidenceContracts.EVID_GALFY_SIDE_LAMP.sourceEvidenceGroupId;
  assert.ok(validateUiDesignData(x).some(e=>e.includes('sourceEvidenceGroupId is required')));
});
