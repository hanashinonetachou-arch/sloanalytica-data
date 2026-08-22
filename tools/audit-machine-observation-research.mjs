#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const researchRoot = path.join(root, 'research');
const reportPathArg = process.argv.find((arg) => arg.startsWith('--json-out='));
const reportPath = reportPathArg ? reportPathArg.slice('--json-out='.length) : null;

const CHECKED_STATUS = new Set(['checked', 'available', 'confirmed']);
const NOT_AVAILABLE_STATUS = new Set(['not_available', 'not-available', 'unavailable', 'none', 'unavailable_or_ended']);
const UNRESOLVED_STATUS = new Set(['unresolved', 'unknown', 'pending', 'not_checked', 'not-checked', 'not_confirmed']);
const PARTIAL_STATUS = new Set(['partially_confirmed', 'partial', 'partially_checked']);

function normalizeLegacyStatus(block) {
  if (!block || typeof block !== 'object') return 'MISSING';
  const raw = String(block.status ?? '').trim().toLowerCase();
  if (!raw) return 'PRESENT_STATUS_MISSING';
  if (CHECKED_STATUS.has(raw)) return 'CHECKED';
  if (NOT_AVAILABLE_STATUS.has(raw)) return 'NOT_AVAILABLE';
  if (UNRESOLVED_STATUS.has(raw)) return 'UNRESOLVED';
  if (PARTIAL_STATUS.has(raw)) return 'PARTIALLY_CHECKED';
  return `OTHER:${raw}`;
}

function normalizeV1Status(block) {
  const raw = String(block?.status ?? '').trim().toUpperCase();
  if (['CHECKED', 'NOT_AVAILABLE', 'UNRESOLVED'].includes(raw)) return raw;
  return raw ? `OTHER:${raw}` : 'PRESENT_STATUS_MISSING';
}

function availableDataItems(block) {
  if (!block || typeof block !== 'object') return [];
  for (const key of ['availableData', 'retrievableItems', 'availableItems', 'displayItems']) {
    if (Array.isArray(block[key])) return block[key];
  }
  return [];
}

function countAvailableData(block) {
  return availableDataItems(block).length;
}

function hasNotes(block) {
  return typeof block?.notes === 'string' && block.notes.trim().length > 0;
}

function hasExplicitLegacyPredecessorAssessment(data) {
  const directKeys = ['predecessorDataResearch', 'seatedStartDataResearch', 'predecessorResearch', 'seatStartResearch'];
  if (directKeys.some((key) => data?.[key] && typeof data[key] === 'object')) return true;
  const observationText = JSON.stringify({
    machineMenuResearch: data?.machineMenuResearch ?? null,
    linkedMachineServiceResearch: data?.linkedMachineServiceResearch ?? null,
    researchCompleteness: data?.researchCompleteness ?? null,
  });
  return /(着席|前任者|差分|predecessor|seat(?:ed)?\s*start)/i.test(observationText);
}

function checkedDetailsMissing(machine) {
  const missing = [];
  if (machine.menuStatus === 'CHECKED' && machine.menuAvailableDataCount === 0) missing.push('MACHINE_MENU_AVAILABLE_DATA');
  if (machine.serviceStatus === 'CHECKED' && machine.serviceAvailableDataCount === 0) missing.push('LINKED_SERVICE_AVAILABLE_DATA');
  if (machine.sourceType === 'OBSERVATION_V1' && machine.predecessorStatus === 'CHECKED' && machine.predecessorAvailableDataCount === 0 && !machine.predecessorHasNotes) missing.push('PREDECESSOR_DATA_DETAILS');
  return missing;
}

function classify(machine) {
  const { menuStatus: menu, serviceStatus: service, predecessorStatus: predecessor } = machine;
  if (machine.sourceType === 'OBSERVATION_V1') {
    const severe = [menu, service, predecessor].some((s) => s === 'PRESENT_STATUS_MISSING' || s.startsWith('OTHER:'));
    if (severe) return 'REVIEW_SCHEMA';
    if ([menu, service, predecessor].includes('UNRESOLVED')) return 'UNRESOLVED';
    if (machine.checkedDetailsMissing.length > 0) return 'CHECKED_DETAILS_MISSING';
    return 'RESOLVED';
  }
  if (menu === 'MISSING' && service === 'MISSING') return 'LEGACY_UNAUDITED';
  const severe = [menu, service].some((s) => s === 'PRESENT_STATUS_MISSING' || s.startsWith('OTHER:'));
  if (severe) return 'REVIEW_SCHEMA';
  if (menu === 'MISSING' || service === 'MISSING') return 'PARTIAL_LEGACY';
  if (menu === 'UNRESOLVED' || service === 'UNRESOLVED' || menu === 'PARTIALLY_CHECKED' || service === 'PARTIALLY_CHECKED') return 'UNRESOLVED';
  if (machine.checkedDetailsMissing.length > 0) return 'CHECKED_DETAILS_MISSING';
  if (!machine.predecessorAssessmentExplicit) return 'OBSERVATION_RESOLVED_PREDECESSOR_UNASSESSED';
  return 'RESOLVED';
}

