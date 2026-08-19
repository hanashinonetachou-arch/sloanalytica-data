import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DUPLICATE_REJECTED_ELEMENT_IDS,
  removeDuplicateRejectedElements,
} from '../tools/fix-duplicate-rejected-elements.mjs';

test('duplicate rejected-element fix targets the 8 verified machines', () => {
  assert.equal(Object.keys(DUPLICATE_REJECTED_ELEMENT_IDS).length, 8);
  assert.deepEqual(DUPLICATE_REJECTED_ELEMENT_IDS.L_G1_YUSHUN_CLUB_GOLD_KD, [
    'REJECTED_G1_BONUS_TINY_DIFF',
    'REJECTED_G1_ROAD_TINY_DIFF',
  ]);
  assert.deepEqual(DUPLICATE_REJECTED_ELEMENT_IDS.L_CODE_GEASS_REVIVAL_ZS, [
    'REJECTED_BIG_OVERLAP',
    'REJECTED_DIRECT_NESTED',
  ]);
});

test('duplicate rejected-element fix removes only requested rejectedElements', () => {
  const selection = {
    features: [{ featureId: 'FEAT_KEEP', adoptionCategory: 'EXCLUDE' }],
    rejectedElements: [
      { id: 'REMOVE_ME', name: 'duplicate' },
      { id: 'KEEP_ME', name: 'unique' },
    ],
  };
  const result = removeDuplicateRejectedElements(selection, ['REMOVE_ME']);
  assert.deepEqual(result.features, selection.features);
  assert.deepEqual(result.rejectedElements, [{ id: 'KEEP_ME', name: 'unique' }]);
});
