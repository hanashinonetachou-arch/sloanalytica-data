import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { validateResearchData } from './validate-research-data.mjs';
import { validateSelectionData } from './validate-selection-data.mjs';
import { normalizeLookup, resolveCandidate } from './batch-research-pipeline.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MAX_BATCH = 10;
const DEFAULT_REPORT = path.join(ROOT, 'reports', 'batch-e2e-report.json');

function readJson(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }
function writeJson(p, value) { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, JSON.stringify(value, null, 2) + '\n', 'utf8'); }
function exists(p) { return fs.existsSync(p); }

export function normalizeRequests(values) {
  const out = [];
  for (const raw of values ?? []) {
    const value = String(raw).trim();
    if (!value) continue;
    if (!out.some(existing => normalizeLookup(existing) === normalizeLookup(value))) out.push(value);
  }
  if (!out.length) throw new Error('machine name, marketKey, or machineId is required');
  if (out.length > MAX_BATCH) throw new Error(`batch size exceeds ${MAX_BATCH}: ${out.length}`);
  return out;
}

export function deriveStage({ researchExists, researchOk, researchReview, selectionExists, selectionOk, selectionReview, published }) {
  if (!researchExists) return 'RESEARCH_REQUIRED';
  if (!researchOk) return 'BLOCKED';
  if (researchReview) return 'RESEARCH_REVIEW';
  if (!selectionExists) return 'SELECTION_REQUIRED';
  if (!selectionOk) return 'BLOCKED';
  if (selectionReview) return 'SELECTION_REVIEW';
  if (published) return 'PUBLISHED';
  return 'READY_FOR_MACHINE';
}

export function deriveOverallStatus(results) {
  if (results.some(r => r.stage === 'BLOCKED')) return 'BLOCKED';
  if (results.some(r => /_REVIEW$/.test(r.stage))) return 'REVIEW';
  if (results.some(r => r.stage === 'RESEARCH_REQUIRED')) return 'RESEARCH_REQUIRED';
  if (results.some(r => r.stage === 'SELECTION_REQUIRED')) return 'SELECTION_REQUIRED';
  if (results.some(r => r.stage === 'READY_FOR_MACHINE')) return 'READY_FOR_MACHINE';
  return 'PUBLISHED';
}

function listResearchIds() {
  const root = path.join(ROOT, 'research');
  if (!exists(root)) return [];
  return fs.readdirSync(root, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && exists(path.join(root, entry.name, 'research-data.json')))
    .map(entry => entry.name);
}

function resolveRequest(request, assessment) {
  const directId = listResearchIds().find(id => normalizeLookup(id) === normalizeLookup(request));
  if (directId) return { status: 'MATCHED', machineId: directId, candidate: (assessment.candidates ?? []).find(c => c.registryMachineId === directId) ?? null };
  const resolved = resolveCandidate(request, assessment.candidates ?? []);
  if (resolved.status !== 'MATCHED') return { status: resolved.status, machineId: null, candidate: null };
  return { status: 'MATCHED', machineId: resolved.candidate.registryMachineId ?? null, candidate: resolved.candidate };
}

function publishedSet() {
  const p = path.join(ROOT, 'catalog.json');
  if (!exists(p)) return new Set();
  return new Set((readJson(p).machines ?? []).map(machine => machine.machineId));
}

