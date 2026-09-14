import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MACHINES_DIR = path.join(ROOT, 'machines');
const COUNTER_WIDGETS = new Set(['counter', 'quick_counter', 'stepper_counter', 'boolean', 'select']);

const isEvidenceInput = (input) =>
  input?.category === 'EVIDENCE' ||
  input?.inferenceRole === 'INCLUDE_SUPPORT' ||
  String(input?.id || '').startsWith('INP_EVI_');

const machineIds = fs.readdirSync(MACHINES_DIR)
  .filter((name) => fs.statSync(path.join(MACHINES_DIR, name)).isDirectory())
  .sort();

const findings = [];
let scannedMachines = 0;
let scannedSections = 0;

for (const machineId of machineIds) {
  const packagePath = path.join(MACHINES_DIR, machineId, 'machine-package.json');
  if (!fs.existsSync(packagePath)) continue;
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  scannedMachines += 1;
  const inputs = new Map((pkg.inputs?.inputs ?? []).map((input) => [input.id, input]));

  for (const section of pkg.ui?.sections ?? []) {
    scannedSections += 1;
    const sectionRows = (section.items ?? [])
      .filter((item) => item?.type === 'input' && item.inputId)
      .map((item, index) => ({ item, input: inputs.get(item.inputId), index }))
      .filter(({ input }) => input && !isEvidenceInput(input));

    const fullWidthCounters = sectionRows.filter(({ item }) =>
      COUNTER_WIDGETS.has(String(item.widget || '')) && item.gridSpan === 12
    );
    if (fullWidthCounters.length < 2) continue;

    findings.push({
      machineId,
      displayName: pkg.machine?.displayName ?? machineId,
      sectionId: section.id ?? null,
      sectionTitle: section.title ?? '',
      counterCount: fullWidthCounters.length,
      hasFullWidthNumberContext: sectionRows.some(({ item }) => item.widget === 'number' && item.gridSpan === 12),
      counters: fullWidthCounters.map(({ item, input, index }) => ({
        index,
        inputId: item.inputId,
        label: item.label ?? input.name ?? item.inputId,
        widget: item.widget,
        category: input.category ?? null,
        inferenceRole: input.inferenceRole ?? null,
      })),
    });
  }
}

findings.sort((a, b) =>
  a.displayName.localeCompare(b.displayName, 'ja') ||
  a.sectionTitle.localeCompare(b.sectionTitle, 'ja')
);

const report = {
  schemaVersion: 'feature-two-column-counter-audit-v1',
  policy: {
    scope: 'Non-Evidence Feature controls only.',
    denominatorRule: 'Full-width number/manual denominator inputs are context, not automatic two-column targets.',
    candidateRule: 'Two or more full-width counter-like controls in the same section are two-column review candidates.',
    layoutIntent: 'Pair counter-like siblings as 6+6 where labels/controls fit; for odd groups keep the unpaired tail full-width unless an explicit 3-column contract exists.',
  },
  summary: {
    scannedMachines,
    scannedSections,
    candidateSections: findings.length,
    candidateCounters: findings.reduce((sum, finding) => sum + finding.counterCount, 0),
  },
  findings,
};

const outIndex = process.argv.indexOf('--json-out');
if (outIndex >= 0 && process.argv[outIndex + 1]) {
  const out = path.resolve(ROOT, process.argv[outIndex + 1]);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, `${JSON.stringify(report, null, 2)}\n`);
}

console.log(`Feature counter-pair audit: machines=${scannedMachines}, sections=${scannedSections}`);
console.log(`REVIEW candidate sections=${report.summary.candidateSections}, counters=${report.summary.candidateCounters}`);
for (const finding of findings) {
  console.log(`REVIEW ${finding.machineId} | ${finding.sectionTitle}: ${finding.counters.map((x) => x.label).join(' / ')}`);
}
