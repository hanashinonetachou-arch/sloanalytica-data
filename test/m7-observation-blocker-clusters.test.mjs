import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { clusterObservationBlockers } from "../tools/audit-m7-observation-blocker-clusters.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("current Observation blockers are clustered mechanically without semantic inference", () => {
  const report = clusterObservationBlockers(root);
  assert.equal(report.summary.observationBlockedMachines, report.sourceSummary.OBSERVATION_BLOCKED);
  assert.equal(report.summary.clusterCount, 12);
  assert.equal(
    report.summary.noDiagnosticLabelCandidateMachines + report.summary.withDiagnosticLabelCandidateMachines,
    report.summary.observationBlockedMachines
  );
  assert.equal(report.summary.duplicateFormalObservationMachines, 0);
  assert.equal(report.machines.length, report.sourceSummary.OBSERVATION_BLOCKED);
  assert.equal(new Set(report.machines.map(item => item.machineId)).size, report.sourceSummary.OBSERVATION_BLOCKED);
  assert.equal(report.policy.labelOnlyIsProof, false);
  assert.equal(report.policy.semanticInferenceAllowed, false);
});

test("largest current cluster remains the single-group no-label-candidate class", () => {
  const report = clusterObservationBlockers(root);
  const largest = report.clusters[0];
  assert.ok(largest.machineCount > 0);
  assert.equal(largest.evidenceGroupCount, largest.machineCount);
  assert.ok(largest.evidenceItemCount >= largest.evidenceGroupCount);
  assert.match(largest.signature, /missing=1/);
  assert.match(largest.signature, /labelCandidates=NO/);
  assert.match(largest.signature, /duplicateFormal=NO/);
});

test("cluster report never promotes a machine to migration-ready", () => {
  const report = clusterObservationBlockers(root);
  for (const machine of report.machines) {
    assert.equal(machine.observation, "FAIL");
  }
});
