import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RESEARCH_DIR = path.join(ROOT, 'research');
const APPLY = process.argv.includes('--apply');
const REPORT_ARG = process.argv.indexOf('--report');
const REPORT_PATH = path.resolve(ROOT, REPORT_ARG >= 0 && process.argv[REPORT_ARG + 1]
  ? process.argv[REPORT_ARG + 1]
  : 'reports/feature-two-column-canonical-reaudit.json');

// Evidence / setting-hint presentation is intentionally a separate redesign lane.
const DEFER_SECTION = /(設定示唆|確定情報|確定演出|終了画面|終了時.*(画面|ボイス)|ボイス|セリフ|ミニキャラ|キャラ紹介|写真|トロフィー|BGM|楽曲|ベストショット|怪獣紹介|ルーレット|枚数調整成功時の魔法)/;

const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const write = (p, value) => fs.writeFileSync(p, `${JSON.stringify(value, null, 2)}\n`);

const findings = [];
const changedMachineIds = new Set();
let canonicalMachines = 0;
let scannedSections = 0;
let deferredSections = 0;

for (const machineId of fs.readdirSync(RESEARCH_DIR).sort()) {
  if (machineId.includes('_TEST_') || machineId.endsWith('_TEST')) continue;
  const uiPath = path.join(RESEARCH_DIR, machineId, 'ui-design-data.json');
  if (!fs.existsSync(uiPath)) continue;
  const ui = read(uiPath);
  if (ui.schemaVersion !== 'ui-design-data-v1' || ui.machineId !== machineId) continue;
  canonicalMachines += 1;
  let changed = false;

  for (const sectionName of ui.sectionOrder ?? []) {
    const section = ui.sections?.[sectionName];
    if (!section || !Array.isArray(section.inputIds)) continue;
    scannedSections += 1;
    if ((section.evidenceIds?.length ?? 0) > 0 || DEFER_SECTION.test(sectionName)) {
      deferredSections += 1;
      continue;
    }

    const groups = [];
    let current = [];
    const flush = () => {
      if (current.length >= 2) groups.push(current);
      current = [];
    };

    for (const inputId of section.inputIds) {
      const contract = ui.inputContracts?.[inputId];
      if (contract?.mode === 'COUNTER') current.push({ inputId, contract });
      else flush();
    }
    flush();

    for (const group of groups) {
      const pairableCount = group.length - (group.length % 2);
      if (pairableCount < 2) continue;
      const repairs = [];
      for (let i = 0; i < pairableCount; i += 1) {
        const { inputId, contract } = group[i];
        const before = { gridSpan: contract.gridSpan ?? null, compact: contract.compact ?? null };
        if (contract.gridSpan !== 6 || contract.compact !== true) {
          repairs.push({ inputId, name: contract.name, before, after: { gridSpan: 6, compact: true } });
          if (APPLY) {
            contract.gridSpan = 6;
            contract.compact = true;
            changed = true;
          }
        }
      }
      if (repairs.length) {
        findings.push({
          machineId,
          sectionName,
          groupSize: group.length,
          pairableCount,
          group: group.map(({ inputId, contract }, index) => ({
            inputId,
            name: contract.name,
            gridSpan: contract.gridSpan ?? null,
            compact: contract.compact ?? null,
            pairable: index < pairableCount,
          })),
          repairs,
        });
      }
    }
  }

  if (APPLY && changed) {
    write(uiPath, ui);
    changedMachineIds.add(machineId);
  }
}

const report = {
  schemaVersion: 'feature-two-column-canonical-reaudit-v1',
  mode: APPLY ? 'APPLY' : 'AUDIT',
  policy: {
    sourceOfTruth: 'research/<machineId>/ui-design-data.json',
    scope: 'Canonical numeric Feature COUNTER sibling groups only.',
    pairing: 'Consecutive COUNTER controls pair left-to-right as 6+6. An odd final counter is not modified.',
    numberInputs: 'NUMBER/manual denominator controls stay full width and break sibling groups.',
    evidence: 'Evidence/setting-hint presentation sections are deferred to the separate Evidence redesign.',
  },
  summary: {
    canonicalMachines,
    scannedSections,
    deferredSections,
    repairGroups: findings.length,
    repairInputs: findings.reduce((sum, row) => sum + row.repairs.length, 0),
    changedMachines: APPLY ? changedMachineIds.size : [...new Set(findings.map((row) => row.machineId))].length,
  },
  machineIds: APPLY ? [...changedMachineIds].sort() : [...new Set(findings.map((row) => row.machineId))].sort(),
  findings,
};

fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
write(REPORT_PATH, report);
console.log(`Canonical Feature 2-col ${report.mode}: machines=${canonicalMachines}, sections=${scannedSections}, deferred=${deferredSections}`);
console.log(`REPAIR groups=${report.summary.repairGroups}, inputs=${report.summary.repairInputs}, machines=${report.summary.changedMachines}`);
for (const row of findings) {
  console.log(`REPAIR ${row.machineId} | ${row.sectionName}: ${row.repairs.map((x) => `${x.name}[${x.before.gridSpan}->6]`).join(' / ')}`);
}
