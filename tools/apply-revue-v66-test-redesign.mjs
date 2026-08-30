#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ID = 'S_REVUE_STARLIGHT_CX_TEST_V66';
const DIR = path.join(ROOT, 'research', ID);
const files = {
  research: path.join(DIR, 'research-data.json'),
  selection: path.join(DIR, 'selection-data.json'),
  observation: path.join(DIR, 'machine-observation-data.json'),
  ui: path.join(DIR, 'ui-design-data.json'),
  experiment: path.join(DIR, 'conditional-model-experiment-v66.json')
};

function die(message) { console.error(`ERROR: ${message}`); process.exit(1); }
function readJson(file) { if (!fs.existsSync(file)) die(`missing ${path.relative(ROOT,file)}`); return JSON.parse(fs.readFileSync(file,'utf8')); }
function writeJson(file, value) { fs.writeFileSync(file, JSON.stringify(value,null,2)+'\n','utf8'); }
function upsertBy(array, key, value) {
  const i = array.findIndex(item => item?.[key] === value[key]);
  if (i >= 0) array[i] = value; else array.push(value);
}

const research = readJson(files.research);
const selection = readJson(files.selection);
const observation = readJson(files.observation);
const ui = readJson(files.ui);
const experiment = fs.existsSync(files.experiment) ? readJson(files.experiment) : {};

// Research: add the cleanest currently-public conditional direct-AT candidate.
research.sources ??= [];
upsertBy(research.sources, 'sourceId', {
  sourceId: 'SRC_NANA_DIRECT_AT',
  publisher: 'なな徹',
  title: 'ボーナス抽選・AT直撃抽選',
  url: 'https://nana-press.com/kaiseki/machine/886/27707/',
  checkedAt: '2026-08-30',
  sourceType: 'major_analysis'
});
research.features ??= [];
upsertBy(research.features, 'researchFeatureId', {
  researchFeatureId: 'RF_REVUE_DIRECT_AT_HIGH_REG_RARE',
  name: '高確中・通常時REG後の強チェリー/チャンス目AT直撃',
  factStatus: 'verified',
  candidateModel: 'binomial',
  trialUnit: '対象状態中の強チェリー/チャンス目成立1回',
  observationScope: '高確中または通常時REG後の内部ボーナス状態中',
  numeratorDefinition: '対象成立役からAT直撃した回数',
  denominatorDefinition: '対象状態中に成立した強チェリー/チャンス目回数',
  settingValues: {
    SET_1: { probability: 0.0859, rawDisplay: '8.59%' },
    SET_2: { probability: 0.0938, rawDisplay: '9.38%' },
    SET_4: { probability: 0.1016, rawDisplay: '10.16%' },
    SET_5: { probability: 0.1250, rawDisplay: '12.50%' },
    SET_6: { probability: 0.1641, rawDisplay: '16.41%' }
  },
  sourceRefs: ['SRC_NANA_DIRECT_AT','SRC_1GEKI'],
  crossSourceStatus: 'matched',
  notes: '設定差のあるconditional candidate。ただし対象状態と成立役の機会数を実戦で安全に観測できるかは未解決。'
});

// Selection: record CZ outcome and aggregate AT for comparison, but do not feed them into inference.
selection.inputs ??= [];
for (const input of [
  {
    id: 'INP_CZ_SUCCESS_COUNT', name: 'CZ成功回数', category: 'TEST_CZ_AT_OUTCOME', type: 'counter', unit: '回',
    displayOrder: 32, inferenceRole: 'EXCLUDE', defaultValue: 0, uiGridSpan: 6, uiDirectInput: false, uiCompactCounter: true,
    description: '【検証用】CZ成功回数。全設定の条件付き成功率が未公開のため、現時点では推測に使用しません。'
  },
  {
    id: 'INP_CZ_FAILURE_COUNT', name: 'CZ失敗回数', category: 'TEST_CZ_AT_OUTCOME', type: 'counter', unit: '回',
    displayOrder: 33, inferenceRole: 'EXCLUDE', defaultValue: 0, uiGridSpan: 6, uiDirectInput: false, uiCompactCounter: true,
    description: '【検証用】CZ失敗回数。CZ成功/失敗の偏りを比較するため記録します。'
  },
  {
    id: 'INP_AT_FIRST_SELF_COUNT', name: 'AT初当り回数', category: 'TEST_CZ_AT_OUTCOME', type: 'counter', unit: '回',
    displayOrder: 34, inferenceRole: 'EXCLUDE', defaultValue: 0, uiGridSpan: 12, uiDirectInput: true,
    description: '【検証用】自己実戦のAT初当り回数。CZ初当りとの依存が未解決のため独立Featureとしては加算しません。'
  }
]) upsertBy(selection.inputs, 'id', input);

