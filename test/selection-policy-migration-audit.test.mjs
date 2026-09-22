import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {auditSelectionPolicyMigration} from '../tools/audit-selection-policy-migration.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');

test('legacy selection migration audit has no unresolved inference-contract regressions',()=>{
  const r=auditSelectionPolicyMigration(root);
  assert.equal(r.summary.blocked,0);
  assert.equal(r.summary.review,0);
  const byId=new Map(r.machines.map(x=>[x.machineId,x]));
  for(const id of byId.keys()) assert.equal(byId.get(id)?.status,'PASS');
  for(const m of r.machines){
    for(const d of m.reviewedDiffs??[]) assert.equal(d.reviewStatus,'APPROVED_SAFETY_REMOVAL',m.machineId);
  }
});
