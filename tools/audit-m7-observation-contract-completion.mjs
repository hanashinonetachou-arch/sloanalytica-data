#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

export const AUDIT_DATE = "2026-09-16";
export const BASE_HEAD = "f02e7fca2fb35dc2e7f6ad303dbc7f23dd7b6fb9";
export const CLASSIFICATIONS = [
  "FORMAL_PROOF_AVAILABLE",
  "STRUCTURAL_PROOF_AVAILABLE",
  "SEMANTIC_REVIEW_REQUIRED",
  "RESEARCH_REOPEN_REQUIRED",
  "FIELD_VERIFICATION_REQUIRED",
  "NOT_APPLICABLE_OR_LEGACY_EQUIVALENT"
];

// These machines are retained by the existing full-fleet audit as real-device /
// Observation verification regressions. This is a stop list, never a migration allow-list.
const FIELD_VERIFICATION_STOP_MACHINES = new Set([
  "L_REZERO_SEASON2_PA5",
  "L_LUPIN_DAIKOUKAISHA_H1",
  "L_MOMOTARO_DENTETSU_TEIBAN_PU",
  "L_SMASLO_DUNBINE_MF",
  "S_OVERLORD_II_SX",
  "S_SENGOKU_COLLECTION5_PS",
  "S_SLODOL_PK"
]);
const SELECTION_QUALITY_STOP_MACHINES = new Set(["LB_FUJIKO_M2"]);
const SHARED_INPUT_STOP_MACHINES = new Set(["L_TENSEI_SHITARA_KEN_DESHITA_GT"]);

const read = file => JSON.parse(fs.readFileSync(file, "utf8"));
const clean = value => String(value ?? "").replace(/[^A-Z0-9_]/g, "_");
const uniq = values => [...new Set(values)].sort();

function sourceEvidenceIds(group) {
  return uniq((group.options ?? []).flatMap(option => option.sourceEvidenceIds ?? []));
}

function nonDiagnosticObservationText(observation) {
  // label/categories are deliberately excluded: they may identify review candidates,
  // but the Evidence Contract forbids using them as lineage proof.
  return JSON.stringify({
    sourceRefs: observation.sourceRefs ?? [],
    notes: observation.notes ?? null,
    semanticNote: observation.semanticNote ?? null,
    definitionEquality: observation.definitionEquality ?? null
  });
}

function diagnosticCandidates(group, observations) {
  const exactGroupLabel = observations.filter(item => item.label === group.label).map(item => item.observationId);
  const labels = (group.options ?? []).map(option => option.label);
  const exactOptionLabelCoverage = observations.filter(item => {
    const terms = new Set([item.label, ...(item.categories ?? [])].filter(Boolean));
    return labels.length > 0 && labels.every(label => terms.has(label));
  }).map(item => item.observationId);
  return {
    exactGroupLabel: uniq(exactGroupLabel),
    exactOptionLabelCoverage: uniq(exactOptionLabelCoverage),
    all: uniq([...exactGroupLabel, ...exactOptionLabelCoverage])
  };
}