selection.features ??= [];
upsertBy(selection.features, 'featureId', {
  researchFeatureId: 'RF_REVUE_AT',
  featureId: 'FEAT_AT_FIRST_SELF_DEPENDENCY_REVIEW',
  adoptionCategory: 'EXCLUDE',
  rejectionReason: 'AT初当りはCZ成功・AT直撃・ボーナス経由など複数経路を含む下流marginalで、CZ初当りと同一区間で独立評価すると情報を二重利用する可能性があるため。',
  userReason: 'AT初当り回数は検証用に記録しますが、CZ初当りと同時には設定推測へ加算しません。'
});
upsertBy(selection.features, 'featureId', {
  researchFeatureId: 'RF_REVUE_DIRECT_AT_HIGH_REG_RARE',
  featureId: 'FEAT_DIRECT_AT_HIGH_REG_RARE_CONDITIONAL',
  adoptionCategory: 'EXCLUDE',
  rejectionReason: '設定別当選率は公開されているが、対象状態中の強チェリー/チャンス目成立回数という正しい分母を安全に観測する契約が未確立のため。',
  userReason: '設定差は大きいものの、正しい抽選機会数を数えられる方法が確定するまで推測には使用しません。'
});
selection.testVariant = {
  ...(selection.testVariant ?? {}),
  dependencyPolicy: 'CZ_FIRST_REPRESENTATIVE_AT_MARGINAL_RECORD_ONLY',
  uiExperiment: 'CZ_SUCCESS_FAILURE_AND_AT_FIRST_RECORD_ONLY'
};

// Observation v2: define direct-play record-only observations for the new UI fields.
observation.observations ??= [];
for (const obs of [
  {
    observationId: 'OBS_TEST_CZ_OUTCOME_COUNTS', sourceType: 'DIRECT_PLAY', observationMode: 'MANUAL_COUNTER', status: 'FOUND',
    label: 'CZ成功回数・CZ失敗回数', categories: ['CZ成功回数','CZ失敗回数'], timing: ['自己実戦のCZ終了時'],
    excludedConditions: ['着席前累積値を混ぜない','成功/失敗を判別できないCZを推測用データとして扱わない'], sourceRefs: ['SRC_1GEKI'],
    notes: 'TEST_V66 record-only。全設定conditional probability未解決のためFeature mappingは作成しない。'
  },
  {
    observationId: 'OBS_TEST_AT_FIRST_SELF', sourceType: 'DIRECT_PLAY', observationMode: 'MANUAL_COUNTER', status: 'FOUND',
    label: '自己実戦AT初当り回数', categories: ['AT初当り回数'], timing: ['自己実戦のAT初当り時'],
    excludedConditions: ['着席前累積値を混ぜない'], sourceRefs: ['SRC_1GEKI'],
    notes: 'TEST_V66 record-only。CZ初当りとの依存レビュー中のため独立Feature mappingは作成しない。'
  }
]) upsertBy(observation.observations, 'observationId', obs);
observation.notes = [
  ...(Array.isArray(observation.notes) ? observation.notes : []),
  'TEST_V66 dependency policy: CZ初当りを代表Featureとし、aggregate AT初当りは同一区間で独立加算しない。CZ成功/失敗と自己実戦AT初当りは比較検証用に保存する。'
];

