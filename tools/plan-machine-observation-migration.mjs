#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const researchRoot = path.join(root, 'research');
const uxRoot = path.join(root, 'ux-contracts');
const outArg = process.argv.find((arg) => arg.startsWith('--json-out='));
const outPath = outArg ? outArg.slice('--json-out='.length) : null;

const OBSERVATION_KEYWORDS = [/マイスロ/i,/myslot/i,/打[-‐‑‒–—―]?win/i,/スロプラ/i,/next/i,/ユニメモ/i,/着席/i,/前任者/i,/開始時/i,/遊技履歴/i,/総ゲーム/i,/predecessor/i,/seated/i];
const CHECKED = new Set(['checked','available','confirmed']);
const NOT_AVAILABLE = new Set(['not_available','not-available','unavailable','none','unavailable_or_ended']);
const UNRESOLVED = new Set(['unresolved','unknown','pending','not_checked','not-checked','not_confirmed']);

function readJson(file) { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; } }
function containsSignal(value) { const text = typeof value === 'string' ? value : JSON.stringify(value ?? ''); return OBSERVATION_KEYWORDS.some((p) => p.test(text)); }
function normalizeLegacy(block) {
  if (!block || typeof block !== 'object') return 'MISSING';
  const s = String(block.status ?? '').trim().toLowerCase();
  if (CHECKED.has(s)) return 'CHECKED';
  if (NOT_AVAILABLE.has(s)) return 'NOT_AVAILABLE';
  if (UNRESOLVED.has(s)) return 'UNRESOLVED';
  if (/partial/.test(s)) return 'PARTIALLY_CHECKED';
  return s ? `OTHER:${s}` : 'PRESENT_STATUS_MISSING';
}
function normalizeV1(block) {
  const s = String(block?.status ?? '').trim().toUpperCase();
  return ['CHECKED','NOT_AVAILABLE','UNRESOLVED'].includes(s) ? s : (s ? `OTHER:${s}` : 'PRESENT_STATUS_MISSING');
}
function dataItems(block) {
  if (!block || typeof block !== 'object') return [];
  for (const key of ['availableData','retrievableItems','availableItems','displayItems']) if (Array.isArray(block[key])) return block[key];
  return [];
}
function countData(block) { return dataItems(block).length; }
function legacyPredecessorExplicit(research) {
  const direct = ['predecessorDataResearch','seatedStartDataResearch','predecessorResearch','seatStartResearch'];
  if (direct.some((k) => research?.[k] && typeof research[k] === 'object')) return true;
  return /(着席|前任者|差分|predecessor|seat(?:ed)?\s*start)/i.test(JSON.stringify({menu: research?.machineMenuResearch, service: research?.linkedMachineServiceResearch, completeness: research?.researchCompleteness}));
}

