#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const TARGETS = {
  S_MILKY_HOMES_GNB: [
    {
      researchFeatureId: 'RF_BONUS_END',
      evidenceCategories: {
        RE_END_COPPER: { category: 'COPPER', inputId: 'INP_END_COPPER' },
        RE_END_GOLD: { category: 'GOLD', inputId: 'INP_END_GOLD' },
        RE_END_STAR: { category: 'STAR', inputId: 'INP_END_STAR' },
        RE_END_RAINBOW: { category: 'RAINBOW', inputId: 'INP_END_RAINBOW' },
      },
    },
  ],
  L_INUYASHA2_FK: [
    {
      researchFeatureId: 'RF_WHITE_BIG_END',
      evidenceCategories: {
        RE_WHITE_BIG_SESSHOMARU_2PLUS: { category: 'SESSHOMARU', inputId: 'INP_RF_WHITE_BIG_END_SESSHOMARU' },
      },
    },
    {
      researchFeatureId: 'RF_BLUE_BIG_END',
      evidenceCategories: {
        RE_BLUE_BIG_INUYASHA_2PLUS: { category: 'INUYASHA', inputId: 'INP_RF_BLUE_BIG_END_INUYASHA' },
      },
    },
  ],
};

const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const write = (p, value) => fs.writeFileSync(p, JSON.stringify(value, null, 2) + '\n');
const arr = v => Array.isArray(v) ? v : [];
const uniq = xs => [...new Set(xs.filter(Boolean))];

function optionForEvidence(selection, researchEvidenceId) {
  for (const group of arr(selection.evidenceUi?.groups)) {
    for (const option of arr(group.options)) {
      if (arr(option.sourceEvidenceIds).includes(researchEvidenceId)) return { group, option };
    }
  }
  return null;
}

function removeEvidenceUiOptions(selection, ids) {
  if (!selection.evidenceUi?.groups) return;
  selection.evidenceUi.groups = selection.evidenceUi.groups
    .map(group => ({
      ...group,
      options: arr(group.options).filter(option => !arr(option.sourceEvidenceIds).some(id => ids.has(id))),
    }))
    .filter(group => group.options.length > 0);
}

function featureInputIds(feature) {
  return uniq([
    feature.numeratorInputId,
    ...arr(feature.numeratorInputIds),
    ...arr(feature.categoryInputIds),
    ...arr(feature.optionalCategoryInputIds),
  ]);
}

function nextDisplayOrder(selection, feature) {
  const ids = new Set(featureInputIds(feature));
  const values = arr(selection.inputs).filter(i => ids.has(i.id)).map(i => Number(i.displayOrder)).filter(Number.isFinite);
  return (values.length ? Math.max(...values) : 50) + 1;
}

