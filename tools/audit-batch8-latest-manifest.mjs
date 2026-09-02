#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const ids = [
  'L_USHIO_TORA_HAKUMEN_VH',
  'L_AMAZING_LIVE_PD',
  'L_YOSHIMUNE_SC2',
  'L_MAHJONG_MONOGATARI_S2',
  'L_IDOLMASTER_MILLION_LIVE_HC',
  'L_YOUJITSU_DE',
  'L_MIDORIDON_VIVA_REVIVAL_FY',
  'L_GUNDAM_SEED_G'
];

const reportPath = path.join(root, 'reports', 'batch8-latest-manifest-audit.json');
const internalTokenRe = /\b(?:SelectionData|ResearchData|MachineData|Feature|Evidence|inferenceRole|sourceType|observationRole|INCLUDE_PRIMARY|INCLUDE_SUPPORT|INCLUDE_FALLBACK|EXCLUDE)\b/i;
const latentRe = /(通常滞在|高確滞在|内部状態|内部モード|モード|状態別|高確移行)/;
const cumulativeRe = /(当日遊技履歴|累積|着席時|履歴)/;
const resetRe = /(電源|リセット|reset|日付変更|消去|消える|初期化)/i;
const nestedRe = /(成功回数\s*[\/／]\s*総回数|成功回数.*総回数|成功.*total|success.*total)/i;

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}
function add(result, severity, code, message, extra = {}) {
  result.findings.push({ severity, code, message, ...extra });
}
function evidenceTimingFamily(id, name='') {
  const s = `${id} ${name}`;
  if (/TROPHY|トロフィー/i.test(s)) return 'TROPHY';
  if (/BONUS_END|ボーナス終了/i.test(s)) return 'BONUS_END';
  if (/AT_END|AT終了/i.test(s)) return 'AT_END';
  if (/PAYOUT|枚OVER|枚突破/i.test(s)) return 'PAYOUT';
  if (/VOICE|ボイス|セリフ/i.test(s)) return 'VOICE';
  if (/INTRO|キャラ紹介/i.test(s)) return 'INTRO';
  if (/MENU|メニュー/i.test(s)) return 'MENU';
  if (/STAMP|スタンプ/i.test(s)) return 'END_SCREEN';
  if (/ADD_|上乗せ/i.test(s)) return 'AT_ADD';
  if (/PANEL|パネル/i.test(s)) return 'PANEL';
  if (/MOVIE|ムービー/i.test(s)) return 'MOVIE';
  if (/HIDDEN|隠し/i.test(s)) return 'HIDDEN';
  return 'OTHER';
}

const report = {
  generatedAt: new Date().toISOString(),
  standards: {
    corePolicy: 'v1.7',
    researchSelectionObservationManifest: 'v6.13',
    machineDataUxManifest: 'v6.11'
  },
  machineIds: ids,
  machines: [],
  summary: {}
};

