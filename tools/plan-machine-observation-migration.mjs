#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const researchRoot = path.join(root, 'research');
const uxRoot = path.join(root, 'ux-contracts');
const outArg = process.argv.find((arg) => arg.startsWith('--json-out='));
const outPath = outArg ? outArg.slice('--json-out='.length) : null;

const OBSERVATION_KEYWORDS = [
  /マイスロ/i,
  /myslot/i,
  /打[-‐‑‒–—―]?win/i,
  /スロプラ/i,
  /next/i,
  /ユニメモ/i,
  /着席/i,
  /前任者/i,
  /開始時/i,
  /遊技履歴/i,
  /総ゲーム/i,
  /total\s*game/i,
  /predecessor/i,
  /seated/i,
];

function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; }
}

function containsObservationSignal(value) {
  const text = typeof value === 'string' ? value : JSON.stringify(value ?? '');
  return OBSERVATION_KEYWORDS.some((pattern) => pattern.test(text));
}

const rows = [];
for (const entry of fs.readdirSync(researchRoot, { withFileTypes: true })) {
  if (!entry.isDirectory() || entry.name.startsWith('_')) continue;
  const machineId = entry.name;
  const dir = path.join(researchRoot, machineId);
  const researchPath = path.join(dir, 'research-data.json');
  const observationPath = path.join(dir, 'machine-observation-data.json');
  if (!fs.existsSync(researchPath) || fs.existsSync(observationPath)) continue;

  const research = readJson(researchPath);
  if (!research) continue;

  // Planner currently focuses on the strict LEGACY_UNAUDITED group only.
  if (research.machineMenuResearch || research.linkedMachineServiceResearch) continue;

  const packagePath = path.join(dir, 'machine-package.generated.json');
  const pkg = fs.existsSync(packagePath) ? readJson(packagePath) : null;
  const inputs = pkg?.inputs?.inputs ?? [];
  const observationInputs = inputs.filter((input) =>
    containsObservationSignal(input?.name) ||
    containsObservationSignal(input?.id) ||
    containsObservationSignal(input?.description) ||
    containsObservationSignal(input?.observationScope)
  );

  const hasPredecessorScope = inputs.some((input) => String(input?.observationScope ?? '').toUpperCase() === 'PREDECESSOR_SNAPSHOT');
  const uxContractPath = path.join(uxRoot, `${machineId}.json`);
  const hasUxContract = fs.existsSync(uxContractPath);
  const researchSignals = containsObservationSignal(research?.features) || containsObservationSignal(research?.evidenceCandidates);

  let score = 0;
  const reasons = [];
  if (hasUxContract) { score += 100; reasons.push('USER_VERIFIED_UX_CONTRACT'); }
  if (hasPredecessorScope) { score += 60; reasons.push('PREDECESSOR_SNAPSHOT_INPUT'); }
  if (observationInputs.length > 0) { score += 40 + Math.min(observationInputs.length, 10); reasons.push(`OBSERVATION_INPUTS:${observationInputs.length}`); }
  if (researchSignals) { score += 15; reasons.push('RESEARCH_TEXT_OBSERVATION_SIGNAL'); }
  if (/未調査|未確認/i.test(research?.machine?.displayName ?? '')) { score += 5; reasons.push('DISPLAY_NAME_UNRESOLVED_MARKER'); }

  const priority = score >= 80 ? 'P0' : score >= 40 ? 'P1' : score >= 15 ? 'P2' : 'P3';
  rows.push({
    machineId,
    displayName: research?.machine?.displayName ?? machineId,
    researchedAt: research?.researchedAt ?? null,
    priority,
    score,
    reasons,
    observationInputs: observationInputs.map((input) => ({
      id: input?.id ?? null,
      name: input?.name ?? null,
      observationScope: input?.observationScope ?? null,
    })),
  });
}

rows.sort((a, b) => b.score - a.score || String(a.researchedAt ?? '').localeCompare(String(b.researchedAt ?? '')) || a.machineId.localeCompare(b.machineId));
const summary = {
  schemaVersion: 'machine-observation-migration-plan-v1',
  generatedAt: new Date().toISOString(),
  legacyUnauditedCount: rows.length,
  priorityCounts: Object.fromEntries(['P0','P1','P2','P3'].map((p) => [p, rows.filter((r) => r.priority === p).length])),
};
const result = { summary, machines: rows };

console.log('Machine Observation migration priority');
console.log(JSON.stringify(summary, null, 2));
for (const row of rows) {
  console.log(`- ${row.priority} ${String(row.score).padStart(3)} | ${row.machineId} | ${row.displayName} | ${row.reasons.join(', ') || 'NO_SIGNAL'}`);
  for (const input of row.observationInputs) console.log(`    input: ${input.id} | ${input.name} | scope=${input.observationScope ?? '-'}`);
}

if (outPath) {
  const absolute = path.resolve(root, outPath);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, `${JSON.stringify(result, null, 2)}\n`);
  console.log(`report: ${path.relative(root, absolute)}`);
}
