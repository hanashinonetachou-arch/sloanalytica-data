import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { auditFleet, auditMachine, classifyMigrationReadiness, markdownReport } from "../tools/audit-m7-full-fleet-migration.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const reportPath = path.join(root, "reports/m7-full-fleet-migration-audit-20260916.json");
const checkedIn = JSON.parse(fs.readFileSync(reportPath, "utf8"));
const ready = overrides => ({ selectionQuality: "PASS", researchLineage: "PASS", normalization: "PASS", observation: "PASS", canonicalUi: "PASS", featureSharing: "PASS", inputCompatibility: "PASS", applicability: "MIGRATION_REQUIRED", legacyBaseline: "PASS", ...overrides });

test("focused proof classification is fail-closed", () => {
  assert.equal(classifyMigrationReadiness(ready({})), "AUTO_MIGRATABLE");
  assert.equal(classifyMigrationReadiness(ready({ selectionQuality: "BLOCKED" })), "SELECTION_QUALITY_BLOCKED");
  assert.equal(classifyMigrationReadiness(ready({ selectionQuality: "REVIEW" })), "SELECTION_QUALITY_BLOCKED");
  assert.equal(classifyMigrationReadiness(ready({ researchLineage: "FAIL" })), "SELECTION_QUALITY_BLOCKED");
  assert.equal(classifyMigrationReadiness(ready({ observation: "FAIL" })), "OBSERVATION_BLOCKED");
  assert.equal(classifyMigrationReadiness(ready({ canonicalUi: "FAIL" })), "CANONICAL_UI_BLOCKED");
  assert.equal(classifyMigrationReadiness(ready({ normalization: "FAIL" })), "NORMALIZATION_BLOCKED");
  assert.equal(classifyMigrationReadiness(ready({ featureSharing: "UNRESOLVED" })), "FEATURE_SHARING_REVIEW");
  assert.equal(classifyMigrationReadiness(ready({ inputCompatibility: "FAIL" })), "INPUT_COMPATIBILITY_BLOCKED");
  assert.equal(classifyMigrationReadiness(ready({ applicability: "NOT_APPLICABLE_NO_EVIDENCE" })), "OTHER_BLOCKED");
  assert.equal(classifyMigrationReadiness(ready({ legacyBaseline: "FAIL" })), "OTHER_BLOCKED");
});

test("authoritative Selection Quality gate reproduces the Fujiko blocker", () => {
  const machine = auditMachine(root, "LB_FUJIKO_M2");
  assert.equal(machine.selectionQualityProof.rule, "SELECTION_QUALITY_GATE");
  assert.equal(machine.selectionQualityProof.status, "FAIL");
  assert.match(machine.selectionQualityProof.detail, /unclassified research evidence: RE_VOICE_FUJIKO/);
  assert.equal(machine.classification, "SELECTION_QUALITY_BLOCKED");
});

test("formal NO_EVIDENCE disposition is non-migration and never AUTO_MIGRATABLE", () => {
  const machine = auditMachine(root, "LB_JACKPOT_CY1");
  assert.equal(machine.evidenceDispositionProof.rule, "EVIDENCE_UI_GATE0_DISPOSITION");
  assert.equal(machine.evidenceDispositionProof.detail, "NO_EVIDENCE");
  assert.equal(machine.migrationDisposition, "NOT_APPLICABLE_NO_EVIDENCE");
  assert.equal(machine.classification, "OTHER_BLOCKED");
});

test("known blocker regression targets remain blocked without classification exceptions", () => {
  const ids = ["L_TENSEI_SHITARA_KEN_DESHITA_GT", "L_REZERO_SEASON2_PA5", "L_LUPIN_DAIKOUKAISHA_H1", "L_MOMOTARO_DENTETSU_TEIBAN_PU", "L_SMASLO_DUNBINE_MF", "S_OVERLORD_II_SX", "S_SENGOKU_COLLECTION5_PS", "S_SLODOL_PK"];
  for (const id of ids) assert.notEqual(auditMachine(root, id).classification, "AUTO_MIGRATABLE", id);
});

test("repository proofs retain Observation, canonical UI, normalization, and sharing failures", () => {
  assert.equal(auditMachine(root, "L_REZERO_SEASON2_PA5").observationProof.status, "FAIL");
  assert.equal(auditMachine(root, "L_AKAME_GA_KILL_2").canonicalUiProof.status, "FAIL");
  assert.equal(auditMachine(root, "LB_KELLOT_5_ND05H").normalizationProof.status, "FAIL");
  const sharing = auditMachine(root, "L_TENSEI_SHITARA_KEN_DESHITA_GT").featureSharingProof;
  assert.equal(sharing.status, "REVIEW");
  assert.equal(sharing.rule, "EVIDENCE_UI_GATE0_SHARED_FEATURE_EVIDENCE");
});

