import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { auditLineageResolution, markdownReport, BASE_HEAD, RESOLUTION_CLASSES, ELIGIBILITIES } from "../tools/audit-m7-lineage-resolution-plan.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const stem = path.join(root, "reports/m7-phase2-2-lineage-resolution-plan-20260916");
const report = JSON.parse(fs.readFileSync(`${stem}.json`, "utf8"));
const completion = JSON.parse(fs.readFileSync(path.join(root, "reports/m7-phase2-2-observation-contract-completion-audit-20260916.json"), "utf8"));
const formalization = JSON.parse(fs.readFileSync(path.join(root, "reports/m7-phase2-2-proof-formalization-batch1-20260916.json"), "utf8"));
const keyOf = item => `${item.machineId}/${item.groupId}`;

test("full-debt resolution output is deterministic", () => {
  const actual = auditLineageResolution(root);
  assert.deepEqual(actual, report);
  assert.equal(markdownReport(actual), fs.readFileSync(`${stem}.md`, "utf8"));
  assert.equal(report.baseHead, BASE_HEAD);
});

test("every unresolved Phase 2.2 group appears exactly once and formal groups are excluded", () => {
  const expected = completion.groups.filter(item => item.proofResult === "NOT_ESTABLISHED").map(keyOf).sort();
  const actual = report.unresolvedGroups.map(keyOf).sort();
  assert.equal(expected.length, 288);
  assert.deepEqual(actual, expected);
  assert.equal(new Set(actual).size, actual.length);
  const formal = new Set(completion.groups.filter(item => item.proofResult === "ESTABLISHED").map(keyOf));
  assert.equal(actual.some(key => formal.has(key)), false);
});

test("resolution and eligibility totals equal the unresolved total", () => {
  assert.deepEqual(Object.keys(report.summary.resolutionClassCounts), RESOLUTION_CLASSES);
  assert.deepEqual(Object.keys(report.eligibilitySummary), ELIGIBILITIES);
  assert.equal(Object.values(report.summary.resolutionClassCounts).reduce((a, b) => a + b, 0), report.summary.unresolvedGroupCount);
  assert.equal(Object.values(report.eligibilitySummary).reduce((a, b) => a + b, 0), report.summary.unresolvedGroupCount);
  for (const item of report.unresolvedGroups) {
    assert.ok(RESOLUTION_CLASSES.includes(item.resolutionClass));
    assert.ok(ELIGIBILITIES.includes(item.bulkAnnotationEligibility));
    assert.ok(item.resolutionBasis && item.requiredNextAction);
  }
});

test("safe eligibility requires exact machine-readable non-diagnostic proof", () => {
  const safe = report.unresolvedGroups.filter(item => item.bulkAnnotationEligibility === "SAFE_WITH_EXISTING_REPOSITORY_PROOF");
  assert.equal(safe.length, report.summary.automaticSafeCount);
  assert.equal(safe.length, 0);
  for (const item of safe) {
    assert.equal(item.machineReadableProofPresent, true);
    assert.equal(item.labelOnlyEvidenceRejected, false);
    assert.equal(item.knownBlocker, null);
  }
  for (const item of report.unresolvedGroups.filter(item => item.labelOnlyEvidenceRejected)) assert.notEqual(item.bulkAnnotationEligibility, "SAFE_WITH_EXISTING_REPOSITORY_PROOF");
});

test("known stops cannot enter safe eligibility", () => {
  const stopMachines = new Set(Object.values(report.knownStopConditions).flat());
  const stopped = report.unresolvedGroups.filter(item => stopMachines.has(item.machineId));
  assert.ok(stopped.length > 0);
  for (const item of stopped) assert.notEqual(item.bulkAnnotationEligibility, "SAFE_WITH_EXISTING_REPOSITORY_PROOF", keyOf(item));
});

test("all 13 Batch-1 candidates remain consistent with formalization", () => {
  assert.equal(report.previousBatch1Reconciliation.length, 13);
  assert.deepEqual(report.previousBatch1Reconciliation.map(keyOf).sort(), formalization.candidates.map(keyOf).sort());
  for (const item of report.previousBatch1Reconciliation) {
    assert.equal(item.priorProofResult, "FORMAL_PROOF_NOT_ESTABLISHED");
    assert.equal(item.newProofDiscovered, false);
    assert.equal(item.reconciliation, "CONSISTENT_FORMAL_PROOF_NOT_ESTABLISHED");
    assert.notEqual(item.bulkAnnotationEligibility, "SAFE_WITH_EXISTING_REPOSITORY_PROOF");
  }
});

test("the plan preserves exact artifact lineage while never re-deciding Selection", () => {
  for (const item of report.unresolvedGroups) {
    assert.ok(item.sourceEvidenceIds.length > 0);
    assert.equal(item.inspectedArtifacts.length, 3);
    assert.equal(item.machineReadableProofPresent, false);
    assert.equal(Object.hasOwn(item, "confidence"), false);
  }
});

test("only the four audit deliverables differ from the required base", () => {
  const tracked = execFileSync("git", ["diff", "--name-only", BASE_HEAD, "--"], { cwd: root, encoding: "utf8" }).trim().split("\n").filter(Boolean);
  const working = execFileSync("git", ["status", "--porcelain=v1", "--untracked-files=all"], { cwd: root, encoding: "utf8" }).trim().split("\n").filter(Boolean).map(line => line.slice(3));
  const changed = [...new Set([...tracked, ...working])].sort();
  assert.deepEqual(changed, [
    "reports/m7-phase2-2-lineage-resolution-plan-20260916.json",
    "reports/m7-phase2-2-lineage-resolution-plan-20260916.md",
    "test/m7-lineage-resolution-plan.test.mjs",
    "tools/audit-m7-lineage-resolution-plan.mjs"
  ]);
});

test("no runtime field, semantic mutation, unsafe migration, or device claim is introduced", () => {
  for (const key of ["runtimeShapeChangeCount", "canonicalUiSemanticChangeCount", "validatorChangeCount", "inferenceSemanticChangeCount", "unsafeMigrationCount", "observationRenameCount", "lineageFormalizedCount", "realDeviceVerificationClaimCount"]) assert.equal(report.safety[key], 0);
  assert.equal(report.policy.realDeviceVerificationPerformed, false);
  assert.equal(JSON.stringify(report).includes("sharedFeatureIds"), false);
});

test("endgame accounting remains actionable and finite", () => {
  assert.equal(report.summary.unresolvedGroupCount, 288);
  assert.equal(report.summary.affectedMachineCount, 140);
  assert.equal(report.summary.controlledHumanLineageConfirmationOnlyCount, 238);
  assert.equal(report.summary.observationSemanticsReviewCount, 21);
  assert.equal(report.summary.redesignOrSplitCount, 3);
  assert.equal(report.summary.fieldOrExternalVerificationCount, 21);
  assert.equal(report.summary.upstreamContractBlockedCount, 5);
  assert.equal(report.workTypes.length, 6);
  assert.equal(report.workTypes.reduce((sum, item) => sum + item.groupCount, 0), 288);
});
