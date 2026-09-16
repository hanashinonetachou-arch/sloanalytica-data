#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { buildMachineData } from "./build-machine-data.mjs";
import { legacyProjection, VERSION } from "./lib/evidence-contract-m7.mjs";
import { assessSelectionQuality } from "./selection-quality-gate.mjs";
import { auditMachine as auditEvidenceGate0 } from "./lib/evidence-ui-gate0.mjs";

const CLASSIFICATIONS = [
  "AUTO_MIGRATABLE", "FEATURE_SHARING_REVIEW", "OBSERVATION_BLOCKED",
  "CANONICAL_UI_BLOCKED", "NORMALIZATION_BLOCKED",
  "INPUT_COMPATIBILITY_BLOCKED", "SELECTION_QUALITY_BLOCKED", "OTHER_BLOCKED"
];
const SUPPORTED_NORMALIZATION = new Set(["ALLOWED_SETTINGS", "ALLOWED_SETTINGS_INTERSECTION"]);
const REGRESSION_TARGETS = {
  selectionQuality: ["LB_FUJIKO_M2"],
  featureSharingEquivalence: ["L_TENSEI_SHITARA_KEN_DESHITA_GT"],
  observationVerification: ["L_REZERO_SEASON2_PA5", "L_LUPIN_DAIKOUKAISHA_H1", "L_MOMOTARO_DENTETSU_TEIBAN_PU", "L_SMASLO_DUNBINE_MF", "S_OVERLORD_II_SX", "S_SENGOKU_COLLECTION5_PS", "S_SLODOL_PK"]
};
const read = file => JSON.parse(fs.readFileSync(file, "utf8"));
const pass = (rule, detail) => ({ status: "PASS", rule, detail });
const fail = (rule, detail) => ({ status: "FAIL", rule, detail });
const review = (rule, detail) => ({ status: "REVIEW", rule, detail });
const notApplicable = (rule, detail) => ({ status: "NOT_APPLICABLE", rule, detail });

function canonicalPlacement(ui, inputId, groupId) {
  const direct = Object.entries(ui.sections ?? {}).filter(([, section]) => section.inputIds?.includes(inputId)).map(([name]) => name);
  const contracts = Object.entries(ui.evidenceContracts ?? {}).filter(([, contract]) => contract?.sourceEvidenceGroupId === groupId).map(([id]) => id);
  const v2 = contracts.map(evidenceUiId => ({
    evidenceUiId,
    sections: Object.entries(ui.sections ?? {}).filter(([, section]) => section.evidenceIds?.includes(evidenceUiId)).map(([name]) => name)
  }));
  if (direct.length === 1 && v2.length === 0) return { ok: true, inputId, section: direct[0] };
  if (direct.length === 0 && v2.length === 1 && v2[0].sections.length === 1) return { ok: true, inputId, section: v2[0].sections[0], evidenceUiId: v2[0].evidenceUiId };
  return { ok: false, inputId, directSections: direct, evidenceUiContracts: v2 };
}

