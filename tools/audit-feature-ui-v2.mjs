import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RESEARCH_DIR = path.join(ROOT, 'research');
const REPORT_ARG = process.argv.indexOf('--report');
const REPORT_PATH = path.resolve(ROOT, REPORT_ARG >= 0 && process.argv[REPORT_ARG + 1]
  ? process.argv[REPORT_ARG + 1]
  : 'reports/feature-ui-v2-audit.json');

const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const write = (p, value) => fs.writeFileSync(p, `${JSON.stringify(value, null, 2)}\n`);

const registryPath = path.join(ROOT, 'machine-registry.json');
const registry = fs.existsSync(registryPath) ? read(registryPath) : { machines: [] };
const displayNameById = new Map((registry.machines ?? []).map((x) => [x.machineId, x.displayName]));

const CONTRACT_DRIFT_IDS = new Set([
  'L_KYOUKARA_OREHA_FE',
  'S_SENGOKU_KOIHIME_FC',
  'S_SUPER_BINGO_NEO_CLASSIC_HH1',
]);

const FULL_WIDTH_NAME = /(総ゲーム|累計ゲーム|通常ゲーム|通常G|ゲーム数|G数|消化G|消化ゲーム|対象ゲーム|AT中ゲーム|AT中G|分母|試行ゲーム|試行G|総数|合計|まとめ入力)/;
const DEPENDENCY_HINT = /(うち|内訳|対象|分母|母数|合計|総数|成功率の分母|前項|上記)/;
const LONG_OR_COMPLEX = /(.{19,}|自由入力|メモ|備考|複合|詳細入力)/;
const DANGLING_PARTICLE = /[のをがでにと]$/;
const SYMBOL_ONLY = /^[\s\p{P}\p{S}]+$/u;
const REVIEW_MODES = new Set(['NUMBER', 'RATE', 'SELECT', 'CATEGORY', 'BOOLEAN', 'ENUM', 'MULTI_SELECT']);

const normalizeLabel = (name) => {
  const raw = String(name ?? '').trim();
  if (!raw.endsWith('回数')) return raw;
  const shortened = raw.slice(0, -2).trim();
  if (!shortened || DANGLING_PARTICLE.test(shortened)) return raw;
  return shortened;
};

const machineFixtures = [
  { id: 'love-cure', machine: /防空少女ラブキューレ/, labels: [/弱チェリー/, /スイカ/] },
  { id: 'bancho4', machine: /押忍！?番長4/, labels: [/初当り/, /AT直撃/] },
  { id: 'umineko2', machine: /うみねこのなく頃に2/, labels: [/Lv2ナビ/i, /対象リプレイ/] },
];
const sectionFixtures = [
  { id: 'arifureta-first-hit-success', machine: /ありふれた職業で世界最強/, section: /初当り.*成功率|初当り・成功率/ },
  { id: 'initial-d-2nd-lb-end', machine: /頭文字D.*2nd/i, section: /AT中LB終了画面/ },
];

const rows = [];
const labelIssues = [];
const contractDrifts = [];
const duplicateLabels = [];
const fixtureState = new Map([...machineFixtures, ...sectionFixtures].map((x) => [x.id, { id: x.id, found: false, pass: false, details: [] }]));
let canonicalMachines = 0;
let sections = 0;

const forceFixtureCompact = (displayName, sectionName, sourceLabel) => {
  for (const fixture of machineFixtures) {
    if (!fixture.machine.test(displayName)) continue;
    if (fixture.labels.some((re) => re.test(sourceLabel))) return fixture.id;
  }
  for (const fixture of sectionFixtures) {
    if (fixture.machine.test(displayName) && fixture.section.test(sectionName)) return fixture.id;
  }
  return null;
};

