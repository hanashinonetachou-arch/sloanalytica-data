import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {auditSelectionPolicyMigration} from '../tools/audit-selection-policy-migration.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
test('selection policy migration audit blocks no machine and identifies safe no-inference-change candidates',()=>{
  const r=auditSelectionPolicyMigration(root);
  assert.equal(r.summary.blocked,0);
  const byId=new Map(r.machines.map(x=>[x.machineId,x]));
  for(const id of ['L_INITIAL_D_2ND','L_KAGUYA_SAMA_JA','L_TOKYO_GHOUL','S_IM_JUGGLER_EX_TP','S_REVUE_STARLIGHT_CX']) assert.equal(byId.get(id)?.status,'PASS');
  assert.equal(byId.get('S_MY_JUGGLER_V_KD')?.status,'REVIEW');
});
