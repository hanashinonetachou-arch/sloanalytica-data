import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateResearchData } from './validate-research-data.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MAX_BATCH = 10;
const DEFAULT_REPORT = path.join(ROOT, 'reports', 'batch-research-pipeline-report.json');

export function normalizeLookup(value) {
  return String(value ?? '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\s　]+/g, '')
    .replace(/[・･\-‐‑‒–—―]/g, '');
}

export function normalizeRequests(values) {
  const out = [];
  for (const raw of values ?? []) {
    const value = String(raw).trim();
    if (!value) continue;
    if (!out.some(v => normalizeLookup(v) === normalizeLookup(value))) out.push(value);
  }
  if (!out.length) throw new Error('machine name, marketKey, or machineId is required');
  if (out.length > MAX_BATCH) throw new Error(`batch size exceeds ${MAX_BATCH}: ${out.length}`);
  return out;
}

export function resolveCandidate(request, candidates) {
  const key = normalizeLookup(request);
  const matches = (candidates ?? []).filter(candidate => [
    candidate.marketKey,
    candidate.registryMachineId,
    candidate.displayName,
  ].some(value => value && normalizeLookup(value) === key));
  if (matches.length === 1) return { status: 'MATCHED', candidate: matches[0] };
  if (matches.length > 1) return { status: 'AMBIGUOUS', candidates: matches };
  return { status: 'NOT_FOUND', candidates: [] };
}

export function classifyResearchData(data) {
  const validation = validateResearchData(data);
  if (validation.status !== 'PASS') {
    return {
      status: 'BLOCKED',
      reasons: validation.errors.map(error => `${error.code}: ${error.message}`),
      warnings: validation.warnings,
    };
  }
  const reasons = validation.warnings.map(warning => `${warning.code}: ${warning.message}`);
  if ((data.conflicts ?? []).length) reasons.push(`Research conflicts: ${data.conflicts.length}`);
  const provisional = /(未調査|暫定|要確認)/.test(String(data.machine?.displayName ?? ''));
  if (provisional) reasons.push(`provisional displayName: ${data.machine.displayName}`);
  return {
    status: reasons.length ? 'REVIEW' : 'READY_FOR_SELECTION',
    reasons,
    warnings: validation.warnings,
  };
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + '\n', 'utf8');
}

function readRequestsFromFile(filePath) {
  const full = path.resolve(ROOT, filePath);
  const text = fs.readFileSync(full, 'utf8');
  if (full.endsWith('.json')) {
    const value = JSON.parse(text);
    if (Array.isArray(value)) return value;
    if (Array.isArray(value.machines)) return value.machines.map(v => typeof v === 'string' ? v : v.displayName ?? v.machineId ?? v.marketKey);
    throw new Error('JSON batch file must be an array or {"machines": [...]}');
  }
  return text.split(/\r?\n/).map(v => v.trim()).filter(Boolean);
}

function slug(value) {
  const normalized = String(value).normalize('NFKC').replace(/[^A-Za-z0-9_-]+/g, '_').replace(/^_+|_+$/g, '');
  return normalized.slice(0, 60) || 'machine';
}

function buildResearchBrief(candidate, batchId) {
  return {
    schemaVersion: 'batch-research-brief-v1',
    batchId,
    marketKey: candidate?.marketKey ?? null,
    displayName: candidate?.displayName ?? null,
    registryMachineId: candidate?.registryMachineId ?? null,
    status: 'RESEARCH_REQUIRED',
    marketContext: candidate ? {
      marketScore: candidate.marketScore ?? null,
      researchReadiness: candidate.researchReadiness ?? null,
      platformFit: candidate.platformFit ?? null,
      estimatedWorkload: candidate.estimatedWorkload ?? null,
      settingInferenceValue: candidate.settingInferenceValue ?? null,
      assessmentStatus: candidate.assessmentStatus ?? null,
      notes: candidate.notes ?? null,
    } : null,
    requiredResearchOutputs: [
      'formal machine authentication before assigning a new machineId',
      'official machine identity, manufacturer, settings and introduction information',
      'multiple-source setting-difference facts with exact URLs and checkedAt',
      'candidate numeric Feature definitions including numerator, denominator, trialUnit and setting values',
      'candidate Evidence definitions limited to confirmed/denied setting information where applicable',
      'machine-linked service availability (e.g. play-data linking feature) and every retrievable counter/item when present',
      'source conflict log; unresolved conflicts must remain explicit',
      'final research-data.json conforming to research-data-v1',
    ],
    sourcePolicy: {
      preferred: ['manufacturer official information', 'major pachislot analysis sites', 'primary/official service documentation when available'],
      crossCheck: 'Important setting-difference values should be cross-checked across multiple reputable sources where available.',
      noFabrication: 'Never invent missing settings, probabilities, denominators, machineId, or service counters.',
      conflictPolicy: 'Do not silently reconcile conflicting sources. Record the conflict and route to REVIEW.',
    },
    machineLinkedServicePolicy: {
      required: true,
      instruction: 'Always investigate whether a machine-linked/play-data service exists. If it exists, investigate concrete retrievable values and counters. If existence is known but details cannot be verified, mark the machine provisional/unresearched for that service rather than inventing fields.',
    },
    nextAction: 'Perform web research, write research-data.json into this workspace, then rerun the batch research pipeline with --ingest <workspace>.',
  };
}