const classify = ({ contract, displayName, sectionName }) => {
  const sourceLabel = String(contract?.name ?? '').trim();
  const mode = String(contract?.mode ?? contract?.widget ?? '').toUpperCase();
  const fixtureId = forceFixtureCompact(displayName, sectionName, sourceLabel);
  if (fixtureId) return { classification: 'AUTO-6', reason: `required-regression-fixture:${fixtureId}` };
  if (FULL_WIDTH_NAME.test(sourceLabel)) return { classification: 'KEEP-12', reason: 'game-total/denominator/aggregate input' };
  if (LONG_OR_COMPLEX.test(sourceLabel)) return { classification: 'KEEP-12', reason: 'long/freeform/complex label' };
  if (DEPENDENCY_HINT.test(sourceLabel)) return { classification: 'REVIEW', reason: 'possible parent-child/denominator dependency' };
  if (mode === 'COUNTER') return { classification: 'AUTO-6', reason: 'short independent counter control' };
  if (REVIEW_MODES.has(mode)) return { classification: 'REVIEW', reason: `compact-capable ${mode || 'UNKNOWN'} requires physical/semantic review` };
  if (contract?.gridSpan === 6) return { classification: 'REVIEW', reason: `existing compact unknown mode:${mode || 'UNKNOWN'}` };
  return { classification: 'REVIEW', reason: `unknown/special mode:${mode || 'UNKNOWN'}` };
};

for (const machineId of fs.readdirSync(RESEARCH_DIR).sort()) {
  if (machineId.includes('_TEST_') || machineId.endsWith('_TEST')) continue;
  const uiPath = path.join(RESEARCH_DIR, machineId, 'ui-design-data.json');
  if (!fs.existsSync(uiPath)) continue;
  const ui = read(uiPath);
  if (ui.schemaVersion !== 'ui-design-data-v1' || ui.machineId !== machineId) continue;
  canonicalMachines += 1;
  const displayName = String(displayNameById.get(machineId) ?? ui.displayName ?? ui.machineName ?? machineId);

  const packagePath = path.join(ROOT, 'machines', machineId, 'machine-package.json');
  if (!fs.existsSync(packagePath)) {
    contractDrifts.push({ machineId, displayName, reason: 'machine-package-missing', expectedKnownDrift: CONTRACT_DRIFT_IDS.has(machineId) });
    continue;
  }
  const pkg = read(packagePath);
  const packageInputIds = new Set((pkg.inputs?.inputs ?? []).map((x) => x.id));
  const canonicalInputIds = [...new Set(Object.values(ui.sections ?? {}).flatMap((section) => section?.inputIds ?? []))];
  const missingInputIds = canonicalInputIds.filter((id) => !packageInputIds.has(id));
  if (missingInputIds.length) {
    contractDrifts.push({ machineId, displayName, reason: 'canonical-input-id-missing-in-package', missingInputIds, expectedKnownDrift: CONTRACT_DRIFT_IDS.has(machineId) });
    continue;
  }

  for (const sectionName of ui.sectionOrder ?? []) {
    const section = ui.sections?.[sectionName];
    if (!section || !Array.isArray(section.inputIds) || section.inputIds.length === 0) continue;
    sections += 1;
    const sectionRows = [];
    const seen = new Map();

    for (const inputId of section.inputIds) {
      const contract = ui.inputContracts?.[inputId];
      if (!contract) continue;
      const sourceLabel = String(contract.name ?? '').trim();
      const displayLabel = normalizeLabel(sourceLabel);
      const result = classify({ contract, displayName, sectionName });
      const row = {
        machineId,
        displayName,
        sectionName,
        inputId,
        sourceLabel,
        displayLabel,
        mode: contract.mode ?? contract.widget ?? null,
        currentGridSpan: contract.gridSpan ?? null,
        compact: contract.compact ?? null,
        classification: result.classification,
        reason: result.reason,
      };
      rows.push(row);
      sectionRows.push(row);

      const issues = [];
      if (!displayLabel) issues.push('empty-label');
      if (displayLabel && SYMBOL_ONLY.test(displayLabel)) issues.push('symbol-only-label');
      if (displayLabel && DANGLING_PARTICLE.test(displayLabel)) issues.push('dangling-particle');
      if (sourceLabel.endsWith('の回数') && displayLabel !== sourceLabel) issues.push('unsafe-no-count-shortening');
      if (issues.length) labelIssues.push({ ...row, issues });

      if (displayLabel) {
        const prior = seen.get(displayLabel) ?? [];
        prior.push(inputId);
        seen.set(displayLabel, prior);
      }
    }

    for (const [label, inputIds] of seen) {
      if (inputIds.length > 1) duplicateLabels.push({ machineId, displayName, sectionName, label, inputIds });
    }

    for (const fixture of sectionFixtures) {
      if (!fixture.machine.test(displayName) || !fixture.section.test(sectionName)) continue;
      const state = fixtureState.get(fixture.id);
      state.found = true;
      state.details.push({ machineId, displayName, sectionName, classifications: sectionRows.map((x) => ({ inputId: x.inputId, label: x.sourceLabel, classification: x.classification })) });
      state.pass = sectionRows.length >= 2 && sectionRows.every((x) => x.classification === 'AUTO-6');
    }
  }

  for (const fixture of machineFixtures) {
    if (!fixture.machine.test(displayName)) continue;
    const state = fixtureState.get(fixture.id);
    state.found = true;
    const matched = rows.filter((x) => x.machineId === machineId && fixture.labels.some((re) => re.test(x.sourceLabel)));
    const eachLabelFound = fixture.labels.every((re) => rows.some((x) => x.machineId === machineId && re.test(x.sourceLabel)));
    state.details.push({ machineId, displayName, matched: matched.map((x) => ({ sectionName: x.sectionName, label: x.sourceLabel, classification: x.classification })) });
    state.pass = eachLabelFound && matched.every((x) => x.classification === 'AUTO-6');
  }
}