export function auditGroup(machineId, group, research, observation) {
  const observations = observation.observations ?? [];
  const expectedFormalObservationId = `OBS_EVI_${clean(group.groupId)}`;
  const lineageIds = sourceEvidenceIds(group);
  const researchIds = new Set((research.evidenceCandidates ?? []).map(item => item.researchEvidenceId));
  const invalidResearchIds = lineageIds.filter(id => !researchIds.has(id));
  const formal = observations.filter(item => item.observationId === expectedFormalObservationId);
  const diagnostics = diagnosticCandidates(group, observations);
  const exactLineage = observations.filter(item => lineageIds.length > 0 && lineageIds.every(id => nonDiagnosticObservationText(item).includes(id)));
  const structured = observations.filter(item => {
    const text = nonDiagnosticObservationText(item);
    return text.includes(group.groupId) || text.includes(`INP_EVI_${group.groupId}`);
  });

  let classification;
  let proofType;
  let proofEstablished = false;
  let migrationAllowed = false;
  let proofSource;
  let proofExplanation;
  let blockerReason;

  if (formal.length === 1) {
    classification = "NOT_APPLICABLE_OR_LEGACY_EQUIVALENT";
    proofType = "FORMAL_OBSERVATION_ID";
    proofEstablished = true;
    proofSource = `machine-observation-data.json#${expectedFormalObservationId}`;
    proofExplanation = "The checked-in Observation already has the one canonical OBS_EVI_<clean(groupId)> identifier.";
    blockerReason = null;
  } else if (formal.length > 1) {
    classification = "SEMANTIC_REVIEW_REQUIRED";
    proofType = "NON_UNIQUE_FORMAL_OBSERVATION_ID";
    proofSource = "machine-observation-data.json#observations";
    proofExplanation = "More than one Observation uses the expected formal identifier, so uniqueness is not proven.";
    blockerReason = "Expected formal Observation ID is not unique.";
  } else if (invalidResearchIds.length || lineageIds.length === 0) {
    classification = "RESEARCH_REOPEN_REQUIRED";
    proofType = "RESEARCH_LINEAGE_INCOMPLETE";
    proofSource = "selection-data.json#evidenceUi.groups + research-data.json#evidenceCandidates";
    proofExplanation = "Selection lineage is empty or contains IDs absent from Research; Observation mapping cannot be considered first.";
    blockerReason = `Research lineage is incomplete: ${invalidResearchIds.join(", ") || "sourceEvidenceIds is empty"}.`;
  } else if (exactLineage.length === 1) {
    classification = "FORMAL_PROOF_AVAILABLE";
    proofType = "EXACT_RESEARCH_EVIDENCE_IDS";
    proofEstablished = true;
    migrationAllowed = !SELECTION_QUALITY_STOP_MACHINES.has(machineId) && !SHARED_INPUT_STOP_MACHINES.has(machineId);
    proofSource = `machine-observation-data.json#${exactLineage[0].observationId}`;
    proofExplanation = "Every Selection sourceEvidenceId is explicitly present in one Observation's non-diagnostic lineage fields.";
    blockerReason = migrationAllowed ? null : "An independent Selection Quality or Feature/Evidence shared-input stop condition forbids migration.";
  } else if (structured.length === 1) {
    classification = "STRUCTURAL_PROOF_AVAILABLE";
    proofType = "EXPLICIT_GROUP_OR_INPUT_REFERENCE";
    proofEstablished = true;
    migrationAllowed = !SELECTION_QUALITY_STOP_MACHINES.has(machineId) && !SHARED_INPUT_STOP_MACHINES.has(machineId);
    proofSource = `machine-observation-data.json#${structured[0].observationId}`;
    proofExplanation = "Exactly one Observation explicitly references the Selection groupId or its canonical Evidence input ID in non-diagnostic structured lineage text.";
    blockerReason = migrationAllowed ? null : "An independent Selection Quality or Feature/Evidence shared-input stop condition forbids migration.";
  } else if (FIELD_VERIFICATION_STOP_MACHINES.has(machineId)) {
    classification = "FIELD_VERIFICATION_REQUIRED";
    proofType = "FULL_FLEET_REGRESSION_STOP_LIST";
    proofSource = "tools/audit-m7-full-fleet-migration.mjs#REGRESSION_TARGETS.observationVerification";
    proofExplanation = "The existing hardened fleet audit retains this machine for real-device / Observation verification; no group-level lineage proof supersedes that stop.";
    blockerReason = "Real-device Observation verification is required before a canonical mapping may be asserted.";
  } else {
    classification = "SEMANTIC_REVIEW_REQUIRED";
    proofType = diagnostics.all.length ? "LABEL_ONLY_CANDIDATE_REJECTED" : "NO_EXPLICIT_OBSERVATION_LINEAGE";
    proofSource = diagnostics.all.length ? "diagnostic label/category comparison (not proof)" : "repository-wide Research / Selection / Observation scan";
    proofExplanation = diagnostics.all.length
      ? "One or more Observations resemble the group by label/category, but the contract forbids treating that resemblance as lineage proof."
      : "Research and Selection lineage exist, but no Observation contains an explicit, unique, non-diagnostic relationship to this group.";
    blockerReason = "Repository evidence does not uniquely prove which current Observation represents this Evidence group.";
  }

  const currentIds = classification === "NOT_APPLICABLE_OR_LEGACY_EQUIVALENT"
    ? [expectedFormalObservationId]
    : exactLineage.length === 1 ? [exactLineage[0].observationId]
      : structured.length === 1 ? [structured[0].observationId] : [];
  return {
    machineId,
    groupId: group.groupId,
    sourceEvidenceIds: lineageIds,
    currentObservationId: currentIds[0] ?? null,
    expectedFormalObservationId,
    classification,
    proofType,
    proofSource,
    proofExplanation,
    proofResult: proofEstablished ? "ESTABLISHED" : "NOT_ESTABLISHED",
    migrationAllowed,
    blockerReason,
    diagnosticCandidateObservationIds: diagnostics.all,
    labelOnlyMatchRejected: !proofEstablished && diagnostics.all.length > 0
  };
}

