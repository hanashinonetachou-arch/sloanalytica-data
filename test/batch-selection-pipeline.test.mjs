import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeRequests,classifySelection} from '../tools/batch-selection-pipeline.mjs';

test('selection batch de-duplicates and enforces max 10',()=>{
  assert.deepEqual(normalizeRequests(['A','A','B']),['A','B']);
  assert.throws(()=>normalizeRequests(Array.from({length:11},(_,i)=>`M${i}`)),/batch limit exceeded/);
});

test('clean selection is READY_FOR_MACHINE',()=>{
  assert.equal(classifySelection({ok:true,errors:[],warnings:[]},{conflicts:[]}), 'READY_FOR_MACHINE');
});

test('selection warnings or research conflicts require REVIEW',()=>{
  assert.equal(classifySelection({ok:true,errors:[],warnings:['w']},{conflicts:[]}), 'REVIEW');
  assert.equal(classifySelection({ok:true,errors:[],warnings:[]},{conflicts:[{conflictId:'C'}]}), 'REVIEW');
});

test('invalid selection is BLOCKED',()=>{
  assert.equal(classifySelection({ok:false,errors:['bad'],warnings:[]},{conflicts:[]}), 'BLOCKED');
});