function migrateOne(root, machineId, config) {
  const base = path.join(root, 'research', machineId);
  const researchPath = path.join(base, 'research-data.json');
  const selectionPath = path.join(base, 'selection-data.json');
  const observationPath = path.join(base, 'machine-observation-data.json');
  const research = read(researchPath);
  const selection = read(selectionPath);
  const observation = read(observationPath);

  const rf = arr(research.features).find(x => x.researchFeatureId === config.researchFeatureId);
  const sf = arr(selection.features).find(x => x.researchFeatureId === config.researchFeatureId);
  if (!rf || !sf) throw new Error(`${machineId}/${config.researchFeatureId}: Research or Selection feature missing`);
  if (!arr(rf.categories).length || !rf.settingDistributions) throw new Error(`${machineId}/${config.researchFeatureId}: complete category distribution required`);

  console.log('CATEGORY_DIAGNOSTIC ' + JSON.stringify({
    machineId,
    researchFeatureId: config.researchFeatureId,
    researchCategories: arr(rf.categories),
    numeratorInputId: sf.numeratorInputId ?? null,
    categoryInputIds: arr(sf.categoryInputIds),
    categoryExcludeLabels: arr(sf.categoryExcludeLabels),
    configuredEvidenceCategories: config.evidenceCategories,
  }));

  const excluded = new Set(arr(sf.categoryExcludeLabels));
  const evidenceIds = new Set(Object.keys(config.evidenceCategories));
  const existingInputs = new Map(arr(selection.inputs).map(i => [i.id, i]));
  let displayOrder = nextDisplayOrder(selection, sf);
  const template = arr(selection.inputs).find(i => featureInputIds(sf).includes(i.id)) ?? {};

  for (const [researchEvidenceId, spec] of Object.entries(config.evidenceCategories)) {
    if (!arr(rf.categories).includes(spec.category)) {
      throw new Error(`${machineId}/${config.researchFeatureId}: research category ${spec.category} not found`);
    }
    if (excluded.size && !excluded.has(spec.category)) {
      throw new Error(`${machineId}/${config.researchFeatureId}: ${spec.category} is not an excluded legacy category`);
    }
    const ui = optionForEvidence(selection, researchEvidenceId);
    const re = arr(research.evidenceCandidates).find(x => x.researchEvidenceId === researchEvidenceId);
    if (!ui || !re) throw new Error(`${machineId}/${researchEvidenceId}: Evidence UI or Research Evidence missing`);

    if (!existingInputs.has(spec.inputId)) {
      const input = {
        id: spec.inputId,
        name: ui.option.label ?? re.name ?? spec.category,
        category: template.category ?? 'SETTING_SIGNAL',
        type: 'counter',
        unit: '回',
        displayOrder: displayOrder++,
        inferenceRole: 'INCLUDE_SUPPORT',
        observationScope: template.observationScope ?? 'SELF_PLAY',
        defaultValue: template.defaultValue ?? null,
        uiQuickAdd: 1,
      };
      selection.inputs.push(input);
      existingInputs.set(spec.inputId, input);
    }

    sf.categoryInputIds = uniq([...arr(sf.categoryInputIds), spec.inputId]);
    selection.evidence ??= [];
    const current = selection.evidence.find(x => x.researchEvidenceId === researchEvidenceId);
    const evidenceRecord = {
      researchEvidenceId,
      evidenceId: current?.evidenceId ?? `EVI_${researchEvidenceId.replace(/^RE_/, '')}`,
      inputId: spec.inputId,
      sharedFeatureIds: uniq([...(current?.sharedFeatureIds ?? []), sf.featureId]),
    };
    if (current) Object.assign(current, evidenceRecord);
    else selection.evidence.push(evidenceRecord);
  }

  delete sf.categoryExcludeLabels;
  sf.userReason = '同一の終了画面観測を1つの入力Surfaceで記録し、設定別の完全分布をNumeric Featureとして評価します。設定を限定するカテゴリは同じ入力をEvidenceEngineにも共有し、二重入力せずに両方へ反映します。';
  delete sf.userFacingReason;
  delete sf.rejectionReason;

  const note = 'v6.4再監査: Evidenceカテゴリを数値分布から除外せず、同一Observationの同一inputをNumeric FeatureとEvidenceEngineで共有する。';
  rf.notes = rf.notes ? `${rf.notes} ${note}` : note;
  removeEvidenceUiOptions(selection, evidenceIds);

  for (const obs of arr(observation.observations)) {
    const label = String(obs.label ?? '');
    const related = label.includes('非Evidence') && (label.includes('終了画面') || label.includes('ボーナス終了'));
    if (!related) continue;
    if (machineId === 'L_INUYASHA2_FK') {
      const wantWhite = config.researchFeatureId === 'RF_WHITE_BIG_END' && label.includes('白BIG');
      const wantBlue = config.researchFeatureId === 'RF_BLUE_BIG_END' && label.includes('青7BIG');
      if (!wantWhite && !wantBlue) continue;
    } else if (machineId === 'S_MILKY_HOMES_GNB' && !label.includes('ボーナス終了')) continue;
    obs.label = label.replace('の非Evidence比率', '振り分け').replace(' 非Evidence比率', '振り分け');
    obs.excludedConditions = arr(obs.excludedConditions).filter(x => !/Evidence/u.test(String(x)));
    obs.categories = uniq([...arr(obs.categories), 'evidence_shared']);
    obs.semanticNote = 'v6.4: Numeric FeatureとEvidenceEngineで同一Observation/inputを共有。legacy observationIdは互換性のため維持。';
  }

  console.log('CATEGORY_RESULT ' + JSON.stringify({
    machineId,
    researchFeatureId: config.researchFeatureId,
    expectedCategoryCount: arr(rf.categories).length,
    actualInputCount: featureInputIds(sf).length,
    finalInputIds: featureInputIds(sf),
  }));

  return { researchPath, selectionPath, observationPath, research, selection, observation };
}

export function migrateBatch1(root = process.cwd(), { apply = false } = {}) {
  const changed = [];
  for (const [machineId, configs] of Object.entries(TARGETS)) {
    let state = null;
    for (const config of configs) {
      if (!state) state = migrateOne(root, machineId, config);
      else {
        write(state.researchPath, state.research);
        write(state.selectionPath, state.selection);
        write(state.observationPath, state.observation);
        state = migrateOne(root, machineId, config);
      }
    }
    if (!state) continue;
    changed.push(machineId);
    if (apply) {
      write(state.researchPath, state.research);
      write(state.selectionPath, state.selection);
      write(state.observationPath, state.observation);
    }
  }
  return { changed, apply };
}

function main() {
  const root = path.resolve(process.argv[2] ?? '.');
  const apply = process.argv.includes('--apply');
  if (!apply) {
    const tmp = fs.mkdtempSync(path.join(process.env.RUNNER_TEMP ?? process.env.TMPDIR ?? '/tmp', 'slo-v64-batch1-'));
    fs.cpSync(root, tmp, { recursive: true, filter: src => !src.includes(`${path.sep}.git${path.sep}`) });
    const result = migrateBatch1(tmp, { apply: true });
    console.log(`DRY-RUN PASS: ${result.changed.join(', ')}`);
    return;
  }
  const result = migrateBatch1(root, { apply: true });
  console.log(`APPLIED: ${result.changed.join(', ')}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) main();
