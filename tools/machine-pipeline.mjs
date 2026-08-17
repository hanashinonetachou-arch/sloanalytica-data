import fs from 'node:fs';
import path from 'node:path';
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
function fail(message) { throw new Error(message); }
function runNpm(script, label) {
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const r = spawnSync(npm, ['run', script], { cwd: ROOT, encoding: 'utf8' });
  if (r.stdout) process.stdout.write(r.stdout);
  if (r.stderr) process.stderr.write(r.stderr);
  if (r.error) fail(`${label} could not start: ${r.error.message}`);
  if (r.status !== 0) fail(`${label} failed with exit code ${r.status}`);
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

  const statistics = evaluateResearchData(research);
  const machinePackage = buildMachineData(research, selection, statistics);
  const difficulty = evaluateMachineDifficulty(research, selection);

  if (!checkOnly) {
    writeJson(statisticsPath, statistics);
    writeJson(machinePath, machinePackage);
    writeJson(difficultyPath, difficulty);
    console.log('UPDATED generated artifacts');
  } else {
    console.log('CHECK mode: generated artifacts were not written');
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
  process.exit(1);
}
