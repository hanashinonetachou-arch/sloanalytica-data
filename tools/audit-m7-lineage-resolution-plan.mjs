#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { resolveHistoricalEvidenceGroup } from "./lib/evidence-contract-m7.mjs";

export const AUDIT_DATE = "2026-09-16";
export const BASE_HEAD = "b5bef0645b1779201cb9bf07f33a3258b3b2c7fb";
export const INPUTS = {
  completion: "reports/m7-phase2-2-observation-contract-completion-audit-20260916.json",
  acquisition: "reports/m7-phase2-2-proof-acquisition-batch1-20260916.json",
  formalization: "reports/m7-phase2-2-proof-formalization-batch1-20260916.json"
};

export const RESOLUTION_CLASSES = [
  "EXACT_UNIVERSE_LINEAGE_METADATA_MISSING",
  "SOURCE_EVIDENCE_SET_NOT_EXPLICIT",
  "OBSERVATION_UNIVERSE_BROADER_THAN_SELECTION",
  "OBSERVATION_UNIVERSE_NARROWER_OR_PARTIAL",
  "OBSERVATION_MODE_MISMATCH",
  "ANSWER_OR_VARIANT_UNIVERSE_MISMATCH",
  "MULTIPLE_OBSERVATIONS_REQUIRED",
  "OBSERVATION_SEMANTICS_REVIEW_REQUIRED",
  "FIELD_VERIFICATION_REQUIRED",
  "INDEPENDENT_SELECTION_OR_RESEARCH_BLOCKER",
  "FEATURE_EVIDENCE_SHARING_REVIEW_REQUIRED"
];

export const ELIGIBILITIES = [
  "SAFE_WITH_EXISTING_REPOSITORY_PROOF",
  "REQUIRES_HUMAN_LINEAGE_CONFIRMATION",
  "REQUIRES_OBSERVATION_REDESIGN_OR_SPLIT",
  "REQUIRES_EXTERNAL_OR_FIELD_VERIFICATION",
  "BLOCKED_BY_UPSTREAM_CONTRACT",
  "NOT_APPLICABLE"
];

const BATCH1_DECISIONS = {
  "L_ARIFURETA_JA/SETTING_EVIDENCE": ["SOURCE_EVIDENCE_SET_NOT_EXPLICIT", "The Observation note names only some outcome families and does not enumerate the eleven selected Research Evidence IDs."],
  "L_ASLOT_KONOSUBA_FX/KONOSUBA_BIG_END": ["OBSERVATION_UNIVERSE_BROADER_THAN_SELECTION", "The Observation explicitly includes ten non-confirmation classifications in addition to the five selected Research Evidence outcomes."],
  "L_BOFURI_FN/SETTING_EVIDENCE": ["SOURCE_EVIDENCE_SET_NOT_EXPLICIT", "The Observation has only a generic category and identifies neither the Selection group nor its Research Evidence IDs."],
  "L_SHAMANKING_SS/SETTING_EVIDENCE": ["SOURCE_EVIDENCE_SET_NOT_EXPLICIT", "The note refers generically to adopted Selection conditions but does not identify the group or enumerate its eighteen Research Evidence IDs."],
  "L_SISTER_QUEST_CA/SMARTALK": ["ANSWER_OR_VARIANT_UNIVERSE_MISMATCH", "The Observation collects answer color and content for three prompts, while Selection contains only the three red-answer Research Evidence outcomes."],
  "L_SUPER_BLACKJACK_SLDC/SETTING_EVIDENCE": ["SOURCE_EVIDENCE_SET_NOT_EXPLICIT", "The note refers generically to adopted Selection conditions but does not identify the group or enumerate its seventeen Research Evidence IDs."],
  "S_AOHARU_MISAO_A2/SETTING_EVIDENCE": ["SOURCE_EVIDENCE_SET_NOT_EXPLICIT", "The Observation has only a generic category and identifies neither the Selection group nor its Research Evidence IDs."],
  "S_DANMACHI_GAIDEN_XR/SETTING_EVIDENCE": ["SOURCE_EVIDENCE_SET_NOT_EXPLICIT", "The note refers generically to adopted Selection conditions but does not identify the group or enumerate its twelve Research Evidence IDs."],
  "S_HAIYORE_NYARUKO_SAN_Y/SETTING_EVIDENCE": ["SOURCE_EVIDENCE_SET_NOT_EXPLICIT", "The note refers generically to Selection Evidence but does not identify the group or enumerate its thirteen Research Evidence IDs."],
  "S_MAHOIKU_NB/SETTING_EVIDENCE": ["SOURCE_EVIDENCE_SET_NOT_EXPLICIT", "The note refers generically to adopted Selection conditions but does not identify the group or enumerate its six Research Evidence IDs."],
  "S_TEKKEN4_ULTIMATE_DEVIL_TCD/SETTING_EVIDENCE": ["SOURCE_EVIDENCE_SET_NOT_EXPLICIT", "The note refers generically to Selection Evidence but does not identify the group or enumerate its twelve Research Evidence IDs."],
  "S_TOARU_RAILGUN_FB/SETTING_EVIDENCE": ["OBSERVATION_MODE_MISMATCH", "The VISUAL_EVENT Observation does not enumerate the two selected audio Evidence outcomes; its note governs missed audio rather than proving collection coverage."],
  "S_YOUJO_SENKI_ZR/SETTING_EVIDENCE": ["SOURCE_EVIDENCE_SET_NOT_EXPLICIT", "The note refers generically to Selection Evidence but does not identify the group or enumerate its fifteen Research Evidence IDs."]
};

