import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { REQUIRED_EVIDENCE_SURFACES, REQUIRED_NUMERIC_SURFACES, validateResearchCompleteness, validateSelectionEvidenceCoverage } from '../tools/batch-completeness-gates.mjs';

function coverage(surfaces, source='SRC') {
  return surfaces.map(surface => ({ surface, status: 'CHECKED', sourceRefs: [source], notes: 'checked candidates and disposition' }));
}
function researchFixture() {
  return {
    machine: { machineId: 'M', settings: ['SET_1', 'SET_2'] },
    sources: [{ sourceId: 'SRC' }],
    evidenceCandidates: [
      { researchEvidenceId: 'RE_END' },
      { researchEvidenceId: 'RE_VOICE' },
    ],
    researchCompleteness: {
      policyVersion: 1,
      evidenceSurfaces: coverage(REQUIRED_EVIDENCE_SURFACES),
      numericSurfaces: coverage(REQUIRED_NUMERIC_SURFACES),
    },
  };
}

test('batch research completeness is mandatory when strict ingest is requested', () => {
  const r = researchFixture();
  delete r.researchCompleteness;
  const result = validateResearchCompleteness(r, { required: true });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some(error => error.includes('researchCompleteness is required')));
});

test('batch research completeness requires every evidence and numeric surface', () => {
  const r = researchFixture();
  r.researchCompleteness.evidenceSurfaces = r.researchCompleteness.evidenceSurfaces.filter(item => item.surface !== 'voice');
  const result = validateResearchCompleteness(r, { required: true });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some(error => error.includes('required surface missing voice')));
});

test('CHECKED research coverage requires concrete notes and known sources', () => {
  const r = researchFixture();
  const voice = r.researchCompleteness.evidenceSurfaces.find(item => item.surface === 'voice');
  voice.notes = '   ';
  voice.sourceRefs = ['UNKNOWN'];
  const result = validateResearchCompleteness(r, { required: true });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some(error => error.includes('unknown sourceRef UNKNOWN')));
  assert.ok(result.errors.some(error => error.includes('CHECKED requires notes')));
});

test('UNRESOLVED research coverage remains explicit instead of being invented', () => {
  const r = researchFixture();
  const voice = r.researchCompleteness.evidenceSurfaces.find(item => item.surface === 'voice');
  voice.status = 'UNRESOLVED';
  voice.sourceRefs = [];
  voice.notes = 'public sources did not resolve voice details';
  const result = validateResearchCompleteness(r, { required: true });
  assert.equal(result.ok, true);
  assert.ok(result.unresolved.includes('evidenceSurfaces/voice'));
});

test('Research Evidence cannot silently disappear in SelectionData', () => {
  const research = researchFixture();
  const selection = {
    evidenceReview: { policyVersion: 1, exclusions: [] },
    evidenceUi: { groups: [{ groupId: 'G', options: [{ value: 'A', sourceEvidenceIds: ['RE_END'] }] }] },
  };
  const result = validateSelectionEvidenceCoverage(selection, research, { required: true });
  assert.equal(result.ok, false);
  assert.deepEqual(result.missing, ['RE_VOICE']);
  assert.ok(result.errors.some(error => error.includes('undispositioned RE_VOICE')));
});

test('every Research Evidence may be UI-referenced or explicitly excluded with reason', () => {
  const research = researchFixture();
  const selection = {
    evidenceReview: { policyVersion: 1, exclusions: [{ researchEvidenceId: 'RE_VOICE', reason: 'duplicate of stronger evidence' }] },
    evidenceUi: { groups: [{ groupId: 'G', options: [{ value: 'A', sourceEvidenceIds: ['RE_END'] }] }] },
  };
  const result = validateSelectionEvidenceCoverage(selection, research, { required: true });
  assert.equal(result.ok, true);
  assert.deepEqual(result.missing, []);
});

test('machine guard revalidates both Research completeness and Selection Evidence coverage', () => {
  const guard = fs.readFileSync(new URL('../tools/guard-machine-pipeline.mjs', import.meta.url), 'utf8');
  assert.match(guard, /validateResearchCompleteness/);
  assert.match(guard, /validateSelectionEvidenceCoverage/);
  assert.match(guard, /research completeness unresolved/);
});

test('package scripts route batch generation through completeness guards', () => {
  const pkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  assert.match(pkg.scripts['research:batch'], /strict-batch-research-pipeline/);
  assert.match(pkg.scripts['selection:batch'], /strict-batch-selection-pipeline/);
  assert.match(pkg.scripts['machine:pipeline'], /guard-machine-pipeline/);
  assert.match(pkg.scripts['machine:batch'], /guard-machine-pipeline/);
});
