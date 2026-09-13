import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {auditSelectionPolicyMigration} from '../tools/audit-selection-policy-migration.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');

test('selection policy migration audit confirms all machines preserve inference contracts with no remaining safety-removal exceptions',()=>{
  const r=auditSelectionPolicyMigration(root);
  assert.equal(r.summary.blocked,0);
  assert.equal(r.summary.review,0);
  assert.equal(r.summary.reviewedSafetyChanges,0);
  const byId=new Map(r.machines.map(x=>[x.machineId,x]));
  for(const id of byId.keys()) assert.equal(byId.get(id)?.status,'PASS');
  const reviewed=r.machines.filter(x=>x.reviewedDiffs?.length).map(x=>x.machineId).sort();
  assert.deepEqual(reviewed,[]);
});
