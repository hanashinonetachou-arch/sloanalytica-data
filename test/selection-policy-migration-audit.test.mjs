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
  assert.equal(r.summary.reviewedSafetyChanges,8);
  const byId=new Map(r.machines.map(x=>[x.machineId,x]));
  for(const id of byId.keys()) assert.equal(byId.get(id)?.status,'PASS');

  const expectedRemovals={
    LB_AREX_BRIGHT_BA:['FEAT_PREDECESSOR_BONUS_OUTCOME'],
    LB_CREA_BONUS_TRIGGER_A2:['FEAT_PREDECESSOR_BONUS_OUTCOME'],
    LB_MAGICAL_HALLOWEEN_GS:['FEAT_PREDECESSOR_BONUS_OUTCOME'],
    LB_SHAKE_BONUS_TRIGGER_A1:['FEAT_PREDECESSOR_BONUS_OUTCOME'],
    L_RING_NI_KAKERO1_FS:['FEAT_BONUS_PREDECESSOR'],
    L_MADOKA_FORTE_UU:['FEAT_BONUS_PREDECESSOR'],
    S_NEO_IM_JUGGLER_EX_KK:['FEAT_PREDECESSOR_BONUS_OUTCOME'],
    S_ULTRA_MIRACLE_JUGGLER_KT:['FEAT_PREDECESSOR_BONUS_OUTCOME']
  };
  const expected=Object.keys(expectedRemovals).sort();
  const reviewed=r.machines.filter(x=>x.reviewedDiffs?.length).map(x=>x.machineId).sort();
  assert.deepEqual(reviewed,expected);
  for(const id of expected){
    const changes=byId.get(id)?.reviewedDiffs??[];
    assert.equal(changes.length,1);
    assert.equal(changes[0].type,'ACTIVE_FEATURE_SET_DIFF');
    assert.equal(changes[0].reviewStatus,'APPROVED_SAFETY_REMOVAL');
    const removed=changes[0].published.filter(fid=>!changes[0].generated.includes(fid)).sort();
    assert.deepEqual(removed,expectedRemovals[id]);
    assert.match(changes[0].reason,/実機未確認/);
  }
});
