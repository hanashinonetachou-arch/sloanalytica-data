import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { validateResearchCompleteness, validateSelectionEvidenceCoverage } from './batch-completeness-gates.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mode = process.argv[2];
const args = process.argv.slice(3);
if (!['single', 'batch'].includes(mode)) {
  console.error('Usage: node tools/guard-machine-pipeline.mjs <single|batch> ...args');
  process.exit(2);
}

function readJson(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }
function readMachineIdsFromFile(filePath) {
  const full = path.resolve(ROOT, filePath);
  const raw = fs.readFileSync(full, 'utf8').trim();
  if (!raw) return [];
  if (raw.startsWith('[')) return JSON.parse(raw).map(String);
  if (raw.startsWith('{')) {
    const value = JSON.parse(raw);
    return (value.machines ?? value.machineIds ?? []).map(item => typeof item === 'string' ? item : item.machineId).filter(Boolean);
  }
  return raw.split(/\r?\n/).map(v => v.trim()).filter(Boolean);
}
function collectIds() {
  if (mode === 'single') return args[0] ? [args[0]] : [];
  const ids = [];
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--file') { ids.push(...readMachineIdsFromFile(args[++i])); continue; }
    if (args[i].startsWith('--')) continue;
    if (/^[A-Z0-9_]+$/.test(args[i])) ids.push(args[i]);
  }
  return [...new Set(ids)];
}
function runNode(script, scriptArgs, label) {
  const r = spawnSync(process.execPath, [path.join(ROOT, 'tools', script), ...scriptArgs], { cwd: ROOT, stdio: 'inherit' });
  if (r.error) throw r.error;
  if (r.status !== 0) throw new Error(`${label} failed with exit code ${r.status}`);
}
function isPublished(machineId) {
  const catalogPath = path.join(ROOT, 'catalog.json');
  if (!fs.existsSync(catalogPath)) return false;
  const catalog = readJson(catalogPath);
  return (catalog.machines ?? []).some(machine => machine.machineId === machineId);
}
function generateSettingBand(machineId) {
  const researchDir = path.join(ROOT, 'research', machineId);
  const researchPath = path.join(researchDir, 'research-data.json');
  const selectionPath = path.join(researchDir, 'selection-data.json');
  const outputPath = path.join(researchDir, 'setting-band-report.json');
  if (!fs.existsSync(researchPath) || !fs.existsSync(selectionPath)) return;
  console.log(`\n=== SETTING BAND: ${machineId} ===`);
  runNode('refine-setting-band-games.mjs', [researchPath, selectionPath, outputPath], 'setting-band refinement');
  if (isPublished(machineId)) {
    runNode('sync-machine-difficulty-catalog.mjs', [machineId], 'difficulty catalog sync with setting band');
  } else {
    console.log('Setting Band generated; catalog integration deferred until publish.');
  }
}

const machineIds = collectIds();
const errors = [];
for (const id of machineIds) {
  const researchPath = path.join(ROOT, 'research', id, 'research-data.json');
  const selectionPath = path.join(ROOT, 'research', id, 'selection-data.json');
  if (!fs.existsSync(researchPath) || !fs.existsSync(selectionPath)) continue;
  const research = readJson(researchPath);
  if (!research.researchCompleteness) continue; // legacy data remains backward compatible
  const selection = readJson(selectionPath);

  const researchResult = validateResearchCompleteness(research, { required: true });
  for (const error of researchResult.errors) errors.push(`${id}: ${error}`);
  // UNRESOLVED is deliberate review metadata, not fabricated data and not a schema error.
  // Keep it visible to the operator, but allow an explicitly marked "未調査版" to be
  // built so real-device verification can close the gap later.
  for (const unresolved of researchResult.unresolved) {
    console.warn(`REVIEW [machine completeness guard] ${id}: research completeness unresolved ${unresolved}`);
  }

  const evidenceResult = validateSelectionEvidenceCoverage(selection, research, { required: true });
  for (const error of evidenceResult.errors) errors.push(`${id}: ${error}`);
}
if (errors.length) {
  for (const error of errors) console.error(`ERROR [machine completeness guard] ${error}`);
  process.exit(1);
}

const target = path.join(ROOT, 'tools', mode === 'single' ? 'machine-pipeline.mjs' : 'batch-machine-pipeline.mjs');
const r = spawnSync(process.execPath, [target, ...args], { cwd: ROOT, stdio: 'inherit' });
if (r.error) throw r.error;
if (r.status !== 0) process.exit(r.status ?? 1);

try {
  for (const machineId of machineIds) generateSettingBand(machineId);
} catch (error) {
  console.error(`ERROR [setting-band pipeline integration]: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}

process.exit(0);
