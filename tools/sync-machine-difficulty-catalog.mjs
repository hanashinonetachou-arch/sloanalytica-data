import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const machineId = process.argv[2];
if (!machineId || !/^[A-Z0-9_]+$/.test(machineId)) {
  console.error('Usage: node tools/sync-machine-difficulty-catalog.mjs <MACHINE_ID>');
  process.exit(2);
}

const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const write = (p, v) => fs.writeFileSync(p, JSON.stringify(v, null, 2) + '\n', 'utf8');
const catalogPath = path.join(ROOT, 'catalog.json');
const difficultyCatalogPath = path.join(ROOT, 'difficulty-catalog.json');
const difficultyPath = path.join(ROOT, 'research', machineId, 'difficulty-report.json');
const machinePath = path.join(ROOT, 'machines', machineId, 'machine-package.json');

for (const p of [catalogPath, difficultyCatalogPath, difficultyPath, machinePath]) {
  if (!fs.existsSync(p)) throw new Error(`required file not found: ${path.relative(ROOT, p)}`);
}

const catalog = read(catalogPath);
const doc = read(difficultyCatalogPath);
const report = read(difficultyPath);
const pkg = read(machinePath);
const machine = (catalog.machines ?? []).find(m => m.machineId === machineId);
if (!machine) throw new Error(`${machineId} is not registered in catalog.json`);
if (report.machineId !== machineId || pkg.machine?.machineId !== machineId) throw new Error('machineId mismatch');

const cal = doc.calibration;
if (!cal || cal.method !== 'FIXED_BENCHMARK_RAW_SCALE') throw new Error('unsupported calibration');
if (!Number.isFinite(cal.referenceRaw) || cal.referenceRaw <= 0) throw new Error('invalid calibration.referenceRaw');
if (!Number.isFinite(cal.displayReference) || cal.displayReference < 0) throw new Error('invalid calibration.displayReference');
const min = Number.isFinite(cal.minimumDisplayScore) ? cal.minimumDisplayScore : 0;

const targets = Array.isArray(report.targets) ? report.targets : [];
const rawScores = targets.map(t => ({ games: t.games, rawScore: t.score }));
const scores = rawScores.map(r => ({
  games: r.games,
  score: Math.max(min, Math.round((r.rawScore / cal.referenceRaw) * cal.displayReference)),
}));
const evidenceCount = pkg.evidence?.evidences?.length ?? 0;
const numericCount = report.coverage?.includedNumericFeatureCount ?? 0;
const status = rawScores.length > 0 && numericCount > 0 ? 'SCORED' : evidenceCount > 0 ? 'EVIDENCE_DOMINANT' : 'NOT_READY';
const rejectedFeatures = (pkg.selectionSummary?.rejected ?? []).map(r => ({
  name: r.name,
  reason: r.reason,
  requiredTrials: r.requiredTrials?.value ?? null,
  requiredTrialsUnit: r.requiredTrials?.unit ?? 'G',
  metricStatus: r.requiredTrials?.value != null ? 'COMPUTED' : 'NOT_COMPUTABLE',
}));

const difficulty = {
  schemaVersion: 'difficulty-display-v1',
  status,
  isProvisional: true,
  scoreModelVersion: report.analyzerVersion ?? 'difficulty-analyzer-v1.2',
  scores: status === 'SCORED' ? scores : [],
  scoreRange: null,
  confidence: status === 'SCORED' ? {
    level: report.scoreConfidence?.level ?? 'UNKNOWN',
    userVisible: false,
    basis: report.scoreConfidence?.basis ?? 'Difficulty Analyzer result',
  } : null,
  profile: status === 'SCORED' ? 'NUMERIC' : status === 'EVIDENCE_DOMINANT' ? 'EVIDENCE_DOMINANT' : 'NOT_READY',
  uiPolicy: {
    showMachineGuideButton: true,
    buttonLabelKey: 'machine_difficulty_guide',
    rangeDisplay: 'WHEN_AVAILABLE',
  },
  ...(status === 'SCORED' ? {
    rawScores,
    displayScoreSource: 'CALIBRATED_FROM_RAW',
    calibrationVersion: cal.calibrationVersion,
  } : {}),
  ...(rejectedFeatures.length ? { rejectedFeatures } : {}),
};

const entry = {
  machineId,
  displayName: machine.displayName,
  machineDataVersion: machine.machineDataVersion,
  difficulty,
};
const entries = doc.entries ?? [];
const idx = entries.findIndex(e => e.machineId === machineId);
const previousEntry = idx >= 0 ? entries[idx] : null;
const changed = JSON.stringify(previousEntry) !== JSON.stringify(entry);
if (idx >= 0) entries[idx] = entry;
else entries.unshift(entry);
if (changed) doc.generatedAt = new Date().toISOString();
write(difficultyCatalogPath, doc);

console.log(`Difficulty Catalog sync: ${machineId}${changed ? ' (updated)' : ' (unchanged)'}`);
if (status === 'SCORED') {
  console.log(`  Raw: ${rawScores.map(s => `${s.games}G=${s.rawScore}`).join(' / ')}`);
  console.log(`  Display: ${scores.map(s => `${s.games}G=${s.score}`).join(' / ')}`);
}
console.log(`  status: ${status}`);
