import test from 'node:test';
import assert from 'node:assert/strict';
import { auditUserVerifiedUxContracts } from '../tools/audit-user-verified-ux-contracts.mjs';

test('user-verified UX contracts remain compatible with generated machine packages', () => {
  const result = auditUserVerifiedUxContracts();
  assert.equal(result.ok, true, result.errors.join('\n'));
  assert.deepEqual(result.errors, []);

  const expectedMachines = [
    'LB_FUJIKO_M2',
    'LB_ISEKAI_QUARTET_KR',
    'LB_SLOT_GALFY_A4',
    'LB_THUNDER_V_HA',
    'LB_TOBE_HAREM_ACE_CF',
    'S_CODE_GEASS_3_CC_FS',
  ];
  for (const machineId of expectedMachines) {
    assert.ok(result.checked.includes(machineId), `${machineId}: UX contract was not audited`);
  }
});

test('known unresolved historical UX is REVIEW, not silently guessed or treated as ERROR', () => {
  const result = auditUserVerifiedUxContracts({ machineIds: ['S_CODE_GEASS_3_CC_FS'] });
  assert.equal(result.ok, true, result.errors.join('\n'));
  assert.equal(result.errors.length, 0);
  assert.ok(result.reviews.some(review => review.includes('C_CC_SEATED_DATA_SECTION')));
});

test('Isekai Quartet protects the verified absence of generic current-games inputs', () => {
  const result = auditUserVerifiedUxContracts({ machineIds: ['LB_ISEKAI_QUARTET_KR'] });
  assert.equal(result.ok, true, result.errors.join('\n'));
  assert.equal(result.errors.length, 0);
});
