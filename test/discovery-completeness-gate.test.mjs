import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validateDiscoveryCompleteness } from '../tools/discovery-completeness-gate.mjs';

function fixture() {
  return {
    features: [{ researchFeatureId: 'RF_A' }],
    evidenceCandidates: [{ researchEvidenceId: 'RE_A', name: '確定画面' }],
    discoveryInventory: [
      { discoveryCandidateId: 'DISC_A', name: '初当り', researchTarget: 'RF_A', transferStatus: 'RESEARCH_CANDIDATE' },
      { discoveryCandidateId: 'DISC_B', name: '確定画面', researchTarget: 'RE_A', transferStatus: 'EVIDENCE_CANDIDATE' },
      { discoveryCandidateId: 'DISC_C', name: '公開値未確定', transferStatus: 'UNRESOLVED' },
    ],
  };
}

test('Gate 0 passes when every Discovery candidate is traceable', () => {
  const result = validateDiscoveryCompleteness(fixture(), { required: true });
  assert.equal(result.ok, true);
  assert.deepEqual(result.counts, { discovered: 3, transferred: 3 });
});

test('Gate 0 blocks a Discovery candidate that disappeared before Research', () => {
  const r = fixture();
  r.discoveryInventory.push({ discoveryCandidateId: 'DISC_MISSING', name: '消失候補' });
  const result = validateDiscoveryCompleteness(r, { required: true });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some(error => error.includes('Discovery candidate missing from Research')));
});

test('Gate 0 blocks mapping to a nonexistent Research target', () => {
  const r = fixture();
  r.discoveryInventory[0].researchTarget = 'RF_NOT_FOUND';
  const result = validateDiscoveryCompleteness(r, { required: true });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some(error => error.includes('mapped Research target does not exist')));
});

test('legacy id/mappedTo inventory remains accepted during migration', () => {
  const r = fixture();
  r.discoveryInventory = [{ id: 'DISC_LEGACY', name: '初当り', mappedTo: 'RF_A' }];
  const result = validateDiscoveryCompleteness(r, { required: true });
  assert.equal(result.ok, true);
});

test('package exposes research:gate0 command', () => {
  const pkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  assert.match(pkg.scripts['research:gate0'], /discovery-completeness-gate/);
});

test('research:batch is wired through strict pipeline with mandatory Gate 0 ingest', () => {
  const pkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  assert.match(pkg.scripts['research:batch'], /strict-batch-research-pipeline/);

  const strictPipeline = fs.readFileSync(new URL('../tools/strict-batch-research-pipeline.mjs', import.meta.url), 'utf8');
  assert.match(strictPipeline, /validateDiscoveryCompleteness/);
  assert.match(strictPipeline, /validateDiscoveryCompleteness\(research, \{ required: true \}\)/);
  assert.match(strictPipeline, /discoveryCompletenessContract/);
  assert.match(strictPipeline, /Legacy MachineData without discoveryInventory remains supported outside new Research batch ingest/);
});