// UI: add a dedicated test-only outcome section immediately after CZ first-hit inputs.
ui.sectionOrder ??= [];
ui.sections ??= {};
ui.inputContracts ??= {};
const sectionName = 'CZ・AT結果（検証用）';
ui.sectionOrder = ui.sectionOrder.filter(x => x !== sectionName);
const czIndex = ui.sectionOrder.indexOf('CZ初当り');
ui.sectionOrder.splice(czIndex >= 0 ? czIndex + 1 : ui.sectionOrder.length, 0, sectionName);
ui.sections[sectionName] = {
  inputIds: ['INP_CZ_SUCCESS_COUNT','INP_CZ_FAILURE_COUNT','INP_AT_FIRST_SELF_COUNT'],
  description: 'CZ突破の引き強・引き弱とAT初当りを記録して現行方式と比較するためのテスト項目です。現時点ではこの3項目を設定推測へ直接加算しません。',
  observationRole: 'DIRECT_PLAY'
};
ui.inputContracts.INP_CZ_SUCCESS_COUNT = { name: 'CZ成功', mode: 'COUNTER', gridSpan: 6, directInput: false, compact: true };
ui.inputContracts.INP_CZ_FAILURE_COUNT = { name: 'CZ失敗', mode: 'COUNTER', gridSpan: 6, directInput: false, compact: true };
ui.inputContracts.INP_AT_FIRST_SELF_COUNT = { name: 'AT初当り回数', mode: 'NUMBER', gridSpan: 12, directInput: true };
ui.status = 'PASS_WITH_UNRESOLVED';
ui.unresolved = Array.from(new Set([...(ui.unresolved ?? []), 'CZ_SUCCESS_CONDITIONAL_FULL_SETTING_VALUES_UNPUBLISHED', 'DIRECT_AT_OPPORTUNITY_DENOMINATOR_UNRESOLVED']));
ui.auditNotes = [
  ...(ui.auditNotes ?? []),
  'TEST_V66: CZ成功/失敗・自己実戦AT初当りを比較用UIとして追加。いずれも現段階では推測不参加。'
];

experiment.selectionExperiment ??= {};
experiment.selectionExperiment.activeTestPolicy = 'CZ_FIRST_REPRESENTATIVE';
experiment.selectionExperiment.aggregateAtSelfPlay = 'RECORD_ONLY_EXCLUDED_FROM_INFERENCE';
experiment.selectionExperiment.czOutcome = 'RECORD_ONLY_UNTIL_FULL_SETTING_CONDITIONAL_VALUES_AVAILABLE';
experiment.selectionExperiment.directAtHighRegRare = 'RESEARCHED_BUT_EXCLUDED_UNTIL_DENOMINATOR_OBSERVABLE';
experiment.uiChangeCandidates = experiment.uiChangeCandidates ?? [];
experiment.uiApplied = {
  appliedAt: '2026-08-30',
  section: sectionName,
  inputs: ['INP_CZ_SUCCESS_COUNT','INP_CZ_FAILURE_COUNT','INP_AT_FIRST_SELF_COUNT'],
  inferenceParticipation: false
};

writeJson(files.research, research);
writeJson(files.selection, selection);
writeJson(files.observation, observation);
writeJson(files.ui, ui);
writeJson(files.experiment, experiment);

console.log(`REVUE V6.6 TEST REDESIGN APPLIED: ${ID}`);
console.log('Policy: CZ first-hit remains representative; aggregate AT and CZ outcomes are record-only for comparison.');
console.log('Added researched candidate: conditional direct AT after high-state/normal-REG rare role, excluded until denominator observation is solved.');
console.log('Next: npm run pipeline:four-layer:gate -- S_REVUE_STARLIGHT_CX_TEST_V66');
console.log('Then: npm run machine:pipeline -- S_REVUE_STARLIGHT_CX_TEST_V66 --skip-repo-checks');
