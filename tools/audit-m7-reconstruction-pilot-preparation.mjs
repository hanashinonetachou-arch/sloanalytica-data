#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_FULL = "reports/m7-full-fleet-migration-audit-20260916.json";
const DEFAULT_ROUTE = "reports/m7-fleet-route-strategy.json";
const DEFAULT_JSON = "reports/m7-reconstruction-pilot-preparation-audit-20260917.json";
const DEFAULT_MD = "reports/m7-reconstruction-pilot-preparation-audit-20260917.md";

export const PILOT = [
  { machineId: "L_EVANGELION_MIRAI_JF", role: "CONTROL_REFERENCE", expectedClassification: "ALREADY_M7", expectedObservation: "PASS" },
  { machineId: "S_BOOWY_SV", role: "RECONSTRUCTION_TARGET", expectedClassification: "OBSERVATION_BLOCKED", expectedObservation: "FAIL" },
  { machineId: "L_ANOTHER_RINO_HEAVEN_CC", role: "RECONSTRUCTION_TARGET", expectedClassification: "CANONICAL_UI_BLOCKED", expectedObservation: "PASS" },
  { machineId: "L_ANIMAL_SLOT_DOCCHI_ZT", role: "RECONSTRUCTION_TARGET", expectedClassification: "NORMALIZATION_BLOCKED", expectedObservation: "PASS" },
  { machineId: "L_AZURLANE_THE_ANIMATION_KN", role: "STOP_CONDITION_SPECIMEN", expectedClassification: "SELECTION_QUALITY_BLOCKED", expectedSelection: "REVIEW" }
];

const readJson = p => JSON.parse(fs.readFileSync(p, "utf8"));
const indexUnique = (rows, source) => {
  const map = new Map();
  for (const row of rows ?? []) {
    if (!row?.machineId) throw new Error(`${source}: row without machineId`);
    if (map.has(row.machineId)) throw new Error(`${source}: duplicate machineId ${row.machineId}`);
    map.set(row.machineId, row);
  }
  return map;
};

export function buildReport(full, route) {
  const fullById = indexUnique(full?.machines, "full-fleet");
  const routeById = indexUnique(route?.machines, "route");
  const fullIds = [...fullById.keys()].sort();
  const routeIds = [...routeById.keys()].sort();
  const missingInRoute = fullIds.filter(id => !routeById.has(id));
  const missingInFull = routeIds.filter(id => !fullById.has(id));
  if (missingInRoute.length || missingInFull.length) {
    throw new Error(`one-to-one join failed: missingInRoute=${missingInRoute.join(",")} missingInFull=${missingInFull.join(",")}`);
  }

  const rows = fullIds.map(machineId => {
    const authoritative = fullById.get(machineId);
    const supplemental = routeById.get(machineId);
    return {
      machineId,
      classification: authoritative.classification,
      migrationDisposition: authoritative.migrationDisposition,
      blockReasons: authoritative.blockReasons ?? [],
      proofs: {
        selectionQuality: authoritative.selectionQualityProof?.status ?? null,
        observation: authoritative.observationProof?.status ?? null,
        canonicalUi: authoritative.canonicalUiProof?.status ?? null,
        normalization: authoritative.normalizationProof?.status ?? null
      },
      route: {
        deficitCount: supplemental.deficitCount,
        fourLayerUnresolved: Boolean(supplemental.semantic?.fourLayerUnresolved),
        fieldVerificationWaiting: Boolean(supplemental.semantic?.fieldVerificationWaiting),
        verificationStatus: supplemental.downstream?.verificationStatus ?? null
      }
    };
  });

  const isM7Blocked = r => r.classification !== "ALREADY_M7" && r.classification !== "AUTO_MIGRATABLE";
  const deficitZeroButBlocked = rows.filter(r => r.route.deficitCount === 0 && isM7Blocked(r));
  const alreadyM7WithSupplementalHold = rows.filter(r => r.classification === "ALREADY_M7" && (r.route.fourLayerUnresolved || r.route.fieldVerificationWaiting));
  const normalizationWithoutSupplementalSignal = rows.filter(r => r.classification === "NORMALIZATION_BLOCKED" && !r.route.fourLayerUnresolved && !r.route.fieldVerificationWaiting);

  const pilot = PILOT.map(spec => {
    const actual = rows.find(r => r.machineId === spec.machineId);
    if (!actual) return { ...spec, status: "ROLE_DRIFT", reasons: ["machine missing from joined fleet"], actual: null };
    const reasons = [];
    if (actual.classification !== spec.expectedClassification) reasons.push(`classification expected ${spec.expectedClassification}, got ${actual.classification}`);
    if (spec.expectedObservation && actual.proofs.observation !== spec.expectedObservation) reasons.push(`observation expected ${spec.expectedObservation}, got ${actual.proofs.observation}`);
    if (spec.expectedSelection && actual.proofs.selectionQuality !== spec.expectedSelection) reasons.push(`selection expected ${spec.expectedSelection}, got ${actual.proofs.selectionQuality}`);
    return { ...spec, status: reasons.length ? "ROLE_DRIFT" : "VALIDATED", reasons, actual };
  });

  const stopConditions = [];
  for (const p of pilot) {
    if (p.status === "ROLE_DRIFT") stopConditions.push({ machineId: p.machineId, type: "ROLE_DRIFT", detail: p.reasons.join("; ") });
    if (p.role === "STOP_CONDITION_SPECIMEN" && p.actual?.proofs.selectionQuality === "REVIEW") {
      stopConditions.push({ machineId: p.machineId, type: "SELECTION_REVIEW", detail: "Selection REVIEW requires human/upstream resolution; do not auto-resolve." });
    }
  }

  return {
    schemaVersion: "m7-reconstruction-pilot-preparation-audit-v1",
    scope: {
      authoritativeSource: DEFAULT_FULL,
      supplementalSource: DEFAULT_ROUTE,
      authoritativeRule: "M7 readiness/classification comes only from the full-fleet migration audit; route signals are supplemental and cannot establish readiness."
    },
    summary: {
      fullFleetCount: fullIds.length,
      routeCount: routeIds.length,
      joinedCount: rows.length,
      deficitZeroButM7BlockedCount: deficitZeroButBlocked.length,
      alreadyM7WithSupplementalHoldCount: alreadyM7WithSupplementalHold.length,
      normalizationBlockedWithoutSupplementalSignalCount: normalizationWithoutSupplementalSignal.length,
      pilotValidatedCount: pilot.filter(x => x.status === "VALIDATED").length,
      pilotRoleDriftCount: pilot.filter(x => x.status === "ROLE_DRIFT").length,
      stopConditionCount: stopConditions.length
    },
    contradictions: {
      deficitZeroButM7Blocked: deficitZeroButBlocked.map(x => x.machineId),
      alreadyM7WithSupplementalHold: alreadyM7WithSupplementalHold.map(x => x.machineId),
      normalizationBlockedWithoutSupplementalSignal: normalizationWithoutSupplementalSignal.map(x => x.machineId)
    },
    pilot,
    stopConditions,
    machines: rows
  };
}

