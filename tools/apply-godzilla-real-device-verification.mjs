#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const machineId = 'L_GODZILLA_NS';
const researchDir = path.join(root, 'research', machineId);
const selectionPath = path.join(researchDir, 'selection-data.json');
const observationPath = path.join(researchDir, 'machine-observation-data.json');
const uiDesignPath = path.join(researchDir, 'ui-design-data.json');
const packagePath = path.join(root, 'machines', machineId, 'machine-package.json');

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}
function writeJson(file, data) {
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}
function mustFind(list, predicate, label) {
  const value = list.find(predicate);
  if (!value) throw new Error(`Missing ${label}`);
  return value;
}

const selection = readJson(selectionPath);
const observation = readJson(observationPath);
const ui = readJson(uiDesignPath);

// --- Selection: real-device terminology and correct denominator semantics ---
const atCount = mustFind(selection.inputs, x => x.id === 'INP_AT_FIRST_HIT_COUNT', 'AT first-hit count input');
atCount.name = 'G-RUSH初当り 回数';
const atTrials = mustFind(selection.inputs, x => x.id === 'INP_AT_FIRST_HIT_TRIALS', 'AT first-hit trials input');
atTrials.name = '有効通常ゲーム数';
atTrials.unit = 'G';

selection.uiCategoryLabels ??= {};
selection.uiCategoryLabels.SEL_RF_AT_FIRST_HIT = 'G-RUSH初当り';
selection.uiCategoryLabels.SEL_RF_SHURAI_OPPONENT = '襲来ZONE対戦怪獣';

const atFeature = mustFind(selection.features, x => x.featureId === 'FEAT_AT_FIRST_HIT', 'AT first-hit feature');
atFeature.userReason = 'G-RUSH初当りには設定差があり、自己実戦で有効通常ゲーム数を正しく把握できる場合に評価へ使用する。実機PUSHメニューの総ゲーム数はAT中を含むため分母には使用しない。';
const shuraiFeature = mustFind(selection.features, x => x.featureId === 'FEAT_SHURAI_OPPONENT', 'Shurai opponent feature');
shuraiFeature.userReason = '襲来ZONEで選ばれた対戦怪獣の振り分けに設定差があるため補助的に使用する。PUSHメニューの各怪獣表示は「成功回数/総回数」で、推測には総回数を使用する。';

// --- Observation: machine-verified facts ---
observation.researchedAt = '2026-09-02';
observation.sourceCoverage.machineMenu = 'VERIFIED_ON_MACHINE';
observation.sourceCoverage.linkedService = 'CHECKED_NONE';
observation.sourceCoverage.seatedState = 'VERIFIED_ON_MACHINE';

const obsAt = mustFind(observation.observations, x => x.observationId === 'OBS_AT_FIRST_HIT', 'OBS_AT_FIRST_HIT');
obsAt.sourceType = 'DIRECT_PLAY';
obsAt.observationMode = 'MANUAL_COUNTER';
obsAt.status = 'VERIFIED_ON_MACHINE';
obsAt.label = 'G-RUSH初当り 回数・有効通常ゲーム数';
obsAt.categories = ['G-RUSH初当り 回数', '有効通常ゲーム数'];
obsAt.timing = ['自己実戦中にG-RUSH初当り回数と有効通常ゲーム数を更新'];
obsAt.excludedConditions = [
  'PUSHメニュー上部のゲーム数はAT中を含むため、有効通常ゲーム数として使用しない',
  '着席前のG-RUSH累積回数を自己実戦値へ混ぜない',
  '未観測を観測済み0として扱わない'
];
obsAt.notes = '実機確認によりAT初当りのカウントはG-RUSH回数を使用することを確定。分母は有効通常ゲーム数であり、AT中を含むPUSHメニュー総ゲーム数からは復元しない。';

const obsShurai = mustFind(observation.observations, x => x.observationId === 'OBS_SHURAI_OPPONENT', 'OBS_SHURAI_OPPONENT');
obsShurai.sourceType = 'MACHINE_MENU';
obsShurai.observationMode = 'MENU_READ';
obsShurai.status = 'VERIFIED_ON_MACHINE';
obsShurai.label = '襲来ZONE対戦怪獣 総回数';
obsShurai.categories = ['ラドン', 'ガイガン', 'ビオランテ', 'デストロイア', 'キングギドラ'];
obsShurai.timing = ['PUSHメニューの当日遊技履歴を開き、各怪獣の右側「総回数」を確認'];
obsShurai.excludedConditions = [
  '各怪獣の左側「成功回数」を対戦怪獣振り分けの回数として使用しない',
  '着席前累積値を自己実戦値へ混ぜる場合は、着席時値との差分を取る',
  '電源ON/OFFで履歴が消えるため宵越し値として扱わない',
  '未観測を観測済み0として扱わない'
];
obsShurai.notes = '実機確認で各怪獣が「成功回数/総回数」と表示されることを確定。振り分け推測には右側の総回数を使用する。履歴はユーザー操作では削除できず、電源ON/OFFで消える。';

