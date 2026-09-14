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

const fixtures = [
  {
    id: 'love-cure-weak-cherry-suika',
    machineId: 'L_LOVEKYURE2_PS',
    requiredInputIds: null,
    labelPatterns: [/弱チェリー/, /スイカ/],
  },
  {
    id: 'bancho4-first-hit-direct-at',
    machineId: 'L_OSU_BANCHO4_A3',
    requiredInputIds: null,
    labelPatterns: [/初当り/, /AT直撃/],
  },
  {
    id: 'umineko2-lv2-replay',
    machineId: 'L_UMINEKO_2_A1',
    requiredInputIds: null,
    labelPatterns: [/Lv2ナビ/i, /対象リプレイ/],
  },
  {
    id: 'arifureta-first-hit-success',
    machineId: 'L_ARIFURETA_JA',
    requiredInputIds: [
      'INP_COMBINED_FIRST_HIT',
      'INP_AWAKENING_TRIALS',
      'INP_AWAKENING_SUCCESS',
    ],
  },
  {
    id: 'initial-d-2nd-at-lb-end-feature',
    machineId: 'L_INITIAL_D_2ND',
    requiredInputIds: [
      'INP_AT_LB_END_DEFAULT_COUNT',
      'INP_AT_LB_END_ODD_COUNT',
      'INP_AT_LB_END_EVEN_COUNT',
      'INP_AT_LB_END_SWIMSUIT_COUNT',
    ],
    requiredFeatureName: 'AT中LB終了画面',
  },
];

const fixtureByMachine = new Map();
for (const fixture of fixtures) {
  const list = fixtureByMachine.get(fixture.machineId) ?? [];
  list.push(fixture);
  fixtureByMachine.set(fixture.machineId, list);
}

function packageUiItemMap(pkg) {
  const map = new Map();
  for (const section of pkg.ui?.sections ?? []) {
    for (const item of section.items ?? []) {
      if (item?.type !== 'input' || !item.inputId) continue;
      map.set(item.inputId, { sectionTitle: section.title ?? null, item });
    }
  }
  return map;
}

function fixtureInputIds(fixture, machineRows) {
  if (fixture.requiredInputIds) return fixture.requiredInputIds;
  const ids = [];
  for (const pattern of fixture.labelPatterns ?? []) {
    const match = machineRows.find((row) => pattern.test(row.sourceLabel));
    if (match) ids.push(match.inputId);
  }
  return ids;
}

const rows = [];
const labelIssues = [];
const duplicateLabels = [];
const contractDrifts = [];
const materializationDrifts = [];
const evidenceLeakage = [];
const fixtureResults = [];
let canonicalMachines = 0;
let sections = 0;

