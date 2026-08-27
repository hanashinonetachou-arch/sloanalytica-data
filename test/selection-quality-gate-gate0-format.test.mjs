import test from 'node:test';
import assert from 'node:assert/strict';
import { assessSelectionQuality } from '../tools/selection-quality-gate.mjs';

test('Selection quality accepts Gate 0 discoveryInventory new format', () => {
  const research = {
    features: [{ researchFeatureId: 'RF_TEST' }],
    evidenceCandidates: [{ researchEvidenceId: 'RE_TEST' }],
    discoveryInventory: [
      { discoveryCandidateId: 'DC_FEATURE', researchTarget: 'RF_TEST', transferStatus: 'TRANSFERRED' },
      { discoveryCandidateId: 'DC_EVIDENCE', researchTarget: 'RE_TEST', transferStatus: 'TRANSFERRED' },
      { discoveryCandidateId: 'DC_UNRESOLVED', researchTarget: null, transferStatus: 'UNRESOLVED' },
      { discoveryCandidateId: 'DC_REFERENCE', researchTarget: null, transferStatus: 'REFERENCE' },
    ],
  };
  const selection = {
    features: [{ researchFeatureId: 'RF_TEST', featureId: 'FEAT_TEST', adoptionCategory: 'EXCLUDE', userFacingReason: '公開値はあるが観測条件が未確定のため不採用です。' }],
    evidenceUi: { groups: [{ groupId: 'EVID_TEST', options: [{ value: 'X', sourceEvidenceIds: ['RE_TEST'] }] }] },
  };
  const result = assessSelectionQuality(research, selection);
  assert.equal(result.blockers.length, 0, result.blockers.join('\n'));
  assert.equal(result.coverage.discovery.missing.length, 0);
});

test('Selection quality keeps legacy id/mappedTo compatibility', () => {
  const research = {
    features: [{ researchFeatureId: 'RF_TEST' }],
    evidenceCandidates: [],
    discoveryInventory: [{ id: 'DC_LEGACY', mappedTo: 'RF_TEST' }],
  };
  const selection = {
    features: [{ researchFeatureId: 'RF_TEST', featureId: 'FEAT_TEST', adoptionCategory: 'EXCLUDE', userFacingReason: '公開値はあるが観測条件が未確定のため不採用です。' }],
  };
  const result = assessSelectionQuality(research, selection);
  assert.equal(result.blockers.length, 0, result.blockers.join('\n'));
});
