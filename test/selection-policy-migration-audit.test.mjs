import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {auditSelectionPolicyMigration} from '../tools/audit-selection-policy-migration.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');

test('selection policy migration audit confirms all machines preserve inference contracts except reviewed safety removals',()=>{
  const r=auditSelectionPolicyMigration(root);
  assert.equal(r.summary.blocked,0);
  assert.equal(r.summary.review,0);
  assert.equal(r.summary.reviewedSafetyChanges,5);
  const byId=new Map(r.machines.map(x=>[x.machineId,x]));
  for(const id of byId.keys()) assert.equal(byId.get(id)?.status,'PASS');

  const expected=['LB_AREX_BRIGHT_BA','LB_CREA_BONUS_TRIGGER_A2','LB_MAGICAL_HALLOWEEN_GS','S_NEO_IM_JUGGLER_EX_KK','S_ULTRA_MIRACLE_JUGGLER_KT'];
  const reviewed=r.machines.filter(x=>x.reviewedDiffs?.length).map(x=>x.machineId).sort();
  assert.deepEqual(reviewed,expected);
  for(const id of expected){
    const changes=byId.get(id)?.reviewedDiffs??[];
    assert.equal(changes.length,1);
    assert.equal(changes[0].type,'ACTIVE_FEATURE_SET_DIFF');
    assert.equal(changes[0].reviewStatus,'APPROVED_SAFETY_REMOVAL');
    const removed=changes[0].published.filter(fid=>!changes[0].generated.includes(fid));
    assert.deepEqual(removed,['FEAT_PREDECESSOR_BONUS_OUTCOME']);
    assert.match(changes[0].reason,/実機未確認/);
  }
});
