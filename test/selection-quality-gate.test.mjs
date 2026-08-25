import test from 'node:test';
import assert from 'node:assert/strict';
import { assessSelectionQuality } from '../tools/selection-quality-gate.mjs';

const research = {
  features: [
    { researchFeatureId: 'RF_A' },
    { researchFeatureId: 'RF_B' },
  ],
  evidenceCandidates: [
    { researchEvidenceId: 'RE_A' },
  ],
};

test('coverage gate blocks unclassified research candidates', () => {
  const selection = {
    features: [{ researchFeatureId: 'RF_A', featureId: 'FEAT_A', adoptionCategory: 'INCLUDE_PRIMARY', userReason: '通常ゲーム数を分母に直接観測でき、全設定の確率が公開されているため採用します。' }],
    evidenceUi: { groups: [] },
  };
  const result = assessSelectionQuality(research, selection);
  assert.equal(result.status, 'BLOCKED');
  assert.deepEqual(result.coverage.missingFeatureDecisions, ['RF_B']);
  assert.deepEqual(result.coverage.missingEvidenceDecisions, ['RE_A']);
});

test('coverage accepts explicit feature rejection and evidence UI classification', () => {
  const selection = {
    features: [
      { researchFeatureId: 'RF_A', featureId: 'FEAT_A', adoptionCategory: 'INCLUDE_PRIMARY', userReason: '通常ゲーム数を分母に直接観測でき、全設定の確率が公開されているため採用します。' },
      { researchFeatureId: 'RF_B', featureId: 'FEAT_B', adoptionCategory: 'EXCLUDE', userFacingReason: '主Featureの部分集合で同じ事象を重複評価するため不採用です。' },
    ],
    evidenceUi: { groups: [{ groupId: 'G', options: [{ value: 'A', sourceEvidenceIds: ['RE_A'] }] }] },
  };
  const result = assessSelectionQuality(research, selection);
  assert.equal(result.status, 'PASS');
  assert.equal(result.coverage.classifiedFeatures, 2);
  assert.equal(result.coverage.classifiedEvidence, 1);
});

test('explanation gate reviews generic selected and rejected reasons', () => {
  const selection = {
    features: [
      { researchFeatureId: 'RF_A', featureId: 'FEAT_A', adoptionCategory: 'INCLUDE_PRIMARY', userReason: '設定差があるため採用。' },
      { researchFeatureId: 'RF_B', featureId: 'FEAT_B', adoptionCategory: 'EXCLUDE', userFacingReason: '低頻度。' },
    ],
    evidenceUi: { groups: [{ groupId: 'G', options: [{ value: 'A', sourceEvidenceIds: ['RE_A'] }] }] },
  };
  const result = assessSelectionQuality(research, selection);
  assert.equal(result.status, 'REVIEW');
  assert.ok(result.reviews.some(x => x.includes('selected FEAT_A')));
  assert.ok(result.reviews.some(x => x.includes('rejected FEAT_B')));
});

test('evidenceDecisions can explicitly classify evidence that has no input UI', () => {
  const selection = {
    features: [
      { researchFeatureId: 'RF_A', featureId: 'FEAT_A', adoptionCategory: 'INCLUDE_PRIMARY', userReason: '通常ゲーム数を分母に直接観測でき、全設定の確率が公開されているため採用します。' },
      { researchFeatureId: 'RF_B', featureId: 'FEAT_B', adoptionCategory: 'EXCLUDE', userFacingReason: '主Featureの部分集合で同じ事象を重複評価するため不採用です。' },
    ],
    evidenceDecisions: [{ researchEvidenceId: 'RE_A', adoptionCategory: 'REFERENCE_ONLY', userFacingReason: '実戦中の安定した観測方法が確立していないため参考情報として保持します。' }],
  };
  const result = assessSelectionQuality(research, selection);
  assert.equal(result.status, 'PASS');
});

test('fallback features require a concrete adoption reason', () => {
  const localResearch = { features: [{ researchFeatureId: 'RF_F' }], evidenceCandidates: [] };
  const missing = assessSelectionQuality(localResearch, {
    features: [{ researchFeatureId: 'RF_F', featureId: 'FEAT_F', adoptionCategory: 'INCLUDE_FALLBACK' }],
  });
  assert.equal(missing.status, 'BLOCKED');
  assert.ok(missing.blockers.some(x => x.includes('selected FEAT_F: missing userReason')));

  const explained = assessSelectionQuality(localResearch, {
    features: [{ researchFeatureId: 'RF_F', featureId: 'FEAT_F', adoptionCategory: 'INCLUDE_FALLBACK', userReason: '主Featureを観測していない場合だけ通常ゲーム数を分母に使うFallbackとし、同時利用時は抑制して二重評価を避けます。' }],
  });
  assert.equal(explained.status, 'PASS');
});

test('inability to discriminate an internal state is a concrete rejection basis', () => {
  const localResearch = { features: [{ researchFeatureId: 'RF_STATE' }], evidenceCandidates: [] };
  const result = assessSelectionQuality(localResearch, {
    features: [{ researchFeatureId: 'RF_STATE', featureId: 'FEAT_STATE', adoptionCategory: 'EXCLUDE', userFacingReason: '内部状態を実戦中に正確に判別できず、見た目で分類すると誤入力リスクが高いため不採用。' }],
  });
  assert.equal(result.status, 'PASS');
});
