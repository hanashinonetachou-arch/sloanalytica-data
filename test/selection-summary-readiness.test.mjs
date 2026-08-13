import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {auditSelectionSummaryReadiness} from '../tools/audit-selection-summary-readiness.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');

test('selection summary readiness audits every current research machine',()=>{
  const r=auditSelectionSummaryReadiness(root);
  assert.equal(r.machineCount,14);
  const byId=new Map(r.machines.map(x=>[x.machineId,x]));
  assert.equal(byId.get('L_INITIAL_D_2ND')?.status,'READY');
  assert.equal(byId.get('S_REVUE_STARLIGHT_CX')?.blockers.includes('BUILDER_REPRODUCTION'),false);
});

test('selection policy migration leaves no legacy DISPLAY_ONLY feature',()=>{
  const r=auditSelectionSummaryReadiness(root);
  assert.equal(r.machines.every(x=>x.counts.legacyDisplayOnly===0),true);
});
