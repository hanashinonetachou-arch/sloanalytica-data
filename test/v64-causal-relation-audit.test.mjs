import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { auditCausalRelations } from '../tools/audit-v64-causal-relations.mjs';

test('all current causal-review candidates have explicit semantic classification',()=>{
  const root=path.resolve('.');
  const report=auditCausalRelations(root);
  assert.equal(report.summary.candidateCount,28);
  assert.equal(report.summary.machineCount,8);
  assert.deepEqual(report.summary.relationCounts,{
    CONDITIONAL_COMPOSITION:8,
    CAUSALLY_RELATED_BUT_DISTINCT_OBSERVATION:13,
    MUTUALLY_EXCLUSIVE_COMPOSITION:7,
  });
  assert.equal(report.candidates.filter(x=>x.relation==='CAUSALLY_RELATED_BUT_DISTINCT_OBSERVATION').every(x=>/REOPEN|REVIEW_OTHER/.test(x.action)),true);
});

test('review retains structural Research definitions for every candidate',()=>{
  const report=auditCausalRelations(path.resolve('.'));
  for(const row of report.candidates){
    assert.ok(row.trialUnit,`${row.machineId}/${row.researchFeatureId} trialUnit`);
    assert.ok(row.numeratorDefinition,`${row.machineId}/${row.researchFeatureId} numeratorDefinition`);
    assert.ok(row.denominatorDefinition,`${row.machineId}/${row.researchFeatureId} denominatorDefinition`);
  }
});
