import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeRequests, deriveStage, deriveOverallStatus } from '../tools/batch-e2e-orchestrator.mjs';

test('normalizes duplicate requests and enforces batch limit', () => {
  assert.deepEqual(normalizeRequests([' スマスロ北斗の拳 ', 'スマスロ　北斗の拳', 'L_TEST']), ['スマスロ北斗の拳', 'L_TEST']);
  assert.throws(() => normalizeRequests(Array.from({length:11},(_,i)=>`L_${i}`)), /batch size exceeds 10/);
});

test('stage derivation follows research selection machine order', () => {
  assert.equal(deriveStage({researchExists:false}), 'RESEARCH_REQUIRED');
  assert.equal(deriveStage({researchExists:true,researchOk:false}), 'BLOCKED');
  assert.equal(deriveStage({researchExists:true,researchOk:true,researchReview:true}), 'RESEARCH_REVIEW');
  assert.equal(deriveStage({researchExists:true,researchOk:true,researchReview:false,selectionExists:false}), 'SELECTION_REQUIRED');
  assert.equal(deriveStage({researchExists:true,researchOk:true,researchReview:false,selectionExists:true,selectionOk:false}), 'BLOCKED');
  assert.equal(deriveStage({researchExists:true,researchOk:true,researchReview:false,selectionExists:true,selectionOk:true,selectionReview:true}), 'SELECTION_REVIEW');
  assert.equal(deriveStage({researchExists:true,researchOk:true,researchReview:false,selectionExists:true,selectionOk:true,selectionReview:false,published:false}), 'READY_FOR_MACHINE');
  assert.equal(deriveStage({researchExists:true,researchOk:true,researchReview:false,selectionExists:true,selectionOk:true,selectionReview:false,published:true}), 'PUBLISHED');
});

test('overall status prioritizes blocked and reviews before required stages', () => {
  assert.equal(deriveOverallStatus([{stage:'PUBLISHED'},{stage:'READY_FOR_MACHINE'}]), 'READY_FOR_MACHINE');
  assert.equal(deriveOverallStatus([{stage:'SELECTION_REQUIRED'},{stage:'READY_FOR_MACHINE'}]), 'SELECTION_REQUIRED');
  assert.equal(deriveOverallStatus([{stage:'RESEARCH_REQUIRED'},{stage:'SELECTION_REQUIRED'}]), 'RESEARCH_REQUIRED');
  assert.equal(deriveOverallStatus([{stage:'RESEARCH_REVIEW'},{stage:'RESEARCH_REQUIRED'}]), 'REVIEW');
  assert.equal(deriveOverallStatus([{stage:'BLOCKED'},{stage:'RESEARCH_REVIEW'}]), 'BLOCKED');
  assert.equal(deriveOverallStatus([{stage:'PUBLISHED'}]), 'PUBLISHED');
});
