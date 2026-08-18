import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MAX_BATCH = 10;

function normalizeLookup(value) {
  return String(value ?? '').normalize('NFKC').toLowerCase().replace(/[\s　]+/g, '').replace(/[・･\-‐‑‒–—―]/g, '');
}

export function normalizeRequests(values) {
  const out = [];
  for (const raw of values ?? []) {
    const value = String(raw).trim();
    if (!value) continue;
    if (!out.some(existing => normalizeLookup(existing) === normalizeLookup(value))) out.push(value);
  }
  if (!out.length) throw new Error('at least one machine name is required');
  if (out.length > MAX_BATCH) throw new Error(`batch size exceeds ${MAX_BATCH}: ${out.length}`);
  return out;
}

function slug(value) {
  const normalized = String(value).normalize('NFKC').replace(/[^A-Za-z0-9_-]+/g, '_').replace(/^_+|_+$/g, '');
  return normalized.slice(0, 60) || 'machine';
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + '\n', 'utf8');
}

export function buildBrief(displayName, batchId, order) {
  return {
    schemaVersion: 'user-selected-research-brief-v1',
    batchId,
    order,
    requestedDisplayName: displayName,
    status: 'RESEARCH_REQUIRED',
    identity: {
      machineId: null,
      policy: 'Do not assign machineId until formal model/type identity is verified from reliable sources.'
    },
    requiredResearchOutputs: [
      'formal machine name, type/model number, manufacturer and introduction date',
      'installed settings only; do not invent missing settings',
      'setting-difference numeric Feature candidates with numerator/denominator/trialUnit and per-setting values',
      'confirmed Evidence candidates with allowed/denied settings',
      'multiple reputable source references and explicit unresolved conflicts',
      'machine-linked/play-data service availability and concrete retrievable counters/items when present',
      'research-data.json conforming to research-data-v1 after identity verification'
    ],
    safety: {
      userSelected: true,
      marketCandidateEntryRequired: false,
      machineIdMayBeGuessed: false,
      probabilitiesMayBeInvented: false,
      conflictsMayBeSilentlyResolved: false
    },
    nextAction: 'Authenticate identity, perform web research, then create research-data.json. Ingest through the normal Batch Research validator or place only validated data under research/<MACHINE_ID>/. '
  };
}

function parseArgs(argv) {
  const names = [];
  let file = null;
  let report = path.join(ROOT, 'reports', 'user-selected-research-batch-report.json');
  let check = false;
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--file') file = argv[++i];
    else if (arg === '--report') report = path.resolve(ROOT, argv[++i]);
    else if (arg === '--check') check = true;
    else if (arg === '--help' || arg === '-h') {
      console.log(`User-selected Research Batch\nUsage:\n  node tools/prepare-user-selected-research-batch.mjs "Machine A" "Machine B"\n  node tools/prepare-user-selected-research-batch.mjs --file batch.txt\n\nSafety: names explicitly selected by the user do not require market-candidate registration, but machineId is never assigned here.`);
      return null;
    } else names.push(arg);
  }
  if (file) names.push(...fs.readFileSync(path.resolve(ROOT, file), 'utf8').split(/\r?\n/).map(v => v.trim()).filter(Boolean));
  return { names: normalizeRequests(names), report, check };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args) return;
  const batchId = `USER_SELECTED_${new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)}`;
  const workspace = path.join(ROOT, 'research-batch', batchId);
  const results = args.names.map((displayName, index) => {
    const itemDir = path.join(workspace, `${String(index + 1).padStart(2, '0')}-${slug(displayName)}`);
    if (!args.check) writeJson(path.join(itemDir, 'research-brief.json'), buildBrief(displayName, batchId, index + 1));
    return { order: index + 1, displayName, machineId: null, status: 'RESEARCH_REQUIRED', workspace: path.relative(ROOT, itemDir) };
  });
  const report = {
    schemaVersion: 'user-selected-research-batch-report-v1',
    generatedAt: new Date().toISOString(),
    batchId,
    mode: args.check ? 'CHECK' : 'PREPARE',
    count: results.length,
    results,
    safety: { marketCandidateEntryRequired: false, machineIdAssignment: 'AFTER_IDENTITY_VERIFICATION' }
  };
  if (!args.check) writeJson(args.report, report);
  console.log(`USER-SELECTED RESEARCH BATCH: RESEARCH_REQUIRED=${results.length} BLOCKED=0`);
  if (!args.check) console.log(`Workspace: ${path.relative(ROOT, workspace)}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
