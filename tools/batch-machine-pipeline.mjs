import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { validateResearchData } from './validate-research-data.mjs';
import { validateSelectionData } from './validate-selection-data.mjs';
import { assessSelectionQuality } from './selection-quality-gate.mjs';

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

export function classifyMachineQuality({ researchValidation, selectionValidation, selectionQuality, research }) {
  if (researchValidation?.status !== 'PASS') return { status: 'BLOCKED', reasons: ['ResearchData validation failed'] };
  if (!selectionValidation?.ok) return { status: 'BLOCKED', reasons: ['SelectionData validation failed'] };
  if (selectionQuality?.status === 'BLOCKED') {
    return { status: 'BLOCKED', reasons: (selectionQuality.blockers ?? []).map(reason => `Selection quality: ${reason}`) };
  }
  const reasons = [];
  for (const warning of researchValidation?.warnings ?? []) reasons.push(`ResearchData: ${warning.message ?? warning}`);
  for (const warning of selectionValidation?.warnings ?? []) reasons.push(`SelectionData: ${warning}`);
  for (const review of selectionQuality?.reviews ?? []) reasons.push(`Selection quality: ${review}`);
  if ((research?.conflicts ?? []).length) reasons.push(`Research conflicts: ${research.conflicts.length}`);
  const displayName = String(research?.machine?.displayName ?? '');
  if (/(未調査|暫定|要確認)/.test(displayName)) reasons.push(`provisional displayName: ${displayName}`);
  return { status: reasons.length ? 'REVIEW' : 'PASS', reasons };
}