function assessRequest(request, assessment, publishedIds) {
  const resolved = resolveRequest(request, assessment);
  if (resolved.status !== 'MATCHED') {
    return { request, machineId: null, displayName: null, stage: 'BLOCKED', reasons: [resolved.status === 'AMBIGUOUS' ? 'candidate lookup is ambiguous' : 'candidate/research identity not found; identity is not guessed'], nextAction: 'Resolve exact machine identity/candidate entry.' };
  }
  const candidate = resolved.candidate;
  const machineId = resolved.machineId;
  if (!machineId) {
    return { request, machineId: null, displayName: candidate?.displayName ?? request, marketKey: candidate?.marketKey ?? null, stage: 'RESEARCH_REQUIRED', reasons: [], nextAction: 'Run Batch Research; authenticate exact machine identity before assigning machineId.' };
  }

  const researchPath = path.join(ROOT, 'research', machineId, 'research-data.json');
  if (!exists(researchPath)) {
    return { request, machineId, displayName: candidate?.displayName ?? request, marketKey: candidate?.marketKey ?? null, stage: 'RESEARCH_REQUIRED', reasons: [], nextAction: 'Run Batch Research.' };
  }

  try {
    const research = readJson(researchPath);
    const rv = validateResearchData(research);
    if (rv.status !== 'PASS') return { request, machineId, displayName: research.machine?.displayName ?? candidate?.displayName ?? request, stage: 'BLOCKED', reasons: rv.errors.map(e => `${e.code}: ${e.message}`), nextAction: 'Fix ResearchData validation errors.' };
    const researchReasons = (rv.warnings ?? []).map(w => `${w.code}: ${w.message}`);
    if ((research.conflicts ?? []).length) researchReasons.push(`Research conflicts: ${research.conflicts.length}`);
    if (/(未調査|暫定|要確認)/.test(String(research.machine?.displayName ?? ''))) researchReasons.push(`provisional displayName: ${research.machine.displayName}`);
    if (researchReasons.length) return { request, machineId, displayName: research.machine?.displayName ?? request, stage: 'RESEARCH_REVIEW', reasons: researchReasons, nextAction: 'Resolve ResearchData warnings/conflicts before automatic advance.' };

    const selectionPath = path.join(ROOT, 'research', machineId, 'selection-data.json');
    if (!exists(selectionPath)) return { request, machineId, displayName: research.machine?.displayName ?? request, stage: 'SELECTION_REQUIRED', reasons: [], nextAction: 'Run Batch Selection.' };
    const selection = readJson(selectionPath);
    const sv = validateSelectionData(selection, research);
    if (!sv.ok) return { request, machineId, displayName: research.machine?.displayName ?? request, stage: 'BLOCKED', reasons: sv.errors, nextAction: 'Fix SelectionData validation errors.' };
    if (sv.warnings.length) return { request, machineId, displayName: research.machine?.displayName ?? request, stage: 'SELECTION_REVIEW', reasons: sv.warnings, nextAction: 'Review SelectionData warnings.' };
    const isPublished = publishedIds.has(machineId);
    return { request, machineId, displayName: research.machine?.displayName ?? request, stage: isPublished ? 'PUBLISHED' : 'READY_FOR_MACHINE', reasons: [], nextAction: isPublished ? 'No action required.' : 'Run Batch Machine Pipeline check; publish remains a separate approval step.' };
  } catch (error) {
    return { request, machineId, displayName: candidate?.displayName ?? request, stage: 'BLOCKED', reasons: [error instanceof Error ? error.message : String(error)], nextAction: 'Fix unreadable/inconsistent data.' };
  }
}

function readRequestsFromFile(filePath) {
  const full = path.resolve(ROOT, filePath);
  const text = fs.readFileSync(full, 'utf8').trim();
  if (!text) return [];
  if (full.endsWith('.json')) {
    const value = JSON.parse(text);
    if (Array.isArray(value)) return value;
    if (Array.isArray(value.machines)) return value.machines.map(v => typeof v === 'string' ? v : v.displayName ?? v.machineId ?? v.marketKey);
    throw new Error('JSON batch file must be an array or {"machines": [...]}');
  }
  return text.split(/\r?\n/).map(v => v.trim()).filter(Boolean);
}

function runNode(script, args) {
  const result = spawnSync(process.execPath, [path.join(ROOT, 'tools', script), ...args], { cwd: ROOT, encoding: 'utf8' });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  return { script, args, ok: !result.error && result.status === 0, exitCode: result.status, error: result.error?.message ?? null };
}

