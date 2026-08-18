import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validateVerificationStatus } from '../tools/machine-verification-status.mjs';

const statusDoc=JSON.parse(fs.readFileSync('machine-verification-status.json','utf8'));
const catalog=JSON.parse(fs.readFileSync('catalog.json','utf8'));

test('real-device verification status document validates',()=>{
  const result=validateVerificationStatus(statusDoc,catalog);
  assert.equal(result.status,'PASS',JSON.stringify(result.errors,null,2));
});

test('batch 001 published machines start pending real-device verification',()=>{
  assert.equal(statusDoc.entries.length,10);
  for(const entry of statusDoc.entries) assert.equal(entry.status,'PENDING_REAL_DEVICE');
});

test('invalid status and unpublished machine are rejected',()=>{
  const bad={schemaVersion:'machine-verification-status-v1',entries:[{machineId:'L_UNKNOWN_X',status:'DONE'}]};
  const result=validateVerificationStatus(bad,catalog);
  assert.equal(result.status,'FAIL');
  assert.ok(result.errors.some(e=>e.includes('invalid status')));
  assert.ok(result.errors.some(e=>e.includes('not published')));
});
