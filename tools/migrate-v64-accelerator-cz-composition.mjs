#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const MACHINE_ID = 'L_TOARU_ACCELERATOR_RZ';
const COMPONENT_TOTAL_ROUNDING_TOLERANCE = 0.000004;
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const write = (p, v) => fs.writeFileSync(p, JSON.stringify(v, null, 2) + '\n');
const arr = v => Array.isArray(v) ? v : [];
const uniq = xs => [...new Set(xs.filter(Boolean))];

function feature(research, id) {
  const found = arr(research.features).find(f => f.researchFeatureId === id);
  if (!found) throw new Error(`missing Research feature ${id}`);
  return found;
}

function conditionalDistributions(research) {
  const accel = feature(research, 'RF_CZ_ACCEL');
  const last = feature(research, 'RF_CZ_LASTORDER');
  const dual = feature(research, 'RF_CZ_DUAL');
  const settings = research.machine?.settings ?? [];
  return Object.fromEntries(settings.map(setting => {
    const values = {
      ACCEL_CZ: Number(accel.settingValues?.[setting]?.probability),
      LASTORDER_CZ: Number(last.settingValues?.[setting]?.probability),
      DUAL_CZ: Number(dual.settingValues?.[setting]?.probability),
    };
    if (Object.values(values).some(v => !Number.isFinite(v) || v < 0)) throw new Error(`invalid CZ component for ${setting}`);
    const sum = Object.values(values).reduce((a, b) => a + b, 0);
    if (!(sum > 0)) throw new Error(`invalid CZ component sum for ${setting}`);
    return [setting, Object.fromEntries(Object.entries(values).map(([k, v]) => [k, v / sum]))];
  }));
}

function upsertInput(selection, input) {
  const idx = arr(selection.inputs).findIndex(x => x.id === input.id);
  if (idx >= 0) selection.inputs[idx] = { ...selection.inputs[idx], ...input };
  else selection.inputs.push(input);
}

