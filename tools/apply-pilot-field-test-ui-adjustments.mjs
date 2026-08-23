#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const writeJson = (p, v) => fs.writeFileSync(p, JSON.stringify(v, null, 2) + '\n');
const clone = v => structuredClone(v);

function bumpPatch(version) {
  const m = String(version ?? '').match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!m) throw new Error(`invalid version: ${version}`);
  return `${m[1]}.${m[2]}.${Number(m[3]) + 1}`;
}

function byId(items, id) {
  const item = items.find(x => x.id === id);
  if (!item) throw new Error(`missing input ${id}`);
  return item;
}
function feature(items, id) {
  const item = items.find(x => x.featureId === id);
  if (!item) throw new Error(`missing feature ${id}`);
  return item;
}

export function adjustMyJuggler(selection, design, research) {
  const out = clone(selection);
  const ui = clone(design);
  const re = clone(research);

  let single = out.inputs.find(x => x.id === 'INP_SINGLE_REG_COUNT');
  if (!single) {
    single = {
      id: 'INP_SINGLE_REG_COUNT', name: '単独REG', category: 'SELF_PLAY', type: 'counter', unit: '回',
      displayOrder: 12, inferenceRole: 'INCLUDE_SUPPORT', observationScope: 'SELF_PLAY', defaultValue: 0,
    };
    const regIndex = out.inputs.findIndex(x => x.id === 'INP_REG_COUNT');
    out.inputs.splice(Math.max(0, regIndex), 0, single);
  }
  const cherry = byId(out.inputs, 'INP_CHERRY_REG_COUNT');
  cherry.displayOrder = 13;
  const grape = byId(out.inputs, 'INP_GRAPE_COUNT');
  grape.displayOrder = 14;
  const total = byId(out.inputs, 'INP_REG_COUNT');
  Object.assign(total, {
    name: 'REG合計（自動計算）', displayOrder: 15, defaultValue: 0, inputVisible: false,
    derivedCalculation: 'sum', derivedFromInputIds: ['INP_SINGLE_REG_COUNT', 'INP_CHERRY_REG_COUNT'],
  });

  const composition = feature(out.features, 'FEAT_SINGLE_REG_COMPOSITION');
  composition.numeratorInputId = 'INP_CHERRY_REG_COUNT';
  composition.categoryInputIds = ['INP_SINGLE_REG_COUNT'];
  composition.inputTransform = 'sum_inputs_to_trials';
  composition.denominatorInputIds = ['INP_CHERRY_REG_COUNT', 'INP_SINGLE_REG_COUNT'];
  delete composition.denominatorInputId;
  delete composition.categorySubtractInputIds;
  composition.userReason = '単独REGとチェリー重複REGをそれぞれ直接カウントし、2項目の合計をREG総数としてREG内訳の設定差を評価します。';

  ui.sections['自分の区間'].inputIds = [
    'INP_NORMAL_GAMES', 'INP_BIG_COUNT', 'INP_SINGLE_REG_COUNT', 'INP_CHERRY_REG_COUNT', 'INP_GRAPE_COUNT',
  ];
  delete ui.inputContracts.INP_REG_COUNT;
  ui.inputContracts.INP_SINGLE_REG_COUNT = { name: '単独REG', mode: 'COUNTER', gridSpan: 6, directInput: true, compact: true };
  ui.inputContracts.INP_CHERRY_REG_COUNT = { name: 'チェリー重複REG', mode: 'COUNTER', gridSpan: 6, directInput: true, compact: true };
  ui.inputContracts.INP_GRAPE_COUNT = { ...(ui.inputContracts.INP_GRAPE_COUNT ?? {}), name: 'ブドウ', mode: 'COUNTER', gridSpan: 6, directInput: true, compact: true };

  const rf = re.features.find(x => x.researchFeatureId === 'RF_MYJ5_SINGLE_REG_COMPOSITION');
  if (!rf) throw new Error('missing RF_MYJ5_SINGLE_REG_COMPOSITION');
  rf.numeratorDefinition = 'チェリー重複REG回数と単独REG回数をそれぞれ直接カウントする。';
  rf.denominatorDefinition = '単独REG回数＋チェリー重複REG回数。';
  rf.notes = '単独REGとチェリー重複REGを別々に直接入力し、合計REG回数は2項目の和から自動算出する。従来の2カテゴリ構成確率はそのまま利用する。';
  return { selection: out, design: ui, research: re };
}

export function adjustGalfy(selection, design) {
  const out = clone(selection);
  const ui = clone(design);
  byId(out.inputs, 'INP_BT_MISS').name = 'ハズレ';
  if (ui.inputContracts.INP_BT_MISS) ui.inputContracts.INP_BT_MISS.name = 'ハズレ';
  return { selection: out, design: ui };
}

