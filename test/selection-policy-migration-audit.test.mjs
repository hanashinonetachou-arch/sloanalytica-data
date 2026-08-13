import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {auditSelectionPolicyMigration} from '../tools/audit-selection-policy-migration.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
test('selection policy migration audit confirms all machines preserve inference contracts',()=>{
  const r=auditSelectionPolicyMigration(root);
  assert.equal(r.summary.blocked,0);
  const byId=new Map(r.machines.map(x=>[x.machineId,x]));
  assert.equal(r.summary.review,0);
  for(const id of byId.keys()) assert.equal(byId.get(id)?.status,'PASS');
});
