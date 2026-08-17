import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { validateResearchData } from './validate-research-data.mjs';
import { validateSelectionData } from './validate-selection-data.mjs';
import { evaluateResearchData } from './evaluate-research-statistics.mjs';
import { buildMachineData } from './build-machine-data.mjs';
import { evaluateMachineDifficulty } from './evaluate-machine-difficulty.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function readJson(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }
function writeJson(p, value) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(value, null, 2) + '\n', 'utf8');
}
function withoutGeneratedAt(value) {
  if (Array.isArray(value)) return value.map(withoutGeneratedAt);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value)
      .filter(([key]) => key !== 'generatedAt')
      .map(([key, child]) => [key, withoutGeneratedAt(child)]));
  }
  return value;
}
function preserveGeneratedAtIfEquivalent(existingPath, nextValue) {
  if (!fs.existsSync(existingPath) || !nextValue || typeof nextValue !== 'object') return nextValue;
  try {
    const existing = readJson(existingPath);
    const equivalent = JSON.stringify(withoutGeneratedAt(existing)) === JSON.stringify(withoutGeneratedAt(nextValue));
    if (equivalent && existing.generatedAt && 'generatedAt' in nextValue) {
      return { ...nextValue, generatedAt: existing.generatedAt };
    }
  } catch {
    // Invalid pre-existing generated data should be replaced by the freshly generated value.
  }
  return nextValue;
}
function fail(message) { throw new Error(message); }
function runNpm(script, label) {
  // Prefer npm's JavaScript entry point inherited from the parent `npm run` process.
  // This avoids spawning npm.cmd directly on Windows, which can fail with EINVAL
  // on some Node/Windows combinations.
  const npmExecPath = process.env.npm_execpath;
  let command;
  let args;

  if (npmExecPath) {
    command = process.execPath;
    args = [npmExecPath, 'run', script];
  } else if (process.platform === 'win32') {
    command = process.env.ComSpec || 'cmd.exe';
    args = ['/d', '/s', '/c', `npm run ${script}`];
  } else {
    command = 'npm';
    args = ['run', script];
  }

  const r = spawnSync(command, args, { cwd: ROOT, encoding: 'utf8' });
  if (r.stdout) process.stdout.write(r.stdout);
  if (r.stderr) process.stderr.write(r.stderr);
  if (r.error) fail(`${label} could not start: ${r.error.message}`);
  if (r.status !== 0) fail(`${label} failed with exit code ${r.status}`);
}
function runNode(args, label) {
  const r = spawnSync(process.execPath, args, { cwd: ROOT, encoding: 'utf8' });
  if (r.stdout) process.stdout.write(r.stdout);
  if (r.stderr) process.stderr.write(r.stderr);
  if (r.error) fail(`${label} could not start: ${r.error.message}`);
  if (r.status !== 0) fail(`${label} failed with exit code ${r.status}`);
}
function syncExistingCatalogMetadata(catalogPath, machinePath, machinePackage, machineId) {
  const catalog = readJson(catalogPath);
  const entry = (catalog.machines ?? []).find(m => m.machineId === machineId);
  if (!entry) return false;
  const bytes = fs.readFileSync(machinePath);
  const nextVersion = machinePackage.machine?.machineDataVersion;
  const nextSha = crypto.createHash('sha256').update(bytes).digest('hex');
  const nextSize = bytes.length;
  const featureModelCapabilities = [...new Set((machinePackage.features?.features ?? [])
    .map(feature => feature?.modelType)
    .filter(modelType => typeof modelType === 'string' && modelType.length > 0))];
  const previousCapabilities = Array.isArray(entry.requiredCapabilities) ? entry.requiredCapabilities : [];
  const nextCapabilities = [...new Set([...previousCapabilities, ...featureModelCapabilities])];
  const changed = entry.machineDataVersion !== nextVersion ||
    entry.sha256 !== nextSha ||
    entry.packageSizeBytes !== nextSize ||
    JSON.stringify(previousCapabilities) !== JSON.stringify(nextCapabilities);
  entry.machineDataVersion = nextVersion;
  entry.sha256 = nextSha;
  entry.packageSizeBytes = nextSize;
  entry.requiredCapabilities = nextCapabilities;
  if (changed) catalog.generatedAt = new Date().toISOString();
  writeJson(catalogPath, catalog);
  console.log(`Catalog metadata sync: ${machineId}${changed ? ' (updated)' : ' (unchanged)'}`);
  console.log(`  version: ${entry.machineDataVersion}`);
  console.log(`  size: ${entry.packageSizeBytes}`);
  console.log(`  sha256: ${entry.sha256}`);
  console.log(`  capabilities: ${entry.requiredCapabilities.join(', ')}`);
  return true;
}

const [machineId, ...flags] = process.argv.slice(2);
if (!machineId || !/^[A-Z0-9_]+$/.test(machineId)) {
  console.error('Usage: npm run machine:pipeline -- <MACHINE_ID> [--check]');
  process.exit(2);
}
const checkOnly = flags.includes('--check');
const researchDir = path.join(ROOT, 'research', machineId);
const researchPath = path.join(researchDir, 'research-data.json');
const selectionPath = path.join(researchDir, 'selection-data.json');
const statisticsPath = path.join(researchDir, 'statistics-report.json');
const difficultyPath = path.join(researchDir, 'difficulty-report.json');
const machinePath = path.join(ROOT, 'machines', machineId, 'machine-package.json');
const catalogPath = path.join(ROOT, 'catalog.json');
const difficultyCatalogPath = path.join(ROOT, 'difficulty-catalog.json');
let difficultyCatalogBackup = null;
let catalogBackup = null;

