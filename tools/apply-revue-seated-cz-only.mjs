import fs from 'node:fs';

const dir = 'research/S_REVUE_STARLIGHT_CX';
const read = (name) => JSON.parse(fs.readFileSync(`${dir}/${name}`, 'utf8'));
const write = (name, value) => fs.writeFileSync(`${dir}/${name}`, `${JSON.stringify(value, null, 2)}\n`);

const VERSION = '0.1.9';
const removedInputs = new Set(['INP_SEATED_TOTAL_GAMES', 'INP_SEATED_REG_COUNT', 'INP_SEATED_AT_COUNT']);

const research = read('research-data.json');
research.researchedAt = '2026-08-30';
research.features = research.features.filter((x) => x.researchFeatureId !== 'RF_REVUE_PREDECESSOR_REG');
const researchCz = research.features.find((x) => x.researchFeatureId === 'RF_REVUE_CZ');
if (!researchCz) throw new Error('RF_REVUE_CZ not found');
researchCz.notes = '公開値1/265.9～1/179.5。自己実戦では通常時ゲーム数、着席前区間では実機メニュー「遊技履歴」の通常ゲーム数を分母にする。CZ成功・AT後など短期状態でCZ当選率が変動し得るため、少量履歴を固定閾値だけで過信せず試行量に応じて評価する。';
const researchAt = research.features.find((x) => x.researchFeatureId === 'RF_REVUE_AT');
if (researchAt) researchAt.notes = '公開AT初当り。着席前判断では主要経路であるCZ由来の設定差を下流で再観測するため、着席時CZとの重複評価を避けて前任者Featureには採用しない。';
write('research-data.json', research);

const selection = read('selection-data.json');
selection.machineDataVersion = VERSION;
selection.inputs = selection.inputs.filter((x) => !removedInputs.has(x.id));
const normal = selection.inputs.find((x) => x.id === 'INP_SEATED_NORMAL_GAMES');
const cz = selection.inputs.find((x) => x.id === 'INP_SEATED_CZ_COUNT');
if (!normal || !cz) throw new Error('seated normal/CZ inputs not found');
Object.assign(normal, {
  displayOrder: 1,
  inferenceRole: 'INCLUDE_PRIMARY',
  defaultValue: '',
  description: '実機メニュー「遊技履歴」の通常ゲーム数を入力してください。着席前Challenge Revueの推測分母として使用します。',
  observationScope: 'PREDECESSOR_SNAPSHOT',
});
Object.assign(cz, {
  displayOrder: 2,
  inferenceRole: 'INCLUDE_PRIMARY',
  defaultValue: '',
  description: '実機メニュー「遊技履歴」のChallenge Revue累計回数を入力してください。着席時通常ゲーム数と同じ着席前区間として推測に使用します。',
  observationScope: 'PREDECESSOR_SNAPSHOT',
  parentInputId: 'INP_SEATED_NORMAL_GAMES',
});
selection.features = selection.features.filter((x) => x.featureId !== 'FEAT_REG_PREDECESSOR');
const predCz = selection.features.find((x) => x.featureId === 'FEAT_CZ_PREDECESSOR');
if (!predCz) throw new Error('FEAT_CZ_PREDECESSOR not found');
Object.assign(predCz, {
  researchFeatureId: 'RF_REVUE_CZ',
  featureId: 'FEAT_CZ_PREDECESSOR',
  adoptionCategory: 'INCLUDE_PRIMARY',
  numeratorInputId: 'INP_SEATED_CZ_COUNT',
  denominatorInputId: 'INP_SEATED_NORMAL_GAMES',
  minimumSample: 1000,
  sampleRecommendation: 5000,
  weight: 1,
  difficultyParticipation: 'EXCLUDE',
  userReason: '着席前の通常ゲーム数とChallenge Revue累計回数は実機メニューで同一区間として取得でき、公開CZ確率と同じ通常ゲーム基準で評価できます。CZは着席判断としてREGより判別効率が高く、AT初当りの主要経路でもあるため前任者情報はCZを代表Featureとして使用します。',
  difficultyExclusionReason: '共通Difficultyは自分が遊技した1500G・3000G・7000Gを評価するため、前任者区間は試行量へ含めません。',
});
delete predCz.rejectionReason;
write('selection-data.json', selection);

