import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeRequests, buildBrief } from '../tools/prepare-user-selected-research-batch.mjs';

test('user-selected batch keeps explicit names and removes normalized duplicates', () => {
  assert.deepEqual(normalizeRequests(['Lバキ 強くなりたくば喰らえ!!!', 'Lバキ　強くなりたくば喰らえ!!!', 'スマスロ北斗の拳']), ['Lバキ 強くなりたくば喰らえ!!!', 'スマスロ北斗の拳']);
});

test('user-selected batch enforces 10-machine limit', () => {
  assert.throws(() => normalizeRequests(Array.from({length: 11}, (_, i) => `machine-${i}`)), /batch size exceeds 10/);
});

test('research brief never assigns a machineId before identity verification', () => {
  const brief = buildBrief('Example Machine', 'BATCH_TEST', 1);
  assert.equal(brief.identity.machineId, null);
  assert.equal(brief.safety.userSelected, true);
  assert.equal(brief.safety.marketCandidateEntryRequired, false);
  assert.equal(brief.safety.machineIdMayBeGuessed, false);
});