test("formal non-sharing proof promotes the canonical-UI batch without weakening legacy reviews", () => {
  const promoted = ["L_AKAME_GA_KILL_2", "L_BOUNTY_ANGEL", "L_GIRLS_UND_PANZER_FINALE_H1", "L_GOD_EATER_RESURRECTION", "L_KAMEN_RIDER_7RIDERS_UJA", "L_ULTRAMAN_TIGA_KA", "S_FIRE_DRIFT", "S_KABANERI_ZR"];
  for (const id of promoted) {
    const machine = auditMachine(root, id);
    assert.equal(machine.featureSharingProof.status, "PASS", id);
    assert.equal(machine.featureSharingProof.rule, "FORMAL_FEATURE_EVIDENCE_NON_SHARING", id);
    assert.equal(machine.classification, "CANONICAL_UI_BLOCKED", id);
  }
  const unresolved = auditMachine(root, "LB_KELLOT_5_ND05H").featureSharingProof;
  assert.equal(unresolved.status, "REVIEW");
  assert.equal(unresolved.rule, "EVIDENCE_UI_GATE0_SHARED_FEATURE_EVIDENCE");
});

test("label equality is diagnostic only and cannot prove Observation linkage", () => {
  for (const id of ["L_LUPIN_DAIKOUKAISHA_H1", "L_MOMOTARO_DENTETSU_TEIBAN_PU", "S_OVERLORD_II_SX"]) {
    const proof = auditMachine(root, id).observationProof;
    assert.equal(proof.status, "FAIL", id);
    assert.equal(proof.rule, "FORMAL_GROUP_OBSERVATION_ID", id);
    assert.match(proof.detail, /diagnosticLabelCandidates/, id);
  }
});

test("legacy build success is baseline-only, never final post-migration equivalence", () => {
  const machine = auditMachine(root, "L_AKAME_GA_KILL_2");
  assert.equal(machine.machineDataEquivalenceProof.rule, "DETERMINISTIC_LEGACY_BASELINE");
  assert.equal(machine.machineDataEquivalenceProof.status, "BASELINE_ONLY");
  assert.equal(machine.postMigrationEquivalenceProof.status, "NOT_RUN");
});

test("input compatibility is explicitly pre-migration and not final MIG-INV-005/006/010 proof", () => {
  const machine = auditMachine(root, "L_AKAME_GA_KILL_2");
  assert.equal(machine.inputCompatibilityProof.rule, "PRE_MIGRATION_LEGACY_INPUT_SURFACE");
  assert.match(machine.inputCompatibilityProof.detail, /Candidate-gate only/);
  assert.match(machine.inputCompatibilityProof.detail, /post-migration comparison/);
  assert.equal(machine.postMigrationInputCompatibilityProof.status, "NOT_RUN");
});

test("full-fleet M7 audit is deterministic and matches checked-in JSON and Markdown", () => {
  const actual = auditFleet(root, checkedIn);
  assert.deepEqual(actual, checkedIn);
  assert.equal(markdownReport(actual), fs.readFileSync(path.join(root, "reports/m7-full-fleet-migration-audit-20260916.md"), "utf8"));
  assert.equal(actual.summary.totalMachines, 270);
  assert.equal(actual.summary.alreadyM7, 9);
  assert.equal(actual.summary.legacyMachines, 261);
  assert.equal(actual.summary.AUTO_MIGRATABLE, 0);
});

test("no legacy machine enters Batch 1 while any mandatory proof fails", () => {
  const report = auditFleet(root, checkedIn);
  assert.equal(report.machines.filter(machine => machine.classification === "AUTO_MIGRATABLE").length, 0);
  for (const machine of report.machines.filter(machine => machine.classification !== "ALREADY_M7")) {
    assert.ok(machine.classification.endsWith("BLOCKED") || machine.classification.endsWith("REVIEW"));
    assert.ok(machine.blockReasons.length > 0);
    assert.equal(machine.postMigrationEquivalenceProof.status, "NOT_RUN");
  }
  for (const machine of report.machines.filter(machine => machine.researchLineageProof?.status === "FAIL")) {
    assert.notEqual(machine.classification, "AUTO_MIGRATABLE", machine.machineId);
  }
});