function publishedCanonicalProof(root, machineId, ui) {
  const packagePath = path.join(root, "machines", machineId, "machine-package.json");
  if (!fs.existsSync(packagePath)) return { ok: false, detail: "Published machine-package.json is missing" };
  const pkg = read(packagePath);
  if (ui.status !== "PASS" || (ui.unresolved ?? []).length) return { ok: false, detail: "canonical UI is not closed" };
  if (pkg.ui?.canonicalUiDesign?.materialized !== true) return { ok: false, detail: "canonical materialization marker is missing" };
  const expectedSections = ui.sectionOrder ?? [];
  const actualSections = pkg.ui?.sections ?? [];
  if (actualSections.length !== expectedSections.length) return { ok: false, detail: "canonical section count differs" };
  const expectedVisible = new Set();
  for (const [index, title] of expectedSections.entries()) {
    const source = ui.sections?.[title], actual = actualSections[index];
    if (!source || actual?.title !== title || actual.displayOrder !== index + 1) return { ok: false, detail: `canonical section identity/order differs at ${title}` };
    for (const key of ["description", "collapsible", "defaultExpanded"]) if (source[key] != null && source[key] !== actual[key]) return { ok: false, detail: `${key} differs for ${title}` };
    const expectedIds = [];
    for (const inputId of source.inputIds ?? []) {
      if (ui.inputContracts?.[inputId]?.inputVisible === false) continue;
      expectedIds.push(inputId); expectedVisible.add(inputId);
    }
    for (const evidenceUiId of source.evidenceIds ?? []) {
      const contract = ui.evidenceContracts?.[evidenceUiId];
      if (!contract) return { ok: false, detail: `canonical Evidence contract ${evidenceUiId} is missing` };
      const inputId = `INP_EVI_${contract.sourceEvidenceGroupId}`;
      expectedIds.push(inputId); expectedVisible.add(inputId);
    }
    const actualIds = (actual.items ?? []).filter(item => item?.type === "input").map(item => item.inputId);
    if (JSON.stringify(actualIds) !== JSON.stringify(expectedIds)) return { ok: false, detail: `canonical item order/content differs for ${title}` };
  }
  const packageInputs = pkg.inputs?.inputs ?? [];
  const packageIds = packageInputs.map(input => input.id);
  if (JSON.stringify([...packageIds].sort()) !== JSON.stringify([...expectedVisible].sort())) return { ok: false, detail: "published input visibility differs from canonical UI" };
  for (const input of packageInputs) {
    const contract = ui.inputContracts?.[input.id];
    if (!contract) continue;
    if (contract.gridSpan != null && input.uiGridSpan !== contract.gridSpan) return { ok: false, detail: `uiGridSpan differs for ${input.id}` };
    if (contract.compact === true && input.uiCompactCounter !== true) return { ok: false, detail: `uiCompactCounter differs for ${input.id}` };
    if (contract.quickAdd !== undefined && JSON.stringify(input.uiQuickAdd) !== JSON.stringify(contract.quickAdd)) return { ok: false, detail: `quickAdd differs for ${input.id}` };
  }
  return { ok: true, detail: "Published canonical UI marker, sections, placement, visibility, uiGridSpan, uiCompactCounter, and quickAdd match" };
}

function observationForGroup(group, observation) {
  const observations = observation.observations ?? [];
  const clean = value => String(value ?? "").replace(/[^A-Z0-9_]/g, "_");
  const formalObservationId = `OBS_EVI_${clean(group.groupId)}`;
  const formal = observations.filter(item => item.observationId === formalObservationId);
  if (formal.length === 1) return { ok: true, groupId: group.groupId, observationId: formal[0].observationId, rule: "FORMAL_GROUP_OBSERVATION_ID" };
  const groupLabelCandidates = observations.filter(item => item.label === group.label).map(item => item.observationId);
  const optionLabelCandidates = observations.filter(item => {
    const terms = new Set([item.label, ...(item.categories ?? [])].filter(Boolean));
    return (group.options ?? []).every(option => terms.has(option.label));
  }).map(item => item.observationId);
  return {
    ok: false,
    groupId: group.groupId,
    expectedFormalObservationId: formalObservationId,
    formalCandidateObservationIds: formal.map(item => item.observationId),
    diagnosticLabelCandidates: { exactGroupLabel: groupLabelCandidates, exactOptionLabelCoverage: optionLabelCandidates },
    rule: formal.length > 1 ? "FORMAL_GROUP_OBSERVATION_ID_NOT_UNIQUE" : "FORMAL_GROUP_OBSERVATION_ID_MISSING"
  };
}

function featureEventInputs(feature) {
  return [...new Set([
    feature.numeratorInputId,
    ...(feature.numeratorInputIds ?? []),
    ...(feature.categoryInputIds ?? []),
    feature.conditionedOnInputId
  ].filter(Boolean))];
}

export function classifyMigrationReadiness(proofs) {
  const priority = [
    ["SELECTION_QUALITY_BLOCKED", proofs.selectionQuality !== "PASS" || proofs.researchLineage !== "PASS"],
    ["NORMALIZATION_BLOCKED", proofs.normalization !== "PASS"],
    ["OBSERVATION_BLOCKED", proofs.observation !== "PASS"],
    ["CANONICAL_UI_BLOCKED", proofs.canonicalUi !== "PASS"],
    ["FEATURE_SHARING_REVIEW", proofs.featureSharing !== "PASS"],
    ["INPUT_COMPATIBILITY_BLOCKED", proofs.inputCompatibility !== "PASS"],
    ["OTHER_BLOCKED", proofs.applicability !== "MIGRATION_REQUIRED" || proofs.legacyBaseline === "FAIL"]
  ];
  return priority.find(([, blocked]) => blocked)?.[0] ?? "AUTO_MIGRATABLE";
}