export function deriveOverallStatus(results, repositoryChecksOk = true) {
  if (!repositoryChecksOk || results.some(result => result.status === 'BLOCKED')) return 'BLOCKED';
  if (results.some(result => result.status === 'REVIEW')) return 'REVIEW';
  return 'PASS';
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
export function generatedPaths(machineIds) {
  const paths = [
    path.join(ROOT, 'catalog.json'),
    path.join(ROOT, 'difficulty-catalog.json'),
    path.join(ROOT, 'machine-registry.json'),
  ];
  for (const machineId of machineIds) {
    paths.push(
      path.join(ROOT, 'research', machineId, 'statistics-report.json'),
      path.join(ROOT, 'research', machineId, 'difficulty-report.json'),
      path.join(ROOT, 'research', machineId, 'setting-band-report.json'),
      path.join(ROOT, 'machines', machineId, 'machine-package.json'),
    );
  }
  return [...new Set(paths)];
}
function snapshotFiles(paths) {
  return new Map(paths.map(p => [p, fs.existsSync(p) ? fs.readFileSync(p) : null]));
}
function restoreFiles(snapshot) {
  for (const [p, bytes] of snapshot.entries()) {
    if (bytes === null) {
      if (fs.existsSync(p)) fs.rmSync(p, { force: true });
      continue;
    }
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, bytes);
  }
}
function runPipeline(machineId) {
  const args = [path.join(ROOT, 'tools', 'machine-pipeline.mjs'), machineId, '--skip-repo-checks'];
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
function resolveNpmCommand(script) {
  const npmExecPath = process.env.npm_execpath;
  if (npmExecPath) return { command: process.execPath, args: [npmExecPath, 'run', script] };
  if (process.platform === 'win32') {
    return { command: process.env.ComSpec || 'cmd.exe', args: ['/d', '/s', '/c', `npm run ${script}`] };
  }
  return { command: 'npm', args: ['run', script] };
}
function runRepositoryCheck(script) {
  const { command, args } = resolveNpmCommand(script);
  const startedAt = Date.now();
  const result = spawnSync(command, args, { cwd: ROOT, encoding: 'utf8' });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  return {
    script,
    ok: !result.error && result.status === 0,
    exitCode: result.status,
    durationMs: Date.now() - startedAt,
    error: result.error?.message ?? null,
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
    const selectionQuality = assessSelectionQuality(research, selection);
    return classifyMachineQuality({ researchValidation, selectionValidation, selectionQuality, research });
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
  console.log(`SloAnalytica Batch Machine Pipeline v1\nUsage:\n  node tools/batch-machine-pipeline.mjs MACHINE_ID [MACHINE_ID ...] [--check]\n  node tools/batch-machine-pipeline.mjs --file batch.txt [--check]\n  node tools/batch-machine-pipeline.mjs --file batch.json --report reports/custom.json\n\nRules:\n  - maximum ${MAX_BATCH} machines per batch\n  - Research/Selection validation and Selection Quality Gate run before generation\n  - Selection Quality BLOCKED prevents generation; REVIEW is surfaced in the batch result\n  - machine generation/validation runs per machine\n  - repository test/audit/service-name audit run once at batch end\n  - WRITE is atomic: any BLOCKED/repository-check failure rolls back the entire batch\n  - CHECK always restores generated files after validation\n  - report classifies PASS / REVIEW / BLOCKED\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    process.exit(0);
  }

  let snapshot = null;
  try {
    const inputValues = [...args.machineArgs, ...(args.file ? readIdsFromFile(args.file) : [])];
    const machineIds = normalizeMachineIds(inputValues);
    const results = [];
    const startedAt = Date.now();
    snapshot = snapshotFiles(generatedPaths(machineIds));
    console.log(`BATCH START: ${machineIds.length} machines / mode=${args.checkOnly ? 'CHECK' : 'WRITE'}`);

    for (const machineId of machineIds) {
      console.log(`\n=== ${machineId} ===`);
      const quality = preflight(machineId);
      if (quality.status === 'BLOCKED') {
        console.log(`BLOCKED: ${quality.reasons.join(' / ')}`);
        results.push({ machineId, status: 'BLOCKED', reasons: quality.reasons, pipeline: null });
        continue;
      }
      const pipeline = runPipeline(machineId);
      if (pipeline.stdout) process.stdout.write(pipeline.stdout);
      if (pipeline.stderr) process.stderr.write(pipeline.stderr);
      const status = pipeline.ok ? quality.status : 'BLOCKED';
      const reasons = pipeline.ok ? quality.reasons : [...quality.reasons, 'machine:pipeline failed'];
      results.push({ machineId, status, reasons, pipeline: { ok: pipeline.ok, exitCode: pipeline.exitCode, durationMs: pipeline.durationMs } });
    }

    const machinePhaseBlocked = results.some(result => result.status === 'BLOCKED');
    const repositoryChecks = [];
    if (!machinePhaseBlocked) {
      console.log('\n=== REPOSITORY CHECKS (ONCE PER BATCH) ===');
      for (const script of ['test', 'audit', 'audit:ui-service-names']) {
        const check = runRepositoryCheck(script);
        repositoryChecks.push(check);
        if (!check.ok) break;
      }
    } else {
      console.log('\nRepository checks skipped: machine phase contains BLOCKED result.');
    }

    const repositoryChecksOk = !machinePhaseBlocked && repositoryChecks.length === 3 && repositoryChecks.every(check => check.ok);
    const counts = { PASS: 0, REVIEW: 0, BLOCKED: 0 };
    for (const result of results) counts[result.status] += 1;
    const overallStatus = deriveOverallStatus(results, repositoryChecksOk);
    const shouldRollback = args.checkOnly || overallStatus === 'BLOCKED';
    if (shouldRollback) restoreFiles(snapshot);

    const report = {
      schemaVersion: 'batch-machine-pipeline-report-v1',
      generatedAt: new Date().toISOString(),
      mode: args.checkOnly ? 'CHECK' : 'WRITE',
      maxBatchSize: MAX_BATCH,
      atomicWrite: true,
      rolledBack: shouldRollback,
      overallStatus,
      counts,
      machineIds,
      repositoryChecks,
      durationMs: Date.now() - startedAt,
      results,
    };
    writeJson(args.report, report);

    console.log(`\nBATCH ${overallStatus}: PASS=${counts.PASS} REVIEW=${counts.REVIEW} BLOCKED=${counts.BLOCKED}`);
    console.log(`Repository checks: ${repositoryChecksOk ? 'PASS' : 'NOT PASS'}`);
    console.log(`Rolled back: ${shouldRollback ? 'yes' : 'no'}`);
    console.log(`Duration: ${report.durationMs}ms`);
    console.log(`Report: ${path.relative(ROOT, args.report)}`);
    if (overallStatus === 'BLOCKED') process.exitCode = 1;
  } catch (error) {
    if (snapshot) restoreFiles(snapshot);
    console.error(`BATCH FAILED: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 2;
  }
}