const CLASS_DETAILS = {
  EXACT_UNIVERSE_LINEAGE_METADATA_MISSING: "Authoritative repository structure closes the exact Selection and Observation universes, but explicit machine-readable lineage is absent.",
  SOURCE_EVIDENCE_SET_NOT_EXPLICIT: "Selection has a closed Research Evidence set, but no Observation artifact explicitly identifies that exact set.",
  OBSERVATION_UNIVERSE_BROADER_THAN_SELECTION: "The Observation intentionally admits outcomes beyond the selected Evidence universe.",
  OBSERVATION_UNIVERSE_NARROWER_OR_PARTIAL: "The Observation covers only part of the selected Evidence universe.",
  OBSERVATION_MODE_MISMATCH: "Selection and Observation use incompatible or incomplete collection modes.",
  ANSWER_OR_VARIANT_UNIVERSE_MISMATCH: "The Observation answer/content variants are broader or different from Selection.",
  MULTIPLE_OBSERVATIONS_REQUIRED: "The selected group cannot honestly be represented by one simple Observation lineage annotation.",
  OBSERVATION_SEMANTICS_REVIEW_REQUIRED: "Only diagnostic candidates exist; a human must determine semantics before lineage can be confirmed.",
  FIELD_VERIFICATION_REQUIRED: "An existing hardened stop requires real-device, linked-service, or field confirmation.",
  INDEPENDENT_SELECTION_OR_RESEARCH_BLOCKER: "An upstream Selection or Research quality contract blocks lineage work.",
  FEATURE_EVIDENCE_SHARING_REVIEW_REQUIRED: "Feature/Evidence sharing requires a separate contract decision and must not be emitted as a runtime proof field."
};

const read = (root, file) => JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
const keyOf = item => `${item.machineId}/${item.groupId}`;
const uniq = values => [...new Set(values)].sort();
const countBy = (names, rows, field) => Object.fromEntries(names.map(name => [name, rows.filter(row => row[field] === name).length]));

function inspectArtifacts(root, item) {
  const dir = `research/${item.machineId}`;
  const research = read(root, `${dir}/research-data.json`);
  const selection = read(root, `${dir}/selection-data.json`);
  const observation = read(root, `${dir}/machine-observation-data.json`);

  const historicalGroup = {
    groupId: item.groupId,
    options: [{ sourceEvidenceIds: item.sourceEvidenceIds }]
  };
  resolveHistoricalEvidenceGroup(selection, historicalGroup);
  const selectedIds = uniq(item.sourceEvidenceIds);

  const researchIds = new Set((research.evidenceCandidates ?? []).map(candidate => candidate.researchEvidenceId));
  const missing = selectedIds.filter(id => !researchIds.has(id));
  if (missing.length) throw new Error(`${keyOf(item)}: missing Research Evidence IDs: ${missing.join(", ")}`);
  return { observation, inspectedArtifacts: [`${dir}/research-data.json`, `${dir}/selection-data.json`, `${dir}/machine-observation-data.json`] };
}

