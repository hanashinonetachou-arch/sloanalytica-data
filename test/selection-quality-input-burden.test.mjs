import test from 'node:test';
import assert from 'node:assert/strict';
import { assessSelectionQuality } from '../tools/selection-quality-gate.mjs';

const research = { features: [{ researchFeatureId: 'RF_A' }], evidenceCandidates: [] };

test('manual counting burden cannot justify EXCLUDE', () => {
  const result = assessSelectionQuality(research, {
    features: [{
      researchFeatureId: 'RF_A',
      featureId: 'FEAT_A',
      adoptionCategory: 'EXCLUDE',
      userFacingReason: '設定差はありますが、手動カウントが必要で入力負荷が高いため不採用です。',
    }],
  });
  assert.equal(result.status, 'BLOCKED');
  assert.ok(result.blockers.some(x => x.includes('input burden/manual counting')));
});

test('statistical rejection without input burden remains valid', () => {
  const result = assessSelectionQuality(research, {
    features: [{
      researchFeatureId: 'RF_A',
      featureId: 'FEAT_A',
      adoptionCategory: 'EXCLUDE',
      userFacingReason: '設定差はあるものの発生確率が極端に低く、通常の一日実戦では必要試行量を満たせないため不採用です。',
    }],
  });
  assert.equal(result.status, 'PASS');
});

test('rejectedElements also cannot cite input burden', () => {
  const result = assessSelectionQuality({ features: [], evidenceCandidates: [] }, {
    rejectedElements: [{
      id: 'REJ_A',
      name: '候補要素',
      reason: '設定差はありますが入力が大変なので不採用です。',
    }],
  });
  assert.equal(result.status, 'BLOCKED');
  assert.ok(result.blockers.some(x => x.includes('input burden/manual counting')));
});
