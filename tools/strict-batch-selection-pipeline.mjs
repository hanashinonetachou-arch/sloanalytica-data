import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { validateSelectionEvidenceCoverage } from './batch-completeness-gates.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ORIGINAL = path.join(ROOT, 'tools', 'batch-selection-pipeline.mjs');
const DEFAULT_REPORT = path.join(ROOT, 'reports', 'batch-selection-pipeline-report.json');

function readJson(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }
function writeJson(p, value) { fs.writeFileSync(p, JSON.stringify(value, null, 2) + '\n', 'utf8'); }
function argValue(args, key) { const i = args.indexOf(key); return i >= 0 ? args[i + 1] : null; }
function runOriginal(args) {
  const r = spawnSync(process.execPath, [ORIGINAL, ...args], { cwd: ROOT, stdio: 'inherit' });
  if (r.error) throw r.error;
  return r.status ?? 1;
}
function ensureReportArg(args) {
  if (args.includes('--report')) return { args, reportPath: path.resolve(ROOT, argValue(args, '--report')) };
  return { args: [...args, '--report', path.relative(ROOT, DEFAULT_REPORT)], reportPath: DEFAULT_REPORT };
}
function precheckIngest(workspace) {
  const batchReportPath = path.join(workspace, 'selection-batch-report.json');
  if (!fs.existsSync(batchReportPath)) return ['selection-batch-report.json missing'];
  const batchReport = readJson(batchReportPath);
  const errors = [];
  for (const item of batchReport.results ?? []) {
    const id = item.machineId;
    if (!id) continue;
    const selectionPath = path.join(workspace, id, 'selection-data.json');
    const researchPath = path.join(ROOT, 'research', id, 'research-data.json');
    if (!fs.existsSync(selectionPath) || !fs.existsSync(researchPath)) continue;
    const selection = readJson(selectionPath);
    const research = readJson(researchPath);
    const result = validateSelectionEvidenceCoverage(selection, research, { required: true });
    for (const error of result.errors) errors.push(`${id}: ${error}`);
  }
  return errors;
}
function enrichBriefs(reportPath) {
  if (!fs.existsSync(reportPath)) return;
  const report = readJson(reportPath);
  if (!report.workspace) return;
  for (const item of report.results ?? []) {
    if (!item.machineId || item.existingSelection) continue;
    const briefPath = path.join(ROOT, report.workspace, item.machineId, 'selection-brief.json');
    if (!fs.existsSync(briefPath)) continue;
    const brief = readJson(briefPath);
    brief.evidenceReviewContract = {
      requiredForBatchIngest: true,
      policyVersion: 1,
      rule: 'Every ResearchData evidenceCandidate must be either referenced by evidenceUi.options[].sourceEvidenceIds or explicitly listed in evidenceReview.exclusions with a user-facing reason. Silent omission is forbidden.',
      outputShape: {
        evidenceReview: {
          policyVersion: 1,
          exclusions: [{ researchEvidenceId: 'RE_EXAMPLE', reason: 'Low practical value or duplicate evidence; explain why.' }],
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
    for (const error of errors) console.error(`ERROR [batch selection evidence coverage] ${error}`);
    process.exit(1);
  }
  process.exit(runOriginal(args));
}

const prepared = ensureReportArg(args);
const status = runOriginal(prepared.args);
if (status === 0 && !args.includes('--check')) enrichBriefs(prepared.reportPath);
process.exit(status);
