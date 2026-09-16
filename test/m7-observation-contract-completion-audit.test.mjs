import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { auditFleet, markdownReport } from "../tools/audit-m7-observation-contract-completion.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const reportPath = path.join(root, "reports/m7-phase2-2-observation-contract-completion-audit-20260916.json");
const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));

test("Observation completion audit is deterministic and matches both checked-in reports", () => {
  const actual = auditFleet(root);
  assert.deepEqual(actual, report);
  assert.equal(markdownReport(actual), fs.readFileSync(reportPath.replace(/\.json$/, ".md"), "utf8"));
});

test("every Evidence group has explicit binary proof fields and no confidence score", () => {
  assert.equal(report.summary.totalEvidenceGroupsReviewed, 447);
  assert.equal(report.groups.length, 447);
  for (const item of report.groups) {
    assert.ok(item.machineId && item.groupId && item.expectedFormalObservationId);
    assert.ok(Array.isArray(item.sourceEvidenceIds));
    assert.ok(["ESTABLISHED", "NOT_ESTABLISHED"].includes(item.proofResult));
    assert.equal(Object.hasOwn(item, "confidence"), false);
    if (item.migrationAllowed) assert.equal(item.proofResult, "ESTABLISHED");
  }
});

test("label-only diagnostics never permit migration", () => {
  const rejected = report.groups.filter(item => item.labelOnlyMatchRejected);
  assert.equal(rejected.length, report.summary.labelOnlyMatchesRejected);
  assert.ok(rejected.length > 0);
  for (const item of rejected) {
    assert.equal(item.proofResult, "NOT_ESTABLISHED");
    assert.equal(item.migrationAllowed, false);
  }
});

test("known independent blockers cannot become migration candidates", () => {
  const stopped = new Set(["LB_FUJIKO_M2", "L_TENSEI_SHITARA_KEN_DESHITA_GT", "L_LUPIN_DAIKOUKAISHA_H1", "L_MOMOTARO_DENTETSU_TEIBAN_PU", "L_SMASLO_DUNBINE_MF", "S_OVERLORD_II_SX", "S_SENGOKU_COLLECTION5_PS", "S_SLODOL_PK"]);
  for (const item of report.groups.filter(item => stopped.has(item.machineId))) assert.equal(item.migrationAllowed, false, `${item.machineId}/${item.groupId}`);
});

test("the audit-only batch proposes no unsafe migration", () => {
  assert.equal(report.summary.migrationCandidates, 0);
});
