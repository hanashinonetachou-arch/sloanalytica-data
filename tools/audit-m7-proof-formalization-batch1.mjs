#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

export const AUDIT_DATE = "2026-09-16";
export const BASE_HEAD = "591d7bf3ba3fcf923df8ac2e0060b6b20ae9ec71";
const ACQUISITION = "reports/m7-phase2-2-proof-acquisition-batch1-20260916.json";
const ESTABLISHED = new Set([]);
const BLOCKERS = {
  "L_ARIFURETA_JA/SETTING_EVIDENCE": "SOURCE_EVIDENCE_SET_NOT_EXPLICIT: the note names only some outcome families and does not enumerate all eleven Research Evidence IDs; category and wording correspondence cannot close the lineage set.",
  "L_ASLOT_KONOSUBA_FX/KONOSUBA_BIG_END": "OBSERVATION_UNIVERSE_BROADER_THAN_SELECTION: the Observation explicitly includes ten non-confirmation classifications in addition to the five selected Research Evidence outcomes.",
  "L_BOFURI_FN/SETTING_EVIDENCE": "NO_EXACT_NON_DIAGNOSTIC_LINEAGE: the Observation has only a generic category and does not identify the Selection group or Research Evidence IDs.",
  "L_SHAMANKING_SS/SETTING_EVIDENCE": "SOURCE_EVIDENCE_SET_NOT_EXPLICIT: the note refers generically to adopted Selection conditions but does not identify the group or enumerate its eighteen Research Evidence IDs.",
  "L_SISTER_QUEST_CA/SMARTALK": "ANSWER_VARIANT_UNIVERSE_NOT_EXACT: the Observation covers answer color and content for three prompts, while Selection contains only the three red-answer Research Evidence outcomes.",
  "L_SUPER_BLACKJACK_SLDC/SETTING_EVIDENCE": "SOURCE_EVIDENCE_SET_NOT_EXPLICIT: the note refers generically to adopted Selection conditions but does not identify the group or enumerate its seventeen Research Evidence IDs.",
  "S_AOHARU_MISAO_A2/SETTING_EVIDENCE": "NO_EXACT_NON_DIAGNOSTIC_LINEAGE: the Observation has only a generic category and does not identify the Selection group or Research Evidence IDs.",
  "S_DANMACHI_GAIDEN_XR/SETTING_EVIDENCE": "SOURCE_EVIDENCE_SET_NOT_EXPLICIT: the note refers generically to adopted Selection conditions but does not identify the group or enumerate its twelve Research Evidence IDs.",
  "S_HAIYORE_NYARUKO_SAN_Y/SETTING_EVIDENCE": "SOURCE_EVIDENCE_SET_NOT_EXPLICIT: the note refers generically to Selection Evidence but does not identify the group or enumerate its thirteen Research Evidence IDs.",
  "S_MAHOIKU_NB/SETTING_EVIDENCE": "SOURCE_EVIDENCE_SET_NOT_EXPLICIT: the note refers generically to adopted Selection conditions but does not identify the group or enumerate its six Research Evidence IDs.",
  "S_TEKKEN4_ULTIMATE_DEVIL_TCD/SETTING_EVIDENCE": "SOURCE_EVIDENCE_SET_NOT_EXPLICIT: the note refers generically to Selection Evidence but does not identify the group or enumerate its twelve Research Evidence IDs.",
  "S_TOARU_RAILGUN_FB/SETTING_EVIDENCE": "OBSERVATION_MODE_AND_LINEAGE_INCOMPLETE: the VISUAL_EVENT Observation does not enumerate the two audio Research Evidence IDs and its existing note only governs missed audio, so exact coverage is not proven.",
  "S_YOUJO_SENKI_ZR/SETTING_EVIDENCE": "SOURCE_EVIDENCE_SET_NOT_EXPLICIT: the note refers generically to Selection Evidence but does not identify the group or enumerate its fifteen Research Evidence IDs."
};
const read = (root, file) => JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
const uniq = values => [...new Set(values)].sort();
const idsFor = group => uniq((group.options ?? []).flatMap(option => option.sourceEvidenceIds ?? []));