function parseArgs(argv) {
  const requests = [];
  let file = null, report = DEFAULT_REPORT, advance = false, help = false;
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--file') file = argv[++i];
    else if (arg === '--report') report = path.resolve(ROOT, argv[++i]);
    else if (arg === '--advance') advance = true;
    else if (arg === '--check') advance = false;
    else if (arg === '--help' || arg === '-h') help = true;
    else requests.push(arg);
  }
  return { requests, file, report, advance, help };
}

function printHelp() {
  console.log(`SloAnalytica Batch End-to-End Orchestrator v2\n\nStatus only (default):\n  npm run batch:e2e -- MACHINE_1 MACHINE_2\n  npm run batch:e2e -- --file batch.txt\n\nSafely advance available stages:\n  npm run batch:e2e -- MACHINE_1 MACHINE_2 --advance\n\nOptions:\n  --check          status-only alias; no stage workspaces/generation\n  --advance        prepare Research/Selection workspaces and run Machine Batch in --check mode\n  --file <path>    newline or JSON list, maximum ${MAX_BATCH}\n  --report <path>  unified JSON report\n\nSafety:\n  - Research advance is routed through strict Research Completeness v2 / Machine Observation gates\n  - Selection advance is routed through strict evidence-coverage gates and Policy-v2 validation\n  - never invents machineId, probabilities, Selection decisions, mappings, weights, or exposure\n  - REVIEW/BLOCKED stages are not auto-advanced\n  - Machine stage is CHECK only; generated MachineData/catalog changes are rolled back\n  - publish/approve is intentionally outside this orchestrator\n`);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) return printHelp();
  const startedAt = Date.now();
  try {
    const raw = [...args.requests, ...(args.file ? readRequestsFromFile(args.file) : [])];
    const requests = normalizeRequests(raw);
    const assessment = readJson(path.join(ROOT, 'machine-candidate-assessment.json'));
    const publishedIds = publishedSet();
    const before = requests.map(request => assessRequest(request, assessment, publishedIds));
    const actions = [];

    if (args.advance) {
      const researchRequests = before.filter(r => r.stage === 'RESEARCH_REQUIRED').map(r => r.request);
      const selectionIds = before.filter(r => r.stage === 'SELECTION_REQUIRED').map(r => r.machineId).filter(Boolean);
      const machineIds = before.filter(r => r.stage === 'READY_FOR_MACHINE').map(r => r.machineId).filter(Boolean);
      if (researchRequests.length) actions.push(runNode('strict-batch-research-pipeline.mjs', researchRequests));
      if (selectionIds.length) actions.push(runNode('strict-batch-selection-pipeline.mjs', selectionIds));
      if (machineIds.length) actions.push(runNode('batch-machine-pipeline.mjs', [...machineIds, '--check']));
    }

    const after = requests.map(request => assessRequest(request, assessment, publishedIds));
    const counts = {};
    for (const result of after) counts[result.stage] = (counts[result.stage] ?? 0) + 1;
    const report = {
      schemaVersion: 'batch-e2e-orchestrator-report-v2',
      generatedAt: new Date().toISOString(),
      mode: args.advance ? 'ADVANCE_SAFE' : 'STATUS',
      maxBatchSize: MAX_BATCH,
      policyBaseline: 'PHASE12_101_MACHINE_AUDITED_BASELINE',
      overallStatus: deriveOverallStatus(after),
      counts,
      requests,
      before,
      actions,
      results: after,
      safety: { researchCompletenessV2: true, machineObservationRequired: true, featureSelectionPolicyV2: true, userVerifiedUxProtected: true, reviewAutoAdvance: false, machineWrite: false, publishIncluded: false },
      durationMs: Date.now() - startedAt,
    };
    writeJson(args.report, report);
    console.log(`E2E ${report.overallStatus}: ${Object.entries(counts).map(([k,v]) => `${k}=${v}`).join(' ')}`);
    console.log(`Report: ${path.relative(ROOT, args.report)}`);
    if (report.overallStatus === 'BLOCKED' || actions.some(action => !action.ok)) process.exitCode = 1;
  } catch (error) {
    console.error(`E2E FAILED: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 2;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
