import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { REQUIRED_EVIDENCE_SURFACES, REQUIRED_NUMERIC_SURFACES, validateResearchCompleteness } from './batch-completeness-gates.mjs';
import { validateDiscoveryCompleteness } from './discovery-completeness-gate.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ORIGINAL = path.join(ROOT, 'tools', 'batch-research-pipeline.mjs');
const DEFAULT_REPORT = path.join(ROOT, 'reports', 'batch-research-pipeline-report.json');
const CURRENT_RESEARCH_COMPLETENESS_POLICY = 2;
const CURRENT_DISCOVERY_COMPLETENESS_POLICY = 1;

function readJson(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }
function writeJson(p, value) { fs.writeFileSync(p, JSON.stringify(value, null, 2) + '\n', 'utf8'); }
function findResearchFiles(root) {
  const files = [];
  const walk = current => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile() && entry.name === 'research-data.json') files.push(full);
    }
  };
  if (fs.existsSync(root)) walk(root);
  return files;
}
function argValue(args, key) { const i = args.indexOf(key); return i >= 0 ? args[i + 1] : null; }
function runOriginal(args) {
  const r = spawnSync(process.execPath, [ORIGINAL, ...args], { cwd: ROOT, stdio: 'inherit' });
  if (r.error) throw r.error;
  return r.status ?? 1;
}
function precheckIngest(workspace) {
  const files = findResearchFiles(workspace);
  if (!files.length) return ['no research-data.json found in ingest workspace'];
  const errors = [];
  for (const file of files) {
    const research = readJson(file);
    const relative = path.relative(ROOT, file);

    const discovery = validateDiscoveryCompleteness(research, { required: true });
    for (const error of discovery.errors) errors.push(`${relative}: Gate 0: ${error}`);

    const result = validateResearchCompleteness(research, { required: true, minimumPolicyVersion: CURRENT_RESEARCH_COMPLETENESS_POLICY });
    for (const error of result.errors) errors.push(`${relative}: ${error}`);
    for (const item of result.unresolved) console.warn(`REVIEW [research completeness] ${relative}: ${item} is UNRESOLVED`);
  }
  return errors;
}
function enrichBriefs(reportPath) {
  if (!fs.existsSync(reportPath)) return;
  const report = readJson(reportPath);
  for (const result of report.results ?? []) {
    if (!result.workspace) continue;
    const briefPath = path.join(ROOT, result.workspace, 'research-brief.json');
    if (!fs.existsSync(briefPath)) continue;
    const brief = readJson(briefPath);
    brief.discoveryCompletenessContract = {
      requiredForBatchIngest: true,
      policyVersion: CURRENT_DISCOVERY_COMPLETENESS_POLICY,
      instruction: 'Record every setting-difference or setting-inference candidate found during Web Discovery in discoveryInventory before Selection. Discovery is exhaustive and does not decide adoption. Every candidate must remain traceable to Research through researchTarget/mappedTo, or be explicitly retained as UNRESOLVED/REFERENCE. Do not drop weak, low-frequency, correlated, manual-count, or apparently redundant candidates during Discovery.',
      migration: 'Required for newly generated or newly ingested Research. Legacy MachineData without discoveryInventory remains supported outside new Research batch ingest and is migrated when re-researched.',
      outputShape: {
        discoveryInventory: [
          { discoveryCandidateId: 'DISC_EXAMPLE', name: 'candidate name', researchTarget: 'RF_EXAMPLE', transferStatus: 'RESEARCH_CANDIDATE' },
          { discoveryCandidateId: 'DISC_UNRESOLVED', name: 'candidate pending confirmation', transferStatus: 'UNRESOLVED' },
        ],
      },
    };
    brief.researchCompletenessContract = {
      requiredForBatchIngest: true,
      policyVersion: CURRENT_RESEARCH_COMPLETENESS_POLICY,
      statusValues: ['CHECKED', 'NOT_APPLICABLE', 'UNRESOLVED'],
      instruction: 'Do not omit a surface because no setting difference was found. Record CHECKED/NOT_APPLICABLE/UNRESOLVED explicitly. CHECKED requires sourceRefs. UNRESOLVED must remain explicit and is routed to review. For machine_menu_cumulative, explicitly investigate the normal on-machine menu/history screen for cumulative normal games, CZ, AT initial hits, bonuses, small roles, or other setting-relevant cumulative counters. Record whether numerator/denominator observation scopes match published analysis definitions; do not adopt a displayed counter merely because it exists.',
      evidenceSurfaces: REQUIRED_EVIDENCE_SURFACES,
      numericSurfaces: REQUIRED_NUMERIC_SURFACES,
      outputShape: {
        researchCompleteness: {
          policyVersion: CURRENT_RESEARCH_COMPLETENESS_POLICY,
          evidenceSurfaces: [{ surface: 'end_screen', status: 'CHECKED', sourceRefs: ['SOURCE_ID'], notes: 'what was checked' }],
          numericSurfaces: [
            { surface: 'small_role', status: 'CHECKED', sourceRefs: ['SOURCE_ID'], notes: 'what was checked' },
            { surface: 'machine_menu_cumulative', status: 'CHECKED', sourceRefs: ['SOURCE_ID'], notes: 'menu/history counters checked, definitions, and whether they are usable as predecessor observations' },
          ],
        },
      },
    };
    writeJson(briefPath, brief);
  }
}

const args = process.argv.slice(2);
const ingest = argValue(args, '--ingest');
if (ingest) {
  const errors = precheckIngest(path.resolve(ROOT, ingest));
  if (errors.length) {
    for (const error of errors) console.error(`ERROR [batch research completeness] ${error}`);
    process.exit(1);
  }
  process.exit(runOriginal(args));
}

const status = runOriginal(args);
if (status === 0 && !args.includes('--check')) {
  const customReport = argValue(args, '--report');
  enrichBriefs(customReport ? path.resolve(ROOT, customReport) : DEFAULT_REPORT);
}
process.exit(status);