export function auditBatch(root) {
  const input = read(root, ACQUISITION);
  const candidates = input.batch1Candidates.map(candidate => {
    const key = `${candidate.machineId}/${candidate.groupId}`;
    const dir = `research/${candidate.machineId}`;
    const research = read(root, `${dir}/research-data.json`);
    const selection = read(root, `${dir}/selection-data.json`);
    const observation = read(root, `${dir}/machine-observation-data.json`);
    const group = selection.evidenceUi?.groups?.find(item => item.groupId === candidate.groupId);
    if (!group) throw new Error(`${key}: Selection group is missing`);
    const selectionIds = idsFor(group);
    if (JSON.stringify(selectionIds) !== JSON.stringify(candidate.sourceEvidenceIds)) throw new Error(`${key}: acquisition and Selection lineage differ`);
    const researchIds = new Set((research.evidenceCandidates ?? []).map(item => item.researchEvidenceId));
    const missing = selectionIds.filter(id => !researchIds.has(id));
    if (missing.length) throw new Error(`${key}: Research IDs missing: ${missing.join(", ")}`);
    const established = ESTABLISHED.has(key);
    const finalId = established ? candidate.expectedFormalObservationId : candidate.currentObservationId;
    const item = observation.observations?.find(value => value.observationId === finalId);
    if (!item) throw new Error(`${key}: Observation ${finalId} is missing`);
    const lineageText = JSON.stringify({ sourceRefs: item.sourceRefs ?? [], notes: item.notes ?? null });
    if (established && (!lineageText.includes(candidate.groupId) || selectionIds.some(id => !lineageText.includes(id)))) throw new Error(`${key}: formal lineage is incomplete`);
    const featureRefs = (observation.featureMappings ?? []).filter(mapping => (mapping.observationIds ?? []).includes(candidate.currentObservationId)).map(mapping => mapping.featureId).sort();
    if (established && featureRefs.length) throw new Error(`${key}: legacy ID has downstream feature references`);
    const observationFile = `${dir}/machine-observation-data.json`;
    const lineageBefore = { observationId: candidate.currentObservationId, groupId: null, sourceEvidenceIds: [], explicitExactLineage: false };
    const lineageAfter = established
      ? { observationId: finalId, groupId: candidate.groupId, sourceEvidenceIds: selectionIds, explicitExactLineage: true }
      : lineageBefore;
    return {
      machineId: candidate.machineId,
      groupId: candidate.groupId,
      sourceEvidenceIds: selectionIds,
      currentObservationId: candidate.currentObservationId,
      formalObservationId: established ? finalId : null,
      proofResult: established ? "FORMAL_PROOF_ESTABLISHED" : "FORMAL_PROOF_NOT_ESTABLISHED",
      proofBasis: established
        ? "The pre-existing non-diagnostic Observation note explicitly restricted collection to the adopted Selection Evidence universe; Research contains every Selection sourceEvidenceId, and the formalized note now enumerates that exact closed set."
        : "The repository does not prove an exact closed Evidence-to-Observation universe without relying on labels, categories, or broadened Observation semantics.",
      lineageBefore,
      lineageAfter,
      idRenameRequired: established,
      idRenamePerformed: established,
      downstreamReferenceAudit: {
        legacyFeatureMappingReferences: featureRefs,
        selectionObservationIdReferences: [],
        canonicalUiObservationIdReferences: [],
        runtimeObservationIdReferences: [],
        result: established ? "SAFE_NO_DOWNSTREAM_CONTRACT_REFERENCES" : "NOT_APPLICABLE_RENAME_NOT_AUTHORIZED"
      },
      modifiedFiles: established ? [observationFile] : [],
      blocker: established ? null : BLOCKERS[key],
      notes: established
        ? "Lineage and ID decisions are both established; no Evidence option or Observation collection semantic was changed."
        : "Stopped without modifying the candidate Observation. Human semantic confirmation or a separately sourced explicit lineage annotation is required."
    };
  });
  const establishedCount = candidates.filter(item => item.proofResult === "FORMAL_PROOF_ESTABLISHED").length;
  const blockedCount = candidates.length - establishedCount;
  if (Object.keys(BLOCKERS).length !== blockedCount) throw new Error("Decision manifest does not cover every blocked candidate");
  return {
    schemaVersion: "m7-phase2.2-proof-formalization-batch1-v1",
    auditDate: AUDIT_DATE,
    baseHead: BASE_HEAD,
    authoritativeInput: ACQUISITION,
    policy: {
      proofDecision: "binary; FORMAL_PROOF_ESTABLISHED or FORMAL_PROOF_NOT_ESTABLISHED",
      forbiddenProof: "labels, display names, categories, appearance, UI proximity, similar wording, and matching option count",
      runtimeContract: "Observation source metadata only; no MachineData/runtime emission"
    },
    summary: {
      candidateCount: candidates.length,
      formalProofEstablishedCount: establishedCount,
      formalProofNotEstablishedCount: blockedCount,
      lineageFormalizedCount: establishedCount,
      observationIdRenameCount: establishedCount,
      blockedCount,
      runtimeShapeChangeCount: 0,
      canonicalUiSemanticChangeCount: 0,
      validatorChangeCount: 0,
      unsafeMigrationCount: 0
    },
    candidates
  };
}

export function markdownReport(report) {
  const s = report.summary;
  const lines = [
    `# M7 Evidence Contract Phase 2.2 — Proof Formalization Batch 1 (${report.auditDate})`, "",
    `Base HEAD: \`${report.baseHead}\`. Proof is binary; label/category resemblance was not used as proof.`, "",
    "## Summary", "", "| Metric | Count |", "|---|---:|",
    ...Object.entries(s).map(([key, value]) => `| ${key} | ${value} |`), "",
    "## Candidate decisions", "",
    "| Machine | Group | Research Evidence IDs | Before → after | Proof | Rename | Blocker / basis |",
    "|---|---|---|---|---|---|---|"
  ];
  for (const item of report.candidates) {
    const lineage = item.sourceEvidenceIds.map(id => `\`${id}\``).join(", ");
    const after = item.formalObservationId ?? item.currentObservationId;
    const detail = (item.blocker ?? item.proofBasis).replaceAll("|", "\\|");
    lines.push(`| \`${item.machineId}\` | \`${item.groupId}\` | ${lineage} | \`${item.currentObservationId}\` → \`${after}\` | ${item.proofResult} | ${item.idRenamePerformed ? "performed" : "not performed"} | ${detail} |`);
  }
  lines.push("", "## Invariants", "",
    "No runtime shape, canonical UI semantics, validator, Selection, inference, materialized MachineData, App renderer, distribution, or real-device claim was changed. Blocked candidates remain unchanged; no unsafe migration was performed.", "",
    "Because no exact lineage was established, no Observation note or identifier was changed. No new schema or runtime field was introduced.", "");
  return lines.join("\n");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const root = process.cwd();
  const report = auditBatch(root);
  if (process.argv.includes("--write")) {
    const stem = path.join(root, "reports/m7-phase2-2-proof-formalization-batch1-20260916");
    fs.writeFileSync(`${stem}.json`, `${JSON.stringify(report, null, 2)}\n`);
    fs.writeFileSync(`${stem}.md`, markdownReport(report));
  }
  console.log(JSON.stringify(report.summary, null, 2));
}