const obsMenu = mustFind(observation.observations, x => x.observationId === 'OBS_MACHINE_MENU_HISTORY', 'OBS_MACHINE_MENU_HISTORY');
obsMenu.status = 'VERIFIED_ON_MACHINE';
obsMenu.categories = [
  '総ゲーム数（AT中を含む）',
  '襲来CZ ラドン 成功回数/総回数',
  '襲来CZ ガイガン 成功回数/総回数',
  '襲来CZ ビオランテ 成功回数/総回数',
  '襲来CZ デストロイア 成功回数/総回数',
  '襲来CZ キングギドラ 成功回数/総回数',
  'BREAKDOWN 成功回数/総回数',
  'BREAKDOWN G 成功回数/総回数',
  'G-RUSH 回数',
  'DESTRUCTION 回数',
  'GODZILLA BONUS 回数',
  '大怪獣モード 回数',
  'EXTRA BONUS 回数',
  'メニュー画面キャラクター/乗り物'
];
obsMenu.excludedConditions = [
  '総ゲーム数はAT中を含むためG-RUSH初当りの有効通常ゲーム数へ直接流用しない',
  '電源ON/OFFで当日履歴が消えるため宵越しデータとして使用しない',
  'キャラクター/乗り物の傾向示唆をHard Evidenceへ昇格させない'
];
obsMenu.notes = '実機確認でPUSHメニューの当日遊技履歴項目を確定。履歴はユーザー操作では削除不可で同一電源ON中は着席前の当日累積値が残る。電源ON/OFFで消去される。';

const atMap = mustFind(observation.featureMappings, x => x.featureId === 'FEAT_AT_FIRST_HIT', 'AT mapping');
atMap.notes = 'G-RUSH初当り回数を分子、有効通常ゲーム数を分母として使用。PUSHメニュー総ゲーム数はAT中を含むため分母には使わない。';
const shuraiMap = mustFind(observation.featureMappings, x => x.featureId === 'FEAT_SHURAI_OPPONENT', 'Shurai mapping');
shuraiMap.mappingType = 'EXACT';
shuraiMap.collectionMethods = ['MENU_READ'];
shuraiMap.notes = 'PUSHメニュー各怪獣の右側「総回数」をカテゴリ回数としてそのまま使用できる。着席時累積値がある場合は差分で自己実戦区間を得る。';

for (const item of observation.fieldVerificationItems) {
  if (item.verificationId === 'VFY_L_GODZILLA_NS_SEATED_STATE') {
    item.status = 'VERIFIED_ON_MACHINE';
    item.question = '実機確認済み。PUSHメニュー当日履歴はユーザー操作で削除できず、同一電源ON中は前任者分を含む累積値が残る。着席時値との差分利用が可能。電源ON/OFFで消えるため宵越し不可。';
  }
  if (item.verificationId === 'VFY_L_GODZILLA_NS_LINKED_SERVICE') {
    item.status = 'VERIFIED_ON_MACHINE';
    item.question = '実機確認済み。機種固有のQR・実機連動機能は存在しない。';
  }
  if (item.verificationId === 'VFY_L_GODZILLA_NS_MENU_HISTORY_FIELDS') {
    item.status = 'VERIFIED_ON_MACHINE';
    item.question = '実機確認済み。総ゲーム数、襲来CZ怪獣別の成功回数/総回数、BREAKDOWN系、G-RUSH、DESTRUCTION、各種BONUS等を確認。総ゲーム数はAT中を含むため有効通常G分母には使用しない。';
  }
}

// --- UI design: user-facing wording only; evidence grouped by confirmation timing ---
const evidenceGroups = [
  {
    title: 'PUSHメニュー',
    ids: ['INP_MENU_2PLUS_COUNT', 'INP_MENU_4PLUS_COUNT', 'INP_MENU_6_COUNT'],
    description: 'PUSHメニューで確認した設定確定情報を入力します。'
  },
  {
    title: 'オペレーターセリフ',
    ids: ['INP_OPERATOR_2PLUS_COUNT', 'INP_OPERATOR_3PLUS_COUNT', 'INP_OPERATOR_4PLUS_COUNT', 'INP_OPERATOR_5PLUS_COUNT', 'INP_OPERATOR_6_COUNT'],
    description: 'オペレーターのセリフで設定確定パターンを確認したときに入力します。'
  },
  {
    title: 'ボーナス終了時',
    ids: ['INP_BONUS_END_4PLUS_COUNT', 'INP_BONUS_END_5PLUS_COUNT', 'INP_BONUS_END_6_COUNT'],
    description: 'ボーナス終了時に設定確定パターンを確認したときに入力します。'
  },
  {
    title: 'EXボーナス',
    ids: ['INP_EX_MOVIE_5PLUS_COUNT'],
    description: 'EXボーナス中のムービーで設定確定パターンを確認したときに入力します。'
  },
  {
    title: 'ギンちゃんトロフィー',
    ids: ['INP_TROPHY_2PLUS_COUNT', 'INP_TROPHY_3PLUS_COUNT', 'INP_TROPHY_4PLUS_COUNT', 'INP_TROPHY_5PLUS_COUNT', 'INP_TROPHY_6_COUNT'],
    description: 'ギンちゃんトロフィーが出現したときに該当する色を入力します。'
  }
];