function decision(item, acquisitionItem, formalizationItem) {
  const key = keyOf(item);
  if (item.classification === "FIELD_VERIFICATION_REQUIRED") return {
    resolutionClass: "FIELD_VERIFICATION_REQUIRED", eligibility: "REQUIRES_EXTERNAL_OR_FIELD_VERIFICATION",
    basis: item.proofExplanation, next: "Complete the existing field/linked-service verification stop; then establish exact lineage without inferring from labels.", blocker: item.blockerReason
  };
  if (!acquisitionItem) throw new Error(`${key}: missing proof-acquisition classification`);
  if (acquisitionItem.classification === "INDEPENDENT_BLOCKER") return {
    resolutionClass: "INDEPENDENT_SELECTION_OR_RESEARCH_BLOCKER", eligibility: "BLOCKED_BY_UPSTREAM_CONTRACT",
    basis: acquisitionItem.proofExplanation, next: "Resolve the Selection Quality blocker before any Observation lineage action.", blocker: acquisitionItem.proofType
  };
  if (acquisitionItem.classification === "FEATURE_EVIDENCE_SHARING_REVIEW_REQUIRED") return {
    resolutionClass: "FEATURE_EVIDENCE_SHARING_REVIEW_REQUIRED", eligibility: "BLOCKED_BY_UPSTREAM_CONTRACT",
    basis: acquisitionItem.proofExplanation, next: "Resolve the shared-input contract without adding a runtime sharing/proof field.", blocker: acquisitionItem.proofType
  };
  if (acquisitionItem.classification === "OBSERVATION_SEMANTICS_REVIEW_REQUIRED") return {
    resolutionClass: "OBSERVATION_SEMANTICS_REVIEW_REQUIRED", eligibility: "REQUIRES_HUMAN_LINEAGE_CONFIRMATION",
    basis: acquisitionItem.proofExplanation, next: "Perform human Observation semantics review, then annotate exact lineage only if equivalence is confirmed.", blocker: null
  };
  if (acquisitionItem.classification === "LINEAGE_ANNOTATION_REQUIRED") return {
    resolutionClass: "SOURCE_EVIDENCE_SET_NOT_EXPLICIT", eligibility: "REQUIRES_HUMAN_LINEAGE_CONFIRMATION",
    basis: "Research and Selection close the selected Evidence IDs, but inspection finds no unique non-diagnostic Observation relationship that explicitly closes the same source set.",
    next: "Obtain controlled authoritative confirmation of the exact Evidence-to-Observation universe, then annotate it in an existing formal artifact.", blocker: null
  };
  if (acquisitionItem.classification !== "REPOSITORY_PROOF_ACQUIRABLE" || !formalizationItem) throw new Error(`${key}: unexpected acquisition state`);
  const manifest = BATCH1_DECISIONS[key];
  if (!manifest || formalizationItem.proofResult !== "FORMAL_PROOF_NOT_ESTABLISHED") throw new Error(`${key}: Batch-1 reconciliation is incomplete`);
  const redesign = new Set(["OBSERVATION_UNIVERSE_BROADER_THAN_SELECTION", "OBSERVATION_UNIVERSE_NARROWER_OR_PARTIAL", "OBSERVATION_MODE_MISMATCH", "ANSWER_OR_VARIANT_UNIVERSE_MISMATCH", "MULTIPLE_OBSERVATIONS_REQUIRED"]);
  return {
    resolutionClass: manifest[0],
    eligibility: redesign.has(manifest[0]) ? "REQUIRES_OBSERVATION_REDESIGN_OR_SPLIT" : "REQUIRES_HUMAN_LINEAGE_CONFIRMATION",
    basis: manifest[1],
    next: redesign.has(manifest[0]) ? "Redesign or split the Observation so its collection universe can represent Selection honestly; do not attach the selected IDs to the current whole Observation." : "Obtain controlled authoritative confirmation enumerating the exact selected Research Evidence set, then annotate lineage.",
    blocker: formalizationItem.blocker
  };
}