export function auditMachine(root, machineId) {
  const dir = path.join(root, "research", machineId);
  const selection = read(path.join(dir, "selection-data.json"));
  const groups = selection.evidenceUi?.groups ?? [];
  const projection = legacyProjection(selection);
  const base = {
    machineId,
    classification: null,
    legacyEvidenceGroupCount: groups.length,
    legacyEvidenceItemCount: projection.items.length,
    observationProof: null,
    canonicalUiProof: null,
    normalizationProof: null,
    featureSharingProof: null,
    inputCompatibilityProof: null,
    machineDataEquivalenceProof: null,
    postMigrationEquivalenceProof: { status: "NOT_RUN", rule: "PRE_VS_POST_MIGRATION_REQUIRED", detail: "No migration is performed by the fleet audit" },
    postMigrationInputCompatibilityProof: { status: "NOT_RUN", rule: "PROPOSED_PROJECTION_COMPATIBILITY_REQUIRED", detail: "Final MIG-INV-005/006/010 compatibility requires comparison with the proposed post-migration projection" },
    selectionQualityProof: null,
    evidenceDispositionProof: null,
    migrationDisposition: null,
    blockReasons: []
  };
  if (selection.evidenceContract?.contractVersion === VERSION) {
    return { ...base, classification: "ALREADY_M7", migrationDisposition: "ALREADY_M7_EQUIVALENT", observationProof: pass("EXISTING_M7_CONTRACT", "Preserved checked-in contract"), canonicalUiProof: pass("EXISTING_M7_CONTRACT", "Preserved checked-in contract"), normalizationProof: pass("EXISTING_M7_CONTRACT", "Preserved checked-in contract"), featureSharingProof: pass("EXISTING_M7_CONTRACT", "Preserved checked-in contract"), inputCompatibilityProof: pass("EXISTING_M7_CONTRACT", "Preserved checked-in contract"), selectionQualityProof: notApplicable("EXISTING_M7_REFERENCE", "Reference implementation is governed by its checked-in pilot tests"), evidenceDispositionProof: pass("M7_CONTRACT", "selection-evidence-v2 is present"), machineDataEquivalenceProof: pass("PILOT_PRE_POST_EQUIVALENCE", "Covered by checked-in pilot equivalence tests"), postMigrationEquivalenceProof: pass("PILOT_PRE_POST_EQUIVALENCE", "Covered by checked-in pilot equivalence tests"), postMigrationInputCompatibilityProof: pass("PILOT_PRE_POST_INPUT_COMPATIBILITY", "Covered by checked-in pilot projection equivalence tests") };
  }

  const required = ["research-data.json", "machine-observation-data.json", "ui-design-data.json"];
  const missing = required.filter(file => !fs.existsSync(path.join(dir, file)));
  if (missing.length) {
    base.blockReasons.push(`Required source artifacts missing: ${missing.join(", ")}`);
    base.observationProof = fail("SOURCE_ARTIFACTS", "Observation artifact unavailable");
    base.canonicalUiProof = fail("SOURCE_ARTIFACTS", "canonical UI artifact unavailable");
    base.normalizationProof = fail("SOURCE_ARTIFACTS", "Source artifacts incomplete");
    base.featureSharingProof = fail("SOURCE_ARTIFACTS", "Source artifacts incomplete");
    base.inputCompatibilityProof = fail("SOURCE_ARTIFACTS", "Source artifacts incomplete");
    base.machineDataEquivalenceProof = fail("SOURCE_ARTIFACTS", "Source artifacts incomplete");
    base.selectionQualityProof = fail("SOURCE_ARTIFACTS", "Selection Quality cannot be evaluated");
    base.evidenceDispositionProof = fail("SOURCE_ARTIFACTS", "Evidence disposition cannot be evaluated");
    base.migrationDisposition = "BLOCKED_SOURCE_ARTIFACTS";
    base.classification = "SELECTION_QUALITY_BLOCKED";
    return base;
  }

  const research = read(path.join(dir, "research-data.json"));
  const observation = read(path.join(dir, "machine-observation-data.json"));
  const ui = read(path.join(dir, "ui-design-data.json"));
  const packagePath = path.join(root, "machines", machineId, "machine-package.json");
  const pkg = fs.existsSync(packagePath) ? read(packagePath) : null;
  const selectionQuality = assessSelectionQuality(research, selection);
  base.selectionQualityProof = selectionQuality.status === "PASS"
    ? pass("SELECTION_QUALITY_GATE", "tools/selection-quality-gate.mjs returned PASS")
    : selectionQuality.status === "REVIEW"
      ? review("SELECTION_QUALITY_GATE", selectionQuality.reviews.join("; "))
      : fail("SELECTION_QUALITY_GATE", selectionQuality.blockers.join("; "));
  if (selectionQuality.status !== "PASS") base.blockReasons.push(`Selection Quality ${selectionQuality.status}: ${[...selectionQuality.blockers, ...selectionQuality.reviews].join("; ")}`);
  const evidenceGate0 = auditEvidenceGate0(machineId, { research, selection, observation, ui, package: pkg });
  base.evidenceDispositionProof = { status: evidenceGate0.status, rule: "EVIDENCE_UI_GATE0_DISPOSITION", detail: evidenceGate0.disposition };

  if (groups.length === 0 || projection.items.length === 0) {
    base.migrationDisposition = evidenceGate0.disposition === "NO_EVIDENCE" ? "NOT_APPLICABLE_NO_EVIDENCE"
      : evidenceGate0.disposition === "ORPHAN_DOWNSTREAM" ? "BLOCKED_ORPHAN_DOWNSTREAM"
        : "BLOCKED_ADOPTION_OUTSIDE_LEGACY_GROUPS";
    const detail = evidenceGate0.disposition === "NO_EVIDENCE"
      ? "Formal Gate0 disposition is NO_EVIDENCE; there is no Evidence contract to migrate"
      : evidenceGate0.disposition === "ORPHAN_DOWNSTREAM"
        ? "Gate0 found downstream Evidence without a Selection adoption contract"
        : "Gate0 found formal Evidence adoption outside legacy evidenceUi.groups";
    base.observationProof = notApplicable("EVIDENCE_UI_GATE0_DISPOSITION", detail);
    base.canonicalUiProof = evidenceGate0.disposition === "NO_EVIDENCE" ? notApplicable("EVIDENCE_UI_GATE0_DISPOSITION", detail) : fail("EVIDENCE_UI_GATE0_DISPOSITION", detail);
    base.normalizationProof = notApplicable("NO_LEGACY_GROUP_PROJECTION", detail);
    base.featureSharingProof = evidenceGate0.disposition === "NO_EVIDENCE" ? notApplicable("EVIDENCE_UI_GATE0_DISPOSITION", detail) : fail("ADOPTION_PATH_UNREPRESENTED", detail);
    base.inputCompatibilityProof = notApplicable("NO_LEGACY_GROUP_PROJECTION", detail);
    base.machineDataEquivalenceProof = notApplicable("NO_MIGRATION_PROJECTION", "Legacy build success cannot establish pre/post migration equivalence when no migration projection exists");
    base.blockReasons.push(detail);
    base.classification = selectionQuality.status === "PASS" ? "OTHER_BLOCKED" : "SELECTION_QUALITY_BLOCKED";
    return base;
  }
  base.migrationDisposition = "MIGRATION_REQUIRED";

  const researchIds = new Set((research.evidenceCandidates ?? []).map(item => item.researchEvidenceId));
  const missingLineage = projection.items.filter(item => item.sourceResearchEvidenceIds.length === 0 || item.sourceResearchEvidenceIds.some(id => !researchIds.has(id))).map(item => item.evidenceId);
  if (missingLineage.length) {
    base.blockReasons.push(`Research lineage missing or invalid: ${missingLineage.join(", ")}`);
  }

  const unsupportedNormalization = groups.filter(group => !SUPPORTED_NORMALIZATION.has(group.normalizationMode)).map(group => group.groupId);
  base.normalizationProof = unsupportedNormalization.length
    ? fail("EXPLICIT_LEGACY_NORMALIZATION", `Missing or unsupported normalizationMode: ${unsupportedNormalization.join(", ")}`)
    : pass("EXPLICIT_LEGACY_NORMALIZATION", groups.map(group => `${group.groupId}=${group.normalizationMode}`).join("; "));
  if (unsupportedNormalization.length) {
    base.blockReasons.push(base.normalizationProof.detail);
  }

  const observationMappings = groups.map(group => observationForGroup(group, observation));
  const unresolvedObservation = observationMappings.filter(item => !item.ok);
  base.observationProof = unresolvedObservation.length
    ? fail("FORMAL_GROUP_OBSERVATION_ID", JSON.stringify(unresolvedObservation))
    : pass("FORMAL_GROUP_OBSERVATION_ID", observationMappings.map(item => `${item.groupId}->${item.observationId} (${item.rule})`).join("; "));
  if (unresolvedObservation.length) {
    base.blockReasons.push("One or more Evidence groups lack exactly one formal OBS_EVI_<clean(groupId)> Observation linkage; label/category matching is diagnostic only");
  }

  const placements = projection.inputs.map(input => canonicalPlacement(ui, input.id, projection.items.find(item => item.inputId === input.id)?.groupId));
  const unresolvedPlacements = placements.filter(item => !item.ok);
  const publishedCanonical = publishedCanonicalProof(root, machineId, ui);
  base.canonicalUiProof = unresolvedPlacements.length || !publishedCanonical.ok
    ? fail("UNIQUE_PLACEMENT_AND_PUBLISHED_CANONICAL_EQUIVALENCE", `${unresolvedPlacements.length ? JSON.stringify(unresolvedPlacements) : "placement unique"}; ${publishedCanonical.detail}`)
    : pass("UNIQUE_PLACEMENT_AND_PUBLISHED_CANONICAL_EQUIVALENCE", `${placements.map(item => `${item.inputId}->${item.section}${item.evidenceUiId ? `/${item.evidenceUiId}` : ""}`).join("; ")}; ${publishedCanonical.detail}`);
  if (unresolvedPlacements.length || !publishedCanonical.ok) {
    base.blockReasons.push(`canonical UI proof failed: ${publishedCanonical.detail}`);
  }

  const activeFeatures = (selection.features ?? []).filter(feature => String(feature.adoptionCategory ?? "").startsWith("INCLUDE"));
  const featureInputs = new Map(activeFeatures.map(feature => [feature.featureId, featureEventInputs(feature)]));
  const overlaps = projection.items.flatMap(item => [...featureInputs].filter(([, ids]) => ids.includes(item.inputId)).map(([featureId]) => ({ evidenceId: item.evidenceId, inputId: item.inputId, featureId })));
  const lineageIds = new Set(projection.items.flatMap(item => item.sourceResearchEvidenceIds));
  const conflictingLegacyDeclarations = (selection.evidence ?? []).filter(item => lineageIds.has(item.researchEvidenceId) && item.inputId && !projection.inputs.some(input => input.id === item.inputId)).map(item => ({ researchEvidenceId: item.researchEvidenceId, inputId: item.inputId, sharedFeatureIds: item.sharedFeatureIds ?? [] }));
  const sharedGate = evidenceGate0.gates.sharedFeatureEvidence;
  base.featureSharingProof = overlaps.length || conflictingLegacyDeclarations.length
    ? fail("INDEPENDENT_INPUT_RELATIONSHIP", JSON.stringify({ overlaps, conflictingLegacyDeclarations }))
    : sharedGate?.passed > 0 && sharedGate?.unresolved === 0
      ? pass("EVIDENCE_UI_GATE0_SHARED_FEATURE_EVIDENCE", "Independent Gate0 shared Feature/Evidence proof passed")
      : review("EVIDENCE_UI_GATE0_SHARED_FEATURE_EVIDENCE", "No runtime input overlap was found, but absence of implicit Feature/Evidence sharing has no independent formal proof");
  if (base.featureSharingProof.status !== "PASS") {
    base.blockReasons.push("Feature/Evidence sharing state is not uniquely represented by the legacy runtime surface");
  }

  const invalidInputs = projection.inputs.filter(input => !["enum", "multi_enum"].includes(input.type) || !Array.isArray(input.options) || input.options.some(option => typeof option.value !== "string"));
  base.inputCompatibilityProof = invalidInputs.length
    ? fail("PRE_MIGRATION_LEGACY_INPUT_SURFACE", `Legacy projection is not structurally representable: ${invalidInputs.map(input => input.id).join(", ")}`)
    : pass("PRE_MIGRATION_LEGACY_INPUT_SURFACE", `Candidate-gate only; legacy ID/type/default/options are structurally representable: ${projection.inputs.map(input => `${input.id}:${input.type}:${input.type === "multi_enum" ? "[]" : "__UNSET__"}:[${input.options.map(option => option.value).join(",")}]`).join("; ")}. Final labels/options/cardinality/unset, input-ID stability, and saved-history/active-session compatibility require proposed post-migration comparison.`);
  if (invalidInputs.length) {
    base.blockReasons.push("Legacy input ID/type/default/options cannot be represented by the M7 contract");
  }

  try {
    const statisticsPath = path.join(dir, "statistics-report.json");
    buildMachineData(research, selection, fs.existsSync(statisticsPath) ? read(statisticsPath) : null);
    base.machineDataEquivalenceProof = { status: "BASELINE_ONLY", rule: "DETERMINISTIC_LEGACY_BASELINE", detail: "Legacy MachineData builds; this is not MIG-INV-007 pre/post migration equivalence" };
  } catch (error) {
    base.machineDataEquivalenceProof = fail("DETERMINISTIC_LEGACY_BASELINE", error.message);
    base.blockReasons.push(`Legacy MachineData build failed: ${error.message}`);
  }
  if (missingLineage.length === 0) base.researchLineageProof = pass("RESEARCH_ID_MEMBERSHIP", "Every materialized Evidence item has non-empty Research lineage");
  else base.researchLineageProof = fail("RESEARCH_ID_MEMBERSHIP", missingLineage.join(", "));
  base.classification = classifyMigrationReadiness({
    selectionQuality: selectionQuality.status,
    researchLineage: base.researchLineageProof.status,
    normalization: base.normalizationProof.status,
    observation: base.observationProof.status,
    canonicalUi: base.canonicalUiProof.status,
    featureSharing: base.featureSharingProof.status,
    inputCompatibility: base.inputCompatibilityProof.status,
    applicability: base.migrationDisposition,
    legacyBaseline: base.machineDataEquivalenceProof.status === "FAIL" ? "FAIL" : "PASS"
  });
  return base;
}