export function migrate(root = process.cwd(), { apply = false } = {}) {
  const base = path.join(root, 'research', MACHINE_ID);
  const researchPath = path.join(base, 'research-data.json');
  const selectionPath = path.join(base, 'selection-data.json');
  const observationPath = path.join(base, 'machine-observation-data.json');
  const research = read(researchPath);
  const selection = read(selectionPath);
  const observation = read(observationPath);

  const total = feature(research, 'RF_CZ_TOTAL');
  const distributions = conditionalDistributions(research);
  const compositionId = 'RF_CZ_TYPE_COMPOSITION';
  const composition = {
    researchFeatureId: compositionId,
    name: 'CZ当選時の種類構成',
    factStatus: 'verified',
    candidateModel: 'multinomial',
    trialUnit: '種類を判別したCZ当選1回',
    observationScope: '通常時CZ当選時',
    numeratorDefinition: '一方通行CZ・打ち止めCZ・一方通行＆打ち止めCZの種類別回数',
    denominatorDefinition: '種類を判別して記録したCZ当選回数',
    settingValues: {},
    categories: ['ACCEL_CZ', 'LASTORDER_CZ', 'DUAL_CZ'],
    settingDistributions: distributions,
    distributionMode: 'explicit_complete',
    sourceRefs: uniq([
      ...arr(feature(research, 'RF_CZ_ACCEL').sourceRefs),
      ...arr(feature(research, 'RF_CZ_LASTORDER').sourceRefs),
      ...arr(feature(research, 'RF_CZ_DUAL').sourceRefs),
    ]),
    crossSourceStatus: 'derived_from_resolved_components',
    notes: '3種類の通常GあたりCZ確率を、CZ当選を条件とする構成比へ正規化した派生Feature。CZ総数のBinomialと種類構成のMultinomialを分解して評価し、同じCZ情報を独立に二重計上しない。更新前セッションでは種類不明の既存CZを構成比の分母に含めない。公開1/○○値の成分和とCZ合算には最大約3.11e-6の丸め差があるため4e-6以内を整合とする。'
  };
  const existingResearchIndex = arr(research.features).findIndex(f => f.researchFeatureId === compositionId);
  if (existingResearchIndex >= 0) research.features[existingResearchIndex] = composition;
  else research.features.push(composition);

  const legacy = arr(selection.inputs).find(i => i.id === 'INP_CZ_TOTAL_COUNT');
  if (!legacy) throw new Error('legacy INP_CZ_TOTAL_COUNT missing');
  Object.assign(legacy, {
    name: 'CZ合算（旧履歴互換）',
    inputVisible: false,
    description: 'v6.4以前の保存済みセッション互換用。新規入力では種類別CZカウンターから自動合算します。',
  });

  upsertInput(selection, {
    id: 'INP_CZ_ACCEL_COUNT', name: '一方通行CZ', category: 'SELF_PLAY', type: 'counter', unit: '回', displayOrder: 11,
    inferenceRole: 'INCLUDE_SUPPORT', observationScope: 'SELF_PLAY', defaultValue: null, uiQuickAdd: 1,
    description: '通常時に一方通行CZへ当選した回数。'
  });
  upsertInput(selection, {
    id: 'INP_CZ_LASTORDER_COUNT', name: '打ち止めCZ', category: 'SELF_PLAY', type: 'counter', unit: '回', displayOrder: 12,
    inferenceRole: 'INCLUDE_SUPPORT', observationScope: 'SELF_PLAY', defaultValue: null, uiQuickAdd: 1,
    description: '通常時に打ち止めCZへ当選した回数。'
  });
  upsertInput(selection, {
    id: 'INP_CZ_DUAL_COUNT', name: '一方通行＆打ち止めCZ', category: 'SELF_PLAY', type: 'counter', unit: '回', displayOrder: 13,
    inferenceRole: 'INCLUDE_SUPPORT', observationScope: 'SELF_PLAY', defaultValue: null, uiQuickAdd: 1,
    description: '通常時に一方通行＆打ち止めCZへ当選した回数。'
  });
  upsertInput(selection, {
    id: 'INP_CZ_TYPED_TOTAL', name: '種類判別済みCZ合計', category: 'SELF_PLAY', type: 'integer', unit: '回', displayOrder: 90,
    inferenceRole: 'INCLUDE_SUPPORT', observationScope: 'SELF_PLAY', defaultValue: null, inputVisible: false,
    derivedCalculation: 'sum', derivedFromInputIds: ['INP_CZ_ACCEL_COUNT', 'INP_CZ_LASTORDER_COUNT', 'INP_CZ_DUAL_COUNT']
  });
  upsertInput(selection, {
    id: 'INP_CZ_TOTAL_RESOLVED', name: 'CZ合算（互換統合値）', category: 'SELF_PLAY', type: 'integer', unit: '回', displayOrder: 91,
    inferenceRole: 'INCLUDE_PRIMARY', observationScope: 'SELF_PLAY', defaultValue: null, inputVisible: false,
    derivedCalculation: 'sum', derivedFromInputIds: ['INP_CZ_TOTAL_COUNT', 'INP_CZ_ACCEL_COUNT', 'INP_CZ_LASTORDER_COUNT', 'INP_CZ_DUAL_COUNT']
  });

  const totalSelection = arr(selection.features).find(f => f.researchFeatureId === 'RF_CZ_TOTAL');
  if (!totalSelection) throw new Error('RF_CZ_TOTAL Selection missing');
  totalSelection.numeratorInputId = 'INP_CZ_TOTAL_RESOLVED';
  totalSelection.userReason = 'CZ合算は通常ゲーム数に対する総当選率として採用します。v6.4以前の旧CZ合算値と、更新後に入力した3種類のCZ回数を内部で自動合算するため、既存履歴を失わず継続できます。';

  const oldOutcome = arr(selection.features).find(f => f.researchFeatureId === 'RF_CZ_OUTCOME');
  if (oldOutcome) {
    oldOutcome.adoptionCategory = 'EXCLUDE';
    oldOutcome.userFacingReason = '通常Gあたりの種類別確率をそのままCZ合算と併用すると重複するため不採用。代わりにCZ当選を条件とした種類構成へ変換したFeatureを採用します。';
  }
  for (const id of ['RF_CZ_ACCEL', 'RF_CZ_LASTORDER', 'RF_CZ_DUAL']) {
    const sf = arr(selection.features).find(f => f.researchFeatureId === id);
    if (sf) sf.userFacingReason = '単独BinomialではCZ合算と包含関係になるため不採用。3種類をまとめた条件付き構成Featureとして利用します。';
  }

  const compositionSelection = {
    researchFeatureId: compositionId,
    featureId: 'FEAT_CZ_TYPE_COMPOSITION',
    adoptionCategory: 'INCLUDE_SUPPORT',
    numeratorInputId: 'INP_CZ_ACCEL_COUNT',
    categoryInputIds: ['INP_CZ_LASTORDER_COUNT', 'INP_CZ_DUAL_COUNT'],
    denominatorInputId: 'INP_CZ_TYPED_TOTAL',
    minimumSample: 1,
    sampleRecommendation: 30,
    weight: 1,
    difficultyParticipation: 'EXCLUDE',
    userReason: 'CZ総数とは別に、種類まで判別できたCZだけを母数として3種類の構成比を評価します。総CZ確率と条件付き種類構成へ数学的に分解するため、同じCZを二重評価しません。旧履歴の種類不明CZはこの構成比には混ぜません。'
  };
  const existingSelectionIndex = arr(selection.features).findIndex(f => f.researchFeatureId === compositionId);
  if (existingSelectionIndex >= 0) selection.features[existingSelectionIndex] = compositionSelection;
  else selection.features.push(compositionSelection);
  selection.machineDataVersion = '0.1.1';
  selection.uiCategoryDescriptions ??= {};
  selection.uiCategoryDescriptions.SELF_PLAY = '通常ゲーム数と、当選したCZの種類を記録します。CZ合算は種類別入力から自動集計され、旧履歴の合算値も内部で引き継ぎます。';

  const totalObs = arr(observation.observations).find(o => o.observationId === 'OBS_CZ_TOTAL_DIRECT');
  if (totalObs) {
    totalObs.label = 'CZ当選回数（合算）';
    totalObs.semanticNote = 'v6.4: 新規セッションは種類別CZ入力から合算を派生。v6.4以前の保存済み合算値は互換入力として加算する。';
  }
  const typeObs = {
    observationId: 'OBS_CZ_TYPE_DIRECT', sourceType: 'DIRECT_PLAY', observationMode: 'VISUAL_EVENT', status: 'FOUND',
    label: 'CZ種類別回数', categories: ['numerator', 'composition'], timing: ['各CZ当選時'], excludedConditions: [], sourceRefs: ['SRC_NANA', 'SRC_1GEKI_CZ'],
    semanticNote: '一方通行CZ・打ち止めCZ・一方通行＆打ち止めCZは実戦中の告知/消化単位で区別して手動カウント可能。'
  };
  const obsIndex = arr(observation.observations).findIndex(o => o.observationId === typeObs.observationId);
  if (obsIndex >= 0) observation.observations[obsIndex] = typeObs;
  else observation.observations.push(typeObs);

  observation.featureMappings = arr(observation.featureMappings).filter(m => m.featureId !== 'FEAT_CZ_TYPE_COMPOSITION');
  const totalMapping = observation.featureMappings.find(m => m.featureId === 'FEAT_CZ_TOTAL');
  if (totalMapping) {
    totalMapping.observationIds = uniq(['OBS_CZ_TOTAL_DIRECT', 'OBS_CZ_TYPE_DIRECT', 'OBS_NORMAL_GAMES_MANUAL']);
    totalMapping.collectionMethods = uniq(['MANUAL_COUNTER', 'VISUAL_EVENT']);
  }
  observation.featureMappings.push({
    featureId: 'FEAT_CZ_TYPE_COMPOSITION', mappingType: 'COMBINABLE', observationIds: ['OBS_CZ_TYPE_DIRECT'],
    collectionMethods: ['MANUAL_COUNTER', 'VISUAL_EVENT'], usableForInference: true, usableForDifficulty: false
  });

  const distributionsCheck = composition.settingDistributions;
  for (const setting of research.machine.settings) {
    const dist = distributionsCheck[setting];
    const sum = Object.values(dist).reduce((a, b) => a + b, 0);
    if (Math.abs(sum - 1) > 1e-12) throw new Error(`${setting}: conditional CZ composition does not sum to 1`);
    const componentSum = Object.values({
      a: feature(research, 'RF_CZ_ACCEL').settingValues[setting].probability,
      l: feature(research, 'RF_CZ_LASTORDER').settingValues[setting].probability,
      d: feature(research, 'RF_CZ_DUAL').settingValues[setting].probability,
    }).reduce((a, b) => a + Number(b), 0);
    const totalP = Number(total.settingValues[setting].probability);
    if (Math.abs(componentSum - totalP) > COMPONENT_TOTAL_ROUNDING_TOLERANCE) throw new Error(`${setting}: CZ component/total mismatch ${componentSum} vs ${totalP}`);
  }

  if (apply) {
    write(researchPath, research);
    write(selectionPath, selection);
    write(observationPath, observation);
  }
  return { machineId: MACHINE_ID, version: selection.machineDataVersion };
}

const root = path.resolve(process.argv[2] ?? '.');
const apply = process.argv.includes('--apply');
if (apply) console.log('APPLIED ' + JSON.stringify(migrate(root, { apply: true })));
else {
  const tmp = fs.mkdtempSync(path.join(process.env.RUNNER_TEMP ?? process.env.TMPDIR ?? '/tmp', 'slo-v64-accelerator-composition-'));
  fs.cpSync(root, tmp, { recursive: true, filter: src => !src.includes(`${path.sep}.git${path.sep}`) });
  console.log('DRY-RUN PASS ' + JSON.stringify(migrate(tmp, { apply: true })));
}