export function auditFleet(root) {
  const machineIds = fs.readdirSync(path.join(root, "research"), { withFileTypes: true })
    .filter(entry => entry.isDirectory() && !entry.name.startsWith("_") && fs.existsSync(path.join(root, "research", entry.name, "selection-data.json")))
    .map(entry => entry.name).sort();
  const groups = [];
  for (const machineId of machineIds) {
    const dir = path.join(root, "research", machineId);
    const selection = read(path.join(dir, "selection-data.json"));
    const researchPath = path.join(dir, "research-data.json");
    const observationPath = path.join(dir, "machine-observation-data.json");
    if (!fs.existsSync(researchPath) || !fs.existsSync(observationPath)) continue;
    const research = read(researchPath);
    const observation = read(observationPath);
    for (const group of selection.evidenceUi?.groups ?? []) groups.push(auditGroup(machineId, group, research, observation));
  }
  groups.sort((a, b) => a.machineId.localeCompare(b.machineId) || a.groupId.localeCompare(b.groupId));
  const counts = Object.fromEntries(CLASSIFICATIONS.map(name => [name, groups.filter(item => item.classification === name).length]));
  const blocked = groups.filter(item => item.proofResult !== "ESTABLISHED" || item.blockerReason);
  return {
    schemaVersion: "m7-phase2.2-observation-contract-completion-audit-v1",
    auditDate: AUDIT_DATE,
    baseHead: BASE_HEAD,
    policy: {
      formalObservationId: "OBS_EVI_<clean(groupId)>",
      proofDecision: "binary contract proof; no confidence score",
      labelAndCategoryUse: "diagnostic candidate extraction only; never migration proof",
      migrationScope: "audit only; no Observation, canonical UI, MachineData, or runtime mutation"
    },
    summary: {
      totalEvidenceGroupsReviewed: groups.length,
      alreadyFormal: groups.filter(item => item.proofType === "FORMAL_OBSERVATION_ID").length,
      ...counts,
      blockedGroups: blocked.length,
      blockedMachines: new Set(blocked.map(item => item.machineId)).size,
      labelOnlyMatchesRejected: groups.filter(item => item.labelOnlyMatchRejected).length,
      migrationCandidates: groups.filter(item => item.migrationAllowed).length
    },
    groups
  };
}

export function markdownReport(report) {
  const s = report.summary;
  const lines = [
    `# M7 Phase 2.2 Observation contract completion audit — ${report.auditDate}`, "",
    `Base HEAD: \`${report.baseHead}\`. This is an audit-only deliverable; no production Observation or runtime artifact is changed.`, "",
    "## Summary", "", "| Metric | Count |", "|---|---:|",
    `| Total Evidence groups reviewed | ${s.totalEvidenceGroupsReviewed} |`,
    `| Already formal | ${s.alreadyFormal} |`,
    ...CLASSIFICATIONS.map(name => `| ${name} | ${s[name]} |`),
    `| Blocked groups | ${s.blockedGroups} |`, `| Blocked machines | ${s.blockedMachines} |`,
    `| Label-only matches rejected | ${s.labelOnlyMatchesRejected} |`, `| Migration candidates | ${s.migrationCandidates} |`, "",
    "Proof is binary (`ESTABLISHED` / `NOT_ESTABLISHED`); no confidence score is used. Label/category similarity is retained only as diagnostics and cannot permit migration.", "",
    "## Stop conditions", "",
    "- `LB_FUJIKO_M2` remains independently blocked by Selection Quality.",
    "- `L_TENSEI_SHITARA_KEN_DESHITA_GT` remains blocked until the Feature/Evidence shared-input relationship and byte-equivalent projection are formally proven; this audit emits no runtime field.",
    "- Existing real-device / Observation regression targets remain `FIELD_VERIFICATION_REQUIRED` unless stronger group-level repository proof exists.", "",
    "## Exact machine/group results", "",
    "| Machine | Group | Source Evidence IDs | Current Observation | Expected formal Observation | Classification | Proof | Migration | Blocker reason | Diagnostic candidates |",
    "|---|---|---|---|---|---|---|---|---|---|"
  ];
  for (const item of report.groups) lines.push(`| \`${item.machineId}\` | \`${item.groupId}\` | ${item.sourceEvidenceIds.map(id => `\`${id}\``).join(", ") || "-"} | ${item.currentObservationId ? `\`${item.currentObservationId}\`` : "-"} | \`${item.expectedFormalObservationId}\` | ${item.classification} | ${item.proofResult}: ${item.proofType}; ${item.proofExplanation.replaceAll("|", "\\|")} | ${item.migrationAllowed ? "allowed" : "not allowed"} | ${(item.blockerReason ?? "-").replaceAll("|", "\\|")} | ${item.diagnosticCandidateObservationIds.map(id => `\`${id}\``).join(", ") || "-"} |`);
  return `${lines.join("\n")}\n`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const root = process.cwd();
  const report = auditFleet(root);
  if (process.argv.includes("--write")) {
    fs.writeFileSync(path.join(root, "reports", `m7-phase2-2-observation-contract-completion-audit-${AUDIT_DATE.replaceAll("-", "")}.json`), `${JSON.stringify(report, null, 2)}\n`);
    fs.writeFileSync(path.join(root, "reports", `m7-phase2-2-observation-contract-completion-audit-${AUDIT_DATE.replaceAll("-", "")}.md`), markdownReport(report));
  }
  console.log(JSON.stringify(report.summary, null, 2));
}