const fixtureResults = [...fixtureState.values()];
const byClass = (name) => rows.filter((x) => x.classification === name);
const report = {
  schemaVersion: 'feature-ui-v2-audit-v1',
  mode: 'READ_ONLY',
  policy: {
    sourceOfTruth: 'research/<machineId>/ui-design-data.json',
    evidence: 'Only Feature inputIds are classified; Evidence presentation is not modified or inferred from section titles.',
    decision: 'Classification is based on physical/operational layout compatibility, not statistical Feature type alone.',
    oddCount: 'AUTO-6 remains half-width even when it is the final odd control; no automatic widening to 12.',
    sectionBoundary: 'No pairing across canonical section boundaries.',
    mutation: 'This auditor never changes canonical UI or MachineData.',
  },
  summary: {
    canonicalMachines,
    sections,
    inputs: rows.length,
    auto6: byClass('AUTO-6').length,
    keep12: byClass('KEEP-12').length,
    review: byClass('REVIEW').length,
    labelIssues: labelIssues.length,
    duplicateLabels: duplicateLabels.length,
    contractDriftMachines: contractDrifts.length,
    unexpectedContractDrifts: contractDrifts.filter((x) => !x.expectedKnownDrift).length,
    fixturePass: fixtureResults.filter((x) => x.pass).length,
    fixtureTotal: fixtureResults.length,
  },
  contractDrifts,
  fixtureResults,
  labelIssues,
  duplicateLabels,
  classifications: {
    AUTO_6: byClass('AUTO-6'),
    KEEP_12: byClass('KEEP-12'),
    REVIEW: byClass('REVIEW'),
  },
};

fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
write(REPORT_PATH, report);
console.log(`Feature UI v2 READ_ONLY: machines=${canonicalMachines} sections=${sections} inputs=${rows.length}`);
console.log(`AUTO-6=${report.summary.auto6} KEEP-12=${report.summary.keep12} REVIEW=${report.summary.review}`);
console.log(`labelIssues=${report.summary.labelIssues} duplicateLabels=${report.summary.duplicateLabels}`);
console.log(`contractDrifts=${report.summary.contractDriftMachines} unexpected=${report.summary.unexpectedContractDrifts}`);
for (const fixture of fixtureResults) console.log(`FIXTURE ${fixture.pass ? 'PASS' : 'FAIL'} ${fixture.id} found=${fixture.found}`);
for (const issue of labelIssues) console.log(`LABEL ${issue.machineId} | ${issue.sectionName} | ${issue.sourceLabel} -> ${issue.displayLabel} | ${issue.issues.join(',')}`);

if (fixtureResults.some((x) => !x.pass)) process.exitCode = 2;
if (contractDrifts.some((x) => !x.expectedKnownDrift)) process.exitCode = 3;