try {
  if (!fs.existsSync(researchPath)) fail(`ResearchData not found: ${path.relative(ROOT, researchPath)}`);
  if (!fs.existsSync(selectionPath)) fail(`SelectionData not found: ${path.relative(ROOT, selectionPath)}`);

  const research = readJson(researchPath);
  const selection = readJson(selectionPath);
  if (research.machine?.machineId !== machineId) fail(`ResearchData machineId mismatch: ${research.machine?.machineId}`);
  if (selection.machineId !== machineId) fail(`SelectionData machineId mismatch: ${selection.machineId}`);

  const researchValidation = validateResearchData(research);
  if (researchValidation.status !== 'PASS') {
    for (const e of researchValidation.errors ?? []) console.error(`ERROR [ResearchData/${e.code}]: ${e.message}`);
    fail('ResearchData validation failed');
  }
  for (const w of researchValidation.warnings ?? []) console.warn(`WARNING [ResearchData/${w.code}]: ${w.message}`);
  console.log(`PASS ResearchData (${researchValidation.warnings?.length ?? 0} warnings)`);

  const selectionValidation = validateSelectionData(selection, research);
  if (!selectionValidation.ok) {
    for (const e of selectionValidation.errors ?? []) console.error(`ERROR [SelectionData]: ${e}`);
    fail('SelectionData validation failed');
  }
  for (const w of selectionValidation.warnings ?? []) console.warn(`WARNING [SelectionData]: ${w}`);
  console.log(`PASS SelectionData (${selectionValidation.warnings?.length ?? 0} warnings)`);

  let statistics = evaluateResearchData(research);
  const machinePackage = buildMachineData(research, selection, statistics);
  let difficulty = evaluateMachineDifficulty(research, selection);
  statistics = preserveGeneratedAtIfEquivalent(statisticsPath, statistics);
  difficulty = preserveGeneratedAtIfEquivalent(difficultyPath, difficulty);

  if (!checkOnly) {
    writeJson(statisticsPath, statistics);
    writeJson(machinePath, machinePackage);
    writeJson(difficultyPath, difficulty);
    console.log('UPDATED generated artifacts');
  } else {
    console.log('CHECK mode: generated artifacts were not written');
  }

  const catalog = readJson(catalogPath);
  const isPublished = (catalog.machines ?? []).some(m => m.machineId === machineId);
  if (isPublished) {
    if (checkOnly) {
      difficultyCatalogBackup = fs.readFileSync(difficultyCatalogPath);
      catalogBackup = fs.readFileSync(catalogPath);
      writeJson(statisticsPath, statistics);
      writeJson(machinePath, machinePackage);
      writeJson(difficultyPath, difficulty);
    }
    syncExistingCatalogMetadata(catalogPath, machinePath, machinePackage, machineId);
    runNode(['tools/sync-machine-difficulty-catalog.mjs', machineId], 'difficulty catalog sync');
    if (checkOnly) console.log('CHECK mode: Catalog metadata and Difficulty Catalog synced temporarily for contract tests');
  } else {
    console.log('Catalog/Difficulty sync skipped: machine is not yet published in catalog.json');
  }

  runNpm('test', 'test');
  runNpm('audit', 'audit');

  const scores = (difficulty.targets ?? []).map(t => `${t.games}G=${t.score}`).join(' / ');
  const included = difficulty.coverage?.includedNumericFeatureCount ?? 0;
  const excluded = difficulty.coverage?.explicitlyExcludedNumericFeatureCount ?? 0;
  console.log('');
  console.log(`PIPELINE PASS: ${machineId}`);
  console.log(`Raw Score: ${scores || 'N/A'}`);
  console.log(`Difficulty Features: included=${included}, excluded=${excluded}`);
  console.log(`Mode: ${checkOnly ? 'CHECK' : 'WRITE'}`);
} catch (error) {
  console.error(`PIPELINE FAILED: ${machineId}`);
  console.error(`ERROR: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
} finally {
  if (checkOnly) {
    if (difficultyCatalogBackup) fs.writeFileSync(difficultyCatalogPath, difficultyCatalogBackup);
    if (catalogBackup) fs.writeFileSync(catalogPath, catalogBackup);
    for (const p of [statisticsPath, difficultyPath]) {
      if (fs.existsSync(p)) {
        const r = spawnSync('git', ['checkout', '--', path.relative(ROOT, p)], { cwd: ROOT, encoding: 'utf8' });
        if (r.status !== 0 && fs.existsSync(p)) fs.rmSync(p);
      }
    }
    if (fs.existsSync(machinePath)) {
      const r = spawnSync('git', ['checkout', '--', path.relative(ROOT, machinePath)], { cwd: ROOT, encoding: 'utf8' });
      if (r.status !== 0 && fs.existsSync(machinePath)) fs.rmSync(machinePath);
    }
  }
}
