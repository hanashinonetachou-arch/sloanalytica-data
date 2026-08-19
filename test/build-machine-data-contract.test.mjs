import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMachineData } from '../tools/build-machine-data.mjs';

const research = {
  machine: {
    machineId: 'TEST_MACHINE',
    displayName: 'テスト機',
    modelNumber: 'TEST',
    manufacturer: 'TEST',
    settings: ['SET_1', 'SET_6'],
  },
  sources: [],
  features: [
    {
      researchFeatureId: 'RF_MULTI',
      name: 'カテゴリ内訳',
      factStatus: 'verified',
      candidateModel: 'multinomial',
      categories: ['A', 'B'],
      settingDistributions: {
        SET_1: { A: 0.8, B: 0.2 },
        SET_6: { A: 0.2, B: 0.8 },
      },
      trialUnit: '回',
      sourceRefs: [],
    },
    {
      researchFeatureId: 'RF_REJECTED',
      name: '調査済み未採用候補',
      factStatus: 'verified',
      candidateModel: 'binomial',
      trialUnit: 'G',
      settingValues: {
        SET_1: { probability: 0.01 },
        SET_6: { probability: 0.02 },
      },
      sourceRefs: [],
      notes: '設定差は確認済みだが観測条件に課題がある。',
    },
  ],
  evidenceCandidates: [],
};

const selection = {
  machineId: 'TEST_MACHINE',
  machineDataVersion: '0.1.0',
  inputs: [
    { id: 'INP_A', name: 'A', type: 'counter', category: 'PRIMARY', unit: '回', displayOrder: 1 },
    { id: 'INP_B', name: 'B', type: 'counter', category: 'PRIMARY', unit: '回', displayOrder: 2 },
  ],
  features: [
    {
      researchFeatureId: 'RF_MULTI',
      featureId: 'FEAT_MULTI',
      adoptionCategory: 'INCLUDE_SUPPORT',
      numeratorInputId: 'INP_A',
      categoryInputIds: ['INP_B'],
      inputTransform: 'sum_inputs_to_trials',
      minimumSample: 1,
      sampleRecommendation: 10,
      weight: 1,
      userReason: '内訳差が大きいため採用。',
    },
  ],
  rejectedElements: [
    {
      id: 'REJECTED_MANUAL',
      name: '説明専用の不採用要素',
      reason: '設定差はあるが、1日の実戦では有効な試行回数を確保しにくいため不採用。',
      requiredTrials: { value: 40000, unit: 'G' },
    },
  ],
  evidence: [],
  evidenceUi: { groups: [] },
};

test('sum_inputs_to_trials materializes denominatorInputIds from all explicit categories', () => {
  const pkg = buildMachineData(research, selection);
  const feature = pkg.features.features.find((item) => item.featureId === 'FEAT_MULTI');
  assert.deepEqual(feature.denominatorInputIds, ['INP_A', 'INP_B']);
});

test('verified ResearchData candidates omitted from Selection remain visible as rejected explanations', () => {
  const pkg = buildMachineData(research, selection);
  const rejected = pkg.selectionSummary.rejected.find((item) => item.name === '調査済み未採用候補');
  assert.ok(rejected);
  assert.match(rejected.reason, /設定差は確認済みだが観測条件に課題がある/);
  assert.match(rejected.reason, /推測計算には使用していません/);
});

test('explicit rejectedElements are retained in the user-facing selection summary', () => {
  const pkg = buildMachineData(research, selection);
  const rejected = pkg.selectionSummary.rejected.find((item) => item.featureId === 'REJECTED_MANUAL');
  assert.ok(rejected);
  assert.equal(rejected.name, '説明専用の不採用要素');
  assert.equal(rejected.requiredTrials.value, 40000);
  assert.equal(rejected.requiredTrials.unit, 'G');
});