const ui = read('ui-design-data.json');
const seated = ui.sections?.['着席時データ'];
if (!seated) throw new Error('着席時データ section not found');
seated.inputIds = ['INP_SEATED_NORMAL_GAMES', 'INP_SEATED_CZ_COUNT'];
seated.description = '実機メニュー「遊技履歴」から、着席前の通常ゲーム数とChallenge Revue累計回数を入力します。CZ初当りは設定差が大きく、同じ通常ゲーム基準の前任者区間として設定推測に使用します。';
ui.inputContracts = ui.inputContracts || {};
for (const id of removedInputs) delete ui.inputContracts[id];
ui.inputContracts.INP_SEATED_NORMAL_GAMES = { name: '着席時 通常ゲーム数', mode: 'NUMBER', gridSpan: 12, directInput: true };
ui.inputContracts.INP_SEATED_CZ_COUNT = { name: '着席時 Challenge Revue回数', mode: 'NUMBER', gridSpan: 12, directInput: true };
write('ui-design-data.json', ui);

const obs = read('machine-observation-data.json');
const predObs = obs.observations.find((x) => x.observationId === 'OBS_PREDECESSOR_REG');
if (!predObs) throw new Error('OBS_PREDECESSOR_REG not found');
predObs.observationId = 'OBS_PREDECESSOR_CZ';
predObs.label = '着席時通常ゲーム数・Challenge Revue回数';
predObs.categories = ['着席時通常ゲーム数', '着席時Challenge Revue回数'];
predObs.timing = ['着席直後に実機メニュー「遊技履歴」を確認'];
predObs.excludedConditions = ['自己実戦区間を混ぜない', 'CZの観測区間に総ゲーム数を代用しない', '着席後に増えた値を着席時スナップショットへ混ぜない'];
predObs.notes = 'ユーザー実機確認により、遊技履歴から着席時通常ゲーム数とChallenge Revue累計回数を同一区間で取得できる。公開CZ確率と同じ通常ゲーム基準で前任者CZを評価する。CZ成功・AT後などの状態依存があるため少量履歴を過信せず、固定の有効化閾値は設けない。';
obs.featureMappings = obs.featureMappings.filter((x) => x.featureId !== 'FEAT_REG_PREDECESSOR');
let map = obs.featureMappings.find((x) => x.featureId === 'FEAT_CZ_PREDECESSOR');
if (!map) {
  map = { featureId: 'FEAT_CZ_PREDECESSOR' };
  obs.featureMappings.push(map);
}
Object.assign(map, {
  mappingType: 'EXACT',
  observationIds: ['OBS_PREDECESSOR_CZ'],
  collectionMethods: ['MACHINE_MENU_READ'],
  usableForInference: true,
  usableForDifficulty: false,
  notes: '着席前区間のみ。自己実戦CZとは重ならない別区間として評価し、Difficultyには含めない。',
});
const vfy = obs.fieldVerificationItems?.find((x) => x.verificationId === 'VFY_S_REVUE_STARLIGHT_CX_PREDECESSOR');
if (vfy) {
  vfy.status = 'VERIFIED_ON_MACHINE';
  vfy.question = '着席時の通常ゲーム数とChallenge Revue累計回数を実機メニュー「遊技履歴」で取得できることを確認済み。前任者推測はCZのみを使用し、REG・AT初当りは着席時Featureから除外する。';
}
write('machine-observation-data.json', obs);

const lock = read('user-verified-ui-lock.json');
lock.policy = lock.policy || {};
lock.policy.reason = '2026-08-30の実機確認とSelection再検討により、着席時入力を「通常ゲーム数＋Challenge Revue回数」の2項目へ意図的変更。前任者CZを推測へ採用するため再実機確認対象とする。';
lock.sectionDescriptions = lock.sectionDescriptions || {};
lock.sectionDescriptions['着席時データ'] = seated.description;
lock.sectionItems = lock.sectionItems || {};
lock.sectionItems['着席時データ'] = ['INP_SEATED_NORMAL_GAMES', 'INP_SEATED_CZ_COUNT'];
lock.inputContracts = lock.inputContracts || {};
for (const id of removedInputs) delete lock.inputContracts[id];
lock.inputContracts.INP_SEATED_NORMAL_GAMES = { name: '着席時 通常ゲーム数', gridSpan: 12, directInput: true };
lock.inputContracts.INP_SEATED_CZ_COUNT = { name: '着席時 Challenge Revue回数', gridSpan: 12, directInput: true };
write('user-verified-ui-lock.json', lock);

console.log('UPDATED Revue seated policy: normal games + Challenge Revue only; predecessor CZ inference enabled');