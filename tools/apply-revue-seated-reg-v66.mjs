import fs from 'node:fs';
import path from 'node:path';

const machineId = 'S_REVUE_STARLIGHT_CX';
const root = process.cwd();
const researchDir = path.join(root, 'research', machineId);

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const writeJson = (file, value) => fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const upsertBy = (array, key, value) => {
  const index = array.findIndex((item) => item?.[key] === value[key]);
  if (index >= 0) array[index] = value;
  else array.push(value);
};

const files = {
  research: path.join(researchDir, 'research-data.json'),
  selection: path.join(researchDir, 'selection-data.json'),
  observation: path.join(researchDir, 'machine-observation-data.json'),
  ui: path.join(researchDir, 'ui-design-data.json'),
  lock: path.join(researchDir, 'user-verified-ui-lock.json'),
};
Object.values(files).forEach((file) => assert(fs.existsSync(file), `missing: ${file}`));

const research = readJson(files.research);
const bonusResearch = research.features.find((item) => item.researchFeatureId === 'RF_REVUE_BONUS');
assert(bonusResearch?.settingDistributions, 'RF_REVUE_BONUS settingDistributions not found');
const regSettingValues = Object.fromEntries(
  Object.entries(bonusResearch.settingDistributions).map(([setting, dist]) => {
    assert(Number.isFinite(dist?.REG), `RF_REVUE_BONUS ${setting} REG probability missing`);
    return [setting, { probability: dist.REG }];
  }),
);
upsertBy(research.features, 'researchFeatureId', {
  researchFeatureId: 'RF_REVUE_PREDECESSOR_REG',
  name: '着席前REG出現率',
  factStatus: 'verified',
  candidateModel: 'poisson',
  trialUnit: '着席前の総ゲーム数1G（AT中を含むリアルボーナス抽選対象区間）',
  numeratorDefinition: '着席時REG累計回数',
  denominatorDefinition: '着席時総ゲーム数',
  settingValues: regSettingValues,
  sourceRefs: bonusResearch.sourceRefs ?? [],
  crossSourceStatus: bonusResearch.crossSourceStatus ?? 'rounded_match',
  notes: '本機はリアルボーナスのためAT中もREG抽選対象。着席前区間は自己実戦区間と分離して評価する。公開REG率はRF_REVUE_BONUSのREGカテゴリと同一値を使用。',
});
research.researchedAt = '2026-08-30';
writeJson(files.research, research);

const selection = readJson(files.selection);
selection.machineDataVersion = '0.1.7';
const oldGamesIndex = selection.inputs.findIndex((item) => item.id === 'INP_SEATED_NORMAL_GAMES');
assert(oldGamesIndex >= 0 || selection.inputs.some((item) => item.id === 'INP_SEATED_TOTAL_GAMES'), 'seated games input not found');
if (oldGamesIndex >= 0) {
  selection.inputs[oldGamesIndex] = {
    id: 'INP_SEATED_TOTAL_GAMES',
    name: '着席時 総ゲーム数',
    category: 'PREDECESSOR',
    type: 'integer',
    unit: 'G',
    displayOrder: 1,
    inferenceRole: 'INCLUDE_PRIMARY',
    defaultValue: '',
    description: '実機メニュー「遊技履歴」の総ゲーム数を入力してください。リアルボーナスはAT中も抽選されるため、着席時REGの分母には通常ゲーム数ではなく総ゲーム数を使用します。',
    observationScope: 'PREDECESSOR_SNAPSHOT',
    sessionDifferenceHelper: false,
  };
}
upsertBy(selection.inputs, 'id', {
  id: 'INP_SEATED_REG_COUNT',
  name: '着席時 REG回数',
  category: 'PREDECESSOR',
  type: 'counter',
  unit: '回',
  displayOrder: 2,
  inferenceRole: 'INCLUDE_PRIMARY',
  defaultValue: '',
  description: '実機メニュー「遊技履歴」のREG累計回数を入力してください。着席時総ゲーム数と同じ着席前区間として評価します。',
  observationScope: 'PREDECESSOR_SNAPSHOT',
  parentInputId: 'INP_SEATED_TOTAL_GAMES',
});
for (const input of selection.inputs) {
  if (input.id === 'INP_SEATED_CZ_COUNT') input.displayOrder = 3;
  if (input.id === 'INP_SEATED_AT_COUNT') input.displayOrder = 4;
}
selection.features = selection.features.filter((item) => item.featureId !== 'FEAT_REG_PREDECESSOR');
const predecessorInsertAt = selection.features.findIndex((item) => item.featureId === 'FEAT_CZ_PREDECESSOR');
const predecessorRegFeature = {
  researchFeatureId: 'RF_REVUE_PREDECESSOR_REG',
  featureId: 'FEAT_REG_PREDECESSOR',
  adoptionCategory: 'INCLUDE_PRIMARY',
  numeratorInputId: 'INP_SEATED_REG_COUNT',
  denominatorInputId: 'INP_SEATED_TOTAL_GAMES',
  minimumSample: 1000,
  sampleRecommendation: 6000,
  weight: 1,
  difficultyParticipation: 'EXCLUDE',
  userReason: '着席前のREGは自己実戦とは別区間の独立観測で、REGには設定差があります。本機はリアルボーナスのためAT中も抽選されるので、通常ゲーム数ではなく着席時総ゲーム数を分母にして評価します。',
  difficultyExclusionReason: '共通Difficultyは自分が遊技した1500G・3000G・7000Gを評価するため、前任者区間は試行量へ含めません。',
};
if (predecessorInsertAt >= 0) selection.features.splice(predecessorInsertAt, 0, predecessorRegFeature);
else selection.features.push(predecessorRegFeature);
writeJson(files.selection, selection);

