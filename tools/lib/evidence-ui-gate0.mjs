import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

export const REQUIRED_GATES = [
  'layerCompleteness', 'evidenceInputType', 'naturalObservationStructure',
  'evidencePropagation', 'artifactFreshness', 'materializerRoute',
  'selectionObservationLinkage', 'evidenceSourceLineage',
  'evidenceOptionSemantics', 'sharedFeatureEvidence',
  'generatedPublishedSeparation',
];
export const UNITS = ['machine', 'machine-layer', 'group', 'option', 'contract'];
export const DISPOSITIONS = ['EVIDENCE', 'NO_EVIDENCE', 'ORPHAN_DOWNSTREAM', 'UNKNOWN'];
const empty = () => ({ eligible: 0, checked: 0, passed: 0, failed: 0, unresolved: 0, skipped: 0 });
const cov = (unit, result, count = 1) => ({ unit, eligible: count, checked: count,
  passed: result === 'pass' ? count : 0, failed: result === 'fail' ? count : 0,
  unresolved: result === 'unresolved' ? count : 0, skipped: 0,
  unitBreakdown: { [unit]: { eligible: count, checked: count, passed: result === 'pass' ? count : 0,
    failed: result === 'fail' ? count : 0, unresolved: result === 'unresolved' ? count : 0, skipped: 0 } } });
const arr = value => Array.isArray(value) ? value : [];
const ids = (items, ...keys) => new Set(arr(items).flatMap(x => keys.map(k => x?.[k]).filter(Boolean)));
const packageEvidenceItems = pkg => pkg?.evidence?.evidences ?? pkg?.evidence?.evidence ?? pkg?.evidence;
const evidenceInPackage = pkg => arr(packageEvidenceItems(pkg)).length;
const canonicalEvidence = ui => Object.keys(ui?.evidenceContracts ?? {}).length;
const addFinding = (findings, gate, code, severity = 'UNRESOLVED', unit = 'machine') =>
  findings.push({ gate, code, severity, unit });
const semanticHash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');

