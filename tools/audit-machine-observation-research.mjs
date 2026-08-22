#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const researchRoot = path.join(root, 'research');
const reportPathArg = process.argv.find((arg) => arg.startsWith('--json-out='));
const reportPath = reportPathArg ? reportPathArg.slice('--json-out='.length) : null;

const CHECKED_STATUS = new Set(['checked', 'available', 'confirmed']);
const NOT_AVAILABLE_STATUS = new Set([
  'not_available', 'not-available', 'unavailable', 'none', 'unavailable_or_ended',
]);
const UNRESOLVED_STATUS = new Set([
  'unresolved', 'unknown', 'pending', 'not_checked', 'not-checked', 'not_confirmed',
]);
const PARTIAL_STATUS = new Set(['partially_confirmed', 'partial', 'partially_checked']);

function normalizeStatus(block) {
  if (!block || typeof block !== 'object') return 'MISSING';
  const raw = String(block.status ?? '').trim().toLowerCase();
  if (!raw) return 'PRESENT_STATUS_MISSING';
  if (CHECKED_STATUS.has(raw)) return 'CHECKED';
  if (NOT_AVAILABLE_STATUS.has(raw)) return 'NOT_AVAILABLE';
  if (UNRESOLVED_STATUS.has(raw)) return 'UNRESOLVED';
  if (PARTIAL_STATUS.has(raw)) return 'PARTIALLY_CHECKED';
  return `OTHER:${raw}`;
}

function countAvailableData(block) {
  return Array.isArray(block?.availableData) ? block.availableData.length : 0;
}

function hasExplicitPredecessorAssessment(data) {
  const directKeys = [
    'predecessorDataResearch',
    'seatedStartDataResearch',
    'predecessorResearch',
    'seatStartResearch',
  ];
  if (directKeys.some((key) => data?.[key] && typeof data[key] === 'object')) return true;

  const observationText = JSON.stringify({
    machineMenuResearch: data?.machineMenuResearch ?? null,
    linkedMachineServiceResearch: data?.linkedMachineServiceResearch ?? null,
    researchCompleteness: data?.researchCompleteness ?? null,
  });
  return /(着席|前任者|差分|predecessor|seat(?:ed)?\s*start)/i.test(observationText);
}

function classify(machine) {
  const menu = machine.menuStatus;
  const service = machine.serviceStatus;
  const bothMissing = menu === 'MISSING' && service === 'MISSING';
  if (bothMissing) return 'LEGACY_UNAUDITED';

  const severe = [menu, service].some((s) => s === 'PRESENT_STATUS_MISSING' || s.startsWith('OTHER:'));
  if (severe) return 'REVIEW_SCHEMA';

  if (menu === 'MISSING' || service === 'MISSING') return 'PARTIAL_LEGACY';
  if (menu === 'UNRESOLVED' || service === 'UNRESOLVED' || menu === 'PARTIALLY_CHECKED' || service === 'PARTIALLY_CHECKED') {
    return 'UNRESOLVED';
  }
  if (!machine.predecessorAssessmentExplicit) return 'OBSERVATION_RESOLVED_PREDECESSOR_UNASSESSED';
  return 'RESOLVED';
}

if (!fs.existsSync(researchRoot)) {
  console.error(`research directory not found: ${researchRoot}`);
  process.exit(2);
}

const machineDirs = fs.readdirSync(researchRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && !entry.name.startsWith('_'))
  .map((entry) => entry.name)
  .sort();

const machines = [];
for (const machineId of machineDirs) {
  const researchPath = path.join(researchRoot, machineId, 'research-data.json');
  if (!fs.existsSync(researchPath)) continue;

  let data;
  try {
    data = JSON.parse(fs.readFileSync(researchPath, 'utf8'));
  } catch (error) {
    machines.push({
      machineId,
      displayName: machineId,
      classification: 'INVALID_RESEARCH_JSON',
      error: String(error?.message ?? error),
    });
    continue;
  }

  const machine = {
    machineId,
    displayName: data?.machine?.displayName ?? machineId,
    researchedAt: data?.researchedAt ?? null,
    menuStatus: normalizeStatus(data?.machineMenuResearch),
    menuAvailableDataCount: countAvailableData(data?.machineMenuResearch),
    serviceStatus: normalizeStatus(data?.linkedMachineServiceResearch),
    serviceAvailableDataCount: countAvailableData(data?.linkedMachineServiceResearch),
    predecessorAssessmentExplicit: hasExplicitPredecessorAssessment(data),
  };
  machine.classification = classify(machine);
  machines.push(machine);
}

const classificationOrder = [
  'INVALID_RESEARCH_JSON',
  'LEGACY_UNAUDITED',
  'REVIEW_SCHEMA',
  'PARTIAL_LEGACY',
  'UNRESOLVED',
  'OBSERVATION_RESOLVED_PREDECESSOR_UNASSESSED',
  'RESOLVED',
];
const counts = Object.fromEntries(classificationOrder.map((key) => [key, 0]));
for (const machine of machines) counts[machine.classification] = (counts[machine.classification] ?? 0) + 1;

const summary = {
  schemaVersion: 'machine-observation-research-audit-v2',
  generatedAt: new Date().toISOString(),
  machineCount: machines.length,
  counts,
  menuStatusCounts: {},
  serviceStatusCounts: {},
  predecessorAssessment: {
    explicit: machines.filter((m) => m.predecessorAssessmentExplicit).length,
    unassessed: machines.filter((m) => !m.predecessorAssessmentExplicit).length,
  },
};
for (const machine of machines) {
  summary.menuStatusCounts[machine.menuStatus] = (summary.menuStatusCounts[machine.menuStatus] ?? 0) + 1;
  summary.serviceStatusCounts[machine.serviceStatus] = (summary.serviceStatusCounts[machine.serviceStatus] ?? 0) + 1;
}

const report = { summary, machines };

console.log('Machine Observation Research Audit');
console.log(`machines: ${summary.machineCount}`);
for (const key of classificationOrder) console.log(`${key}: ${counts[key] ?? 0}`);
console.log(`predecessor assessment explicit: ${summary.predecessorAssessment.explicit}`);
console.log(`predecessor assessment unassessed: ${summary.predecessorAssessment.unassessed}`);

for (const key of classificationOrder) {
  const rows = machines.filter((m) => m.classification === key);
  if (rows.length === 0 || key === 'RESOLVED') continue;
  console.log(`\n[${key}]`);
  for (const row of rows) {
    console.log(`- ${row.machineId} | ${row.displayName} | menu=${row.menuStatus} | service=${row.serviceStatus} | predecessor=${row.predecessorAssessmentExplicit ? 'EXPLICIT' : 'UNASSESSED'}`);
  }
}

if (reportPath) {
  const absolute = path.resolve(root, reportPath);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`\nreport: ${path.relative(root, absolute)}`);
}

if ((counts.INVALID_RESEARCH_JSON ?? 0) > 0 || (counts.REVIEW_SCHEMA ?? 0) > 0) {
  process.exitCode = 1;
}
