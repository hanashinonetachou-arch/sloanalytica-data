import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { auditCausalRelations } from '../tools/audit-v64-causal-relations.mjs';

test('v6.4 causal review has no unresolved candidates',()=>{
  const report=auditCausalRelations(path.resolve('.'));
  assert.equal(report.summary.candidateCount,0);
  assert.equal(report.summary.machineCount,0);
  assert.deepEqual(report.summary.relationCounts,{});
  assert.deepEqual(report.summary.actionCounts,{});
  assert.deepEqual(report.candidates,[]);
});

test('new causal-reason candidates are treated as review drift',()=>{
  const report=auditCausalRelations(path.resolve('.'));
  assert.equal(report.candidates.length,0);
});
