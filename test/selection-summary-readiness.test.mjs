import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {auditSelectionSummaryReadiness} from '../tools/audit-selection-summary-readiness.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');

test('selection summary readiness audits every current research machine',()=>{
  const r=auditSelectionSummaryReadiness(root);
  assert.equal(r.machineCount,10);
  const byId=new Map(r.machines.map(x=>[x.machineId,x]));
  assert.equal(byId.get('L_INITIAL_D_2ND')?.status,'READY');
  assert.equal(byId.get('S_REVUE_STARLIGHT_CX')?.blockers.includes('BUILDER_REPRODUCTION'),true);
});

test('legacy DISPLAY_ONLY distinguishes input dependency from reference candidate',()=>{
  const r=auditSelectionSummaryReadiness(root);
  const byId=new Map(r.machines.map(x=>[x.machineId,x]));
  const mushoku=byId.get('L_MUSHOKU_TENSEI_NM');
  assert.equal(mushoku.legacyDisplayOnly.some(x=>x.classification==='INPUT_DEPENDENCY'),true);
  const eureka=byId.get('S_EUREKA_SEVEN_HIEVO_XS');
  assert.equal(eureka.legacyDisplayOnly.some(x=>x.classification==='LEGACY_REFERENCE_CANDIDATE'),true);
});
