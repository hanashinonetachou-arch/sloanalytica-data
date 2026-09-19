#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { resolveHistoricalEvidenceGroup } from "./lib/evidence-contract-m7.mjs";

export const AUDIT_DATE = "2026-09-16";
export const BASE_HEAD = "a9234354d0091cdbcab17619dc0ba2887b5e30bc";
export const CLASSIFICATIONS = [
  "REPOSITORY_PROOF_ACQUIRABLE",
  "LINEAGE_ANNOTATION_REQUIRED",
  "OBSERVATION_SEMANTICS_REVIEW_REQUIRED",
  "EXTERNAL_RESEARCH_REQUIRED",
  "FIELD_VERIFICATION_REQUIRED",
  "INDEPENDENT_BLOCKER",
  "FEATURE_EVIDENCE_SHARING_REVIEW_REQUIRED"
];

const INDEPENDENT_BLOCKER_MACHINES = new Set(["LB_FUJIKO_M2"]);
const SHARING_REVIEW_MACHINES = new Set(["L_TENSEI_SHITARA_KEN_DESHITA_GT"]);
const read = file => JSON.parse(fs.readFileSync(file, "utf8"));
const clean = value => String(value ?? "").replace(/[^A-Z0-9_]/g, "_");

function phase2InputIndex(audit) {
  const result = new Map();
  for (const machine of audit.machines ?? []) {
    for (const item of machine.items ?? []) result.set(`${machine.machineId}/${item.inputId}`, item);
  }
  return result;
}

function classify(item, observation, auditedInput) {
  const observations = observation.observations ?? [];
  const legacyId = `OBS_${clean(item.groupId)}`;
  const legacy = observations.filter(candidate => candidate.observationId === legacyId);
  const hasAuditedInputProjection = auditedInput?.structuralReferences?.length > 0;

  if (SHARING_REVIEW_MACHINES.has(item.machineId)) {
    return {
      classification: "FEATURE_EVIDENCE_SHARING_REVIEW_REQUIRED",
      proofSource: "SHARED_FEATURE_EVIDENCE_INPUT_STANDARD.md + Selection/Observation artifacts",
      proofType: "SHARED_INPUT_CONTRACT_NOT_PROVEN",
      explanation: "Feature/Evidence sharing needs formal proof or a confirmed shared-input contract; no runtime sharing field may be invented."
    };
  }
  if (INDEPENDENT_BLOCKER_MACHINES.has(item.machineId)) {
    return {
      classification: "INDEPENDENT_BLOCKER",
      proofSource: "existing M7 Selection Quality stop condition",
      proofType: "SELECTION_QUALITY_BLOCKER",
      explanation: "Selection Quality is independently blocked, so Observation lineage work cannot make this group migration-ready."
    };
  }
  // This is intentionally stricter than an identifier or label comparison: the
  // old Observation identifier must be unique and an older formal audit must
  // independently record the canonical input as a structural package/UI path.
  if (legacy.length === 1 && hasAuditedInputProjection && !item.labelOnlyMatchRejected) {
    return {
      classification: "REPOSITORY_PROOF_ACQUIRABLE",
      currentObservationId: legacyId,
      proofSource: `research/${item.machineId}/machine-observation-data.json#${legacyId} + audit-reports/evidence-ui-v2-phase2.json#${item.machineId}/INP_EVI_${item.groupId}`,
      proofType: "UNIQUE_LEGACY_ID_AND_AUDITED_INPUT_PROJECTION",
      explanation: "A unique machine-local Observation structurally embeds the exact groupId in its identifier, and the prior formal UI audit independently records INP_EVI_<groupId> at concrete package/UI trails. This is a proof-acquisition candidate, not yet an established formal Observation proof."
    };
  }
  if (item.diagnosticCandidateObservationIds.length > 0) {
    return {
      classification: "OBSERVATION_SEMANTICS_REVIEW_REQUIRED",
      proofSource: "diagnostic label/category comparison (explicitly not proof)",
      proofType: "LABEL_ONLY_CANDIDATE_REJECTED",
      explanation: "The candidate Observation must be semantically reviewed; label/category resemblance is retained only to locate it and cannot establish lineage."
    };
  }
  return {
    classification: "LINEAGE_ANNOTATION_REQUIRED",
    proofSource: "Research + Selection + Observation artifact inspection",
    proofType: "NO_EXPLICIT_OBSERVATION_LINEAGE",
    explanation: "Research IDs and Selection sourceEvidenceIds are present, but the repository has no unique non-label Observation relationship; an explicit lineage annotation is required."
  };
}