if (!fs.existsSync(researchRoot)) { console.error(`research directory not found: ${researchRoot}`); process.exit(2); }
const machineDirs = fs.readdirSync(researchRoot, { withFileTypes: true }).filter((e) => e.isDirectory() && !e.name.startsWith('_')).map((e) => e.name).sort();
const machines = [];
for (const machineId of machineDirs) {
  const researchPath = path.join(researchRoot, machineId, 'research-data.json');
  if (!fs.existsSync(researchPath)) continue;
  let research;
  try { research = JSON.parse(fs.readFileSync(researchPath, 'utf8')); }
  catch (error) { machines.push({ machineId, displayName: machineId, classification: 'INVALID_RESEARCH_JSON', error: String(error?.message ?? error) }); continue; }
  const observationPath = path.join(researchRoot, machineId, 'machine-observation-data.json');
  let machine;
  if (fs.existsSync(observationPath)) {
    try {
      const observation = JSON.parse(fs.readFileSync(observationPath, 'utf8'));
      machine = { machineId, displayName: observation.displayName ?? research?.machine?.displayName ?? machineId, researchedAt: observation.researchedAt ?? null, sourceType: 'OBSERVATION_V1', menuStatus: normalizeV1Status(observation.machineMenu), menuAvailableDataCount: countAvailableData(observation.machineMenu), serviceStatus: normalizeV1Status(observation.linkedService), serviceAvailableDataCount: countAvailableData(observation.linkedService), predecessorStatus: normalizeV1Status(observation.predecessorData), predecessorAvailableDataCount: countAvailableData(observation.predecessorData), predecessorHasNotes: hasNotes(observation.predecessorData), predecessorAssessmentExplicit: true };
    } catch {
      machine = { machineId, displayName: research?.machine?.displayName ?? machineId, sourceType: 'OBSERVATION_V1', menuStatus: 'OTHER:INVALID_JSON', menuAvailableDataCount: 0, serviceStatus: 'OTHER:INVALID_JSON', serviceAvailableDataCount: 0, predecessorStatus: 'OTHER:INVALID_JSON', predecessorAvailableDataCount: 0, predecessorHasNotes: false, predecessorAssessmentExplicit: true };
    }
  } else {
    const explicit = hasExplicitLegacyPredecessorAssessment(research);
    machine = { machineId, displayName: research?.machine?.displayName ?? machineId, researchedAt: research?.researchedAt ?? null, sourceType: 'LEGACY_RESEARCH_DATA', menuStatus: normalizeLegacyStatus(research?.machineMenuResearch), menuAvailableDataCount: countAvailableData(research?.machineMenuResearch), serviceStatus: normalizeLegacyStatus(research?.linkedMachineServiceResearch), serviceAvailableDataCount: countAvailableData(research?.linkedMachineServiceResearch), predecessorStatus: explicit ? 'LEGACY_EXPLICIT' : 'UNASSESSED', predecessorAvailableDataCount: 0, predecessorHasNotes: explicit, predecessorAssessmentExplicit: explicit };
  }
  machine.checkedDetailsMissing = checkedDetailsMissing(machine);
  machine.classification = classify(machine);
  machines.push(machine);
}

const classificationOrder = ['INVALID_RESEARCH_JSON','LEGACY_UNAUDITED','REVIEW_SCHEMA','PARTIAL_LEGACY','CHECKED_DETAILS_MISSING','UNRESOLVED','OBSERVATION_RESOLVED_PREDECESSOR_UNASSESSED','RESOLVED'];
const counts = Object.fromEntries(classificationOrder.map((k) => [k, 0]));
for (const m of machines) counts[m.classification] = (counts[m.classification] ?? 0) + 1;
const summary = { schemaVersion: 'machine-observation-research-audit-v4.1', generatedAt: new Date().toISOString(), machineCount: machines.length, standaloneObservationFiles: machines.filter((m) => m.sourceType === 'OBSERVATION_V1').length, legacyResearchFallback: machines.filter((m) => m.sourceType === 'LEGACY_RESEARCH_DATA').length, counts, menuStatusCounts: {}, serviceStatusCounts: {}, predecessorStatusCounts: {}, checkedDetailsMissingCounts: {} };
for (const m of machines) {
  summary.menuStatusCounts[m.menuStatus] = (summary.menuStatusCounts[m.menuStatus] ?? 0) + 1;
  summary.serviceStatusCounts[m.serviceStatus] = (summary.serviceStatusCounts[m.serviceStatus] ?? 0) + 1;
  summary.predecessorStatusCounts[m.predecessorStatus] = (summary.predecessorStatusCounts[m.predecessorStatus] ?? 0) + 1;
  for (const key of m.checkedDetailsMissing ?? []) summary.checkedDetailsMissingCounts[key] = (summary.checkedDetailsMissingCounts[key] ?? 0) + 1;
}
const report = { summary, machines };
console.log('Machine Observation Research Audit');
console.log(`machines: ${summary.machineCount}`);
console.log(`standalone observation files: ${summary.standaloneObservationFiles}`);
console.log(`legacy research fallback: ${summary.legacyResearchFallback}`);
for (const key of classificationOrder) console.log(`${key}: ${counts[key] ?? 0}`);
for (const key of classificationOrder) {
  const rows = machines.filter((m) => m.classification === key);
  if (!rows.length || key === 'RESOLVED') continue;
  console.log(`\n[${key}]`);
  for (const row of rows) console.log(`- ${row.machineId} | ${row.displayName} | source=${row.sourceType} | menu=${row.menuStatus} | service=${row.serviceStatus} | predecessor=${row.predecessorStatus}${row.checkedDetailsMissing?.length ? ` | missing=${row.checkedDetailsMissing.join(',')}` : ''}`);
}
if (reportPath) { const absolute = path.resolve(root, reportPath); fs.mkdirSync(path.dirname(absolute), { recursive: true }); fs.writeFileSync(absolute, `${JSON.stringify(report, null, 2)}\n`); console.log(`\nreport: ${path.relative(root, absolute)}`); }
if ((counts.INVALID_RESEARCH_JSON ?? 0) > 0 || (counts.REVIEW_SCHEMA ?? 0) > 0) process.exitCode = 1;
