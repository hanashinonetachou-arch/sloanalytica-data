#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();
const VALIDATOR = path.join(ROOT, 'tools', 'validate-evidence-ui.mjs');
const OUT_DIR = path.join(ROOT, 'audit-reports');
const JSON_OUT = path.join(OUT_DIR, 'evidence-validator-all.json');
const MD_OUT = path.join(OUT_DIR, 'evidence-validator-all.md');
const SKIP_DIRS = new Set(['.git', 'node_modules', 'audit-reports']);
const MAX_JSON_BYTES = 5 * 1024 * 1024;

const rel = p => path.relative(ROOT, p).replaceAll('\\', '/');
const readJson = p => {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); }
  catch { return null; }
};

function walkJson(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.isDirectory() && SKIP_DIRS.has(ent.name)) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walkJson(p, out);
    else if (/\.json$/i.test(ent.name)) {
      try {
        if (fs.statSync(p).size <= MAX_JSON_BYTES) out.push(p);
      } catch {}
    }
  }
  return out;
}

function loadRegistryIds() {
  const doc = readJson(path.join(ROOT, 'machine-registry.json'));
  const rows = Array.isArray(doc) ? doc : (doc?.machines ?? doc?.entries ?? doc?.items ?? []);
  return new Set(rows.map(x => x?.machineId).filter(Boolean));
}

function exactMachineIdFromPath(file, registryIds) {
  const segments = rel(file).split('/');
  const hits = segments.filter(s => registryIds.has(s));
  return hits.length === 1 ? hits[0] : null;
}

function explicitResearchPath(ui) {
  const candidates = [
    ui?.researchPath,
    ui?.generatedFrom?.research,
    ui?.sourceResearch,
    ui?.sources?.research,
  ].filter(x => typeof x === 'string' && x.trim());
  if (candidates.length !== 1) return null;
  const p = path.resolve(ROOT, candidates[0]);
  return p.startsWith(ROOT) ? p : null;
}

function resolvePair(uiFile, ui, registryIds) {
  const explicitId = ui?.machineId ?? ui?.machine?.machineId ?? null;
  const pathId = exactMachineIdFromPath(uiFile, registryIds);
  if (explicitId && pathId && explicitId !== pathId) {
    return { ok:false, reason:`machineId mismatch: document=${explicitId}, path=${pathId}` };
  }
  const machineId = explicitId || pathId;
  const explicitResearch = explicitResearchPath(ui);
  let researchFile = explicitResearch;
  if (!researchFile && machineId) researchFile = path.join(ROOT, 'research', machineId, 'research-data.json');
  if (!researchFile) return { ok:false, reason:'cannot resolve Research JSON without an explicit machineId/path relation' };
  if (!fs.existsSync(researchFile)) return { ok:false, reason:`Research JSON not found: ${rel(researchFile)}` };
  const research = readJson(researchFile);
  if (!research) return { ok:false, reason:`Research JSON unreadable: ${rel(researchFile)}` };
  const researchMachineId = research?.machine?.machineId ?? research?.machineId ?? null;
  if (machineId && researchMachineId && machineId !== researchMachineId) {
    return { ok:false, reason:`Research machineId mismatch: ui=${machineId}, research=${researchMachineId}` };
  }
  return { ok:true, machineId:machineId || researchMachineId, researchFile };
}

if (!fs.existsSync(VALIDATOR)) throw new Error(`validator not found: ${rel(VALIDATOR)}`);
const registryIds = loadRegistryIds();
const jsonFiles = walkJson(ROOT);
const evidenceUiFiles = [];
for (const file of jsonFiles) {
  const doc = readJson(file);
  if (doc?.schemaVersion === 'evidence-ui-v1') evidenceUiFiles.push({ file, doc });
}

const results = [];
for (const { file, doc } of evidenceUiFiles.sort((a,b)=>rel(a.file).localeCompare(rel(b.file)))) {
  const pair = resolvePair(file, doc, registryIds);
  if (!pair.ok) {
    results.push({ evidenceUi:rel(file), research:null, machineId:null, status:'PAIRING_FAIL', errors:[pair.reason] });
    continue;
  }
  const run = spawnSync(process.execPath, [VALIDATOR, file, pair.researchFile], { encoding:'utf8' });
  const errors = `${run.stderr ?? ''}\n${run.stdout ?? ''}`.trim().split(/\r?\n/).filter(Boolean);
  results.push({
    evidenceUi:rel(file), research:rel(pair.researchFile), machineId:pair.machineId ?? null,
    status:run.status === 0 ? 'PASS' : 'VALIDATION_FAIL',
    errors:run.status === 0 ? [] : errors,
  });
}

const summary = {
  evidenceUiFiles:evidenceUiFiles.length,
  pass:results.filter(x=>x.status==='PASS').length,
  pairingFail:results.filter(x=>x.status==='PAIRING_FAIL').length,
  validationFail:results.filter(x=>x.status==='VALIDATION_FAIL').length,
};
const report = {
  schemaVersion:'evidence-validator-all-v1',
  generatedAt:new Date().toISOString(),
  validator:'tools/validate-evidence-ui.mjs',
  pairingPolicy:[
    'Use explicit Evidence UI machineId when present.',
    'Otherwise use exactly one registry machineId appearing as a complete path segment.',
    'Use an explicit Research path when present; otherwise research/<machineId>/research-data.json.',
    'Never infer a machine from labels or partial string similarity.'
  ],
  summary, results,
};
fs.mkdirSync(OUT_DIR, { recursive:true });
fs.writeFileSync(JSON_OUT, `${JSON.stringify(report,null,2)}\n`);
const md = [
  '# Evidence UI full validator', '',
  `- Evidence UI files: ${summary.evidenceUiFiles}`,
  `- PASS: ${summary.pass}`,
  `- Pairing FAIL: ${summary.pairingFail}`,
  `- Validation FAIL: ${summary.validationFail}`,
  '',
  '## Failures', '',
  ...results.filter(x=>x.status!=='PASS').flatMap(x=>[
    `- **${x.status}** \`${x.evidenceUi}\`${x.machineId ? ` (${x.machineId})` : ''}`,
    ...x.errors.map(e=>`  - ${e}`),
  ]),
  ...(results.every(x=>x.status==='PASS') ? ['- none'] : []),
  ''
].join('\n');
fs.writeFileSync(MD_OUT, md);
console.log(`Evidence UI full validator: files=${summary.evidenceUiFiles}, pass=${summary.pass}, pairingFail=${summary.pairingFail}, validationFail=${summary.validationFail}`);
if (summary.pairingFail || summary.validationFail) process.exitCode = 1;
