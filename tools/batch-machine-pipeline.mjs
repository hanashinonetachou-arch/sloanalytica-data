import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { validateResearchData } from './validate-research-data.mjs';
import { validateSelectionData } from './validate-selection-data.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_REPORT = path.join(ROOT, 'reports', 'batch-machine-pipeline-report.json');
const MAX_BATCH = 10;

export function normalizeMachineIds(values) {
  const ids = [];
  for (const raw of values ?? []) {
    for (const token of String(raw).split(/[\s,]+/)) {
      if (!token) continue;
      if (!/^[A-Z0-9_]+$/.test(token)) throw new Error(`invalid machineId: ${token}`);
      if (!ids.includes(token)) ids.push(token);
    }
  }
  if (!ids.length) throw new Error('machineId is required');
  if (ids.length > MAX_BATCH) throw new Error(`batch size exceeds ${MAX_BATCH}: ${ids.length}`);
  return ids;
}

export function classifyMachineQuality({ researchValidation, selectionValidation, research }) {
  if (researchValidation?.status !== 'PASS') return { status: 'BLOCKED', reasons: ['ResearchData validation failed'] };
  if (!selectionValidation?.ok) return { status: 'BLOCKED', reasons: ['SelectionData validation failed'] };
  const reasons = [];
  for (const warning of researchValidation?.warnings ?? []) reasons.push(`ResearchData: ${warning.message ?? warning}`);
  for (const warning of selectionValidation?.warnings ?? []) reasons.push(`SelectionData: ${warning}`);
  if ((research?.conflicts ?? []).length) reasons.push(`Research conflicts: ${research.conflicts.length}`);
  const displayName = String(research?.machine?.displayName ?? '');
  if (/(未調査|暫定|要確認)/.test(displayName)) reasons.push(`provisional displayName: ${displayName}`);
  return { status: reasons.length ? 'REVIEW' : 'PASS', reasons };
}

function readJson(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }
function writeJson(p, value) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(value, null, 2) + '\n', 'utf8');
}
function readIdsFromFile(filePath) {
  const full = path.resolve(ROOT, filePath);
  const text = fs.readFileSync(full, 'utf8');
  if (full.endsWith('.json')) {
    const value = JSON.parse(text);
    if (Array.isArray(value)) return value;
    if (Array.isArray(value.machineIds)) return value.machineIds;
    throw new Error('JSON batch file must be an array or {"machineIds": [...]}');
  }
  return text.split(/\r?\n/).map(v => v.trim()).filter(Boolean);
}
function runPipeline(machineId, checkOnly) {
  const args = [path.join(ROOT, 'tools', 'machine-pipeline.mjs'), machineId];
  if (checkOnly) args.push('--check');
  const startedAt = Date.now();
  const result = spawnSync(process.execPath, args, { cwd: ROOT, encoding: 'utf8' });
  return {
    ok: result.status === 0,
    exitCode: result.status,
    durationMs: Date.now() - startedAt,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  };
}
function preflight(machineId) {
  const researchPath = path.join(ROOT, 'research', machineId, 'research-data.json');
  const selectionPath = path.join(ROOT, 'research', machineId, 'selection-data.json');
  if (!fs.existsSync(researchPath) || !fs.existsSync(selectionPath)) {
    return { status: 'BLOCKED', reasons: [
      !fs.existsSync(researchPath) ? 'ResearchData missing' : null,
      !fs.existsSync(selectionPath) ? 'SelectionData missing' : null,
    ].filter(Boolean) };
  }
  try {
    const research = readJson(researchPath);
    const selection = readJson(selectionPath);
    const researchValidation = validateResearchData(research);
    const selectionValidation = validateSelectionData(selection, research);
    return classifyMachineQuality({ researchValidation, selectionValidation, research });
  } catch (error) {
    return { status: 'BLOCKED', reasons: [error instanceof Error ? error.message : String(error)] };
  }
}
function parseArgs(argv) {
  const machineArgs = [];
  let file = null;
  let report = DEFAULT_REPORT;
  let checkOnly = false;
  let help = false;
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--check') checkOnly = true;
    else if (arg === '--help' || arg === '-h') help = true;
    else if (arg === '--file') file = argv[++i];
    else if (arg === '--report') report = path.resolve(ROOT, argv[++i]);
    else machineArgs.push(arg);
  }
  return { machineArgs, file, report, checkOnly, help };
}
function printHelp() {
  console.log(`SloAnalytica Batch Machine Pipeline v1\nUsage:\n  npm run machine:batch -- MACHINE_ID [MACHINE_ID ...] [--check]\n  npm run machine:batch -- --file batch.txt [--check]\n  npm run machine:batch -- --file batch.json --report reports/custom.json\n\nRules:\n  - maximum ${MAX_BATCH} machines per batch\n  - each machine runs the existing machine:pipeline contract\n  - report classifies PASS / REVIEW / BLOCKED\n  - --check keeps generated MachineData/catalog changes temporary\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    process.exit(0);
  }
  try {
    const inputValues = [...args.machineArgs, ...(args.file ? readIdsFromFile(args.file) : [])];
    const machineIds = normalizeMachineIds(inputValues);
    const results = [];
    console.log(`BATCH START: ${machineIds.length} machines / mode=${args.checkOnly ? 'CHECK' : 'WRITE'}`);

    for (const machineId of machineIds) {
      console.log(`\n=== ${machineId} ===`);
      const quality = preflight(machineId);
      if (quality.status === 'BLOCKED') {
        console.log(`BLOCKED: ${quality.reasons.join(' / ')}`);
        results.push({ machineId, status: 'BLOCKED', reasons: quality.reasons, pipeline: null });
        continue;
      }
      const pipeline = runPipeline(machineId, args.checkOnly);
      if (pipeline.stdout) process.stdout.write(pipeline.stdout);
      if (pipeline.stderr) process.stderr.write(pipeline.stderr);
      const status = pipeline.ok ? quality.status : 'BLOCKED';
      const reasons = pipeline.ok ? quality.reasons : [...quality.reasons, 'machine:pipeline failed'];
      results.push({ machineId, status, reasons, pipeline: { ok: pipeline.ok, exitCode: pipeline.exitCode, durationMs: pipeline.durationMs } });
    }

    const counts = { PASS: 0, REVIEW: 0, BLOCKED: 0 };
    for (const result of results) counts[result.status] += 1;
    const overallStatus = counts.BLOCKED ? 'BLOCKED' : counts.REVIEW ? 'REVIEW' : 'PASS';
    const report = {
      schemaVersion: 'batch-machine-pipeline-report-v1',
      generatedAt: new Date().toISOString(),
      mode: args.checkOnly ? 'CHECK' : 'WRITE',
      maxBatchSize: MAX_BATCH,
      overallStatus,
      counts,
      machineIds,
      results,
    };
    writeJson(args.report, report);

    console.log(`\nBATCH ${overallStatus}: PASS=${counts.PASS} REVIEW=${counts.REVIEW} BLOCKED=${counts.BLOCKED}`);
    console.log(`Report: ${path.relative(ROOT, args.report)}`);
    if (overallStatus === 'BLOCKED') process.exitCode = 1;
  } catch (error) {
    console.error(`BATCH FAILED: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 2;
  }
}
