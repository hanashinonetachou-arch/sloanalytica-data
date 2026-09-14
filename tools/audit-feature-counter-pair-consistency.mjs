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
    const rows = (section.items ?? [])
      .filter((item) => item?.type === 'input' && item.inputId)
      .map((item, index) => ({ item, input: inputs.get(item.inputId), index }))
      .filter(({ input }) => input && !isEvidenceInput(input));

    const groups = [];
    let current = [];
    const flush = () => {
      if (current.length >= 2) groups.push(current);
      current = [];
    };

    for (const row of rows) {
      if (COUNTER_WIDGETS.has(String(row.item.widget || ''))) current.push(row);
      else flush();
    }
    flush();

    for (const group of groups) {
      const pairableCount = group.length % 2 === 0 ? group.length : group.length - 1;
      if (pairableCount < 2) continue;
      const pairable = group.slice(0, pairableCount);
      const inconsistent = pairable.filter(({ item }) => item.gridSpan !== 6);
      if (!inconsistent.length) continue;

      findings.push({
        machineId,
        displayName: pkg.machine?.displayName ?? machineId,
        sectionId: section.id ?? null,
        sectionTitle: section.title ?? '',
        groupSize: group.length,
        pairableCount,
        items: group.map(({ item, input, index }, groupIndex) => ({
          index,
          groupIndex,
          inputId: item.inputId,
          label: item.label ?? input.name ?? item.inputId,
          widget: item.widget,
          gridSpan: item.gridSpan ?? null,
          expectedGridSpan: groupIndex < pairableCount ? 6 : 12,
          category: input.category ?? null,
          inferenceRole: input.inferenceRole ?? null,
        })),
      });
    }
  }
}

findings.sort((a, b) =>
  a.displayName.localeCompare(b.displayName, 'ja') ||
  a.sectionTitle.localeCompare(b.sectionTitle, 'ja')
);

const report = {
  schemaVersion: 'feature-counter-pair-consistency-audit-v1',
  policy: {
    scope: 'Non-Evidence Feature controls only.',
    groupingRule: 'Consecutive counter-like controls form a sibling group; number/manual controls break the group.',
    layoutRule: 'Pair sibling counters as 6+6. For odd groups, keep only the final unpaired item full-width.',
    evidenceRule: 'Evidence is intentionally excluded for separate definition/UI redesign.',
  },
  summary: {
    scannedMachines,
    scannedSections,
    inconsistentGroups: findings.length,
    inconsistentPairableItems: findings.reduce((sum, finding) => sum + finding.items.filter((item) => item.groupIndex < finding.pairableCount && item.gridSpan !== 6).length, 0),
  },
  findings,
};

const outIndex = process.argv.indexOf('--json-out');
if (outIndex >= 0 && process.argv[outIndex + 1]) {
  const out = path.resolve(ROOT, process.argv[outIndex + 1]);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, `${JSON.stringify(report, null, 2)}\n`);
}

console.log(`Feature counter-pair consistency: machines=${scannedMachines}, sections=${scannedSections}`);
console.log(`FAIL groups=${report.summary.inconsistentGroups}, items=${report.summary.inconsistentPairableItems}`);
for (const finding of findings) {
  console.log(`FAIL ${finding.machineId} | ${finding.sectionTitle}: ${finding.items.map((x) => `${x.label}[${x.gridSpan}->${x.expectedGridSpan}]`).join(' / ')}`);
}
