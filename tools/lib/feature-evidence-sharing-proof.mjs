const arr = value => Array.isArray(value) ? value : [];
const clean = value => String(value ?? "").replace(/[^A-Z0-9_]/g, "_");

function activeFeatures(selection) {
  return arr(selection?.features).filter(feature => String(feature?.adoptionCategory ?? "").startsWith("INCLUDE"));
}

function featureEventInputs(feature) {
  return [...new Set([
    feature?.numeratorInputId,
    ...arr(feature?.numeratorInputIds),
    ...arr(feature?.categoryInputIds),
    feature?.conditionedOnInputId,
    feature?.denominatorInputId,
    ...arr(feature?.denominatorInputIds)
  ].filter(Boolean))];
}

export function proveFeatureEvidenceNonSharing(selection, observation, ui) {
  const groups = arr(selection?.evidenceUi?.groups);
  if (!groups.length) return {
    status: "NOT_APPLICABLE",
    rule: "FORMAL_FEATURE_EVIDENCE_NON_SHARING",
    detail: "No legacy Selection evidenceUi.groups require non-sharing proof",
    groups: []
  };
  if (!observation || !ui) return {
    status: "REVIEW",
    rule: "FORMAL_FEATURE_EVIDENCE_NON_SHARING",
    detail: "Observation or canonical UI artifact is missing",
    groups: []
  };

  const mappings = arr(observation.featureMappings);
  const mappingByFeature = new Map(mappings.map(mapping => [mapping.featureId, mapping]));
  const observedIds = new Set(arr(observation.observations).map(item => item?.observationId).filter(Boolean));
  const canonicalContracts = Object.entries(ui.evidenceContracts ?? {});
  const inputContracts = ui.inputContracts ?? {};
  const featureInputOwners = new Map();

  for (const feature of activeFeatures(selection)) {
    if (!feature?.featureId) return {
      status: "REVIEW", rule: "FORMAL_FEATURE_EVIDENCE_NON_SHARING",
      detail: "An adopted Feature has no featureId", groups: []
    };
    const mapping = mappingByFeature.get(feature.featureId);
    if (!mapping) return {
      status: "REVIEW", rule: "FORMAL_FEATURE_EVIDENCE_NON_SHARING",
      detail: `Adopted Feature ${feature.featureId} has no formal Observation mapping`, groups: []
    };
    for (const observationId of arr(mapping.observationIds)) {
      if (!observedIds.has(observationId)) return {
        status: "REVIEW", rule: "FORMAL_FEATURE_EVIDENCE_NON_SHARING",
        detail: `Feature mapping ${feature.featureId} references missing Observation ${observationId}`, groups: []
      };
    }
    for (const inputId of featureEventInputs(feature)) {
      const owners = featureInputOwners.get(inputId) ?? [];
      owners.push(feature.featureId);
      featureInputOwners.set(inputId, owners);
    }
  }

  const rows = [];
  for (const group of groups) {
    const groupId = group?.groupId;
    if (!groupId) return {
      status: "REVIEW", rule: "FORMAL_FEATURE_EVIDENCE_NON_SHARING",
      detail: "Selection Evidence group has no groupId", groups: rows
    };
    const evidenceObservationId = `OBS_EVI_${clean(groupId)}`;
    const evidenceObservationMatches = arr(observation.observations).filter(item => item?.observationId === evidenceObservationId);
    if (evidenceObservationMatches.length !== 1) return {
      status: "REVIEW", rule: "FORMAL_FEATURE_EVIDENCE_NON_SHARING",
      detail: `${groupId} does not have exactly one formal Evidence Observation ${evidenceObservationId}`, groups: rows
    };
    const featureObservationRefs = mappings
      .filter(mapping => arr(mapping.observationIds).includes(evidenceObservationId))
      .map(mapping => mapping.featureId)
      .filter(Boolean);
    if (featureObservationRefs.length) return {
      status: "FAIL", rule: "FORMAL_FEATURE_EVIDENCE_NON_SHARING",
      detail: `${groupId} Evidence Observation is consumed by Feature mapping(s): ${featureObservationRefs.join(", ")}`, groups: rows
    };

    const contracts = canonicalContracts.filter(([, contract]) => contract?.sourceEvidenceGroupId === groupId);
    if (contracts.length !== 1) return {
      status: "REVIEW", rule: "FORMAL_FEATURE_EVIDENCE_NON_SHARING",
      detail: `${groupId} does not have exactly one canonical Evidence contract`, groups: rows
    };
    const [evidenceUiId, contract] = contracts[0];
    if (contract?.inheritOptions !== true) return {
      status: "REVIEW", rule: "FORMAL_FEATURE_EVIDENCE_NON_SHARING",
      detail: `${groupId} canonical Evidence contract does not inherit Selection options`, groups: rows
    };

    const evidenceInputId = `INP_EVI_${groupId}`;
    const featureInputRefs = featureInputOwners.get(evidenceInputId) ?? [];
    if (featureInputRefs.length) return {
      status: "FAIL", rule: "FORMAL_FEATURE_EVIDENCE_NON_SHARING",
      detail: `${groupId} Evidence input ${evidenceInputId} is owned by Feature(s): ${featureInputRefs.join(", ")}`, groups: rows
    };
    if (Object.hasOwn(inputContracts, evidenceInputId)) return {
      status: "REVIEW", rule: "FORMAL_FEATURE_EVIDENCE_NON_SHARING",
      detail: `${groupId} Evidence input is also represented as a canonical Feature inputContract`, groups: rows
    };

    rows.push({
      groupId,
      evidenceObservationId,
      evidenceUiId,
      evidenceInputId,
      featureObservationRefs: [],
      featureInputRefs: []
    });
  }

  return {
    status: "PASS",
    rule: "FORMAL_FEATURE_EVIDENCE_NON_SHARING",
    detail: `Selection Evidence groups are isolated from adopted Feature Observation mappings and Feature input contracts across ${rows.length} group(s)`,
    featureSharing: "NONE",
    sharedFeatureIds: [],
    groups: rows
  };
}
