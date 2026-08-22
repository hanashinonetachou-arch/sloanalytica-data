#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const researchRoot = path.join(root, 'research');
const uxRoot = path.join(root, 'ux-contracts');
const outArg = process.argv.find((arg) => arg.startsWith('--json-out='));
const outPath = outArg ? outArg.slice('--json-out='.length) : null;

const OBSERVATION_KEYWORDS = [
  /マイスロ/i, /myslot/i, /打[-‐‑‒–—―]?win/i, /スロプラ/i, /next/i, /ユニメモ/i,
  /着席/i, /前任者/i, /開始時/i, /遊技履歴/i, /総ゲーム/i, /total\s*game/i,
  /predecessor/i, /seated/i,
];

function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; }
}
function containsObservationSignal(value) {
  const text = typeof value === 'string' ? value : JSON.stringify(value ?? '');
  return OBSERVATION_KEYWORDS.some((pattern) => pattern.test(text));
}
function legacyStatus(block) {
  if (!block || typeof block !== 'object') return 'MISSING';
  const raw = String(block.status ?? '').toLowerCase();
  if (['checked','available','confirmed'].includes(raw)) return 'CHECKED';
  if (['not_available','not-available','unavailable','none','unavailable_or_ended'].includes(raw)) return 'NOT_AVAILABLE';
  return 'UNRESOLVED';
}
function v1Status(block) {
  const raw = String(block?.status ?? '').toUpperCase();
  return ['CHECKED','NOT_AVAILABLE','UNRESOLVED'].includes(raw) ? raw : 'UNRESOLVED';
}
function legacyPredecessorExplicit(research) {
  const directKeys = ['predecessorDataResearch','seatedStartDataResearch','predecessorResearch','seatStartResearch'];
  if (directKeys.some((key) => research?.[key] && typeof research[key] === 'object')) return true;
  return /(着席|前任者|差分|predecessor|seat(?:ed)?\s*start)/i.test(JSON.stringify({
    machineMenuResearch: research?.machineMenuResearch ?? null,
    linkedMachineServiceResearch: research?.linkedMachineServiceResearch ?? null,
    researchCompleteness: research?.researchCompleteness ?? null,
  }));
}