export function auditFleet(root, phase1Report = null) {
  const machineIds = fs.readdirSync(path.join(root, "research"), { withFileTypes: true })
    .filter(entry => entry.isDirectory() && !entry.name.startsWith("_") && fs.existsSync(path.join(root, "research", entry.name, "selection-data.json")))
    .map(entry => entry.name).sort();
  const machines = machineIds.map(machineId => auditMachine(root, machineId));
  const counts = Object.fromEntries(CLASSIFICATIONS.map(name => [name, machines.filter(machine => machine.classification === name).length]));
  const alreadyM7 = machines.filter(machine => machine.classification === "ALREADY_M7").length;
  const phase1ById = new Map((phase1Report?.machines ?? []).map(machine => [machine.machineId, machine.phase1Classification ?? machine.classification]));
  const phase2ById = new Map((phase1Report?.machines ?? []).map(machine => [machine.machineId, machine.phase2Classification ?? machine.classification]));
  const phase2ObservationById = new Map((phase1Report?.machines ?? []).map(machine => [machine.machineId, machine.phase2ObservationProof ?? machine.observationProof]));
  for (const machine of machines) {
    machine.phase1Classification = phase1ById.get(machine.machineId) ?? machine.classification;
    machine.phase2Classification = phase2ById.get(machine.machineId) ?? machine.classification;
    machine.phase2ObservationProof = phase2ObservationById.get(machine.machineId) ?? machine.observationProof;
  }
  const classificationChanges = machines.filter(machine => machine.phase1Classification !== machine.classification).map(machine => ({ machineId: machine.machineId, from: machine.phase1Classification, to: machine.classification, formalReason: machine.selectionQualityProof?.detail ?? machine.blockReasons[0] }));
  const phase2ClassificationChanges = machines.filter(machine => machine.phase2Classification !== machine.classification).map(machine => ({ machineId: machine.machineId, from: machine.phase2Classification, to: machine.classification, formalReason: machine.observationProof?.detail ?? machine.blockReasons[0] }));
  const observationProofChanges = machines.filter(machine => machine.phase2ObservationProof?.status === "PASS" && machine.observationProof?.status !== "PASS").map(machine => ({ machineId: machine.machineId, oldRule: machine.phase2ObservationProof.rule, oldDetail: machine.phase2ObservationProof.detail, newResult: machine.observationProof.status, newRule: machine.observationProof.rule, reason: "Phase 2 proof depended on label/category equality without the formal OBS_EVI_<groupId> repository linkage" }));
  const dispositions = Object.fromEntries([...new Set(machines.map(machine => machine.migrationDisposition))].sort().map(name => [name, machines.filter(machine => machine.migrationDisposition === name).length]));
  const notApplicableOrEquivalent = machines.filter(machine => ["NOT_APPLICABLE_NO_EVIDENCE", "ALREADY_M7_EQUIVALENT"].includes(machine.migrationDisposition)).length;
  const phase1Other = machines.filter(machine => machine.phase1Classification === "OTHER_BLOCKED");
  const phase1OtherAnalysis = {
    total: phase1Other.length,
    byFormalDisposition: Object.fromEntries([...new Set(phase1Other.map(machine => machine.migrationDisposition))].sort().map(name => [name, phase1Other.filter(machine => machine.migrationDisposition === name).length])),
    selectionQualityNonPass: phase1Other.filter(machine => machine.selectionQualityProof?.status !== "PASS").length,
    conclusion: "The Phase 1 OTHER_BLOCKED population can be subdivided by the existing Evidence Gate0 disposition without interpreting machine semantics. NO_EVIDENCE is recorded as a non-migration disposition, not AUTO_MIGRATABLE."
  };
  const machineById = new Map(machines.map(machine => [machine.machineId, machine]));
  const knownBlockerReview = {
    reproduced: [],
    notFormallyDerivable: []
  };
  for (const machineId of REGRESSION_TARGETS.selectionQuality) {
    const machine = machineById.get(machineId);
    const target = machine?.selectionQualityProof?.status === "FAIL" ? knownBlockerReview.reproduced : knownBlockerReview.notFormallyDerivable;
    target.push({ machineId, blocker: "Selection Quality", repositoryProof: machine?.selectionQualityProof ?? null });
  }
  for (const machineId of REGRESSION_TARGETS.featureSharingEquivalence) {
    const machine = machineById.get(machineId);
    knownBlockerReview.notFormallyDerivable.push({ machineId, blocker: "prior sharedFeatureIds runtime equivalence failure", repositoryProof: machine?.featureSharingProof ?? null, retainedBlock: machine?.classification ?? null });
  }
  for (const machineId of REGRESSION_TARGETS.observationVerification) {
    const machine = machineById.get(machineId);
    const target = machine?.observationProof?.status === "FAIL" ? knownBlockerReview.reproduced : knownBlockerReview.notFormallyDerivable;
    target.push({ machineId, blocker: "real-device / Observation verification", repositoryProof: machine?.observationProof ?? null, retainedBlock: machine?.classification ?? null });
  }
  return {
    schemaVersion: "m7-full-fleet-migration-audit-v2.1",
    auditDate: "2026-09-16",
    phase1BaseHead: "8a31eec356e40fecc38ac86fd6e938e1deff9375",
    originalDataBase: "3c794e894a43ef82a8657a43be3fa9c8754a11c2",
    appBaseHead: "36ca4d5c5639159ada096e371b3d63cdf3d9c043",
    formalSources: {
      selectionQuality: "tools/selection-quality-gate.mjs::assessSelectionQuality",
      evidenceDisposition: "tools/lib/evidence-ui-gate0.mjs::auditMachine",
      observation: "tools/materialize-gate-c-observation-v7.mjs formal OBS_EVI_<clean(groupId)> contract; labels/categories are diagnostic only",
      canonicalUi: "ui-design-data.json plus published machines/<machineId>/machine-package.json",
      featureSharing: "Selection adopted Feature event input IDs plus explicit Selection Evidence declarations",
      inputCompatibility: "tools/lib/evidence-contract-m7.mjs::legacyProjection"
    },
    modelLimitations: [
      "Selection Quality REVIEW is fail-closed as SELECTION_QUALITY_BLOCKED; the audit does not reinterpret its reasons.",
      "Gate0 EVIDENCE without legacy evidenceUi.groups proves adoption exists but does not prove an M7 migration path.",
      "DETERMINISTIC_LEGACY_BASELINE is not MIG-INV-007; post-migration equivalence remains NOT_RUN for every legacy machine.",
      "PRE_MIGRATION_LEGACY_INPUT_SURFACE is only a candidate gate; final MIG-INV-005/006/010 proof requires a proposed post-migration projection."
    ],
    summary: { totalMachines: machines.length, alreadyM7, legacyMachines: machines.length - alreadyM7, ...counts, NOT_APPLICABLE_OR_EQUIVALENT: notApplicableOrEquivalent, researchLineageFailures: machines.filter(machine => machine.researchLineageProof?.status === "FAIL").length, observationLabelOnlyMatchesRejected: observationProofChanges.length, dispositions },
    phase1OtherAnalysis,
    knownBlockerReview,
    classificationChanges,
    phase2ClassificationChanges,
    observationProofChanges,
    machines
  };
}

