#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const read = file => JSON.parse(fs.readFileSync(file, "utf8"));

export function clusterObservationBlockers(root) {
  const report = read(path.join(root, "reports", "m7-full-fleet-migration-audit-20260916.json"));
  const rows = report.machines.filter(machine => machine.classification === "OBSERVATION_BLOCKED").map(machine => {
    let failures = [];
    try { failures = JSON.parse(machine.observationProof?.detail ?? "[]"); } catch {}
    const missing = failures.filter(item => item?.ok === false);
    const labelCandidates = missing.flatMap(item => [
      ...(item.diagnosticLabelCandidates?.exactGroupLabel ?? []),
      ...(item.diagnosticLabelCandidates?.exactOptionLabelCoverage ?? [])
    ]);
    return {
      machineId: machine.machineId,
      migrationDisposition: machine.migrationDisposition,
      evidenceGroupCount: machine.legacyEvidenceGroupCount,
      evidenceItemCount: machine.legacyEvidenceItemCount,
      selectionQuality: machine.selectionQualityProof?.status,
      normalization: machine.normalizationProof?.status,
      observation: machine.observationProof?.status,
      canonicalUi: machine.canonicalUiProof?.status,
      featureSharing: machine.featureSharingProof?.status,
      inputCompatibility: machine.inputCompatibilityProof?.status,
      missingFormalObservationCount: missing.length,
      missingGroupIds: missing.map(item => item.groupId),
      expectedFormalObservationIds: missing.map(item => item.expectedFormalObservationId),
      diagnosticLabelCandidateCount: new Set(labelCandidates).size,
      duplicateFormalObservation: missing.some(item => item.rule === "FORMAL_GROUP_OBSERVATION_ID_NOT_UNIQUE")
    };
  });

  const bySignature = new Map();
  for (const row of rows) {
    const signature = [
      row.migrationDisposition,
      row.selectionQuality,
      row.normalization,
      row.observation,
      row.canonicalUi,
      row.featureSharing,
      row.inputCompatibility,
      `missing=${row.missingFormalObservationCount}`,
      `labelCandidates=${row.diagnosticLabelCandidateCount > 0 ? "YES" : "NO"}`,
      `duplicateFormal=${row.duplicateFormalObservation ? "YES" : "NO"}`
    ].join("|");
    const current = bySignature.get(signature) ?? {
      signature, machineCount: 0, evidenceGroupCount: 0, evidenceItemCount: 0, machines: []
    };
    current.machineCount += 1;
    current.evidenceGroupCount += row.evidenceGroupCount ?? 0;
    current.evidenceItemCount += row.evidenceItemCount ?? 0;
    current.machines.push(row.machineId);
    bySignature.set(signature, current);
  }

  const clusters = [...bySignature.values()].sort((a, b) =>
    b.machineCount - a.machineCount || a.signature.localeCompare(b.signature)
  );
  return {
    schemaVersion: "m7-observation-blocker-clusters-v1",
    sourceReport: "reports/m7-full-fleet-migration-audit-20260916.json",
    sourceSummary: report.summary,
    policy: {
      formalObservationId: "OBS_EVI_<clean(groupId)>",
      labelOnlyIsProof: false,
      semanticInferenceAllowed: false,
      note: "This report only clusters existing formal audit results. It does not create Observation lineage or authorize migration."
    },
    summary: {
      observationBlockedMachines: rows.length,
      clusterCount: clusters.length,
      noDiagnosticLabelCandidateMachines: rows.filter(row => row.diagnosticLabelCandidateCount === 0).length,
      withDiagnosticLabelCandidateMachines: rows.filter(row => row.diagnosticLabelCandidateCount > 0).length,
      duplicateFormalObservationMachines: rows.filter(row => row.duplicateFormalObservation).length
    },
    clusters,
    machines: rows
  };
}

export function markdownReport(report) {
  const lines = [
    "# M7 Observation blocker clusters — 2026-09-19", "",
    "This is a mechanical re-clustering of the current full-fleet audit. Labels/categories remain diagnostic only and never establish Observation lineage.", "",
    "## Summary", "",
    `- OBSERVATION_BLOCKED: ${report.summary.observationBlockedMachines}`,
    `- Clusters: ${report.summary.clusterCount}`,
    `- No diagnostic label candidate: ${report.summary.noDiagnosticLabelCandidateMachines}`,
    `- With diagnostic label candidate: ${report.summary.withDiagnosticLabelCandidateMachines}`,
    `- Duplicate formal Observation ID: ${report.summary.duplicateFormalObservationMachines}`, "",
    "## Clusters", "",
    "| Machines | Groups | Items | Signature |", "|---:|---:|---:|---|"
  ];
  for (const cluster of report.clusters) {
    lines.push(`| ${cluster.machineCount} | ${cluster.evidenceGroupCount} | ${cluster.evidenceItemCount} | \`${cluster.signature}\` |`);
  }
  lines.push("", "## Safety conclusion", "",
    "A cluster is not a migration allow-list. Formal Observation completion still requires an explicit unique non-diagnostic relationship between each Selection Evidence group and its Observation artifact. A generic Evidence Observation, a similar label, or a single-group/single-candidate shape alone is insufficient."
  );
  return `${lines.join("\n")}\n`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = clusterObservationBlockers(process.cwd());
  if (process.argv.includes("--write")) {
    fs.writeFileSync("reports/m7-observation-blocker-clusters-20260919.json", `${JSON.stringify(report, null, 2)}\n`);
    fs.writeFileSync("reports/m7-observation-blocker-clusters-20260919.md", markdownReport(report));
  }
  console.log(JSON.stringify(report.summary, null, 2));
}