function parseArgs(argv) {
  const requests = [];
  let file = null;
  let report = DEFAULT_REPORT;
  let ingest = null;
  let checkOnly = false;
  let help = false;
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--file') file = argv[++i];
    else if (arg === '--report') report = path.resolve(ROOT, argv[++i]);
    else if (arg === '--ingest') ingest = path.resolve(ROOT, argv[++i]);
    else if (arg === '--check') checkOnly = true;
    else if (arg === '--help' || arg === '-h') help = true;
    else requests.push(arg);
  }
  return { requests, file, report, ingest, checkOnly, help };
}

function printHelp() {
  console.log(`SloAnalytica Batch Research Pipeline v1\n\nPrepare research workspaces:\n  npm run research:batch -- "Machine A" "Machine B"\n  npm run research:batch -- --file batch.txt\n\nValidate/ingest researched workspaces:\n  npm run research:batch -- --ingest research-batch/BATCH_ID\n\nOptions:\n  --check              validate/plan without writing workspaces or ResearchData\n  --report <path>      custom JSON report path\n  --file <path>        newline or JSON list, maximum ${MAX_BATCH}\n  --ingest <workspace> validate research-data.json files and copy PASS/REVIEW data to research/<MACHINE_ID>/\n\nSafety:\n  - never invents machineId or analysis values\n  - unresolved conflicts stay REVIEW\n  - invalid ResearchData is BLOCKED and never ingested\n`);
}

