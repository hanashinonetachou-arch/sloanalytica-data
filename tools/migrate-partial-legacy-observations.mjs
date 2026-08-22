#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const researchRoot = path.join(root, 'research');
const TODAY = '2026-08-22';

const CHECKED = new Set(['checked', 'available', 'confirmed']);
const NOT_AVAILABLE = new Set(['not_available', 'not-available', 'unavailable', 'none', 'unavailable_or_ended']);
const UNRESOLVED = new Set(['unresolved', 'unknown', 'pending', 'not_checked', 'not-checked', 'not_confirmed']);
const PARTIAL = new Set(['partially_confirmed', 'partial', 'partially_checked']);

function normalizeStatus(block) {
  if (!block || typeof block !== 'object') return 'UNRESOLVED';
  const raw = String(block.status ?? '').trim().toLowerCase();
  if (CHECKED.has(raw)) return 'CHECKED';
  if (NOT_AVAILABLE.has(raw)) return 'NOT_AVAILABLE';
  if (UNRESOLVED.has(raw) || PARTIAL.has(raw) || !raw) return 'UNRESOLVED';
  return 'UNRESOLVED';
}

function availableData(block) {
  if (!block || typeof block !== 'object') return [];
  for (const key of ['availableData', 'retrievableItems', 'availableItems', 'displayItems']) {
    if (Array.isArray(block[key])) return [...block[key]];
  }
  return [];
}

function sourceRefs(block) {
  return Array.isArray(block?.sourceRefs) ? [...block.sourceRefs] : [];
}

function hasLegacyPredecessorSignal(data) {
  const directKeys = ['predecessorDataResearch', 'seatedStartDataResearch', 'predecessorResearch', 'seatStartResearch'];
  if (directKeys.some((key) => data?.[key] && typeof data[key] === 'object')) return true;
  const text = JSON.stringify({
    machineMenuResearch: data?.machineMenuResearch ?? null,
    linkedMachineServiceResearch: data?.linkedMachineServiceResearch ?? null,
    researchCompleteness: data?.researchCompleteness ?? null,
    features: data?.features ?? null,
  });
  return /(着席|前任者|差分|predecessor|seat(?:ed)?\s*start)/i.test(text);
}

function notesFor(block, kind, wasMissing) {
  const existing = typeof block?.notes === 'string' ? block.notes.trim() : '';
  if (existing) return existing;
  if (wasMissing) {
    return kind === 'machineMenu'
      ? '旧ResearchDataでは実機メニュー／遊技履歴の独立調査ブロックが未記録。不存在とは判断せず、Machine Observation Researchで再調査する。'
      : '旧ResearchDataでは実機連動機能の独立調査ブロックが未記録。不存在とは判断せず、Machine Observation Researchで再調査する。';
  }
  return '旧ResearchDataから構造移行。公開情報の再確認は別のMachine Observation Researchで行う。';
}

const migrated = [];
for (const entry of fs.readdirSync(researchRoot, { withFileTypes: true })) {
  if (!entry.isDirectory() || entry.name.startsWith('_')) continue;
  const machineId = entry.name;
  const dir = path.join(researchRoot, machineId);
  const researchPath = path.join(dir, 'research-data.json');
  const observationPath = path.join(dir, 'machine-observation-data.json');
  if (!fs.existsSync(researchPath) || fs.existsSync(observationPath)) continue;

  let data;
  try { data = JSON.parse(fs.readFileSync(researchPath, 'utf8')); }
  catch { continue; }

  const menuPresent = !!(data.machineMenuResearch && typeof data.machineMenuResearch === 'object');
  const servicePresent = !!(data.linkedMachineServiceResearch && typeof data.linkedMachineServiceResearch === 'object');
  if (menuPresent === servicePresent) continue; // migrate PARTIAL_LEGACY only

  const menu = data.machineMenuResearch;
  const service = data.linkedMachineServiceResearch;
  const menuRefs = sourceRefs(menu);
  const serviceRefs = sourceRefs(service);
  const usedSourceIds = new Set([...menuRefs, ...serviceRefs]);
  const sources = (Array.isArray(data.sources) ? data.sources : []).filter((s) => usedSourceIds.has(s?.sourceId));
  const predecessorSignal = hasLegacyPredecessorSignal(data);

  const observation = {
    schemaVersion: 'machine-observation-data-v1',
    machineId,
    displayName: data?.machine?.displayName ?? machineId,
    researchedAt: TODAY,
    sources,
    machineMenu: {
      status: normalizeStatus(menu),
      availableData: availableData(menu),
      sourceRefs: menuRefs.filter((id) => sources.some((s) => s?.sourceId === id)),
      notes: notesFor(menu, 'machineMenu', !menuPresent),
    },
    linkedService: {
      status: normalizeStatus(service),
      availableData: availableData(service),
      sourceRefs: serviceRefs.filter((id) => sources.some((s) => s?.sourceId === id)),
      notes: notesFor(service, 'linkedService', !servicePresent),
    },
    predecessorData: {
      status: 'UNRESOLVED',
      availableData: [],
      sourceRefs: [],
      notes: predecessorSignal
        ? '旧ResearchDataには着席時／前任者データへの言及があるが、具体的な取得項目・取得元・Feature分子/分母との同値性はこの構造移行では確定しない。Machine Observation Researchで個別再調査する。'
        : '旧ResearchDataでは着席時／前任者データの取得可否が独立評価されていない。不存在とは判断せず、Machine Observation Researchで再調査する。',
      usableForInference: false,
      usableForSelfSessionDelta: false,
    },
  };

  fs.writeFileSync(observationPath, `${JSON.stringify(observation, null, 2)}\n`);
  migrated.push(machineId);
}

console.log(`PARTIAL_LEGACY migrated: ${migrated.length}`);
for (const id of migrated) console.log(`- ${id}`);
if (migrated.length !== 29) {
  console.error(`Expected 29 PARTIAL_LEGACY migrations, got ${migrated.length}`);
  process.exit(1);
}
