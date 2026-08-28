import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { auditCausalRelations } from '../tools/audit-v64-causal-relations.mjs';

test('all current causal-review candidates have explicit semantic classification',()=>{
  const root=path.resolve('.');
  const report=auditCausalRelations(root);
  assert.equal(report.summary.candidateCount,13);
  assert.equal(report.summary.machineCount,3);
  assert.deepEqual(report.summary.relationCounts,{
    CAUSALLY_RELATED_BUT_DISTINCT_OBSERVATION:6,
    MUTUALLY_EXCLUSIVE_COMPOSITION:3,
    CONDITIONAL_COMPOSITION:4,
  });
  assert.equal(report.candidates.filter(x=>x.relation==='CAUSALLY_RELATED_BUT_DISTINCT_OBSERVATION').every(x=>/REOPEN|REVIEW_OTHER/.test(x.action)),true);
  for(const resolved of ['RF_CZ_ACCEL','RF_CZ_LASTORDER','RF_CZ_DUAL','RF_CZ_OUTCOME','RF_AT_INITIAL','RF_SHUTTER_OPEN','RF_SHUTTER_DURATION','RF_SHUTTER_ROLE_CZ','RF_SHUTTER_NONROLE_CZ','RF_CHANCE3_CZ_TYPE']){
    assert.equal(report.candidates.some(x=>x.machineId==='L_TOARU_ACCELERATOR_RZ'&&x.researchFeatureId===resolved),false,`${resolved} should no longer be a causal-reason review candidate`);
  }
  assert.equal(report.candidates.some(x=>x.machineId==='L_ENEN_NO_SHOUBOUTAI_JG'&&x.researchFeatureId==='RF_CROSS_BONUS'),false,'Fire Force RF_CROSS_BONUS should no longer be a causal-reason review candidate');
  assert.equal(report.candidates.some(x=>x.machineId==='L_GIRLS_UND_PANZER_FINALE_H1'&&x.researchFeatureId==='RF_CZ'),false,'Garupan RF_CZ should no longer be a causal-reason review candidate');
  assert.equal(report.candidates.some(x=>x.machineId==='L_KING_PULSAR_SLCC'&&x.researchFeatureId==='RF_CZ'),false,'King Pulsar RF_CZ should no longer be a causal-reason review candidate');
  assert.equal(report.candidates.some(x=>x.machineId==='L_ONE_PUNCH_MAN'),false,'One Punch Man should no longer have causal-reason review candidates');
});

test('review retains structural Research definitions for every candidate',()=>{
  const report=auditCausalRelations(path.resolve('.'));
  for(const row of report.candidates){
    assert.ok(row.trialUnit,`${row.machineId}/${row.researchFeatureId} trialUnit`);
    assert.ok(row.numeratorDefinition,`${row.machineId}/${row.researchFeatureId} numeratorDefinition`);
    assert.ok(row.denominatorDefinition,`${row.machineId}/${row.researchFeatureId} denominatorDefinition`);
  }
});
