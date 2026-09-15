import test from 'node:test';
import assert from 'node:assert/strict';
import { auditMachine, buildSummary, REQUIRED_GATES } from '../tools/lib/evidence-ui-gate0.mjs';
import { validateLedger } from '../tools/validate-evidence-ui-gate0-ledger.mjs';

const base = () => ({
  research: { evidenceCandidates: [] },
  selection: { inputs: [], features: [], evidence: [] },
  observation: { observations: [], featureMappings: [] },
  ui: { evidenceContracts: {} },
  package: { inputs: { inputs: [] }, evidence: { evidence: [] } },
});
const ev = (mode = 'single', packageType = mode) => {
  const x = base();
  x.research.evidenceCandidates = [{ evidenceId: 'EV' }];
  x.selection.evidence = [{ evidenceId: 'EV', sourceEvidenceIds: ['R'], options: [{ label: 'A', value: 'A' }] }];
  x.ui.evidenceContracts.EV = { selectionMode: mode, inputId: 'EV' };
  x.package.inputs.inputs = [{ id: 'EV', type: packageType }];
  x.package.evidence.evidence = [{ evidenceId: 'EV' }];
  return x;
};
const code = (row, finding) => row.findings.some(x => x.code === finding);

test('NO_EVIDENCE is normal PASS where evidence gates are not applicable', () => {
  const row = auditMachine('M', base());
  assert.equal(row.disposition, 'NO_EVIDENCE'); assert.equal(row.gates.evidenceInputType.passed, 1);
});
test('upstream evidence with downstream missing is propagation loss', () => {
  const x = ev(); x.ui.evidenceContracts = {}; x.package.evidence.evidence = [];
  assert.ok(code(auditMachine('M', x), 'EVIDENCE_PROPAGATION_LOSS'));
});
test('downstream-only evidence is orphan downstream', () => {
  const x = base(); x.ui.evidenceContracts.EV = { selectionMode: 'single' };
  assert.equal(auditMachine('M', x).disposition, 'ORPHAN_DOWNSTREAM');
});
for (const type of ['single', 'multi', 'counter', 'boolean']) test(`${type} input semantics`, () => {
  assert.equal(auditMachine('M', ev(type)).gates.evidenceInputType.failed, 0);
});
test('input type mismatch is distinct', () => assert.ok(code(auditMachine('M', ev('single', 'multi')), 'TYPE_MISMATCH')));
test('selection mode unresolved', () => { const x = ev(); delete x.ui.evidenceContracts.EV.selectionMode; assert.ok(code(auditMachine('M', x), 'SELECTION_MODE_UNRESOLVED')); });
test('abstract evidence remains unresolved', () => { const x = ev(); x.selection.evidence[0] = { evidenceId: 'EV' }; assert.ok(code(auditMachine('M', x), 'EVIDENCE_SOURCE_LINEAGE_UNRESOLVED')); });
test('source loss is detected', () => { const x = ev(); delete x.selection.evidence[0].sourceEvidenceIds; assert.ok(code(auditMachine('M', x), 'EVIDENCE_SOURCE_LINEAGE_UNRESOLVED')); });
test('option loss/settings drift is detected', () => { const x = ev(); x.ui.evidenceContracts.EV.options = [{ label: 'B', value: 'B' }]; assert.ok(code(auditMachine('M', x), 'EVIDENCE_OPTION_OR_SETTINGS_DRIFT')); });
test('freshness without proof is unresolved', () => assert.ok(code(auditMachine('M', ev()), 'ARTIFACT_FRESHNESS_UNPROVEN')));
test('stale artifact semantic hash is detected', () => { const x = ev(); x.ui.semanticHash = 'a'; x.package.metadata = { canonicalSemanticHash: 'b' }; assert.ok(code(auditMachine('M', x), 'ARTIFACT_SEMANTIC_HASH_STALE')); });
test('legacy materializer route is unproven', () => assert.ok(code(auditMachine('M', ev()), 'MATERIALIZER_ROUTE_UNPROVEN')));
test('explicit shared feature evidence is accepted', () => { const x = ev(); x.selection.features = [{ featureId: 'F' }]; x.selection.evidence[0].sharedFeatureIds = ['F']; assert.ok(auditMachine('M', x).gates.sharedFeatureEvidence.passed > 0); });
test('implicit shared is unresolved', () => assert.ok(code(auditMachine('M', ev()), 'IMPLICIT_SHARED_EVIDENCE_UNRESOLVED')));
test('observation missing is detected', () => { const x = base(); x.observation = null; assert.ok(code(auditMachine('M', x), 'OBSERVATION_MISSING')); });
test('structured observation linkage passes', () => { const x = base(); x.selection.features = [{ featureId: 'F' }]; x.observation.featureMappings = [{ featureId: 'F', observationIds: ['O'] }]; x.observation.observations = [{ observationId: 'O', observationMode: 'MANUAL_COUNTER', sourceType: 'DIRECT_PLAY', status: 'FOUND', categories: [], timing: [], excludedConditions: [] }]; assert.equal(auditMachine('M', x).gates.selectionObservationLinkage.passed, 1); });
test('generated/published separation is explicit', () => assert.ok(code(auditMachine('M', ev()), 'GENERATED_PUBLISHED_ARTIFACT_NOT_SEPARATE')));
test('legacy evidence is covered, not skipped', () => { const x = base(); x.ui.evidenceContracts.EV = { selectionMode: 'single' }; const row = auditMachine('M', x); assert.equal(row.gates.evidencePropagation.skipped, 0); });
test('v2 declarations alone cannot green proof-dependent gates', () => {
  const x = ev(); x.selection.evidenceContract = { contractVersion: 'selection-evidence-v2', items: [{ evidenceId: 'EV', sourceResearchEvidenceIds: ['R'], triggerValue: 'A', confirmedSettings: ['SET_2'], deniedSettings: [], normalizationSemantics: 'DECLARED', settingFloorSemantics: 'DECLARED', canonicalUi: { inputId: 'EV' }, observationIds: ['O'], featureSharing: 'NONE', sharedFeatureIds: [] }] }; x.selection.evidence = [];
  const row = auditMachine('M', x);
  for (const gate of ['materializerRoute', 'generatedPublishedSeparation', 'evidenceOptionSemantics', 'sharedFeatureEvidence']) assert.ok(row.gates[gate].unresolved > 0, gate);
  assert.equal(row.gates.evidencePropagation.passed, 0);
});