const rows = [];
for (const entry of fs.readdirSync(researchRoot, { withFileTypes: true })) {
  if (!entry.isDirectory() || entry.name.startsWith('_')) continue;
  const machineId = entry.name;
  const dir = path.join(researchRoot, machineId);
  const researchPath = path.join(dir, 'research-data.json');
  if (!fs.existsSync(researchPath)) continue;
  const research = readJson(researchPath);
  if (!research) continue;

  const observationPath = path.join(dir, 'machine-observation-data.json');
  const observation = fs.existsSync(observationPath) ? readJson(observationPath) : null;
  const sourceType = observation ? 'OBSERVATION_V1' : 'LEGACY_FALLBACK';

  const menuStatus = observation ? v1Status(observation.machineMenu) : legacyStatus(research.machineMenuResearch);
  const serviceStatus = observation ? v1Status(observation.linkedService) : legacyStatus(research.linkedMachineServiceResearch);
  const predecessorStatus = observation
    ? v1Status(observation.predecessorData)
    : (legacyPredecessorExplicit(research) ? 'LEGACY_EXPLICIT' : 'UNASSESSED');

  const fullyResolved = ['CHECKED','NOT_AVAILABLE'].includes(menuStatus)
    && ['CHECKED','NOT_AVAILABLE'].includes(serviceStatus)
    && ['CHECKED','NOT_AVAILABLE','LEGACY_EXPLICIT'].includes(predecessorStatus);
  if (fullyResolved) continue;

  const packagePath = path.join(dir, 'machine-package.generated.json');
  const pkg = fs.existsSync(packagePath) ? readJson(packagePath) : null;
  const inputs = pkg?.inputs?.inputs ?? [];
  const observationInputs = inputs.filter((input) =>
    containsObservationSignal(input?.name) || containsObservationSignal(input?.id) ||
    containsObservationSignal(input?.description) || containsObservationSignal(input?.observationScope)
  );
  const hasPredecessorScope = inputs.some((input) => String(input?.observationScope ?? '').toUpperCase() === 'PREDECESSOR_SNAPSHOT');
  const hasUxContract = fs.existsSync(path.join(uxRoot, `${machineId}.json`));
  const researchSignals = containsObservationSignal(research?.features) || containsObservationSignal(research?.evidenceCandidates);

  let score = 0;
  const reasons = [];
  if (hasUxContract) { score += 120; reasons.push('USER_VERIFIED_UX_CONTRACT'); }
  if (hasPredecessorScope) { score += 80; reasons.push('PREDECESSOR_SNAPSHOT_INPUT'); }
  if (predecessorStatus === 'LEGACY_EXPLICIT') { score += 60; reasons.push('LEGACY_PREDECESSOR_EXPLICIT'); }
  if (predecessorStatus === 'CHECKED') { score += 40; reasons.push('PREDECESSOR_CHECKED'); }
  if (menuStatus === 'CHECKED') { score += 35; reasons.push('MENU_CHECKED'); }
  if (serviceStatus === 'CHECKED') { score += 35; reasons.push('SERVICE_CHECKED'); }
  if (observationInputs.length > 0) { score += 30 + Math.min(observationInputs.length, 10); reasons.push(`OBSERVATION_INPUTS:${observationInputs.length}`); }
  if (researchSignals) { score += 15; reasons.push('RESEARCH_TEXT_OBSERVATION_SIGNAL'); }
  if (sourceType === 'LEGACY_FALLBACK') { score += 10; reasons.push('LEGACY_FALLBACK'); }
  if (/未調査|未確認/i.test(research?.machine?.displayName ?? '')) { score += 5; reasons.push('UNRESOLVED_MARKER'); }

  const unresolvedAxes = [];
  if (!['CHECKED','NOT_AVAILABLE'].includes(menuStatus)) unresolvedAxes.push('MENU');
  if (!['CHECKED','NOT_AVAILABLE'].includes(serviceStatus)) unresolvedAxes.push('SERVICE');
  if (!['CHECKED','NOT_AVAILABLE','LEGACY_EXPLICIT'].includes(predecessorStatus)) unresolvedAxes.push('PREDECESSOR');

  const priority = score >= 120 ? 'P0' : score >= 80 ? 'P1' : score >= 40 ? 'P2' : 'P3';
  rows.push({
    machineId,
    displayName: observation?.displayName ?? research?.machine?.displayName ?? machineId,
    researchedAt: observation?.researchedAt ?? research?.researchedAt ?? null,
    sourceType,
    menuStatus,
    serviceStatus,
    predecessorStatus,
    unresolvedAxes,
    priority,
    score,
    reasons,
    observationInputs: observationInputs.map((input) => ({ id: input?.id ?? null, name: input?.name ?? null, observationScope: input?.observationScope ?? null })),
  });
}

rows.sort((a, b) => b.score - a.score || String(a.researchedAt ?? '').localeCompare(String(b.researchedAt ?? '')) || a.machineId.localeCompare(b.machineId));
const summary = {
  schemaVersion: 'machine-observation-resolution-plan-v2',
  generatedAt: new Date().toISOString(),
  unresolvedMachineCount: rows.length,
  priorityCounts: Object.fromEntries(['P0','P1','P2','P3'].map((p) => [p, rows.filter((r) => r.priority === p).length])),
  unresolvedAxisCounts: {
    MENU: rows.filter((r) => r.unresolvedAxes.includes('MENU')).length,
    SERVICE: rows.filter((r) => r.unresolvedAxes.includes('SERVICE')).length,
    PREDECESSOR: rows.filter((r) => r.unresolvedAxes.includes('PREDECESSOR')).length,
  },
};
const result = { summary, machines: rows };

console.log('Machine Observation resolution priority');
console.log(JSON.stringify(summary, null, 2));
for (const row of rows) {
  console.log(`- ${row.priority} ${String(row.score).padStart(3)} | ${row.machineId} | ${row.displayName} | unresolved=${row.unresolvedAxes.join('+')} | ${row.reasons.join(', ') || 'NO_SIGNAL'}`);
}
if (outPath) {
  const absolute = path.resolve(root, outPath);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, `${JSON.stringify(result, null, 2)}\n`);
  console.log(`report: ${path.relative(root, absolute)}`);
}