export function markdownReport(report) {
  const s = report.summary;
  const lines = [
    "# M7 full-fleet migration audit — 2026-09-16", "",
    `Phase 1 base: \`${report.phase1BaseHead}\`. Original verified Data base: \`${report.originalDataBase}\`. Externally verified read-only App base: \`${report.appBaseHead}\`.`, "",
    "## Summary", "",
    "| Metric | Count |", "|---|---:|",
    `| Total machines | ${s.totalMachines} |`, `| Already M7 | ${s.alreadyM7} |`, `| Legacy machines | ${s.legacyMachines} |`,
    ...CLASSIFICATIONS.map(name => `| ${name} | ${s[name]} |`), `| NOT_APPLICABLE_OR_EQUIVALENT | ${s.NOT_APPLICABLE_OR_EQUIVALENT} |`, "",
    "Classification is fail-closed. Only explicit formal repository relationships are accepted for mandatory migration proofs; labels/categories are diagnostic only. A machine can have several failed proofs, while its classification follows the documented deterministic blocker priority.", "",
    "`DETERMINISTIC_LEGACY_BASELINE` is reported as `BASELINE_ONLY`; it is not final MIG-INV-007 equivalence. Every legacy machine retains `postMigrationEquivalenceProof=NOT_RUN`.", "",
    "`PRE_MIGRATION_LEGACY_INPUT_SURFACE` is only a pre-migration candidate gate. Final MIG-INV-005/006/010 compatibility requires comparison with a proposed post-migration projection.", "",
    "## Formal sources", "",
    ...Object.entries(report.formalSources).map(([name, source]) => `- **${name}**: \`${source}\``), "",
    "## Phase 1 → Phase 2 primary-classification changes", "",
    ...(report.classificationChanges.length ? report.classificationChanges.map(change => `- \`${change.machineId}\`: ${change.from} → ${change.to} — ${change.formalReason}`) : ["- None"]), "",
    "## Phase 2 → Phase 2.1 primary-classification changes", "",
    ...(report.phase2ClassificationChanges.length ? report.phase2ClassificationChanges.map(change => `- \`${change.machineId}\`: ${change.from} → ${change.to} — ${change.formalReason}`) : ["- None"]), "",
    "## Observation proof changes", "",
    `Label/category-only PASS results rejected: ${report.observationProofChanges.length}.`, "",
    ...(report.observationProofChanges.length ? report.observationProofChanges.map(change => `- \`${change.machineId}\`: ${change.oldRule} → ${change.newResult}/${change.newRule} — ${change.reason}`) : ["- None"]), "",
    "## Phase 1 OTHER_BLOCKED analysis", "",
    `Phase 1 total: ${report.phase1OtherAnalysis.total}. ${report.phase1OtherAnalysis.conclusion}`, "",
    ...Object.entries(report.phase1OtherAnalysis.byFormalDisposition).map(([name, count]) => `- ${name}: ${count}`),
    `- Selection Quality non-PASS: ${report.phase1OtherAnalysis.selectionQualityNonPass}`, "",
    "## Known-blocker regression review", "",
    "### Reproduced from repository evidence", "",
    ...report.knownBlockerReview.reproduced.map(item => `- \`${item.machineId}\`: ${item.blocker} — ${item.repositoryProof?.rule}: ${item.repositoryProof?.detail}`), "",
    "### Not formally derivable as the stated blocker", "",
    ...report.knownBlockerReview.notFormallyDerivable.map(item => `- \`${item.machineId}\`: ${item.blocker}; current generic audit still returns ${item.retainedBlock ?? "a fail-closed result"}, but the supplied blocker itself has no matching machine-readable proof.`), "",
    "## Machines", "",
    "| Machine | Classification | Disposition | Groups | Items | Selection Quality | Observation | canonical UI | Normalization | Sharing | Input compatibility | MachineData baseline | Post-migration equivalence | Block reasons |",
    "|---|---|---|---:|---:|---|---|---|---|---|---|---|---|---|"
  ];
  for (const machine of report.machines) lines.push(`| \`${machine.machineId}\` | ${machine.classification} | ${machine.migrationDisposition} | ${machine.legacyEvidenceGroupCount} | ${machine.legacyEvidenceItemCount} | ${machine.selectionQualityProof?.status ?? "-"} | ${machine.observationProof?.status ?? "-"} | ${machine.canonicalUiProof?.status ?? "-"} | ${machine.normalizationProof?.status ?? "-"} | ${machine.featureSharingProof?.status ?? "-"} | ${machine.inputCompatibilityProof?.status ?? "-"} | ${machine.machineDataEquivalenceProof?.status ?? "-"} | ${machine.postMigrationEquivalenceProof?.status ?? "-"} | ${machine.blockReasons.join("; ").replaceAll("|", "\\|") || "-"} |`);
  return `${lines.join("\n")}\n`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const root = process.cwd();
  const jsonPath = path.join(root, "reports", "m7-full-fleet-migration-audit-20260916.json");
  const mdPath = path.join(root, "reports", "m7-full-fleet-migration-audit-20260916.md");
  const phase1Report = fs.existsSync(jsonPath) ? read(jsonPath) : null;
  const report = auditFleet(root, phase1Report);
  if (process.argv.includes("--write")) {
    fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
    fs.writeFileSync(mdPath, markdownReport(report));
  }
  console.log(JSON.stringify(report.summary, null, 2));
}