test('legacy Gate0 behavior is unchanged by v2 support', () => {
  const row = auditMachine('M', ev());
  assert.ok(code(row, 'ARTIFACT_FRESHNESS_UNPROVEN'));
  assert.ok(code(row, 'MATERIALIZER_ROUTE_UNPROVEN'));
  assert.ok(code(row, 'IMPLICIT_SHARED_EVIDENCE_UNRESOLVED'));
  assert.ok(code(row, 'GENERATED_PUBLISHED_ARTIFACT_NOT_SEPARATE'));
});

const ledger = () => { const rows = [auditMachine('M', base())]; return { rows, summary: buildSummary(rows) }; };
test('valid fixture ledger', () => assert.deepEqual(validateLedger(ledger(), { expectedRows: 1 }), []));
test('eligible arithmetic fails', () => { const x = ledger(); x.rows[0].gates.evidenceInputType.eligible++; assert.ok(validateLedger(x, { expectedRows: 1 }).some(e => e.includes('eligible !='))); });
test('checked arithmetic fails', () => { const x = ledger(); x.rows[0].gates.evidenceInputType.checked++; assert.ok(validateLedger(x, { expectedRows: 1 }).some(e => e.includes('checked !='))); });
test('summary aggregation mismatch fails', () => { const x = ledger(); x.summary.rowCount++; assert.ok(validateLedger(x, { expectedRows: 1 }).includes('summary does not equal row aggregation')); });
for (const value of [-1, 1.5]) test(`counter ${value} fails`, () => { const x = ledger(); x.rows[0].gates.evidenceInputType.eligible = value; assert.ok(validateLedger(x, { expectedRows: 1 }).some(e => e.includes('non-negative integer'))); });
test('required gate missing fails', () => { const x = ledger(); delete x.rows[0].gates[REQUIRED_GATES[0]]; assert.ok(validateLedger(x, { expectedRows: 1 }).some(e => e.includes('missing'))); });
test('invalid unit fails', () => { const x = ledger(); x.rows[0].gates.evidenceInputType.unit = 'mixed'; assert.ok(validateLedger(x, { expectedRows: 1 }).some(e => e.includes('unit invalid'))); });
test('unit breakdown is preserved', () => assert.ok(ledger().summary.gates.layerCompleteness.unitBreakdown['machine-layer']));
test('notApplicable is outside eligible', () => { const x = ledger(); x.rows[0].notApplicableOutsideEligible = false; assert.ok(validateLedger(x, { expectedRows: 1 }).some(e => e.includes('must be true'))); });
test('machine-layer accounting fails with wrong unit', () => { const x = ledger(); x.rows[0].gates.layerCompleteness.unit = 'machine'; assert.ok(validateLedger(x, { expectedRows: 1 }).some(e => e.includes('five machine-layer'))); });