const classify = ({ contract, fixtureRequired }) => {
  const sourceLabel = String(contract?.name ?? '').trim();
  const mode = String(contract?.mode ?? contract?.widget ?? '').toUpperCase();
  if (fixtureRequired) return { classification: 'AUTO-6', reason: 'required-regression-fixture' };
  if (FULL_WIDTH_NAME.test(sourceLabel)) return { classification: 'KEEP-12', reason: 'game-total/denominator/aggregate input' };
  if (LONG_OR_COMPLEX.test(sourceLabel)) return { classification: 'KEEP-12', reason: 'long/freeform/complex label' };
  if (DEPENDENCY_HINT.test(sourceLabel)) return { classification: 'REVIEW', reason: 'possible parent-child/denominator dependency' };
  if (contract?.gridSpan === 6 && contract?.compact === true) return { classification: 'AUTO-6', reason: 'existing explicit compact canonical intent' };
  if (mode === 'COUNTER') return { classification: 'AUTO-6', reason: 'short independent counter control' };
  if (REVIEW_MODES.has(mode)) return { classification: 'REVIEW', reason: `compact-capable ${mode || 'UNKNOWN'} requires physical/semantic review` };
  if (contract?.gridSpan === 6) return { classification: 'REVIEW', reason: `existing half-width special mode:${mode || 'UNKNOWN'}` };
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
  const packageInputs = pkg.inputs?.inputs ?? [];
  const packageInputIds = new Set(packageInputs.map((x) => x.id));
  const packageInputById = new Map(packageInputs.map((x) => [x.id, x]));
  const packageUiByInputId = packageUiItemMap(pkg);
  const machineRows = [];

  const featureInputIds = [];
  for (const sectionName of ui.sectionOrder ?? []) {
    const section = ui.sections?.[sectionName];
    if (!section || !Array.isArray(section.inputIds) || section.inputIds.length === 0) continue;
    const validIds = section.inputIds.filter((id) => Object.hasOwn(ui.inputContracts ?? {}, id));
    if (!validIds.length) continue;
    sections += 1;
    featureInputIds.push(...validIds);
    const seen = new Map();

    for (const inputId of validIds) {
      const contract = ui.inputContracts[inputId];
      const packageInput = packageInputById.get(inputId);
      if (inputId.startsWith('INP_EVI_') || packageInput?.category === 'EVIDENCE') {
        evidenceLeakage.push({ machineId, displayName, sectionName, inputId, reason: 'evidence input appeared in canonical Feature inputIds' });
        continue;
      }
      if (!packageInputIds.has(inputId)) continue;

      const fixtureRequired = (fixtureByMachine.get(machineId) ?? []).some((fixture) => {
        if (fixture.requiredInputIds?.includes(inputId)) return true;
        return (fixture.labelPatterns ?? []).some((re) => re.test(String(contract.name ?? '')));
      });
      const sourceLabel = String(contract.name ?? '').trim();
      const displayLabel = normalizeLabel(sourceLabel);
      const result = classify({ contract, fixtureRequired });
      const materialized = packageUiByInputId.get(inputId);
      const actualGridSpan = materialized?.item?.gridSpan ?? null;
      const actualCompact = materialized?.item?.config?.compact ?? null;
      const expectedGridSpan = contract.gridSpan ?? null;
      const expectedCompact = contract.compact ?? null;
      const row = {
        machineId,
        displayName,
        sectionName,
        inputId,
        sourceLabel,
        displayLabel,
        mode: contract.mode ?? contract.widget ?? null,
        currentGridSpan: expectedGridSpan,
        compact: expectedCompact,
        materializedGridSpan: actualGridSpan,
        materializedCompact: actualCompact,
        classification: result.classification,
        reason: result.reason,
      };
      rows.push(row);
      machineRows.push(row);

      if (!materialized) {
        materializationDrifts.push({ machineId, displayName, sectionName, inputId, kind: 'missing-ui-item', expectedGridSpan, expectedCompact });
      } else if (actualGridSpan !== expectedGridSpan || actualCompact !== expectedCompact) {
        materializationDrifts.push({
          machineId,
          displayName,
          sectionName,
          inputId,
          kind: 'layout-parity',
          expectedGridSpan,
          actualGridSpan,
          expectedCompact,
          actualCompact,
          materializedSectionTitle: materialized.sectionTitle,
        });
      }

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
  }

  const missingInputIds = [...new Set(featureInputIds)].filter((id) => !packageInputIds.has(id));
  if (missingInputIds.length) {
    contractDrifts.push({ machineId, displayName, reason: 'canonical-feature-input-id-missing-in-package', missingInputIds, expectedKnownDrift: CONTRACT_DRIFT_IDS.has(machineId) });
  }

  for (const fixture of fixtureByMachine.get(machineId) ?? []) {
    const requiredIds = fixtureInputIds(fixture, machineRows);
    const missingFixtureIds = fixture.requiredInputIds
      ? fixture.requiredInputIds.filter((id) => !machineRows.some((row) => row.inputId === id))
      : (fixture.labelPatterns ?? []).filter((pattern) => !machineRows.some((row) => pattern.test(row.sourceLabel))).map(String);
    const matched = machineRows.filter((row) => requiredIds.includes(row.inputId));
    const packageFeatureNamePass = fixture.requiredFeatureName
      ? (pkg.features?.features ?? []).some((feature) => feature.name === fixture.requiredFeatureName && requiredIds.some((id) =>
          feature.denominatorInputId === id ||
          feature.numeratorInputId === id ||
          (feature.denominatorInputIds ?? []).includes(id) ||
          (feature.categoryInputIds ?? []).includes(id)))
      : true;
    const classificationPass = missingFixtureIds.length === 0 && requiredIds.length > 0 && matched.every((row) => row.classification === 'AUTO-6');
    const canonicalLayoutPass = matched.every((row) => row.currentGridSpan === 6);
    const materializedLayoutPass = matched.every((row) => row.materializedGridSpan === 6);
    fixtureResults.push({
      id: fixture.id,
      machineId,
      displayName,
      requiredFeatureName: fixture.requiredFeatureName ?? null,
      requiredInputIds: requiredIds,
      missingFixtureIds,
      classificationPass,
      canonicalLayoutPass,
      materializedLayoutPass,
      packageFeatureNamePass,
      pass: classificationPass && canonicalLayoutPass && materializedLayoutPass && packageFeatureNamePass,
      matched: matched.map((row) => ({ inputId: row.inputId, label: row.sourceLabel, classification: row.classification, canonicalGridSpan: row.currentGridSpan, materializedGridSpan: row.materializedGridSpan })),
    });
  }
}

for (const fixture of fixtures) {
  if (!fixtureResults.some((result) => result.id === fixture.id)) {
    fixtureResults.push({ id: fixture.id, machineId: fixture.machineId, pass: false, reason: 'fixture-machine-not-audited' });
  }
}

const byClass = (name) => rows.filter((x) => x.classification === name);
const driftMachines = new Set(materializationDrifts.map((x) => x.machineId));
const report = {
  schemaVersion: 'feature-ui-v2-audit-v2',
  mode: 'READ_ONLY',
  policy: {
    sourceOfTruth: 'research/<machineId>/ui-design-data.json',
    featureScope: 'Only canonical section.inputIds backed by inputContracts and non-EVIDENCE package inputs are classified.',
    evidence: 'Evidence contracts and EVIDENCE package inputs are explicitly excluded from Feature layout classification.',
    decision: 'Classification is based on physical/operational layout compatibility, not statistical Feature type alone.',
    oddCount: 'AUTO-6 remains half-width even when it is the final odd control; no automatic widening to 12.',
    sectionBoundary: 'No pairing across canonical section boundaries.',
    parity: 'Canonical gridSpan/compact intent is compared with materialized machine-package UI items.',
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
    evidenceLeakage: evidenceLeakage.length,
    contractDriftMachines: contractDrifts.length,
    unexpectedContractDrifts: contractDrifts.filter((x) => !x.expectedKnownDrift).length,
    materializationDrifts: materializationDrifts.length,
    materializationDriftMachines: driftMachines.size,
    fixturePass: fixtureResults.filter((x) => x.pass).length,
    fixtureTotal: fixtureResults.length,
  },
  contractDrifts,
  materializationDrifts,
  evidenceLeakage,
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
console.log(`labelIssues=${report.summary.labelIssues} duplicateLabels=${report.summary.duplicateLabels} evidenceLeakage=${report.summary.evidenceLeakage}`);
console.log(`contractDrifts=${report.summary.contractDriftMachines} unexpected=${report.summary.unexpectedContractDrifts}`);
console.log(`materializationDrifts=${report.summary.materializationDrifts} machines=${report.summary.materializationDriftMachines}`);
for (const fixture of fixtureResults) console.log(`FIXTURE ${fixture.pass ? 'PASS' : 'FAIL'} ${fixture.id}`);
for (const issue of labelIssues) console.log(`LABEL ${issue.machineId} | ${issue.sectionName} | ${issue.sourceLabel} -> ${issue.displayLabel} | ${issue.issues.join(',')}`);

if (fixtureResults.some((x) => !x.pass)) process.exitCode = 2;
if (contractDrifts.some((x) => !x.expectedKnownDrift)) process.exitCode = 3;
if (evidenceLeakage.length) process.exitCode = 4;