export function auditLineageResolution(root) {
  const completion = read(root, INPUTS.completion);
  const acquisition = read(root, INPUTS.acquisition);
  const formalization = read(root, INPUTS.formalization);
  const canonicalUiAudit = read(root, "audit-reports/evidence-ui-v2-phase2.json");
  if (!Array.isArray(canonicalUiAudit.machines) || !canonicalUiAudit.schemaVersion) throw new Error("canonical Evidence UI audit is malformed");
  const unresolvedInput = completion.groups.filter(item => item.proofResult !== "ESTABLISHED");
  const acquisitionByKey = new Map(acquisition.groups.map(item => [keyOf(item), item]));
  const formalizationByKey = new Map(formalization.candidates.map(item => [keyOf(item), item]));
  const unresolvedGroups = unresolvedInput.map(item => {
    const key = keyOf(item);
    const acquisitionItem = acquisitionByKey.get(key);
    const formalizationItem = formalizationByKey.get(key);
    const { observation, inspectedArtifacts } = inspectArtifacts(root, item);
    const result = decision(item, acquisitionItem, formalizationItem);
    const relevantIds = uniq([item.currentObservationId, ...(item.diagnosticCandidateObservationIds ?? []), acquisitionItem?.currentObservationId].filter(Boolean));
    for (const id of relevantIds) if (!(observation.observations ?? []).some(candidate => candidate.observationId === id)) throw new Error(`${key}: relevant Observation ${id} disappeared`);
    return {
      machineId: item.machineId,
      groupId: item.groupId,
      sourceEvidenceIds: [...item.sourceEvidenceIds].sort(),
      currentObservationId: relevantIds.length === 1 ? relevantIds[0] : null,
      relevantObservationIds: relevantIds,
      previousClassification: acquisitionItem?.classification ?? item.classification,
      resolutionClass: result.resolutionClass,
      resolutionBasis: result.basis,
      bulkAnnotationEligibility: result.eligibility,
      requiredNextAction: result.next,
      machineReadableProofPresent: false,
      labelOnlyEvidenceRejected: Boolean(item.labelOnlyMatchRejected || acquisitionItem?.labelOnlyMatchRejected),
      knownBlocker: result.blocker,
      inspectedArtifacts
    };
  }).sort((a, b) => a.machineId.localeCompare(b.machineId) || a.groupId.localeCompare(b.groupId));

  const resolutionClassCounts = countBy(RESOLUTION_CLASSES, unresolvedGroups, "resolutionClass");
  const eligibilitySummary = countBy(ELIGIBILITIES, unresolvedGroups, "bulkAnnotationEligibility");
  const machineMap = new Map();
  for (const row of unresolvedGroups) {
    const list = machineMap.get(row.machineId) ?? [];
    list.push(row);
    machineMap.set(row.machineId, list);
  }
  const machines = [...machineMap].map(([machineId, rows]) => ({
    machineId,
    unresolvedGroupCount: rows.length,
    resolutionClasses: countBy(RESOLUTION_CLASSES, rows, "resolutionClass"),
    eligibilityCounts: countBy(ELIGIBILITIES, rows, "bulkAnnotationEligibility"),
    groupIds: rows.map(row => row.groupId)
  })).sort((a, b) => a.machineId.localeCompare(b.machineId));
  const multiGroupMachines = machines.filter(item => item.unresolvedGroupCount > 1).sort((a, b) => b.unresolvedGroupCount - a.unresolvedGroupCount || a.machineId.localeCompare(b.machineId));
  const previousBatch1Reconciliation = formalization.candidates.map(item => {
    const row = unresolvedGroups.find(candidate => keyOf(candidate) === keyOf(item));
    return { machineId: item.machineId, groupId: item.groupId, priorProofResult: item.proofResult, resolutionClass: row.resolutionClass, bulkAnnotationEligibility: row.bulkAnnotationEligibility, newProofDiscovered: false, reconciliation: "CONSISTENT_FORMAL_PROOF_NOT_ESTABLISHED" };
  });

  const workTypes = [
    { workType: "CONTROLLED_LINEAGE_CONFIRMATION_AND_ANNOTATION", resolutionClasses: ["SOURCE_EVIDENCE_SET_NOT_EXPLICIT", "EXACT_UNIVERSE_LINEAGE_METADATA_MISSING"], groupCount: resolutionClassCounts.SOURCE_EVIDENCE_SET_NOT_EXPLICIT + resolutionClassCounts.EXACT_UNIVERSE_LINEAGE_METADATA_MISSING },
    { workType: "OBSERVATION_REDESIGN_OR_SPLIT", resolutionClasses: ["OBSERVATION_UNIVERSE_BROADER_THAN_SELECTION", "OBSERVATION_UNIVERSE_NARROWER_OR_PARTIAL", "OBSERVATION_MODE_MISMATCH", "ANSWER_OR_VARIANT_UNIVERSE_MISMATCH", "MULTIPLE_OBSERVATIONS_REQUIRED"], groupCount: eligibilitySummary.REQUIRES_OBSERVATION_REDESIGN_OR_SPLIT },
    { workType: "OBSERVATION_SEMANTICS_REVIEW", resolutionClasses: ["OBSERVATION_SEMANTICS_REVIEW_REQUIRED"], groupCount: resolutionClassCounts.OBSERVATION_SEMANTICS_REVIEW_REQUIRED },
    { workType: "FIELD_OR_EXTERNAL_VERIFICATION", resolutionClasses: ["FIELD_VERIFICATION_REQUIRED"], groupCount: resolutionClassCounts.FIELD_VERIFICATION_REQUIRED },
    { workType: "INDEPENDENT_UPSTREAM_CONTRACT_RESOLUTION", resolutionClasses: ["INDEPENDENT_SELECTION_OR_RESEARCH_BLOCKER"], groupCount: resolutionClassCounts.INDEPENDENT_SELECTION_OR_RESEARCH_BLOCKER },
    { workType: "FEATURE_EVIDENCE_SHARING_CONTRACT_RESOLUTION", resolutionClasses: ["FEATURE_EVIDENCE_SHARING_REVIEW_REQUIRED"], groupCount: resolutionClassCounts.FEATURE_EVIDENCE_SHARING_REVIEW_REQUIRED }
  ];
  return {
    schemaVersion: "m7-phase2.2-lineage-resolution-plan-v1",
    auditDate: AUDIT_DATE,
    baseHead: BASE_HEAD,
    authoritativeInputs: [...Object.values(INPUTS), "research/<machineId>/research-data.json", "research/<machineId>/selection-data.json", "research/<machineId>/machine-observation-data.json", "audit-reports/evidence-ui-v2-phase2.json"],
    policy: {
      formalProof: "binary; no confidence or approximate proof",
      diagnosticOnly: ["label similarity", "category similarity", "display name similarity", "appearance", "UI proximity", "similar wording", "matching option counts"],
      safeEligibilityRule: "Requires concrete machine-readable non-diagnostic repository proof closing the exact Selection Evidence and Observation collection universes.",
      selectionRule: "Audit tooling validates but does not reinterpret or re-decide Selection.",
      mutationScope: "Audit tool, test, and reports only; no runtime or canonical data mutation.",
      realDeviceVerificationPerformed: false
    },
    summary: {
      reviewedEvidenceGroups: completion.summary.totalEvidenceGroupsReviewed,
      alreadyFormalGroupsExcluded: completion.summary.alreadyFormal,
      unresolvedGroupCount: unresolvedGroups.length,
      affectedMachineCount: machines.length,
      resolutionClassCounts,
      automaticSafeCount: eligibilitySummary.SAFE_WITH_EXISTING_REPOSITORY_PROOF,
      controlledHumanLineageConfirmationOnlyCount: resolutionClassCounts.SOURCE_EVIDENCE_SET_NOT_EXPLICIT + resolutionClassCounts.EXACT_UNIVERSE_LINEAGE_METADATA_MISSING,
      observationSemanticsReviewCount: resolutionClassCounts.OBSERVATION_SEMANTICS_REVIEW_REQUIRED,
      redesignOrSplitCount: eligibilitySummary.REQUIRES_OBSERVATION_REDESIGN_OR_SPLIT,
      fieldOrExternalVerificationCount: eligibilitySummary.REQUIRES_EXTERNAL_OR_FIELD_VERIFICATION,
      upstreamContractBlockedCount: eligibilitySummary.BLOCKED_BY_UPSTREAM_CONTRACT,
      workTypeCount: workTypes.length,
      multiGroupMachineCount: multiGroupMachines.length
    },
    resolutionClasses: RESOLUTION_CLASSES.map(name => ({ resolutionClass: name, description: CLASS_DETAILS[name], groupCount: resolutionClassCounts[name], uniqueMachineCount: new Set(unresolvedGroups.filter(row => row.resolutionClass === name).map(row => row.machineId)).size })),
    eligibilitySummary,
    workTypes,
    unresolvedGroups,
    machineSummary: { machines, multiGroupMachines },
    previousBatch1Reconciliation,
    knownStopConditions: {
      featureEvidenceSharing: ["L_TENSEI_SHITARA_KEN_DESHITA_GT"],
      fieldOrSemanticVerification: ["L_LUPIN_DAIKOUKAISHA_H1", "L_MOMOTARO_DENTETSU_TEIBAN_PU", "L_SMASLO_DUNBINE_MF", "S_OVERLORD_II_SX", "S_SENGOKU_COLLECTION5_PS", "S_SLODOL_PK", "L_REZERO_SEASON2_PA5"],
      selectionQuality: ["LB_FUJIKO_M2"]
    },
    safety: { runtimeShapeChangeCount: 0, canonicalUiSemanticChangeCount: 0, validatorChangeCount: 0, inferenceSemanticChangeCount: 0, unsafeMigrationCount: 0, observationRenameCount: 0, lineageFormalizedCount: 0, realDeviceVerificationClaimCount: 0 }
  };
}

