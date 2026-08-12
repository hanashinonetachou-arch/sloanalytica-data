import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

export const KNOWN_CAPABILITIES = new Set([
  'binomial', 'multinomial', 'poisson', 'conditional_partial_multinomial',
  'conditional_partial_binomial', 'marginal_multinomial', 'evidence',
  'reference_display', 'auto_accumulator', 'evidence_multi_select', 'derived_denominator',
  'difficulty_display',
]);

const MODEL_CAPABILITY = {
  binomial: 'binomial',
  multinomial: 'multinomial',
  poisson: 'poisson',
  conditional_partial_multinomial: 'conditional_partial_multinomial',
  conditional_partial_binomial: 'conditional_partial_binomial',
  marginal_multinomial: 'marginal_multinomial',
};
const CATALOG_STATUSES = new Set(['available', 'unavailable', 'deprecated']);
const JSON_FILE = 'machine-package.json';

function issue(result, severity, scope, message) {
  result[severity === 'error' ? 'errors' : 'warnings'].push({ severity, scope, message });
}
function isRecord(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }
function isNonEmptyString(value) { return typeof value === 'string' && value.trim().length > 0; }
function isPositiveInteger(value) { return Number.isInteger(value) && value > 0; }
function duplicateValues(values) {
  const seen = new Set(); const duplicates = new Set();
  for (const value of values) { if (seen.has(value)) duplicates.add(value); else seen.add(value); }
  return [...duplicates];
}
function readJson(filePath, result, scope) {
  try { return JSON.parse(fs.readFileSync(filePath, 'utf8')); }
  catch (error) { issue(result, 'error', scope, `JSONを解析できません: ${error.message}`); return null; }
}
function sha256(buffer) { return crypto.createHash('sha256').update(buffer).digest('hex'); }
function validateProbability(value, result, scope) {
  if (!Number.isFinite(value) || value < 0 || value > 1) issue(result, 'error', scope, `確率は0以上1以下の有限数である必要があります: ${String(value)}`);
}
function allInputIds(feature) {
  const ids = [];
  for (const key of ['numeratorInputId', 'denominatorInputId', 'conditionedOnInputId']) if (feature[key] !== undefined) ids.push(feature[key]);
  for (const key of ['categoryInputIds', 'optionalCategoryInputIds', 'denominatorInputIds', 'trialInputIds']) if (Array.isArray(feature[key])) ids.push(...feature[key]);
  if (isRecord(feature.categorySubtractInputIds)) for (const [base, subtracts] of Object.entries(feature.categorySubtractInputIds)) {
    ids.push(base); if (Array.isArray(subtracts)) ids.push(...subtracts);
  }
  return ids;
}
function validateSettingProbabilityMap(map, settings, result, scope, requireValues) {
  if (!isRecord(map)) {
    if (requireValues) issue(result, 'error', scope, '設定別確率がオブジェクトではありません');
    return;
  }
  const keys = Object.keys(map);
  if (requireValues && keys.length === 0) issue(result, 'error', scope, '推測に使用するFeatureに設定別確率がありません');
  for (const setting of settings) if (requireValues && !(setting in map)) issue(result, 'error', scope, `設定別確率に${setting}がありません`);
  for (const setting of keys) if (!settings.includes(setting)) issue(result, 'error', scope, `設定別確率に未定義の設定${setting}があります`);
  for (const [setting, values] of Object.entries(map)) {
    const array = Array.isArray(values) ? values : [values];
    let total = 0;
    for (const value of array) { validateProbability(value, result, `${scope}.${setting}`); if (Number.isFinite(value)) total += value; }
    if (Array.isArray(values) && total > 1 + 1e-9) issue(result, 'error', `${scope}.${setting}`, `カテゴリ確率の合計が1を超えています: ${total}`);
  }
}
function capabilityUsage(machineData, result, scope) {
  const used = new Set();
  for (const feature of machineData.features?.features ?? []) {
    const capability = MODEL_CAPABILITY[feature.modelType];
    if (capability) used.add(capability);
    else if (isNonEmptyString(feature.modelType)) issue(result, 'error', scope, `unknown modelType: ${feature.modelType}`);
    if (feature.calculationRole === 'DISPLAY_ONLY' || feature.probabilityEngineUsage === false) used.add('reference_display');
  }
  if ((machineData.evidence?.evidences ?? []).length > 0) used.add('evidence');
  if ((machineData.inputs?.inputs ?? []).some(input => input?.type === 'multi_enum')) used.add('evidence_multi_select');
  if ((machineData.features?.features ?? []).some(f => Array.isArray(f?.denominatorAdjustments) && f.denominatorAdjustments.length)) used.add('derived_denominator');
  if (machineData.difficulty?.schemaVersion === 'difficulty-display-v1') used.add('difficulty_display');
  for (const section of machineData.ui?.sections ?? []) for (const item of section.items ?? []) if (item.type === 'auto_accumulator') used.add('auto_accumulator');
  return used;
}
function validateAutoAccumulator(item, inputIds, result, scope) {
  if (!inputIds.has(item.inputId)) issue(result, 'error', scope, `出力inputIdが未定義です: ${String(item.inputId)}`);
  const config = item.config?.autoAccumulator;
  if (!isRecord(config)) { issue(result, 'error', scope, 'config.autoAccumulatorが必要です'); return; }
  for (const key of ['selectionInputId', 'conditionInputId']) if (!inputIds.has(config[key])) issue(result, 'error', scope, `${key}が未定義の入力IDです: ${String(config[key])}`);
  for (const key of ['excludedValues', 'conditionExcludedValues']) {
    if (!Array.isArray(config[key]) || config[key].some(value => !Number.isFinite(value))) issue(result, 'error', scope, `${key}は有限数の配列である必要があります`);
  }
  if (!Number.isInteger(config.minSelection) || !Number.isInteger(config.maxSelection) || config.minSelection > config.maxSelection) issue(result, 'error', scope, 'minSelection/maxSelectionの整数範囲が不正です');
  for (const value of [...(config.excludedValues ?? []), ...(config.conditionExcludedValues ?? [])]) {
    if (Number.isInteger(config.minSelection) && Number.isInteger(config.maxSelection) && (value < config.minSelection || value > config.maxSelection)) issue(result, 'error', scope, `除外値${value}が選択可能範囲外です`);
  }
}
function validateMachineData(machineData, result, machineId, filePath) {
  const scope = `${machineId} (${path.relative(result.root, filePath)})`;
  for (const section of ['machine', 'inputs', 'features', 'evidence', 'ui']) if (!isRecord(machineData?.[section])) issue(result, 'error', scope, `必須セクション${section}がありません`);
  if (!isRecord(machineData?.machine)) return new Set();
  const settings = machineData.machine.settings;
  if (!Array.isArray(settings) || settings.length === 0 || settings.some(value => !isNonEmptyString(value))) issue(result, 'error', scope, 'machine.settingsは空でない設定ID配列である必要があります');
  else for (const duplicate of duplicateValues(settings)) issue(result, 'error', scope, `machine.settingsが重複しています: ${duplicate}`);
  const inputs = machineData.inputs?.inputs;
  if (!Array.isArray(inputs)) { issue(result, 'error', scope, 'inputs.inputsが配列ではありません'); return new Set(); }
  const ids = inputs.map(input => input?.id).filter(isNonEmptyString);
  for (const duplicate of duplicateValues(ids)) issue(result, 'error', scope, `入力IDが重複しています: ${duplicate}`);
  for (const input of inputs) if (!isNonEmptyString(input?.id)) issue(result, 'error', scope, 'IDのない入力があります');
  const inputIds = new Set(ids);
  const features = machineData.features?.features;
  if (!Array.isArray(features)) issue(result, 'error', scope, 'features.featuresが配列ではありません');
  else {
    const featureIds = features.map(feature => feature?.featureId).filter(isNonEmptyString);
    for (const duplicate of duplicateValues(featureIds)) issue(result, 'error', scope, `Feature IDが重複しています: ${duplicate}`);
    for (const feature of features) {
      const featureScope = `${scope} feature:${feature?.featureId ?? '(IDなし)'}`;
      if (!isNonEmptyString(feature?.featureId)) issue(result, 'error', featureScope, 'Feature IDがありません');
      if (!MODEL_CAPABILITY[feature?.modelType]) issue(result, 'error', featureScope, `unknown modelType: ${String(feature?.modelType)}`);
      for (const id of allInputIds(feature ?? {})) if (!inputIds.has(id)) issue(result, 'error', featureScope, `未定義の入力IDを参照しています: ${String(id)}`);
      if (feature?.calculationRole === 'DISPLAY_ONLY' && feature?.probabilityEngineUsage !== false) issue(result, 'error', featureScope, 'DISPLAY_ONLYのFeatureはprobabilityEngineUsage: falseである必要があります');
      if (feature?.calculationRole === 'DISPLAY_ONLY' && feature?.adoptionCategory === 'INCLUDE_PRIMARY') issue(result, 'error', featureScope, 'DISPLAY_ONLYのFeatureをINCLUDE_PRIMARYにはできません');
      if (feature?.weight !== undefined && (!Number.isFinite(feature.weight) || feature.weight <= 0)) issue(result, 'error', featureScope, `無効なweightです: ${String(feature.weight)}`);
      const map = feature?.categoryProbabilities ?? feature?.probabilities;
      validateSettingProbabilityMap(map, Array.isArray(settings) ? settings : [], result, featureScope, feature?.calculationRole !== 'DISPLAY_ONLY');
    }
  }
  const evidences = machineData.evidence?.evidences;
  if (!Array.isArray(evidences)) issue(result, 'error', scope, 'evidence.evidencesが配列ではありません');
  else {
    const evidenceIds = evidences.map(evidence => evidence?.id).filter(isNonEmptyString);
    for (const duplicate of duplicateValues(evidenceIds)) issue(result, 'error', scope, `Evidence IDが重複しています: ${duplicate}`);
    for (const evidence of evidences) {
      const evidenceScope = `${scope} evidence:${evidence?.id ?? '(IDなし)'}`;
      if (!isNonEmptyString(evidence?.id)) issue(result, 'error', evidenceScope, 'Evidence IDがありません');
      if (!inputIds.has(evidence?.inputId)) issue(result, 'error', evidenceScope, `未定義の入力IDを参照しています: ${String(evidence?.inputId)}`);
      for (const key of ['confirmedSettings', 'deniedSettings']) {
        if (!Array.isArray(evidence?.[key])) issue(result, 'error', evidenceScope, `${key}が配列ではありません`);
        else for (const setting of evidence[key]) if (!settings.includes(setting)) issue(result, 'error', evidenceScope, `${key}に未定義の設定があります: ${setting}`);
      }
    }
  }
  const sections = machineData.ui?.sections;
  if (!Array.isArray(sections)) issue(result, 'error', scope, 'ui.sectionsが配列ではありません');
  else for (const section of sections) for (const item of section?.items ?? []) {
    const itemScope = `${scope} ui:${item?.id ?? item?.inputId ?? '(項目なし)'}`;
    if (item?.inputId !== undefined && !inputIds.has(item.inputId)) issue(result, 'error', itemScope, `未定義の入力IDを参照しています: ${String(item.inputId)}`);
    if (item?.type === 'auto_accumulator') validateAutoAccumulator(item, inputIds, result, itemScope);
  }
  return capabilityUsage(machineData, result, scope);
}
function catalogRequiredFields(entry) {
  return ['machineId', 'displayName', 'manufacturer', 'machineDataVersion', 'packageUrl', 'sha256', 'packageSizeBytes', 'status', 'requiredCapabilities'];
}
export function auditRepository(root) {
  const result = { root: path.resolve(root), errors: [], warnings: [], machineCount: 0 };
  const catalogPath = path.join(result.root, 'catalog.json');
  const catalog = readJson(catalogPath, result, 'catalog.json');
  if (!isRecord(catalog)) return result;
  if (!isNonEmptyString(catalog.generatedAt) || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(catalog.generatedAt) || Number.isNaN(Date.parse(catalog.generatedAt))) issue(result, 'error', 'catalog.json', 'generatedAtが妥当なISO 8601 UTC日時ではありません');
  if (!Array.isArray(catalog.machines)) { issue(result, 'error', 'catalog.json', 'machinesが配列ではありません'); return result; }
  result.machineCount = catalog.machines.length;
  const catalogIds = catalog.machines.map(entry => entry?.machineId).filter(isNonEmptyString);
  for (const duplicate of duplicateValues(catalogIds)) issue(result, 'error', 'catalog.json', `machineIdが重複しています: ${duplicate}`);
  const catalogById = new Map();
  for (const entry of catalog.machines) {
    const scope = `catalog:${entry?.machineId ?? '(machineIdなし)'}`;
    for (const field of catalogRequiredFields(entry ?? {})) if (entry?.[field] === undefined) issue(result, 'error', scope, `必須フィールド${field}がありません`);
    if (!isNonEmptyString(entry?.machineId)) issue(result, 'error', scope, 'machineIdが不正です');
    if (!isNonEmptyString(entry?.machineDataVersion) || !/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(entry.machineDataVersion)) issue(result, 'error', scope, 'machineDataVersionはSemVer形式である必要があります');
    if (!isNonEmptyString(entry?.packageUrl) || !/^https:\/\//.test(entry.packageUrl)) issue(result, 'error', scope, 'packageUrlはHTTPS URLである必要があります');
    if (!isNonEmptyString(entry?.sha256) || !/^[a-f0-9]{64}$/i.test(entry.sha256)) issue(result, 'error', scope, 'sha256は64桁の16進数である必要があります');
    if (!isPositiveInteger(entry?.packageSizeBytes)) issue(result, 'error', scope, 'packageSizeBytesは正の整数である必要があります');
    if (!CATALOG_STATUSES.has(entry?.status)) issue(result, 'error', scope, `statusが不正です: ${String(entry?.status)}`);
    if (entry?.requiredCapabilities !== undefined && !Array.isArray(entry.requiredCapabilities)) issue(result, 'error', scope, 'requiredCapabilitiesが配列ではありません');
    if (Array.isArray(entry?.requiredCapabilities)) {
      for (const duplicate of duplicateValues(entry.requiredCapabilities)) issue(result, 'error', scope, `requiredCapabilitiesが重複しています: ${duplicate}`);
      for (const capability of entry.requiredCapabilities) if (!KNOWN_CAPABILITIES.has(capability)) issue(result, 'error', scope, `未対応のrequiredCapabilityです: ${capability}`);
    }
    if (isNonEmptyString(entry?.machineId) && !catalogById.has(entry.machineId)) catalogById.set(entry.machineId, entry);
  }
  const machinesRoot = path.join(result.root, 'machines');
  const localIds = fs.existsSync(machinesRoot) ? fs.readdirSync(machinesRoot, { withFileTypes: true }).filter(dir => dir.isDirectory()).map(dir => dir.name) : [];
  if (!fs.existsSync(machinesRoot)) issue(result, 'error', 'machines', 'machinesディレクトリがありません');
  for (const id of localIds) if (!catalogById.has(id)) issue(result, 'warning', `machines/${id}`, 'catalog.jsonに未登録のMachineDataです');
  for (const [machineId, entry] of catalogById) {
    const filePath = path.join(machinesRoot, machineId, JSON_FILE);
    const scope = `catalog:${machineId}`;
    if (!fs.existsSync(filePath)) { issue(result, 'error', scope, `対応するローカルMachineDataがありません: ${path.relative(result.root, filePath)}`); continue; }
    const bytes = fs.readFileSync(filePath);
    if (entry.packageSizeBytes !== bytes.length) issue(result, 'error', scope, `packageSizeBytesが実ファイルと不一致です (catalog=${entry.packageSizeBytes}, actual=${bytes.length})`);
    const actualSha = sha256(bytes);
    if (entry.sha256 !== actualSha) issue(result, 'error', scope, `sha256が実ファイルと不一致です (catalog=${entry.sha256}, actual=${actualSha})`);
    const data = readJson(filePath, result, `machine:${machineId}`);
    if (!data) continue;
    if (data.machine?.machineId !== machineId) issue(result, 'error', scope, `MachineDataのmachine.machineIdが不一致です: ${String(data.machine?.machineId)}`);
    if (data.machine?.machineDataVersion !== entry.machineDataVersion) issue(result, 'error', scope, `MachineDataのmachine.machineDataVersionが不一致です (catalog=${entry.machineDataVersion}, data=${String(data.machine?.machineDataVersion)})`);
    const used = validateMachineData(data, result, machineId, filePath);
    const declared = new Set(Array.isArray(entry.requiredCapabilities) ? entry.requiredCapabilities : []);
    if (!Array.isArray(entry.requiredCapabilities)) issue(result, 'error', scope, `requiredCapabilitiesを宣言してください（必要: ${[...used].join(', ') || 'なし'}）`);
    else {
      for (const capability of used) if (!declared.has(capability)) issue(result, 'error', scope, `MachineDataが使用する能力${capability}がrequiredCapabilitiesにありません`);
      for (const capability of declared) if (!used.has(capability)) issue(result, 'warning', scope, `requiredCapabilitiesの${capability}はMachineDataから検出されません`);
    }
  }
  return result;
}
export function buildAuditReport(result, generatedAt = new Date().toISOString()) {
  return {
    reportVersion: '1.0.0',
    generatedAt,
    root: result.root,
    status: result.errors.length === 0 ? 'PASS' : 'FAIL',
    summary: {
      machineCount: result.machineCount,
      errorCount: result.errors.length,
      warningCount: result.warnings.length,
    },
    errors: result.errors,
    warnings: result.warnings,
  };
}

export function writeAuditReport(result, outputPath, generatedAt) {
  const report = buildAuditReport(result, generatedAt);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return report;
}

function print(result) {
  for (const item of [...result.errors, ...result.warnings]) console.log(`${item.severity.toUpperCase()} [${item.scope}] ${item.message}`);
  if (result.errors.length === 0) console.log(`OK: ${result.machineCount}機種を監査しました（警告 ${result.warnings.length}件）`);
  else console.log(`FAILED: ${result.machineCount}機種を監査しました（エラー ${result.errors.length}件、警告 ${result.warnings.length}件）`);
}

function parseCliArgs(argv) {
  const positional = [];
  let jsonOut = null;
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--json-out') {
      const value = argv[index + 1];
      if (!value || value.startsWith('--')) throw new Error('--json-outには出力先パスが必要です');
      jsonOut = value;
      index += 1;
    } else positional.push(arg);
  }
  if (positional.length > 1) throw new Error('引数が多すぎます。使用法: node tools/audit-public-data.mjs [root] [--json-out path]');
  return { root: positional[0] ? path.resolve(positional[0]) : process.cwd(), jsonOut };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = parseCliArgs(process.argv.slice(2));
    const result = auditRepository(args.root);
    print(result);
    if (args.jsonOut) {
      const outputPath = path.resolve(args.jsonOut);
      writeAuditReport(result, outputPath);
      console.log(`REPORT: ${outputPath}`);
    }
    process.exitCode = result.errors.length === 0 ? 0 : 1;
  } catch (error) {
    console.error(`FAILED: ${error.message}`);
    process.exitCode = 2;
  }
}
