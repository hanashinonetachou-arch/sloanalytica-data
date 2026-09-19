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

test("authoritative Selection Quality gate recognizes the Fujiko evidence classification", () => {
  const machine = auditMachine(root, "LB_FUJIKO_M2");
  assert.equal(machine.selectionQualityProof.rule, "SELECTION_QUALITY_GATE");
  assert.notEqual(machine.selectionQualityProof.status, "FAIL");
  assert.doesNotMatch(machine.selectionQualityProof.detail, /unclassified research evidence: RE_VOICE_FUJIKO/);
});

test("formal NO_EVIDENCE disposition is non-migration and never AUTO_MIGRATABLE", () => {
  const machine = auditMachine(root, "LB_JACKPOT_CY1");
  assert.equal(machine.evidenceDispositionProof.rule, "EVIDENCE_UI_GATE0_DISPOSITION");
  assert.equal(machine.evidenceDispositionProof.detail, "NO_EVIDENCE");
  assert.equal(machine.migrationDisposition, "NOT_APPLICABLE_NO_EVIDENCE");
  assert.equal(machine.classification, "NOT_APPLICABLE_OR_EQUIVALENT");
  assert.equal(machine.blockReasons.length, 0);
});

test("known blocker regression targets remain blocked without classification exceptions", () => {
  const ids = ["L_TENSEI_SHITARA_KEN_DESHITA_GT", "L_REZERO_SEASON2_PA5", "L_LUPIN_DAIKOUKAISHA_H1", "L_MOMOTARO_DENTETSU_TEIBAN_PU", "L_SMASLO_DUNBINE_MF", "S_OVERLORD_II_SX", "S_SENGOKU_COLLECTION5_PS", "S_SLODOL_PK"];
  for (const id of ids) assert.notEqual(auditMachine(root, id).classification, "AUTO_MIGRATABLE", id);
});

test("repository proofs retain Observation, canonical UI, normalization, and sharing failures", () => {
  assert.equal(auditMachine(root, "L_REZERO_SEASON2_PA5").observationProof.status, "FAIL");
  assert.equal(auditMachine(root, "L_AKAME_GA_KILL_2").canonicalUiProof.status, "PASS");
  assert.equal(auditMachine(root, "LB_KELLOT_5_ND05H").normalizationProof.status, "FAIL");
  const sharing = auditMachine(root, "L_TENSEI_SHITARA_KEN_DESHITA_GT").featureSharingProof;
  assert.equal(sharing.status, "REVIEW");
  assert.equal(sharing.rule, "EVIDENCE_UI_GATE0_SHARED_FEATURE_EVIDENCE");
});

test("canonical-UI batch is recognized as migrated M7 without weakening legacy reviews", () => {
  const migrated = ["L_AKAME_GA_KILL_2", "L_BOUNTY_ANGEL", "L_GIRLS_UND_PANZER_FINALE_H1", "L_GOD_EATER_RESURRECTION", "L_KAMEN_RIDER_7RIDERS_UJA", "L_ULTRAMAN_TIGA_KA", "S_FIRE_DRIFT", "S_KABANERI_ZR"];
  for (const id of migrated) {
    const machine = auditMachine(root, id);
    assert.equal(machine.featureSharingProof.status, "PASS", id);
    assert.equal(machine.featureSharingProof.rule, "EXISTING_M7_CONTRACT", id);
    assert.equal(machine.canonicalUiProof.status, "PASS", id);
    assert.equal(machine.classification, "ALREADY_M7", id);
    assert.equal(machine.migrationDisposition, "ALREADY_M7_EQUIVALENT", id);
    assert.equal(machine.blockReasons.length, 0, id);
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

test("migrated batch records pre/post equivalence instead of a legacy-only baseline", () => {
  const machine = auditMachine(root, "L_AKAME_GA_KILL_2");
  assert.equal(machine.machineDataEquivalenceProof.rule, "PILOT_PRE_POST_EQUIVALENCE");
  assert.equal(machine.machineDataEquivalenceProof.status, "PASS");
  assert.equal(machine.postMigrationEquivalenceProof.status, "PASS");
});

test("migrated batch input compatibility is recognized from the existing M7 contract", () => {
  const machine = auditMachine(root, "L_AKAME_GA_KILL_2");
  assert.equal(machine.inputCompatibilityProof.rule, "EXISTING_M7_CONTRACT");
  assert.equal(machine.inputCompatibilityProof.status, "PASS");
  assert.equal(machine.postMigrationInputCompatibilityProof.status, "PASS");
});

test("full-fleet M7 audit is deterministic and matches checked-in JSON and Markdown", () => {
  const actual = auditFleet(root, checkedIn);
  assert.deepEqual(actual, checkedIn);
  assert.equal(markdownReport(actual), fs.readFileSync(path.join(root, "reports/m7-full-fleet-migration-audit-20260916.md"), "utf8"));
  assert.equal(actual.summary.totalMachines, 269);
  assert.equal(actual.summary.alreadyM7, 27);
  assert.equal(actual.summary.legacyMachines, 242);
  assert.equal(actual.summary.AUTO_MIGRATABLE, 0);
});

test("only fully proven legacy machines enter Batch 1", () => {
  const report = auditFleet(root, checkedIn);
  const candidates = report.machines.filter(machine => machine.classification === "AUTO_MIGRATABLE");
  assert.equal(candidates.length, 0);
  for (const machine of candidates) {
    assert.equal(machine.selectionQualityProof.status, "PASS", machine.machineId);
    assert.equal(machine.researchLineageProof.status, "PASS", machine.machineId);
    assert.equal(machine.normalizationProof.status, "PASS", machine.machineId);
    assert.equal(machine.observationProof.status, "PASS", machine.machineId);
    assert.equal(machine.canonicalUiProof.status, "PASS", machine.machineId);
    assert.equal(machine.featureSharingProof.status, "PASS", machine.machineId);
    assert.equal(machine.inputCompatibilityProof.status, "PASS", machine.machineId);
    assert.equal(machine.migrationDisposition, "MIGRATION_REQUIRED", machine.machineId);
    assert.equal(machine.machineDataEquivalenceProof.status, "BASELINE_ONLY", machine.machineId);
    assert.equal(machine.postMigrationEquivalenceProof.status, "NOT_RUN", machine.machineId);
    assert.equal(machine.postMigrationInputCompatibilityProof.status, "NOT_RUN", machine.machineId);
    assert.equal(machine.blockReasons.length, 0, machine.machineId);
  }
  for (const machine of report.machines.filter(machine => !["ALREADY_M7", "AUTO_MIGRATABLE", "NOT_APPLICABLE_OR_EQUIVALENT"].includes(machine.classification))) {
    assert.ok(machine.classification.endsWith("BLOCKED") || machine.classification.endsWith("REVIEW"));
    assert.ok(machine.blockReasons.length > 0);
  }
  for (const machine of report.machines.filter(machine => machine.researchLineageProof?.status === "FAIL")) {
    assert.notEqual(machine.classification, "AUTO_MIGRATABLE", machine.machineId);
  }
});