export function auditProofAcquisition(root) {
  const completionPath = path.join(root, "reports/m7-phase2-2-observation-contract-completion-audit-20260916.json");
  const completion = read(completionPath);
  const phase2Path = path.join(root, "audit-reports/evidence-ui-v2-phase2.json");
  const inputIndex = phase2InputIndex(read(phase2Path));
  const semantic = completion.groups.filter(item => item.classification === "SEMANTIC_REVIEW_REQUIRED");
  const groups = semantic.map(item => {
    const dir = path.join(root, "research", item.machineId);
    // Reading all three is part of the contract even when an upstream report has
    // already summarized them. It also makes missing artifacts a hard failure.
    const research = read(path.join(dir, "research-data.json"));
    const selection = read(path.join(dir, "selection-data.json"));
    const observation = read(path.join(dir, "machine-observation-data.json"));
        const historicalGroup = {
      groupId: item.groupId,
      options: [{ sourceEvidenceIds: item.sourceEvidenceIds }]
    };
    resolveHistoricalEvidenceGroup(selection, historicalGroup);
    const researchIds = new Set((research.evidenceCandidates ?? []).map(candidate => candidate.researchEvidenceId));
    if (item.sourceEvidenceIds.some(id => !researchIds.has(id))) throw new Error(`Research lineage changed: ${item.machineId}/${item.groupId}`);
    const auditedInput = inputIndex.get(`${item.machineId}/INP_EVI_${item.groupId}`);
    const result = classify(item, observation, auditedInput);
    return {
      machineId: item.machineId,
      groupId: item.groupId,
      sourceEvidenceIds: item.sourceEvidenceIds,
      currentObservationId: result.currentObservationId ?? null,
      expectedFormalObservationId: item.expectedFormalObservationId,
      classification: result.classification,
      proofResult: "NOT_ESTABLISHED",
      proofSource: result.proofSource,
      proofType: result.proofType,
      proofExplanation: result.explanation,
      minimumChange: result.classification === "REPOSITORY_PROOF_ACQUIRABLE"
        ? "After human confirmation, add explicit groupId/sourceEvidenceIds lineage using an existing Observation lineage field; separately validate any ID rename. Do not change semantics or runtime shape."
        : "Resolve the stated blocker and add explicit lineage in an existing formal artifact; do not infer or rename from this report.",
      independentBlocker: result.classification === "INDEPENDENT_BLOCKER",
      diagnosticCandidateObservationIds: item.diagnosticCandidateObservationIds,
      labelOnlyMatchRejected: item.labelOnlyMatchRejected,
      inspectedArtifacts: [
        `research/${item.machineId}/research-data.json`,
        `research/${item.machineId}/selection-data.json`,
        `research/${item.machineId}/machine-observation-data.json`
      ]
    };
  });
  groups.sort((a, b) => a.machineId.localeCompare(b.machineId) || a.groupId.localeCompare(b.groupId));
  const counts = Object.fromEntries(CLASSIFICATIONS.map(name => [name, groups.filter(item => item.classification === name).length]));
  const batch1Candidates = groups.filter(item => item.classification === "REPOSITORY_PROOF_ACQUIRABLE");
  return {
    schemaVersion: "m7-phase2.2-proof-acquisition-batch1-v1",
    auditDate: AUDIT_DATE,
    baseHead: BASE_HEAD,
    policy: {
      proofDecision: "binary ESTABLISHED / NOT_ESTABLISHED only; this acquisition report establishes none",
      labelAndCategoryUse: "diagnostic candidate extraction only",
      batchRule: "unique OBS_<groupId> plus independently audited INP_EVI_<groupId> structural package/UI projection",
      mutationScope: "report/tool/test only; no Observation migration or Research/Selection/Observation semantic mutation"
    },
    summary: {
      semanticReviewInput: groups.length,
      classificationCounts: counts,
      repositoryProofAcquirable: counts.REPOSITORY_PROOF_ACQUIRABLE,
      lineageAnnotationRequired: counts.LINEAGE_ANNOTATION_REQUIRED,
      observationSemanticsReviewRequired: counts.OBSERVATION_SEMANTICS_REVIEW_REQUIRED,
      externalResearchRequired: counts.EXTERNAL_RESEARCH_REQUIRED,
      fieldVerificationRequired: counts.FIELD_VERIFICATION_REQUIRED,
      independentBlocker: counts.INDEPENDENT_BLOCKER,
      featureEvidenceSharingReviewRequired: counts.FEATURE_EVIDENCE_SHARING_REVIEW_REQUIRED,
      batch1CandidateCount: batch1Candidates.length,
      labelOnlyRejectedCount: groups.filter(item => item.labelOnlyMatchRejected).length,
      upstreamAllClassificationsLabelOnlyRejectedCount: completion.summary.labelOnlyMatchesRejected
    },
    batch1Candidates,
    groups
  };
}

