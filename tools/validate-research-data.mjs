import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function validateResearchData(data) {
  const errors = [];
  const warnings = [];
  const err = (code, message) => errors.push({ code, message });
  const warn = (code, message) => warnings.push({ code, message });

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    err('ROOT_TYPE', 'ResearchDataのルートはobjectである必要があります。');
    return { status: 'FAIL', errors, warnings };
  }
  if (data.schemaVersion !== 'research-data-v1') err('SCHEMA_VERSION', 'schemaVersionはresearch-data-v1である必要があります。');

  const machine = data.machine;
  if (!machine || typeof machine !== 'object') err('MACHINE_REQUIRED', 'machineが必要です。');
  const settings = new Set(Array.isArray(machine?.settings) ? machine.settings : []);
  if (!machine?.machineId) err('MACHINE_ID', 'machine.machineIdが必要です。');
  if (!machine?.displayName) err('DISPLAY_NAME', 'machine.displayNameが必要です。');
  if (!machine?.manufacturer) err('MANUFACTURER', 'machine.manufacturerが必要です。');
  if (settings.size === 0) err('SETTINGS', 'machine.settingsを1件以上指定してください。');

  const sources = Array.isArray(data.sources) ? data.sources : [];
  const sourceIds = new Set();
  for (const source of sources) {
    if (!source?.sourceId) { err('SOURCE_ID', 'sourceIdがない出典があります。'); continue; }
    if (sourceIds.has(source.sourceId)) err('SOURCE_DUPLICATE', `sourceIdが重複しています: ${source.sourceId}`);
    sourceIds.add(source.sourceId);
    if (!source.publisher || !source.url || !source.checkedAt || !source.sourceType) err('SOURCE_REQUIRED', `出典 ${source.sourceId} の必須項目が不足しています。`);
  }
  const checkSourceRefs = (refs, context) => {
    if (!Array.isArray(refs) || refs.length === 0) { err('SOURCE_REFS', `${context} にsourceRefsが必要です。`); return; }
    for (const ref of refs) if (!sourceIds.has(ref)) err('SOURCE_REF_UNKNOWN', `${context} が未定義の出典 ${ref} を参照しています。`);
  };
  checkSourceRefs(machine?.identitySourceRefs, 'machine.identitySourceRefs');

  const featureIds = new Set();
  const features = Array.isArray(data.features) ? data.features : [];
  for (const feature of features) {
    const id = feature?.researchFeatureId;
    if (!id) { err('FEATURE_ID', 'researchFeatureIdがないFeatureがあります。'); continue; }
    if (featureIds.has(id)) err('FEATURE_DUPLICATE', `researchFeatureIdが重複しています: ${id}`);
    featureIds.add(id);
    checkSourceRefs(feature.sourceRefs, `Feature ${id}`);
    if (!feature.name || !feature.factStatus || !feature.candidateModel || !feature.trialUnit || !feature.numeratorDefinition || !feature.denominatorDefinition) {
      err('FEATURE_REQUIRED', `Feature ${id} の必須項目が不足しています。`);
    }
    const values = feature.settingValues;
    if (!values || typeof values !== 'object' || Array.isArray(values)) err('SETTING_VALUES', `Feature ${id} のsettingValuesが不正です。`);
    else {
      for (const [settingId, value] of Object.entries(values)) {
        if (!settings.has(settingId)) err('SETTING_UNKNOWN', `Feature ${id} が実在設定にない ${settingId} を参照しています。`);
        const p = value?.probability;
        if (typeof p !== 'number' || !Number.isFinite(p) || p < 0 || p > 1) err('PROBABILITY', `Feature ${id} / ${settingId} のprobabilityは0～1の有限数である必要があります。`);
        if (typeof value?.numerator === 'number' && typeof value?.denominator === 'number' && value.denominator > 0) {
          const derived = value.numerator / value.denominator;
          if (typeof p === 'number' && Math.abs(derived - p) > 1e-9) warn('PROBABILITY_RATIO_MISMATCH', `Feature ${id} / ${settingId} のprobabilityとnumerator/denominatorが一致しません。`);
        }
      }
    }
    if (feature.candidateModel === 'multinomial') {
      const categories = Array.isArray(feature.categories) ? feature.categories : [];
      if (categories.length < 2) err('MULTINOMIAL_CATEGORIES', `Feature ${id} のmultinomialにはcategoriesを2件以上指定してください。`);
      if (new Set(categories).size !== categories.length) err('MULTINOMIAL_CATEGORY_DUPLICATE', `Feature ${id} のcategoriesが重複しています。`);
      const distributions = feature.settingDistributions;
      if (!distributions || typeof distributions !== 'object' || Array.isArray(distributions)) {
        err('MULTINOMIAL_DISTRIBUTIONS', `Feature ${id} のmultinomialにはsettingDistributionsが必要です。`);
      } else {
        for (const [settingId, distribution] of Object.entries(distributions)) {
          if (!settings.has(settingId)) err('SETTING_UNKNOWN', `Feature ${id} のsettingDistributionsが実在設定にない ${settingId} を参照しています。`);
          if (!distribution || typeof distribution !== 'object' || Array.isArray(distribution)) {
            err('MULTINOMIAL_DISTRIBUTION_TYPE', `Feature ${id} / ${settingId} のカテゴリ分布が不正です。`);
            continue;
          }
          const keys = Object.keys(distribution);
          for (const category of keys) {
            if (!categories.includes(category)) err('MULTINOMIAL_CATEGORY_UNKNOWN', `Feature ${id} / ${settingId} が未定義カテゴリ ${category} を参照しています。`);
            const prob = distribution[category];
            if (typeof prob !== 'number' || !Number.isFinite(prob) || prob < 0 || prob > 1) err('MULTINOMIAL_PROBABILITY', `Feature ${id} / ${settingId} / ${category} の確率は0～1の有限数である必要があります。`);
          }
          const missing = categories.filter((category) => !(category in distribution));
          if (missing.length) warn('MULTINOMIAL_INCOMPLETE', `Feature ${id} / ${settingId} はカテゴリが不足しています: ${missing.join(', ')}`);
          const sum = categories.reduce((acc, category) => acc + (typeof distribution[category] === 'number' && Number.isFinite(distribution[category]) ? distribution[category] : 0), 0);
          const distributionMode = feature.distributionMode ?? 'complete';
          if (missing.length === 0 && distributionMode === 'complete' && Math.abs(sum - 1) > 1e-6) {
            err('MULTINOMIAL_SUM', `Feature ${id} / ${settingId} のcompleteカテゴリ確率合計は1である必要があります（実値 ${sum}）。`);
          }
          if (missing.length === 0 && distributionMode === 'implicit_residual' && sum > 1 + 1e-6) {
            err('MULTINOMIAL_SUM', `Feature ${id} / ${settingId} の明示カテゴリ確率合計が1を超えています（実値 ${sum}）。`);
          }
        }
      }
    }
    if (feature.factStatus === 'conflict' && feature.crossSourceStatus !== 'conflict') warn('CONFLICT_STATUS', `Feature ${id} はfactStatus=conflictですがcrossSourceStatusがconflictではありません。`);
  }

  const evidenceIds = new Set();
  const evidence = Array.isArray(data.evidenceCandidates) ? data.evidenceCandidates : [];
  for (const ev of evidence) {
    const id = ev?.researchEvidenceId;
    if (!id) { err('EVIDENCE_ID', 'researchEvidenceIdがないEvidenceがあります。'); continue; }
    if (evidenceIds.has(id)) err('EVIDENCE_DUPLICATE', `researchEvidenceIdが重複しています: ${id}`);
    evidenceIds.add(id);
    checkSourceRefs(ev.sourceRefs, `Evidence ${id}`);
    for (const field of ['allowedSettings', 'deniedSettings']) {
      if (!Array.isArray(ev[field])) err('EVIDENCE_SETTINGS', `Evidence ${id} の${field}は配列である必要があります。`);
      else for (const settingId of ev[field]) if (!settings.has(settingId)) err('EVIDENCE_SETTING_UNKNOWN', `Evidence ${id} の${field}に実在しない ${settingId} があります。`);
    }
    const allowed = new Set(Array.isArray(ev.allowedSettings) ? ev.allowedSettings : []);
    for (const denied of Array.isArray(ev.deniedSettings) ? ev.deniedSettings : []) if (allowed.has(denied)) err('EVIDENCE_OVERLAP', `Evidence ${id} で ${denied} がallowed/deniedの両方にあります。`);
  }

  const conflictIds = new Set();
  const conflicts = Array.isArray(data.conflicts) ? data.conflicts : [];
  for (const conflict of conflicts) {
    const id = conflict?.conflictId;
    if (!id) { err('CONFLICT_ID', 'conflictIdがない競合があります。'); continue; }
    if (conflictIds.has(id)) err('CONFLICT_DUPLICATE', `conflictIdが重複しています: ${id}`);
    conflictIds.add(id);
    checkSourceRefs(conflict.sourceRefs, `Conflict ${id}`);
    if (conflict.targetType === 'feature' && !featureIds.has(conflict.targetId)) err('CONFLICT_TARGET', `Conflict ${id} のFeature ${conflict.targetId} が存在しません。`);
    if (conflict.targetType === 'evidence' && !evidenceIds.has(conflict.targetId)) err('CONFLICT_TARGET', `Conflict ${id} のEvidence ${conflict.targetId} が存在しません。`);
    if (conflict.targetType === 'machine' && conflict.targetId !== machine?.machineId) err('CONFLICT_TARGET', `Conflict ${id} のmachine targetIdがmachineIdと一致しません。`);
  }

  return { status: errors.length ? 'FAIL' : 'PASS', errors, warnings };
}

function main() {
  const input = process.argv[2];
  if (!input) {
    console.error('Usage: npm run research:validate -- research/<machineId>/research-data.json');
    process.exit(2);
  }
  const fullPath = path.resolve(process.cwd(), input);
  let data;
  try { data = JSON.parse(fs.readFileSync(fullPath, 'utf8')); }
  catch (e) { console.error(`FAILED: ${e.message}`); process.exit(1); }
  const report = validateResearchData(data);
  for (const warning of report.warnings) console.warn(`WARNING [${warning.code}] ${warning.message}`);
  for (const error of report.errors) console.error(`ERROR [${error.code}] ${error.message}`);
  if (report.status === 'PASS') {
    console.log(`OK: ResearchDataを検証しました（警告 ${report.warnings.length}件）`);
    return;
  }
  console.error(`FAILED: エラー ${report.errors.length}件 / 警告 ${report.warnings.length}件`);
  process.exit(1);
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) main();
