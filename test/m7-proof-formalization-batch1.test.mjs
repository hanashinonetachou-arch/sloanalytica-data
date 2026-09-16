import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { auditBatch, markdownReport, BASE_HEAD } from "../tools/audit-m7-proof-formalization-batch1.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const stem = path.join(root, "reports/m7-phase2-2-proof-formalization-batch1-20260916");
const report = JSON.parse(fs.readFileSync(`${stem}.json`, "utf8"));

test("Batch 1 formalization reports are deterministic", () => {
  const actual = auditBatch(root);
  assert.deepEqual(actual, report);
  assert.equal(markdownReport(actual), fs.readFileSync(`${stem}.md`, "utf8"));
  assert.equal(report.baseHead, BASE_HEAD);
});

test("all 13 candidates have binary decisions and exact Research lineage", () => {
  assert.equal(report.summary.candidateCount, 13);
  assert.equal(report.candidates.length, 13);
  for (const item of report.candidates) {
    assert.ok(["FORMAL_PROOF_ESTABLISHED", "FORMAL_PROOF_NOT_ESTABLISHED"].includes(item.proofResult));
    assert.ok(item.sourceEvidenceIds.length > 0);
    assert.equal(Object.hasOwn(item, "confidence"), false);
    if (item.proofResult === "FORMAL_PROOF_ESTABLISHED") {
      assert.equal(item.lineageAfter.explicitExactLineage, true);
      assert.deepEqual(item.lineageAfter.sourceEvidenceIds, item.sourceEvidenceIds);
      assert.equal(item.blocker, null);
    } else {
      assert.ok(item.blocker);
      assert.equal(item.modifiedFiles.length, 0);
      assert.equal(item.idRenamePerformed, false);
    }
  }
});

test("no candidate is formalized without exact proof and all thirteen remain blocked", () => {
  assert.equal(report.summary.formalProofEstablishedCount, 0);
  assert.equal(report.summary.formalProofNotEstablishedCount, 13);
  assert.equal(report.summary.lineageFormalizedCount, 0);
  assert.equal(report.summary.observationIdRenameCount, 0);
  assert.equal(report.summary.blockedCount, 13);
});

test("safety invariants remain zero", () => {
  for (const key of ["runtimeShapeChangeCount", "canonicalUiSemanticChangeCount", "validatorChangeCount", "unsafeMigrationCount"]) assert.equal(report.summary[key], 0);
});