export function adjustInitialD(selection, design) {
  const out = clone(selection);
  const ui = clone(design);
  const oldIndex = out.inputs.findIndex(x => x.id === 'INP_BELL_TARGET_GAMES');
  if (oldIndex >= 0) out.inputs.splice(oldIndex, 1);
  let excluded = out.inputs.find(x => x.id === 'INP_BELL_EXCLUDED_GAMES');
  if (!excluded) {
    excluded = {
      id: 'INP_BELL_EXCLUDED_GAMES',
      name: 'ベル集計から除外するゲーム数',
      category: 'PRIMARY_BELL', type: 'integer', unit: 'G', displayOrder: 10,
      inferenceRole: 'INCLUDE_PRIMARY', defaultValue: 0,
      description: 'LB確定画面の押し順ナビ区間とLB中のゲーム数を合計して入力してください。',
    };
    const bellIndex = out.inputs.findIndex(x => x.id === 'INP_BELL_COUNT');
    out.inputs.splice(Math.max(0, bellIndex), 0, excluded);
  }
  const bell = byId(out.inputs, 'INP_BELL_COUNT');
  delete bell.parentInputId;
  const bellFeature = feature(out.features, 'FEAT_BELL_NORMAL');
  bellFeature.denominatorInputId = 'INP_MY_SAMMY_NORMAL_GAMES';
  bellFeature.denominatorAdjustments = [{ inputId: 'INP_BELL_EXCLUDED_GAMES', multiplier: -1 }];
  bellFeature.userReason = '試行数を得やすく、実戦中に継続して観測できる。通常ゲーム数からLB確定画面の押し順ナビ区間・LB中のゲーム数を除外して分母を自動算出します。';
  if (bellFeature.difficultyExposure) {
    bellFeature.difficultyExposure.basisId = 'MY_SAMMY_NORMAL_GAMES_MINUS_BELL_EXCLUDED';
    bellFeature.difficultyExposure.estimationBasis = '通常ゲーム数から、ベルを数えないLB確定画面の押し順ナビ区間とLB中ゲーム数を減算してベル対象Gを構成する。';
    bellFeature.difficultyExposure.uncertaintyNote = '実機連動機能の通常ゲーム数におけるLB関連区間の内部加算仕様は実機確認待ち。除外Gはユーザーが実戦中に集計する。';
  }

  ui.sections['通常時ベル'].inputIds = ['INP_BELL_EXCLUDED_GAMES', 'INP_BELL_COUNT'];
  ui.sections['通常時ベル'].description = '通常ゲーム数から除外する「LB確定画面の押し順ナビ区間・LB中」のゲーム数と、通常時ベル回数を入力します。ベル対象Gは自動計算します。';
  delete ui.inputContracts.INP_BELL_TARGET_GAMES;
  ui.inputContracts.INP_BELL_EXCLUDED_GAMES = {
    name: 'ベル集計から除外するゲーム数', mode: 'NUMBER', gridSpan: 12, directInput: true,
  };
  return { selection: out, design: ui };
}

function paths(machineId) {
  const dir = path.join(ROOT, 'research', machineId);
  return {
    selection: path.join(dir, 'selection-data.json'),
    design: path.join(dir, 'ui-design-data.json'),
    research: path.join(dir, 'research-data.json'),
  };
}

export function applyAll({ apply = false, bumpVersion = false } = {}) {
  const results = [];
  {
    const p = paths('S_MY_JUGGLER_V_KD');
    const x = adjustMyJuggler(readJson(p.selection), readJson(p.design), readJson(p.research));
    if (bumpVersion) x.selection.machineDataVersion = bumpPatch(x.selection.machineDataVersion);
    if (apply) { writeJson(p.selection, x.selection); writeJson(p.design, x.design); writeJson(p.research, x.research); }
    results.push(['S_MY_JUGGLER_V_KD', x.selection.machineDataVersion]);
  }
  {
    const p = paths('LB_SLOT_GALFY_A4');
    const x = adjustGalfy(readJson(p.selection), readJson(p.design));
    if (bumpVersion) x.selection.machineDataVersion = bumpPatch(x.selection.machineDataVersion);
    if (apply) { writeJson(p.selection, x.selection); writeJson(p.design, x.design); }
    results.push(['LB_SLOT_GALFY_A4', x.selection.machineDataVersion]);
  }
  {
    const p = paths('L_INITIAL_D_2ND');
    const x = adjustInitialD(readJson(p.selection), readJson(p.design));
    if (bumpVersion) x.selection.machineDataVersion = bumpPatch(x.selection.machineDataVersion);
    if (apply) { writeJson(p.selection, x.selection); writeJson(p.design, x.design); }
    results.push(['L_INITIAL_D_2ND', x.selection.machineDataVersion]);
  }
  return results;
}

const invoked = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invoked) {
  const apply = process.argv.includes('--apply');
  const bumpVersion = process.argv.includes('--bump-version');
  const results = applyAll({ apply, bumpVersion });
  console.log(`Pilot field-test UI adjustments: ${apply ? 'APPLY' : 'DRY_RUN'}`);
  for (const [id, version] of results) console.log(`${id}: ${version}`);
}