const oldAtKey = Object.keys(ui.sections).find(k => ui.sections[k].inputIds?.includes('INP_AT_FIRST_HIT_COUNT'));
const oldShuraiKey = Object.keys(ui.sections).find(k => ui.sections[k].inputIds?.includes('INP_SHURAI_OPPONENT_CAT_RODAN'));
if (!oldAtKey || !oldShuraiKey) throw new Error('Unable to identify numeric UI sections');
const atSection = ui.sections[oldAtKey];
const shuraiSection = ui.sections[oldShuraiKey];
atSection.description = 'G-RUSH初当り回数と、自分で把握した有効通常ゲーム数を入力します。PUSHメニューの総ゲーム数はAT中を含むため使用しません。';
shuraiSection.description = 'PUSHメニューの襲来CZ履歴から、各怪獣の右側に表示される「総回数」を入力します。左側の成功回数はここでは使用しません。';

const newSections = {
  'G-RUSH初当り': atSection,
  '襲来ZONE対戦怪獣': shuraiSection
};
for (const group of evidenceGroups) {
  newSections[group.title] = {
    inputIds: group.ids,
    description: group.description,
    observationRefs: ['OBS_HARD_EVIDENCE_EVENTS'],
    acquisitionSources: ['END_EVENT'],
    collapsible: true,
    defaultExpanded: false
  };
}
ui.sections = newSections;
ui.sectionOrder = ['G-RUSH初当り', '襲来ZONE対戦怪獣', ...evidenceGroups.map(x => x.title)];

if (ui.inputContracts?.INP_AT_FIRST_HIT_COUNT) ui.inputContracts.INP_AT_FIRST_HIT_COUNT.name = 'G-RUSH初当り 回数';
if (ui.inputContracts?.INP_AT_FIRST_HIT_TRIALS) ui.inputContracts.INP_AT_FIRST_HIT_TRIALS.name = '有効通常ゲーム数';

writeJson(selectionPath, selection);
writeJson(observationPath, observation);
writeJson(uiDesignPath, ui);

// Patch generated package too; machine:pipeline may rewrite it from the source layers later.
if (fs.existsSync(packagePath)) {
  const pkg = readJson(packagePath);
  const pCount = pkg.inputs.inputs.find(x => x.id === 'INP_AT_FIRST_HIT_COUNT');
  const pTrials = pkg.inputs.inputs.find(x => x.id === 'INP_AT_FIRST_HIT_TRIALS');
  if (pCount) pCount.name = 'G-RUSH初当り 回数';
  if (pTrials) { pTrials.name = '有効通常ゲーム数'; pTrials.unit = 'G'; }
  const pFeat = pkg.features.features.find(x => x.featureId === 'FEAT_AT_FIRST_HIT');
  if (pFeat) pFeat.name = 'G-RUSH初当り';

  if (pkg.ui?.sections) {
    const numericAt = pkg.ui.sections.find(s => s.items?.some(i => i.inputId === 'INP_AT_FIRST_HIT_COUNT'));
    const numericShurai = pkg.ui.sections.find(s => s.items?.some(i => i.inputId === 'INP_SHURAI_OPPONENT_CAT_RODAN'));
    if (!numericAt || !numericShurai) throw new Error('Unable to identify package numeric sections');
    numericAt.title = 'G-RUSH初当り';
    numericAt.description = atSection.description;
    for (const item of numericAt.items) {
      if (item.inputId === 'INP_AT_FIRST_HIT_COUNT') item.label = 'G-RUSH初当り 回数';
      if (item.inputId === 'INP_AT_FIRST_HIT_TRIALS') item.label = '有効通常ゲーム数';
    }
    numericShurai.title = '襲来ZONE対戦怪獣';
    numericShurai.description = shuraiSection.description;

    const itemById = new Map();
    for (const section of pkg.ui.sections) for (const item of section.items ?? []) itemById.set(item.inputId, item);
    const rebuilt = [numericAt, numericShurai];
    let displayOrder = 3;
    for (const group of evidenceGroups) {
      rebuilt.push({
        id: `UI_EVIDENCE_${displayOrder}`,
        title: group.title,
        displayOrder,
        description: group.description,
        collapsible: true,
        defaultExpanded: false,
        items: group.ids.map(id => itemById.get(id)).filter(Boolean)
      });
      displayOrder++;
    }
    pkg.ui.sections = rebuilt;
  }
  writeJson(packagePath, pkg);
}

console.log('Applied L_GODZILLA_NS real-device verification and UX corrections.');
