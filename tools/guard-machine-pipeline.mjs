import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { validateResearchCompleteness, validateSelectionEvidenceCoverage } from './batch-completeness-gates.mjs';
import { auditUserVerifiedUxContracts } from './audit-user-verified-ux-contracts.mjs';

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
function snapshotSettingBandReports(machineIds) {
  return new Map(machineIds.map(id => {
    const p = path.join(ROOT, 'research', id, 'setting-band-report.json');
    return [p, fs.existsSync(p) ? fs.readFileSync(p) : null];
  }));
}
function restoreSettingBandReports(snapshot) {
  for (const [p, bytes] of snapshot.entries()) {
    if (bytes === null) {
      if (fs.existsSync(p)) fs.rmSync(p, { force: true });
    } else {
      fs.mkdirSync(path.dirname(p), { recursive: true });
      fs.writeFileSync(p, bytes);
    }
  }
}

const machineIds = collectIds();
const errors = [];
for (const id of machineIds) {
  const researchPath = path.join(ROOT, 'research', id, 'research-data.json');
  const selectionPath = path.join(ROOT, 'research', id, 'selection-data.json');
  if (!fs.existsSync(researchPath) || !fs.existsSync(selectionPath)) continue;
  const research = readJson(researchPath);
  if (!research.researchCompleteness) continue;
  const selection = readJson(selectionPath);

  const researchResult = validateResearchCompleteness(research, { required: true });
  for (const error of researchResult.errors) errors.push(`${id}: ${error}`);
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

const checkOnly = args.includes('--check');
const settingBandSnapshot = mode === 'batch' ? snapshotSettingBandReports(machineIds) : null;
const machineRegistryPath = path.join(ROOT, 'machine-registry.json');
const machineRegistrySnapshot = checkOnly && fs.existsSync(machineRegistryPath)
  ? fs.readFileSync(machineRegistryPath)
  : null;

const target = path.join(ROOT, 'tools', mode === 'single' ? 'machine-pipeline.mjs' : 'batch-machine-pipeline.mjs');
let status = 1;
try {
  const r = spawnSync(process.execPath, [target, ...args], { cwd: ROOT, stdio: 'inherit' });
  if (r.error) throw r.error;
  status = r.status ?? 1;
  if(status===0){
    const ux=auditUserVerifiedUxContracts({ machineIds: machineIds.length ? machineIds : null });
    for(const review of ux.reviews) console.warn(`REVIEW [user-verified UX] ${review}`);
    for(const error of ux.errors) console.error(`ERROR [user-verified UX] ${error}`);
    if(!ux.ok) status=1;
  }
} finally {
  if (settingBandSnapshot && (status !== 0 || checkOnly)) {
    restoreSettingBandReports(settingBandSnapshot);
  }
  if (machineRegistrySnapshot) {
    fs.writeFileSync(machineRegistryPath, machineRegistrySnapshot);
  }
}

process.exit(status);