function findResearchFiles(root) {
  if (!fs.existsSync(root)) throw new Error(`ingest workspace not found: ${path.relative(ROOT, root)}`);
  const files = [];
  const walk = current => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile() && entry.name === 'research-data.json') files.push(full);
    }
  };
  walk(root);
  return files;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) return printHelp();
  const startedAt = Date.now();
  const assessmentPath = path.join(ROOT, 'machine-candidate-assessment.json');
  const assessment = readJson(assessmentPath);

  if (args.ingest) {
    const files = findResearchFiles(args.ingest);
    const results = [];
    const seenIds = new Set();
    for (const filePath of files) {
      try {
        const data = readJson(filePath);
        const machineId = data.machine?.machineId;
        if (!machineId || !/^[A-Z0-9_]+$/.test(machineId)) {
          results.push({ file: path.relative(ROOT, filePath), machineId: machineId ?? null, status: 'BLOCKED', reasons: ['invalid or missing machineId'] });
          continue;
        }
        if (seenIds.has(machineId)) {
          results.push({ file: path.relative(ROOT, filePath), machineId, status: 'BLOCKED', reasons: ['duplicate machineId in ingest batch'] });
          continue;
        }
        seenIds.add(machineId);
        const classification = classifyResearchData(data);
        const target = path.join(ROOT, 'research', machineId, 'research-data.json');
        if (classification.status !== 'BLOCKED' && !args.checkOnly) writeJson(target, data);
        results.push({ file: path.relative(ROOT, filePath), machineId, status: classification.status, reasons: classification.reasons, target: path.relative(ROOT, target) });
      } catch (error) {
        results.push({ file: path.relative(ROOT, filePath), machineId: null, status: 'BLOCKED', reasons: [error instanceof Error ? error.message : String(error)] });
      }
    }
    const counts = { READY_FOR_SELECTION: 0, REVIEW: 0, BLOCKED: 0 };
    for (const result of results) counts[result.status] += 1;
    const overallStatus = counts.BLOCKED ? 'BLOCKED' : counts.REVIEW ? 'REVIEW' : 'READY_FOR_SELECTION';
    const report = { schemaVersion: 'batch-research-pipeline-report-v1', mode: args.checkOnly ? 'INGEST_CHECK' : 'INGEST', generatedAt: new Date().toISOString(), overallStatus, counts, results, durationMs: Date.now() - startedAt };
    if (!args.checkOnly) writeJson(args.report, report);
    console.log(`BATCH RESEARCH ${overallStatus}: READY=${counts.READY_FOR_SELECTION} REVIEW=${counts.REVIEW} BLOCKED=${counts.BLOCKED}`);
    if (overallStatus === 'BLOCKED') process.exitCode = 1;
    return;
  }

  const rawRequests = [...args.requests, ...(args.file ? readRequestsFromFile(args.file) : [])];
  const requests = normalizeRequests(rawRequests);
  const batchId = `BATCH_RESEARCH_${new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)}`;
  const workspace = path.join(ROOT, 'research-batch', batchId);
  const results = [];

  for (const [index, request] of requests.entries()) {
    const resolved = resolveCandidate(request, assessment.candidates ?? []);
    if (resolved.status !== 'MATCHED') {
      results.push({ request, status: 'BLOCKED', reasons: [resolved.status === 'AMBIGUOUS' ? 'candidate lookup is ambiguous' : 'candidate not found in machine-candidate-assessment.json'] });
      continue;
    }
    const candidate = resolved.candidate;
    const knownId = candidate.registryMachineId;
    if (knownId) {
      const existingPath = path.join(ROOT, 'research', knownId, 'research-data.json');
      if (fs.existsSync(existingPath)) {
        try {
          const data = readJson(existingPath);
          const classification = classifyResearchData(data);
          results.push({ request, displayName: candidate.displayName, marketKey: candidate.marketKey, machineId: knownId, status: classification.status, reasons: classification.reasons, existingResearch: path.relative(ROOT, existingPath) });
          continue;
        } catch (error) {
          results.push({ request, displayName: candidate.displayName, marketKey: candidate.marketKey, machineId: knownId, status: 'BLOCKED', reasons: [error instanceof Error ? error.message : String(error)] });
          continue;
        }
      }
    }
    const brief = buildResearchBrief(candidate, batchId);
    const itemDir = path.join(workspace, `${String(index + 1).padStart(2, '0')}-${slug(candidate.displayName)}`);
    const briefPath = path.join(itemDir, 'research-brief.json');
    if (!args.checkOnly) writeJson(briefPath, brief);
    results.push({ request, displayName: candidate.displayName, marketKey: candidate.marketKey, machineId: knownId ?? null, status: 'RESEARCH_REQUIRED', reasons: [], workspace: path.relative(ROOT, itemDir) });
  }

  const counts = { READY_FOR_SELECTION: 0, REVIEW: 0, RESEARCH_REQUIRED: 0, BLOCKED: 0 };
  for (const result of results) counts[result.status] += 1;
  const overallStatus = counts.BLOCKED ? 'BLOCKED' : counts.REVIEW ? 'REVIEW' : counts.RESEARCH_REQUIRED ? 'RESEARCH_REQUIRED' : 'READY_FOR_SELECTION';
  const report = { schemaVersion: 'batch-research-pipeline-report-v1', mode: args.checkOnly ? 'PREPARE_CHECK' : 'PREPARE', generatedAt: new Date().toISOString(), batchId, maxBatchSize: MAX_BATCH, overallStatus, counts, requests, workspace: path.relative(ROOT, workspace), results, durationMs: Date.now() - startedAt };
  if (!args.checkOnly) writeJson(args.report, report);
  console.log(`BATCH RESEARCH ${overallStatus}: READY=${counts.READY_FOR_SELECTION} REVIEW=${counts.REVIEW} RESEARCH_REQUIRED=${counts.RESEARCH_REQUIRED} BLOCKED=${counts.BLOCKED}`);
  if (!args.checkOnly) console.log(`Workspace: ${path.relative(ROOT, workspace)}`);
  if (overallStatus === 'BLOCKED') process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