for (const machineId of ids) {
  const result = { machineId, findings: [], stats: {} };
  const dir = path.join(root, 'research', machineId);
  const files = {
    research: path.join(dir, 'research-data.json'),
    selection: path.join(dir, 'selection-data.json'),
    observation: path.join(dir, 'machine-observation-data.json'),
    ui: path.join(dir, 'ui-design-data.json'),
    package: path.join(root, 'machines', machineId, 'machine-package.json')
  };
  for (const [kind, file] of Object.entries(files)) {
    if (!fs.existsSync(file)) add(result, 'BLOCK', 'MISSING_FILE', `${kind} file missing`, { file: path.relative(root, file) });
  }
  if (result.findings.some(f => f.code === 'MISSING_FILE')) {
    report.machines.push(result);
    continue;
  }

  const selection = readJson(files.selection);
  const observation = readJson(files.observation);
  const ui = readJson(files.ui);
  const pkg = readJson(files.package);
  const inputById = new Map((selection.inputs ?? []).map(x => [x.id, x]));

  // UX v6.11: user-facing language boundary and Evidence default-collapsed/timing grouping.
  for (const [title, section] of Object.entries(ui.sections ?? {})) {
    const strings = [title, section?.description ?? ''];
    for (const id of section?.inputIds ?? []) strings.push(ui.inputContracts?.[id]?.name ?? inputById.get(id)?.name ?? '');
    for (const text of strings) if (internalTokenRe.test(text)) {
      add(result, 'BLOCK', 'USER_FACING_INTERNAL_TOKEN', `User-facing text contains internal terminology: ${text}`, { section: title });
    }

    const evidenceIds = (section?.inputIds ?? []).filter(id => inputById.get(id)?.category === 'EVIDENCE');
    if (evidenceIds.length) {
      if (section.collapsible !== true || section.defaultExpanded !== false) {
        add(result, 'BLOCK', 'EVIDENCE_NOT_DEFAULT_COLLAPSED', `Evidence section must be collapsible and closed by default: ${title}`, { section: title });
      }
      const families = [...new Set(evidenceIds.map(id => evidenceTimingFamily(id, inputById.get(id)?.name)))];
      const generic = /設定示唆|確定情報|Evidence/i.test(title);
      if (generic && families.length > 1) {
        add(result, 'BLOCK', 'EVIDENCE_TIMING_MIXED', `Evidence from multiple confirmation timings is grouped into one generic section: ${families.join(', ')}`, { section: title, families });
      }
    }

    if ((section?.inputIds?.length ?? 0) > 1) {
      const names = section.inputIds.map(id => ui.inputContracts?.[id]?.name ?? inputById.get(id)?.name ?? '').filter(Boolean);
      const stripMeasure = (name) => name.replace(/\s+(回数|試行数)$/,'').trim();
      const stems = [...new Set(names.map(stripMeasure))];
      const pairedMeasureGroup = stems.length === 1 && stems[0] === title;
      const firstName = names[0] ?? '';
      if (!pairedMeasureGroup && firstName && (title === firstName || firstName.startsWith(`${title} `) || title === stripMeasure(firstName))) {
        add(result, 'REVIEW', 'FIRST_ITEM_SECTION_TITLE_RISK', `Section title may be derived from the first input rather than the semantic group: ${title}`, { section: title, firstInput: firstName });
      }
    }
  }

  const evidenceInputIds = (selection.inputs ?? []).filter(x => x.category === 'EVIDENCE').map(x => x.id);
  const uiInputIds = new Set(Object.values(ui.sections ?? {}).flatMap(s => s.inputIds ?? []));
  for (const id of evidenceInputIds) if (!uiInputIds.has(id)) add(result, 'BLOCK', 'EVIDENCE_INPUT_NOT_MATERIALIZED', `Evidence input is not present in any UI section: ${id}`);

  // RSO v6.13: latent state / conditional denominator review.
  for (const feature of selection.features ?? []) {
    if (!String(feature.adoptionCategory ?? '').startsWith('INCLUDE')) continue;
    const text = [feature.userReason, feature.denominatorDescription, feature.notes, inputById.get(feature.numeratorInputId)?.name, inputById.get(feature.denominatorInputId)?.name].filter(Boolean).join(' ');
    if (latentRe.test(text)) {
      const mapping = (observation.featureMappings ?? []).find(m => m.featureId === feature.featureId);
      const obs = (mapping?.observationIds ?? []).map(id => (observation.observations ?? []).find(o => o.observationId === id)).filter(Boolean);
      const obsText = JSON.stringify(obs);
      const hasExplicitObservability = /(確定観測|判別|observable|識別|除外できる|状態を.*確認)/i.test(obsText);
      if (!hasExplicitObservability) {
        add(result, 'BLOCK', 'LATENT_STATE_OBSERVABILITY_UNPROVEN', `Included feature appears state-dependent but Observation does not prove per-trial state observability: ${feature.featureId}`, { featureId: feature.featureId, adoptionCategory: feature.adoptionCategory });
      } else {
        add(result, 'REVIEW', 'LATENT_STATE_REVIEW', `State-dependent included feature requires explicit v6.13 observability review: ${feature.featureId}`, { featureId: feature.featureId });
      }
    }
  }

  // RSO v6.13: cumulative menu reset-boundary and nested success/total semantics.
  for (const obs of observation.observations ?? []) {
    const text = JSON.stringify(obs);
    if (obs.sourceType === 'MACHINE_MENU' && cumulativeRe.test(text) && !resetRe.test(text)) {
      add(result, 'REVIEW', 'CUMULATIVE_MENU_RESET_UNPROVEN', `Cumulative/menu-history observation lacks reset-boundary semantics: ${obs.observationId}`, { observationId: obs.observationId });
    }
    if (nestedRe.test(text)) {
      const hasSemantics = /(右側|左側|success|total|分母|総回数.*使用|成功回数.*使用しない)/i.test(text);
      if (!hasSemantics) add(result, 'BLOCK', 'NESTED_SUCCESS_TOTAL_UNRESOLVED', `Nested success/total observation lacks explicit semantics: ${obs.observationId}`, { observationId: obs.observationId });
    }
  }

  // Current unresolved observation debt: review rather than auto-fail unless it invalidates an active feature.
  const coverage = observation.sourceCoverage ?? {};
  for (const [key, status] of Object.entries(coverage)) if (status === 'UNRESOLVED') {
    add(result, 'REVIEW', 'SOURCE_COVERAGE_UNRESOLVED', `${key} remains UNRESOLVED`, { source: key });
  }
  for (const item of observation.fieldVerificationItems ?? []) if (item.status === 'WAITING_FOR_MACHINE') {
    add(result, 'REVIEW', 'FIELD_VERIFICATION_WAITING', item.question, { verificationId: item.verificationId, sourceType: item.sourceType });
  }

  // MachinePackage materialization preservation for section semantics.
  const pkgSections = pkg.ui?.sections ?? [];
  const pkgByTitle = new Map(pkgSections.map(s => [s.title, s]));
  for (const [title, section] of Object.entries(ui.sections ?? {})) {
    const p = pkgByTitle.get(title);
    if (!p) {
      add(result, 'BLOCK', 'UI_PACKAGE_SECTION_MISSING', `MachinePackage is missing UI section: ${title}`, { section: title });
      continue;
    }
    if ((p.description ?? '') !== (section.description ?? '')) add(result, 'BLOCK', 'UI_PACKAGE_DESCRIPTION_DRIFT', `MachinePackage description differs from ui-design-data: ${title}`, { section: title });
    if (Boolean(p.collapsible) !== Boolean(section.collapsible) || Boolean(p.defaultExpanded) !== Boolean(section.defaultExpanded)) {
      add(result, 'BLOCK', 'UI_PACKAGE_COLLAPSE_DRIFT', `MachinePackage collapse contract differs from ui-design-data: ${title}`, { section: title });
    }
  }

  result.stats = {
    inputs: selection.inputs?.length ?? 0,
    features: selection.features?.length ?? 0,
    observations: observation.observations?.length ?? 0,
    uiSections: Object.keys(ui.sections ?? {}).length,
    evidenceInputs: evidenceInputIds.length,
    blocks: result.findings.filter(f => f.severity === 'BLOCK').length,
    reviews: result.findings.filter(f => f.severity === 'REVIEW').length
  };
  result.status = result.stats.blocks ? 'BLOCK' : result.stats.reviews ? 'REVIEW' : 'PASS';
  report.machines.push(result);
}

report.summary = {
  totalMachines: report.machines.length,
  pass: report.machines.filter(x => x.status === 'PASS').length,
  review: report.machines.filter(x => x.status === 'REVIEW').length,
  block: report.machines.filter(x => x.status === 'BLOCK').length,
  totalBlocks: report.machines.reduce((n,x) => n + (x.stats?.blocks ?? x.findings.filter(f=>f.severity==='BLOCK').length), 0),
  totalReviews: report.machines.reduce((n,x) => n + (x.stats?.reviews ?? x.findings.filter(f=>f.severity==='REVIEW').length), 0)
};

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report.summary, null, 2));
for (const machine of report.machines) {
  console.log(`\n${machine.machineId}: ${machine.status}`);
  for (const finding of machine.findings) console.log(`- ${finding.severity} [${finding.code}] ${finding.message}`);
}
