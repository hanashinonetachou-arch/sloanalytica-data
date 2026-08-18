import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeLookup, normalizeRequests, resolveCandidate, classifyResearchData } from '../tools/batch-research-pipeline.mjs';

const candidate = {
  marketKey: 'PW_TEST_01',
  displayName: 'スマスロ　テスト・マシン',
  registryMachineId: 'L_TEST_MACHINE',
};

function validResearch() {
  return {
    schemaVersion: 'research-data-v1',
    machine: {
      machineId: 'L_TEST_MACHINE',
      displayName: 'スマスロ テストマシン',
      manufacturer: 'Test Maker',
      settings: ['SET_1', 'SET_6'],
      identitySourceRefs: ['SRC_1'],
    },
    sources: [{ sourceId: 'SRC_1', publisher: 'Official', url: 'https://example.com', checkedAt: '2026-08-18', sourceType: 'official' }],
    features: [],
    evidenceCandidates: [],
    conflicts: [],
  };
}

test('lookup normalization handles full-width spaces and punctuation', () => {
  assert.equal(normalizeLookup('スマスロ　テスト・マシン'), normalizeLookup('スマスロ テストマシン'));
});

test('batch request normalization removes duplicates and enforces max 10', () => {
  assert.deepEqual(normalizeRequests(['A', 'Ａ', 'B']), ['A', 'B']);
  assert.throws(() => normalizeRequests(Array.from({ length: 11 }, (_, i) => `M${i}`)), /batch size exceeds 10/);
});

test('candidate can be resolved by display name, market key, or machine id', () => {
  for (const request of [candidate.displayName, candidate.marketKey, candidate.registryMachineId]) {
    const result = resolveCandidate(request, [candidate]);
    assert.equal(result.status, 'MATCHED');
    assert.equal(result.candidate.marketKey, candidate.marketKey);
  }
});

test('unknown candidate is not guessed', () => {
  assert.equal(resolveCandidate('unknown', [candidate]).status, 'NOT_FOUND');
});

test('valid clean ResearchData is READY_FOR_SELECTION', () => {
  assert.equal(classifyResearchData(validResearch()).status, 'READY_FOR_SELECTION');
});

test('ResearchData conflict is REVIEW', () => {
  const data = validResearch();
  data.conflicts = [{ conflictId: 'C1', targetType: 'machine', targetId: 'L_TEST_MACHINE', sourceRefs: ['SRC_1'] }];
  assert.equal(classifyResearchData(data).status, 'REVIEW');
});

test('invalid ResearchData is BLOCKED', () => {
  const data = validResearch();
  data.machine.settings = [];
  assert.equal(classifyResearchData(data).status, 'BLOCKED');
});