const rows = [];
for (const entry of fs.readdirSync(researchRoot, { withFileTypes: true })) {
  if (!entry.isDirectory() || entry.name.startsWith('_')) continue;
  const machineId = entry.name;
  const dir = path.join(researchRoot, machineId);
  const research = readJson(path.join(dir, 'research-data.json'));
  if (!research) continue;
  const observation = readJson(path.join(dir, 'machine-observation-data.json'));
  const sourceType = observation ? 'OBSERVATION_V1' : 'LEGACY_RESEARCH_DATA';
  const menuBlock = observation?.machineMenu ?? research?.machineMenuResearch;
  const serviceBlock = observation?.linkedService ?? research?.linkedMachineServiceResearch;
  const predecessorBlock = observation?.predecessorData;
  const menuStatus = observation ? normalizeV1(menuBlock) : normalizeLegacy(menuBlock);
  const serviceStatus = observation ? normalizeV1(serviceBlock) : normalizeLegacy(serviceBlock);
  const predecessorStatus = observation ? normalizeV1(predecessorBlock) : (legacyPredecessorExplicit(research) ? 'LEGACY_EXPLICIT' : 'UNASSESSED');
  const menuDataCount = countData(menuBlock);
  const serviceDataCount = countData(serviceBlock);

  const pkg = readJson(path.join(dir, 'machine-package.generated.json'));
  const inputs = pkg?.inputs?.inputs ?? [];
  const observationInputs = inputs.filter((input) => containsSignal(input?.name) || containsSignal(input?.id) || containsSignal(input?.description) || containsSignal(input?.observationScope));
  const hasPredecessorScope = inputs.some((input) => String(input?.observationScope ?? '').toUpperCase() === 'PREDECESSOR_SNAPSHOT');
  const hasUxContract = fs.existsSync(path.join(uxRoot, `${machineId}.json`));

  const fullyResolved = ['CHECKED','NOT_AVAILABLE'].includes(menuStatus) && ['CHECKED','NOT_AVAILABLE'].includes(serviceStatus) && predecessorStatus !== 'UNASSESSED' && predecessorStatus !== 'UNRESOLVED' && !(menuStatus === 'CHECKED' && menuDataCount === 0) && !(serviceStatus === 'CHECKED' && serviceDataCount === 0);
  if (fullyResolved) continue;

  let score = 0;
  const reasons = [];
  if (hasUxContract) { score += 120; reasons.push('USER_VERIFIED_UX_CONTRACT'); }
  if (hasPredecessorScope) { score += 80; reasons.push('PREDECESSOR_SNAPSHOT_INPUT'); }
  if (observationInputs.length) { score += 40 + Math.min(observationInputs.length, 10); reasons.push(`OBSERVATION_INPUTS:${observationInputs.length}`); }
  if (menuStatus === 'CHECKED' && menuDataCount === 0) { score += 55; reasons.push('MENU_CHECKED_DETAILS_MISSING'); }
  if (serviceStatus === 'CHECKED' && serviceDataCount === 0) { score += 55; reasons.push('SERVICE_CHECKED_DETAILS_MISSING'); }
  if (menuStatus === 'MISSING') { score += 35; reasons.push('MENU_LEGACY_MISSING'); }
  if (serviceStatus === 'MISSING') { score += 35; reasons.push('SERVICE_LEGACY_MISSING'); }
  if (predecessorStatus === 'UNASSESSED') { score += 30; reasons.push('PREDECESSOR_UNASSESSED'); }
  if (menuStatus === 'UNRESOLVED' || menuStatus === 'PARTIALLY_CHECKED') { score += 20; reasons.push(`MENU_${menuStatus}`); }
  if (serviceStatus === 'UNRESOLVED') { score += 20; reasons.push('SERVICE_UNRESOLVED'); }
  if (predecessorStatus === 'UNRESOLVED') { score += 20; reasons.push('PREDECESSOR_UNRESOLVED'); }
  if (sourceType === 'LEGACY_RESEARCH_DATA') { score += 10; reasons.push('LEGACY_RESEARCH_FORMAT'); }
  if (containsSignal(research?.features) || containsSignal(research?.evidenceCandidates)) { score += 10; reasons.push('RESEARCH_OBSERVATION_SIGNAL'); }

  const priority = score >= 120 ? 'P0' : score >= 80 ? 'P1' : score >= 45 ? 'P2' : 'P3';
  rows.push({ machineId, displayName: observation?.displayName ?? research?.machine?.displayName ?? machineId, researchedAt: observation?.researchedAt ?? research?.researchedAt ?? null, sourceType, priority, score, reasons, statuses: { menu: menuStatus, linkedService: serviceStatus, predecessor: predecessorStatus }, availableDataCounts: { menu: menuDataCount, linkedService: serviceDataCount }, observationInputs: observationInputs.map((i) => ({ id: i?.id ?? null, name: i?.name ?? null, observationScope: i?.observationScope ?? null })) });
}

rows.sort((a,b) => b.score - a.score || String(a.researchedAt ?? '').localeCompare(String(b.researchedAt ?? '')) || a.machineId.localeCompare(b.machineId));
const summary = { schemaVersion: 'machine-observation-migration-plan-v2.1', generatedAt: new Date().toISOString(), migrationDebtCount: rows.length, priorityCounts: Object.fromEntries(['P0','P1','P2','P3'].map((p) => [p, rows.filter((r) => r.priority === p).length])) };
const result = { summary, machines: rows };
console.log('Machine Observation migration priority v2.1');
console.log(JSON.stringify(summary, null, 2));
for (const row of rows) console.log(`- ${row.priority} ${String(row.score).padStart(3)} | ${row.machineId} | ${row.displayName} | ${row.reasons.join(', ')}`);
if (outPath) { const absolute = path.resolve(root, outPath); fs.mkdirSync(path.dirname(absolute), {recursive:true}); fs.writeFileSync(absolute, `${JSON.stringify(result,null,2)}\n`); console.log(`report: ${path.relative(root,absolute)}`); }