const observation = readJson(files.observation);
observation.researchedAt = '2026-08-30';
observation.sourceCoverage = observation.sourceCoverage ?? {};
observation.sourceCoverage.seatedState = 'VERIFIED_ON_MACHINE';
upsertBy(observation.observations, 'observationId', {
  observationId: 'OBS_PREDECESSOR_REG',
  sourceType: 'SEATED_STATE',
  observationMode: 'MACHINE_MENU_READ',
  status: 'VERIFIED_ON_MACHINE',
  label: '着席時総ゲーム数・REG回数',
  categories: ['着席時総ゲーム数', '着席時REG回数'],
  timing: ['着席直後に実機メニュー「遊技履歴」を確認'],
  excludedConditions: ['自己実戦区間を混ぜない', '通常ゲーム数だけを分母にしない'],
  sourceRefs: [],
  notes: 'ユーザー実機知見により、本機はリアルボーナスでAT中もREG抽選対象。前任者REGは総ゲーム数を分母として扱う。',
});
upsertBy(observation.featureMappings, 'featureId', {
  featureId: 'FEAT_REG_PREDECESSOR',
  mappingType: 'EXACT',
  observationIds: ['OBS_PREDECESSOR_REG'],
  collectionMethods: ['MACHINE_MENU_READ'],
  usableForInference: true,
  usableForDifficulty: false,
  notes: '着席前区間のみ。自己実戦REGとは混合せず別Featureとして評価する。',
});
const predecessorVfy = observation.fieldVerificationItems?.find((item) => item.verificationId === 'VFY_S_REVUE_STARLIGHT_CX_PREDECESSOR');
if (predecessorVfy) {
  predecessorVfy.status = 'VERIFIED_ON_MACHINE';
  predecessorVfy.question = '着席時REGは、リアルボーナスがAT中も抽選されるため着席時総ゲーム数を分母とすることをユーザー実機知見で確認済み。CZ/AT前任者Featureは従来どおり別途扱う。';
}
writeJson(files.observation, observation);

const ui = readJson(files.ui);
ui.sections['着席時データ'].inputIds = ['INP_SEATED_TOTAL_GAMES', 'INP_SEATED_REG_COUNT', 'INP_SEATED_CZ_COUNT', 'INP_SEATED_AT_COUNT'];
ui.sections['着席時データ'].description = '実機メニューの遊技履歴から取得した着席前区間のデータです。REGはリアルボーナスのためAT中も抽選対象となるので、総ゲーム数と組にして推測へ使用します。結果画面では「着席前」と明記して自己実戦と区別します。';
delete ui.inputContracts.INP_SEATED_NORMAL_GAMES;
ui.inputContracts.INP_SEATED_TOTAL_GAMES = { name: '着席時 総ゲーム数', mode: 'NUMBER', gridSpan: 12, directInput: true };
ui.inputContracts.INP_SEATED_REG_COUNT = { name: '着席時 REG回数', mode: 'NUMBER', gridSpan: 12, directInput: true };
ui.auditNotes = [...new Set([...(ui.auditNotes ?? []), '2026-08-30 intentional change: seated REG inference uses seated total games because real bonus is抽選されるAT中も対象。再実機確認対象。'])];
writeJson(files.ui, ui);

const lock = readJson(files.lock);
lock.verifiedAt = '2026-08-30';
lock.policy.reason = 'スマホ実機で確認済みのUIを基準とし、2026-08-30に着席時REG推測を意図的変更。リアルボーナスがAT中も抽選されるため着席時総ゲーム数を分母に追加し、再実機確認対象とする。';
lock.sectionDescriptions['着席時データ'] = ui.sections['着席時データ'].description;
lock.sectionItems['着席時データ'] = [...ui.sections['着席時データ'].inputIds];
delete lock.inputContracts.INP_SEATED_NORMAL_GAMES;
lock.inputContracts.INP_SEATED_TOTAL_GAMES = { name: '着席時 総ゲーム数', gridSpan: 12, directInput: true };
lock.inputContracts.INP_SEATED_REG_COUNT = { name: '着席時 REG回数', gridSpan: 12, directInput: true };
writeJson(files.lock, lock);

console.log('UPDATED Revue Starlight seated REG v6.6 source contracts');
console.log('Next: npm run machine:pipeline -- S_REVUE_STARLIGHT_CX --skip-repo-checks');