export function markdownReport(report) {
  const s = report.summary;
  const lines = [
    `# M7 Evidence Contract Phase 2.2 — Proof Acquisition Batch 1 (${report.auditDate})`, "",
    `Base HEAD: \`${report.baseHead}\`. **No Observation migration is performed by this deliverable.**`, "",
    "## Decision policy", "",
    "Proof remains binary. Every Batch 1 entry is `NOT_ESTABLISHED`: it is a safe target for acquiring an explicit formal annotation, not permission to migrate. Labels/categories and scores are never proof.", "",
    "## Summary", "", "| Metric | Count |", "|---|---:|",
    `| semanticReviewInput | ${s.semanticReviewInput} |`,
    ...CLASSIFICATIONS.map(name => `| ${name} | ${s.classificationCounts[name]} |`),
    `| batch1CandidateCount | ${s.batch1CandidateCount} |`,
    `| labelOnlyRejectedCount (267-group input) | ${s.labelOnlyRejectedCount} |`,
    `| upstream label-only rejected (all 447 groups) | ${s.upstreamAllClassificationsLabelOnlyRejectedCount} |`, "",
    "Zero counts are deliberate: this batch does not manufacture an external-research or field-verification conclusion for groups whose upstream classification was semantic review.", "",
    "## Batch 1 candidates", "",
    "| Machine | Group | Source Evidence IDs | Current Observation | Expected formal Observation | Proof source/type | Minimum change | Independent blocker |", "|---|---|---|---|---|---|---|---|"
  ];
  for (const item of report.batch1Candidates) lines.push(`| \`${item.machineId}\` | \`${item.groupId}\` | ${item.sourceEvidenceIds.map(id => `\`${id}\``).join(", ")} | \`${item.currentObservationId}\` | \`${item.expectedFormalObservationId}\` | ${item.proofType}: ${item.proofExplanation} Source: \`${item.proofSource}\` | ${item.minimumChange} | ${item.independentBlocker ? "yes" : "no"} |`);
  lines.push("", `## All ${report.groups.length} classifications`, "", "| Machine | Group | Classification | Proof decision | Reason / blocker | Diagnostic candidates |", "|---|---|---|---|---|---|");
  for (const item of report.groups) lines.push(`| \`${item.machineId}\` | \`${item.groupId}\` | ${item.classification} | ${item.proofResult} | ${item.proofExplanation} | ${item.diagnosticCandidateObservationIds.map(id => `\`${id}\``).join(", ") || "-"} |`);
  lines.push("", "## Unresolved blockers", "", "- `L_TENSEI_SHITARA_KEN_DESHITA_GT`: Feature/Evidence sharing formal proof or shared-input contract review is required; no new runtime field is proposed.", "- `LB_FUJIKO_M2`: Selection Quality remains an independent blocker.", "- Label-only candidates require Observation semantics review; all other unproven relationships require explicit lineage annotation.", "- The 21 upstream `FIELD_VERIFICATION_REQUIRED` groups (including the named real-device/service checks) are outside the 267 semantic-review input and remain unchanged.", "", "## Stop statement", "", "No Observation ID was renamed, no meaning was rewritten, and canonical UI, materialized MachineData, App runtime, validator behavior, and real-device status were not changed.");
  return `${lines.join("\n")}\n`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const root = process.cwd();
  const report = auditProofAcquisition(root);
  if (process.argv.includes("--write")) {
    const stem = path.join(root, "reports/m7-phase2-2-proof-acquisition-batch1-20260916");
    fs.writeFileSync(`${stem}.json`, `${JSON.stringify(report, null, 2)}\n`);
    fs.writeFileSync(`${stem}.md`, markdownReport(report));
  }
  console.log(JSON.stringify(report.summary, null, 2));
}
