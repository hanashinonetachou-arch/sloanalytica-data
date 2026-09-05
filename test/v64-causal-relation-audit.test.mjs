import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { auditCausalRelations } from '../tools/audit-v64-causal-relations.mjs';

const EXPECTED_KEYS = [
  'L_BIOHAZARD5_ZE/RF_CZ_TOTAL',
  'L_DMC5_ST_XA/RF_ST_FIRST_HIT',
  'L_GUNDAM_SEED_G/RF_CZ_FIRST_HIT',
  'L_SISTER_QUEST_CA/RF_CZ_FIRST_HIT',
  'S_SUPER_RIO_ACE_CC/RF_BONUS_AT_DRAW_STRONG',
].sort();

test('v6.4 causal review has no unresolved candidates',()=>{
  const report=auditCausalRelations(path.resolve('.'));
  assert.equal(report.summary.candidateCount,5);
  assert.equal(report.summary.reviewedCandidateCount,5);
  assert.equal(report.summary.unresolvedCandidateCount,0);
  assert.equal(report.summary.machineCount,5);
  assert.deepEqual(
    report.candidates.map(x=>`${x.machineId}/${x.researchFeatureId}`).sort(),
    EXPECTED_KEYS,
  );
  assert.ok(report.candidates.every(x=>x.relation && x.action && x.rationale));
});

test('review mapping remains exact for the current causal-reason candidate set',()=>{
  const report=auditCausalRelations(path.resolve('.'));
  assert.deepEqual(
    report.candidates.map(x=>`${x.machineId}/${x.researchFeatureId}`).sort(),
    EXPECTED_KEYS,
  );
  assert.equal(report.summary.unresolvedCandidateCount,0);
});
