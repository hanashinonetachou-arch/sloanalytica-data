export const REQUIRED_EVIDENCE_SURFACES = [
  'end_screen',
  'voice',
  'trophy_stamp',
  'payout_number',
  'menu_command_icon',
  'other_setting_evidence',
];

export const REQUIRED_NUMERIC_SURFACES_V1 = [
  'initial_hit',
  'small_role',
  'event_success_rate',
  'character_distribution',
  'other_numeric',
];

export const REQUIRED_NUMERIC_SURFACES_V2 = [
  ...REQUIRED_NUMERIC_SURFACES_V1,
  'machine_menu_cumulative',
];

// Latest contract for newly generated research briefs. Keep the legacy export
// name so existing callers automatically use the newest research contract.
export const REQUIRED_NUMERIC_SURFACES = REQUIRED_NUMERIC_SURFACES_V2;

const COVERAGE_STATUSES = new Set(['CHECKED', 'NOT_APPLICABLE', 'UNRESOLVED']);
const SUPPORTED_RESEARCH_COMPLETENESS_POLICIES = new Set([1, 2]);

function validateSurfaceGroup(entries, requiredSurfaces, sourceIds, label) {
  const errors = [];
  const unresolved = [];
  if (!Array.isArray(entries)) return { errors: [`researchCompleteness.${label} must be an array`], unresolved };
  const bySurface = new Map();
  for (const item of entries) {
    const surface = item?.surface;
    if (!surface || bySurface.has(surface)) {
      errors.push(`${label}: missing or duplicate surface ${surface ?? '(missing)'}`);
      continue;
    }
    bySurface.set(surface, item);
    if (!COVERAGE_STATUSES.has(item.status)) errors.push(`${label}/${surface}: invalid status ${item.status}`);
    if (item.status === 'UNRESOLVED') unresolved.push(`${label}/${surface}`);
    if (item.status === 'CHECKED') {
      if (!Array.isArray(item.sourceRefs) || item.sourceRefs.length === 0) errors.push(`${label}/${surface}: CHECKED requires sourceRefs`);
      else for (const ref of item.sourceRefs) if (!sourceIds.has(ref)) errors.push(`${label}/${surface}: unknown sourceRef ${ref}`);
      if (!String(item.notes ?? '').trim()) errors.push(`${label}/${surface}: CHECKED requires notes describing candidates found or why none were retained`);
    }
    if ((item.status === 'NOT_APPLICABLE' || item.status === 'UNRESOLVED') && !String(item.notes ?? '').trim()) {
      errors.push(`${label}/${surface}: ${item.status} requires notes`);
    }
  }
  for (const surface of requiredSurfaces) if (!bySurface.has(surface)) errors.push(`${label}: required surface missing ${surface}`);
  return { errors, unresolved };
}

export function validateResearchCompleteness(research, { required = false, minimumPolicyVersion = 1 } = {}) {
  const errors = [];
  const unresolved = [];
  const completeness = research?.researchCompleteness;
  if (!completeness) {
    if (required) errors.push('researchCompleteness is required for batch research ingest');
    return { ok: errors.length === 0, errors, unresolved };
  }
  const policyVersion = completeness.policyVersion;
  if (!SUPPORTED_RESEARCH_COMPLETENESS_POLICIES.has(policyVersion)) {
    errors.push('researchCompleteness.policyVersion must be 1 or 2');
  } else if (policyVersion < minimumPolicyVersion) {
    errors.push(`researchCompleteness.policyVersion must be at least ${minimumPolicyVersion} for this workflow`);
  }
  const requiredNumericSurfaces = policyVersion === 1 ? REQUIRED_NUMERIC_SURFACES_V1 : REQUIRED_NUMERIC_SURFACES_V2;
  const sourceIds = new Set((research?.sources ?? []).map(source => source.sourceId));
  const evidence = validateSurfaceGroup(completeness.evidenceSurfaces, REQUIRED_EVIDENCE_SURFACES, sourceIds, 'evidenceSurfaces');
  const numeric = validateSurfaceGroup(completeness.numericSurfaces, requiredNumericSurfaces, sourceIds, 'numericSurfaces');
  errors.push(...evidence.errors, ...numeric.errors);
  unresolved.push(...evidence.unresolved, ...numeric.unresolved);
  return { ok: errors.length === 0, errors, unresolved };
}

export function validateSelectionEvidenceCoverage(selection, research, { required = false } = {}) {
  const errors = [];
  const review = selection?.evidenceReview;
  if (!review) {
    if (required) errors.push('evidenceReview is required for batch selection ingest');
    return { ok: errors.length === 0, errors, missing: [] };
  }
  if (review.policyVersion !== 1) errors.push('evidenceReview.policyVersion must be 1');

  const researchIds = new Set((research?.evidenceCandidates ?? []).map(item => item.researchEvidenceId));
  const referenced = new Set();
  for (const group of selection?.evidenceUi?.groups ?? []) {
    for (const option of group.options ?? []) {
      for (const id of option.sourceEvidenceIds ?? []) referenced.add(id);
    }
  }

  const excluded = new Set();
  for (const item of review.exclusions ?? []) {
    const id = item?.researchEvidenceId;
    if (!researchIds.has(id)) errors.push(`evidenceReview: unknown researchEvidenceId ${id}`);
    if (excluded.has(id)) errors.push(`evidenceReview: duplicate exclusion ${id}`);
    excluded.add(id);
    if (!String(item?.reason ?? '').trim()) errors.push(`evidenceReview/${id}: exclusion reason is required`);
  }

  for (const id of referenced) {
    if (excluded.has(id)) errors.push(`evidenceReview/${id}: evidence cannot be both UI-referenced and excluded`);
  }

  const missing = [...researchIds].filter(id => !referenced.has(id) && !excluded.has(id));
  for (const id of missing) errors.push(`evidenceReview: Research Evidence is undispositioned ${id}`);

  return { ok: errors.length === 0, errors, missing };
}
