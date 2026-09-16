import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { auditProofAcquisition, CLASSIFICATIONS, markdownReport } from "../tools/audit-m7-proof-acquisition.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const reportPath = path.join(root, "reports/m7-phase2-2-proof-acquisition-batch1-20260916.json");
const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));

test("proof acquisition reports are deterministic", () => {
  const actual = auditProofAcquisition(root);
  assert.deepEqual(actual, report);
  assert.equal(markdownReport(actual), fs.readFileSync(reportPath.replace(/\.json$/, ".md"), "utf8"));
});

test("all 267 semantic-review groups receive exactly one of seven classifications", () => {
  assert.equal(report.summary.semanticReviewInput, 267);
  assert.equal(report.groups.length, 267);
  assert.equal(Object.values(report.summary.classificationCounts).reduce((a, b) => a + b, 0), 267);
  for (const item of report.groups) {
    assert.ok(CLASSIFICATIONS.includes(item.classification));
    assert.equal(item.proofResult, "NOT_ESTABLISHED");
    assert.equal(Object.hasOwn(item, "confidence"), false);
    assert.equal(item.inspectedArtifacts.length, 3);
  }
});

test("Batch 1 is small, structurally sourced, and never label-only", () => {
  assert.ok(report.batch1Candidates.length >= 5 && report.batch1Candidates.length <= 20);
  assert.equal(report.batch1Candidates.length, report.summary.repositoryProofAcquirable);
  for (const item of report.batch1Candidates) {
    assert.equal(item.proofType, "UNIQUE_LEGACY_ID_AND_AUDITED_INPUT_PROJECTION");
    assert.equal(item.labelOnlyMatchRejected, false);
    assert.match(item.proofSource, /machine-observation-data\.json/);
    assert.match(item.proofSource, /evidence-ui-v2-phase2\.json/);
    assert.equal(item.independentBlocker, false);
  }
});

test("known stop conditions cannot enter Batch 1", () => {
  const candidates = new Set(report.batch1Candidates.map(item => item.machineId));
  assert.equal(candidates.has("L_TENSEI_SHITARA_KEN_DESHITA_GT"), false);
  assert.equal(candidates.has("LB_FUJIKO_M2"), false);
  assert.equal(report.groups.filter(item => item.machineId === "L_TENSEI_SHITARA_KEN_DESHITA_GT").every(item => item.classification === "FEATURE_EVIDENCE_SHARING_REVIEW_REQUIRED"), true);
  assert.equal(report.groups.filter(item => item.machineId === "LB_FUJIKO_M2").every(item => item.classification === "INDEPENDENT_BLOCKER"), true);
});

test("audit remains acquisition-only", () => {
  assert.equal(report.groups.some(item => item.proofResult === "ESTABLISHED"), false);
  assert.match(report.policy.mutationScope, /no Observation migration/);
});
