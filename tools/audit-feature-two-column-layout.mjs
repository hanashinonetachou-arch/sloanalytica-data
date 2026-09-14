import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MACHINES_DIR = path.join(ROOT, 'machines');

const COMPACT_WIDGETS = new Set([
  'number',
  'counter',
  'quick_counter',
  'stepper_counter',
  'boolean',
  'select',
]);

const isEvidenceInput = (input) =>
  input?.category === 'EVIDENCE' ||
  input?.inferenceRole === 'INCLUDE_SUPPORT' ||
  String(input?.id || '').startsWith('INP_EVI_');

const isCompactCandidate = (item, input) => {
  if (!item || item.type !== 'input' || !item.inputId) return false;
  if (isEvidenceInput(input)) return false;
  if (!COMPACT_WIDGETS.has(String(item.widget || ''))) return false;
  if (item.gridSpan !== 12) return false;
  return true;
};

const machineIds = fs.existsSync(MACHINES_DIR)
  ? fs.readdirSync(MACHINES_DIR).filter((name) => fs.statSync(path.join(MACHINES_DIR, name)).isDirectory()).sort()
  : [];

const findings = [];
let scannedMachines = 0;
let scannedSections = 0;
let featureInputItems = 0;

for (const machineId of machineIds) {
  const packagePath = path.join(MACHINES_DIR, machineId, 'machine-package.json');
  if (!fs.existsSync(packagePath)) continue;
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  scannedMachines += 1;

  const inputs = new Map((pkg.inputs?.inputs ?? []).map((input) => [input.id, input]));
  for (const section of pkg.ui?.sections ?? []) {
    scannedSections += 1;
    const rows = (section.items ?? [])
      .filter((item) => item?.type === 'input' && item.inputId)
      .map((item, index) => ({ item, input: inputs.get(item.inputId), index }))
      .filter(({ input }) => input && !isEvidenceInput(input));

    featureInputItems += rows.length;
    if (rows.length < 2) continue;

    const candidates = rows.filter(({ item, input }) => isCompactCandidate(item, input));
    if (candidates.length < 2) continue;

    findings.push({
      machineId,
      displayName: pkg.machine?.displayName ?? machineId,
      sectionId: section.id ?? null,
      sectionTitle: section.title ?? '',
      candidateCount: candidates.length,
      candidates: candidates.map(({ item, input, index }) => ({
        index,
        inputId: item.inputId,
        label: item.label ?? input.name ?? item.inputId,
        widget: item.widget ?? null,
        gridSpan: item.gridSpan ?? null,
        inputType: input.type ?? null,
        category: input.category ?? null,
        inferenceRole: input.inferenceRole ?? null,
      })),
    });
  }
}

findings.sort((a, b) =>
  a.displayName.localeCompare(b.displayName, 'ja') ||
  String(a.sectionTitle).localeCompare(String(b.sectionTitle), 'ja')
);

const report = {
  schemaVersion: 'feature-two-column-audit-v1',
  policy: {
    scope: 'Feature inputs only; Evidence intentionally excluded for separate redesign.',
    findingMeaning: 'Same section contains at least two compact-capable Feature input items that still occupy full-width gridSpan=12.',
    note: 'A finding is a review candidate, not an automatic layout mutation. Long labels, semantic grouping, odd-item tails, or special controls may justify full width.',
  },
  summary: {
    scannedMachines,
    scannedSections,
    featureInputItems,
    candidateSections: findings.length,
    candidateInputItems: findings.reduce((sum, row) => sum + row.candidateCount, 0),
  },
  findings,
};

const jsonArgIndex = process.argv.indexOf('--json-out');
if (jsonArgIndex >= 0 && process.argv[jsonArgIndex + 1]) {
  const outputPath = path.resolve(ROOT, process.argv[jsonArgIndex + 1]);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
}

console.log(`Feature two-column audit: machines=${scannedMachines}, sections=${scannedSections}, featureInputs=${featureInputItems}`);
console.log(`REVIEW candidate sections=${report.summary.candidateSections}, inputs=${report.summary.candidateInputItems}`);
for (const row of findings) {
  const labels = row.candidates.map((candidate) => `${candidate.label} [${candidate.widget}, span=${candidate.gridSpan}]`).join(' / ');
  console.log(`REVIEW ${row.machineId} | ${row.sectionTitle}: ${labels}`);
}