export function auditMachine(machineId, layers) {
  const { research, selection, observation, ui, package: pkg } = layers;
  const upstream = arr(selection?.evidence).length;
  const selectionGroups = arr(selection?.evidenceUi?.groups);
  const downstream = canonicalEvidence(ui) + evidenceInPackage(pkg);
  // evidenceUi.groups is the auditable legacy adoption contract when the newer
  // item-level selection.evidence array is absent.
  const disposition = upstream > 0 || selectionGroups.length > 0 ? 'EVIDENCE'
    : downstream > 0 ? 'ORPHAN_DOWNSTREAM'
      : (research && selection && ui && pkg ? 'NO_EVIDENCE' : 'UNKNOWN');
  const findings = [];
  const gates = {};

  const present = [research, selection, observation, ui, pkg].filter(Boolean).length;
  gates.layerCompleteness = cov('machine-layer', present === 5 ? 'pass' : 'fail', 5);
  gates.layerCompleteness.passed = present;
  gates.layerCompleteness.failed = 5 - present;
  gates.layerCompleteness.unitBreakdown['machine-layer'] = { ...gates.layerCompleteness, unitBreakdown: undefined };
  delete gates.layerCompleteness.unitBreakdown['machine-layer'].unitBreakdown;
  if (present !== 5) addFinding(findings, 'layerCompleteness', 'LAYER_MISSING', 'FAIL', 'machine-layer');

  const contracts = Object.entries(ui?.evidenceContracts ?? {});
  const pkgInputs = new Map(arr(pkg?.inputs?.inputs).map(x => [x.id, String(x.type).toLowerCase()]));
  let inputResult = 'pass';
  for (const group of selectionGroups) {
    if (!group.selectionMode) {
      inputResult = 'unresolved';
      addFinding(findings, 'evidenceInputType', 'SELECTION_MODE_UNRESOLVED', 'UNRESOLVED', 'group');
    }
  }
  for (const [id, contract] of contracts) {
    if (!contract.selectionMode) { inputResult = 'unresolved'; addFinding(findings, 'evidenceInputType', 'SELECTION_MODE_UNRESOLVED', 'UNRESOLVED', 'group'); }
    const inputId = contract.inputId;
    if (inputId && !pkgInputs.has(inputId)) { inputResult = 'fail'; addFinding(findings, 'evidenceInputType', 'INPUT_ID_MISMATCH', 'FAIL', 'contract'); }
    const canonicalType = String(contract.selectionMode ?? contract.mode ?? '').toLowerCase();
    if (inputId && canonicalType && pkgInputs.has(inputId) && pkgInputs.get(inputId) !== canonicalType) {
      inputResult = 'fail'; addFinding(findings, 'evidenceInputType', 'TYPE_MISMATCH', 'FAIL', 'contract');
    }
  }
  gates.evidenceInputType = disposition === 'NO_EVIDENCE' ? cov('machine', 'pass') : cov('contract', contracts.length || selectionGroups.length ? inputResult : 'unresolved', Math.max(contracts.length, selectionGroups.length, 1));

  let obsResult = observation ? 'pass' : 'fail';
  if (observation) {
    const observationIds = ids(observation.observations, 'observationId');
    for (const item of arr(observation.observations)) {
      const required = ['observationId', 'observationMode', 'sourceType', 'status', 'categories', 'timing', 'excludedConditions'];
      if (required.some(k => item[k] === undefined)) obsResult = 'unresolved';
    }
    for (const mapping of arr(observation.featureMappings)) {
      if (arr(mapping.observationIds).some(id => !observationIds.has(id))) obsResult = 'fail';
    }
  }
  if (disposition === 'NO_EVIDENCE' && observation) obsResult = 'pass';
  gates.naturalObservationStructure = cov('contract', obsResult, Math.max(arr(observation?.observations).length, 1));
  if (!observation) addFinding(findings, 'naturalObservationStructure', 'OBSERVATION_MISSING', 'FAIL');
  else if (obsResult === 'unresolved') addFinding(findings, 'naturalObservationStructure', 'OBSERVATION_SEMANTICS_UNRESOLVED');

  const selectionIds = ids(selection?.evidence, 'evidenceId', 'evidenceGroupId', 'id');
  const uiIds = new Set(contracts.map(([id]) => id));
  const packageIds = ids(packageEvidenceItems(pkg), 'evidenceId', 'id');
  let propagation = disposition === 'NO_EVIDENCE' ? 'pass' : 'unresolved';
  if ([...selectionIds].some(id => !uiIds.has(id)) || [...uiIds].some(id => packageIds.size && !packageIds.has(id))) propagation = 'fail';
  if (disposition === 'ORPHAN_DOWNSTREAM') propagation = 'fail';
  gates.evidencePropagation = cov('contract', propagation, Math.max(selectionIds.size, uiIds.size, packageIds.size, 1));
  if (propagation === 'fail') addFinding(findings, 'evidencePropagation', disposition === 'ORPHAN_DOWNSTREAM' ? 'ORPHAN_DOWNSTREAM' : 'EVIDENCE_PROPAGATION_LOSS', 'FAIL');
  if (propagation === 'unresolved') addFinding(findings, 'evidencePropagation', 'SELECTION_EVIDENCE_ADOPTION_UNRESOLVED');

  const canonicalHash = ui?.semanticHash ?? ui?.metadata?.semanticHash;
  const artifactHash = pkg?.metadata?.canonicalSemanticHash;
  const freshness = disposition === 'NO_EVIDENCE' ? 'pass'
    : canonicalHash && artifactHash ? (canonicalHash === artifactHash ? 'pass' : 'fail') : 'unresolved';
  gates.artifactFreshness = cov('machine', freshness);
  if (freshness === 'unresolved') addFinding(findings, 'artifactFreshness', 'ARTIFACT_FRESHNESS_UNPROVEN');
  if (freshness === 'fail') addFinding(findings, 'artifactFreshness', 'ARTIFACT_SEMANTIC_HASH_STALE', 'FAIL');
  gates.materializerRoute = cov('machine', disposition === 'NO_EVIDENCE' ? 'pass' : 'unresolved');
  if (disposition !== 'NO_EVIDENCE') addFinding(findings, 'materializerRoute', 'MATERIALIZER_ROUTE_UNPROVEN');

  const featureIds = ids(selection?.features, 'featureId');
  const mappedFeatures = ids(observation?.featureMappings, 'featureId');
  const linkage = disposition === 'NO_EVIDENCE' && observation ? 'pass' : observation && [...featureIds].every(id => mappedFeatures.has(id)) ? 'pass' : observation ? 'fail' : 'unresolved';
  gates.selectionObservationLinkage = cov('contract', linkage, Math.max(featureIds.size, 1));
  if (linkage !== 'pass') addFinding(findings, 'selectionObservationLinkage', linkage === 'fail' ? 'FEATURE_MAPPING_LOSS' : 'OBSERVATION_LINKAGE_UNRESOLVED', linkage === 'fail' ? 'FAIL' : 'UNRESOLVED');

  const sourceResolved = disposition === 'NO_EVIDENCE' ? 'pass' : arr(selection?.evidence).every(e => arr(e.sourceEvidenceIds ?? e.sourceRefs).length) && upstream ? 'pass' : 'unresolved';
  gates.evidenceSourceLineage = cov('contract', sourceResolved, Math.max(upstream, downstream, 1));
  if (sourceResolved === 'unresolved') addFinding(findings, 'evidenceSourceLineage', 'EVIDENCE_SOURCE_LINEAGE_UNRESOLVED');

  let optionResult = disposition === 'NO_EVIDENCE' ? 'pass' : 'unresolved';
  for (const evidence of arr(selection?.evidence)) {
    const canonical = ui?.evidenceContracts?.[evidence.evidenceId ?? evidence.evidenceGroupId ?? evidence.id];
    if (canonical && canonical.options && evidence.options && semanticHash(canonical.options) !== semanticHash(evidence.options)) optionResult = 'fail';
  }
  gates.evidenceOptionSemantics = cov('option', optionResult, Math.max(arr(selection?.evidence).flatMap(e => arr(e.options)).length, downstream, 1));
  if (optionResult !== 'pass') addFinding(findings, 'evidenceOptionSemantics', optionResult === 'fail' ? 'EVIDENCE_OPTION_OR_SETTINGS_DRIFT' : 'EVIDENCE_OPTION_SEMANTICS_UNRESOLVED', optionResult === 'fail' ? 'FAIL' : 'UNRESOLVED', 'option');

  let shared = disposition === 'NO_EVIDENCE' ? 'pass' : 'unresolved';
  if (arr(selection?.evidence).some(e => arr(e.sharedFeatureIds).some(id => featureIds.has(id)))) shared = 'pass';
  gates.sharedFeatureEvidence = cov('contract', shared, Math.max(upstream, downstream, 1));
  if (shared === 'unresolved') addFinding(findings, 'sharedFeatureEvidence', 'IMPLICIT_SHARED_EVIDENCE_UNRESOLVED');

  gates.generatedPublishedSeparation = cov('machine', disposition === 'NO_EVIDENCE' ? 'pass' : 'unresolved');
  if (disposition !== 'NO_EVIDENCE') addFinding(findings, 'generatedPublishedSeparation', 'GENERATED_PUBLISHED_ARTIFACT_NOT_SEPARATE');
  const failed = Object.values(gates).some(g => g.failed);
  const unresolved = Object.values(gates).some(g => g.unresolved);
  const status = failed ? 'BLOCKED' : unresolved ? 'RESEARCH_REOPEN' : 'PASS';
  return { machineId, disposition, status, notApplicableOutsideEligible: true,
    notApplicableUnit: disposition === 'NO_EVIDENCE' ? 'machine' : null, gates, findings };
}

export async function readJson(path) {
  try { return JSON.parse(await readFile(path, 'utf8')); } catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}

export function buildSummary(rows) {
  const summary = { rowCount: rows.length, statuses: {}, dispositions: {}, findings: {}, gates: {} };
  for (const row of rows) {
    summary.statuses[row.status] = (summary.statuses[row.status] ?? 0) + 1;
    summary.dispositions[row.disposition] = (summary.dispositions[row.disposition] ?? 0) + 1;
    for (const finding of row.findings) summary.findings[finding.code] = (summary.findings[finding.code] ?? 0) + 1;
    for (const [name, gate] of Object.entries(row.gates)) {
      const target = summary.gates[name] ??= { unit: gate.unit, ...empty(), unitBreakdown: {} };
      for (const key of Object.keys(empty())) target[key] += gate[key];
      for (const [unit, coverage] of Object.entries(gate.unitBreakdown)) {
        const unitTarget = target.unitBreakdown[unit] ??= empty();
        for (const key of Object.keys(empty())) unitTarget[key] += coverage[key];
      }
    }
  }
  summary.findingCount = Object.values(summary.findings).reduce((a, b) => a + b, 0);
  return summary;
}