export function markdownReport(report) {
  const lines = [
    `# M7 Evidence Contract Phase 2.2 — Lineage Resolution Plan (${report.auditDate})`, "",
    `Base HEAD: \`${report.baseHead}\`. This is a full-debt classification and planning audit, not a formalization batch.`, "",
    "## Endgame", "",
    `The ${report.summary.unresolvedGroupCount} unresolved groups on ${report.summary.affectedMachineCount} machines are compressed into ${report.resolutionClasses.filter(item => item.groupCount).length} populated resolution classes and ${report.summary.workTypeCount} future work types. Existing repository proof makes **${report.summary.automaticSafeCount}** groups automatically safe. No real-device verification was performed.`, "",
    "### Resolution classes", "", "| Resolution class | Groups | Machines |", "|---|---:|---:|",
    ...report.resolutionClasses.map(item => `| ${item.resolutionClass} | ${item.groupCount} | ${item.uniqueMachineCount} |`), "",
    "### Bulk annotation eligibility", "", "| Eligibility | Groups |", "|---|---:|",
    ...Object.entries(report.eligibilitySummary).map(([name, count]) => `| ${name} | ${count} |`), "",
    "### Work types", "", "| Work type | Groups | Classes |", "|---|---:|---|",
    ...report.workTypes.map(item => `| ${item.workType} | ${item.groupCount} | ${item.resolutionClasses.join(", ")} |`), "",
    "## Batch-1 reconciliation", "", "All 13 candidates remain `FORMAL_PROOF_NOT_ESTABLISHED`; no new proof, lineage formalization, or Observation rename was discovered.", "", "| Machine / group | New resolution class | Eligibility |", "|---|---|---|",
    ...report.previousBatch1Reconciliation.map(item => `| \`${item.machineId}/${item.groupId}\` | ${item.resolutionClass} | ${item.bulkAnnotationEligibility} |`), "",
    "## Highest-leverage machines", "", "These machines contain multiple blocked groups; counts identify consolidation leverage, not permission to bulk annotate.", "", "| Machine | Groups | Populated classes |", "|---|---:|---|",
    ...report.machineSummary.multiGroupMachines.map(item => `| \`${item.machineId}\` | ${item.unresolvedGroupCount} | ${Object.entries(item.resolutionClasses).filter(([, count]) => count).map(([name, count]) => `${name} (${count})`).join(", ")} |`), "",
    "## All unresolved groups", "", "| Machine / group | Evidence IDs | Observation candidates | Previous | Resolution | Eligibility | Next action |", "|---|---|---|---|---|---|---|",
    ...report.unresolvedGroups.map(item => `| \`${item.machineId}/${item.groupId}\` | ${item.sourceEvidenceIds.map(id => `\`${id}\``).join(", ")} | ${item.relevantObservationIds.map(id => `\`${id}\``).join(", ") || "-"} | ${item.previousClassification} | ${item.resolutionClass} | ${item.bulkAnnotationEligibility} | ${item.requiredNextAction} |`), "",
    "## Safety", "", "No Research, Selection, Observation, canonical UI, MachineData, App runtime, distribution, validator, or inference source was changed. No runtime proof/sharing field was introduced, no unsafe migration occurred, and no real-device verification is claimed.", ""
  ];
  return lines.join("\n");
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const root = process.cwd();
  const report = auditLineageResolution(root);
  if (process.argv.includes("--write")) {
    const stem = path.join(root, "reports/m7-phase2-2-lineage-resolution-plan-20260916");
    fs.writeFileSync(`${stem}.json`, `${JSON.stringify(report, null, 2)}\n`);
    fs.writeFileSync(`${stem}.md`, markdownReport(report));
  }
  console.log(JSON.stringify(report.summary, null, 2));
}