export function markdownReport(report) {
  const s = report.summary;
  const lines = [
    "# M7 Reconstruction Pilot Preparation Audit",
    "",
    "## Summary",
    "",
    `- Joined fleet: ${s.joinedCount}/${s.fullFleetCount} authoritative and ${s.routeCount} route rows`,
    `- Route deficit 0 but M7 blocked: ${s.deficitZeroButM7BlockedCount}`,
    `- ALREADY_M7 with supplemental unresolved/field-hold signal: ${s.alreadyM7WithSupplementalHoldCount}`,
    `- NORMALIZATION_BLOCKED without supplemental unresolved/field-hold signal: ${s.normalizationBlockedWithoutSupplementalSignalCount}`,
    `- Pilot roles validated: ${s.pilotValidatedCount}/${report.pilot.length}`,
    `- Pilot role drift: ${s.pilotRoleDriftCount}`,
    "",
    "Route-strategy signals are supplemental only. They do not establish M7 migration readiness.",
    "",
    "## Pilot",
    "",
    "| Machine | Role | Classification | Observation | Selection | Result |",
    "| --- | --- | --- | --- | --- | --- |"
  ];
  for (const p of report.pilot) lines.push(`| \`${p.machineId}\` | ${p.role} | ${p.actual?.classification ?? "-"} | ${p.actual?.proofs.observation ?? "-"} | ${p.actual?.proofs.selectionQuality ?? "-"} | ${p.status}${p.reasons.length ? ` — ${p.reasons.join("; ")}` : ""} |`);
  lines.push("", "## Stop conditions", "");
  if (!report.stopConditions.length) lines.push("- None.");
  else for (const x of report.stopConditions) lines.push(`- \`${x.machineId}\` — ${x.type}: ${x.detail}`);
  lines.push("");
  return lines.join("\n");
}

function arg(name, fallback) {
  const prefix = `--${name}=`;
  return process.argv.find(x => x.startsWith(prefix))?.slice(prefix.length) ?? fallback;
}

export function runCli(root = process.cwd()) {
  const fullPath = path.join(root, arg("full", DEFAULT_FULL));
  const routePath = path.join(root, arg("route", DEFAULT_ROUTE));
  const jsonPath = path.join(root, arg("json-out", DEFAULT_JSON));
  const mdPath = path.join(root, arg("md-out", DEFAULT_MD));
  const report = buildReport(readJson(fullPath), readJson(routePath));
  if (process.argv.includes("--write")) {
    fs.mkdirSync(path.dirname(jsonPath), { recursive: true });
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2) + "\n");
    fs.writeFileSync(mdPath, markdownReport(report));
  }
  console.log(JSON.stringify(report.summary, null, 2));
  if (report.summary.pilotRoleDriftCount > 0) process.exitCode = 1;
  return report;
}

const self = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === self) runCli();
