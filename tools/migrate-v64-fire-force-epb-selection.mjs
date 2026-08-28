#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const MACHINE_ID = 'L_ENEN_NO_SHOUBOUTAI_JG';
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const write = (p, v) => fs.writeFileSync(p, JSON.stringify(v, null, 2) + '\n');

export function migrate(root = process.cwd(), { apply = false } = {}) {
  const base = path.join(root, 'research', MACHINE_ID);
  const researchPath = path.join(base, 'research-data.json');
  const selectionPath = path.join(base, 'selection-data.json');
  const research = read(researchPath);
  const selection = read(selectionPath);

  const epb = (research.features ?? []).find(f => f.researchFeatureId === 'RF_EPB_AFTER_INITIAL');
  const initial = (research.features ?? []).find(f => f.researchFeatureId === 'RF_INITIAL');
  const bonusShare = (research.features ?? []).find(f => f.researchFeatureId === 'RF_BONUS_SHARE');
  if (!epb || epb.candidateModel !== 'binomial') throw new Error('RF_EPB_AFTER_INITIAL binomial Research feature is required');
  if (!initial || !bonusShare) throw new Error('RF_INITIAL and RF_BONUS_SHARE are required to derive EPB exposure');

  selection.inputs ??= [];
  if (!selection.inputs.some(i => i.id === 'INP_EPB_AFTER_INITIAL')) {
    selection.inputs.push({
      id: 'INP_EPB_AFTER_INITIAL',
      name: 'エピソードボーナス到達',
      type: 'counter',
      category: 'EPB_AFTER_INITIAL',
      displayOrder: 11,
      defaultValue: null,
      unit: '回',
      description: '初当りボーナス後にエピソードボーナスへ到達した回数を入力してください。'
    });
    selection.inputs.sort((a, b) => (a.displayOrder ?? 9999) - (b.displayOrder ?? 9999));
  }

  selection.uiCategoryLabels ??= {};
  selection.uiCategoryLabels.EPB_AFTER_INITIAL = 'エピソードボーナス';

  const rates = {};
  for (const setting of research.machine.settings ?? []) {
    const pInitial = Number(initial.settingValues?.[setting]?.probability);
    const pBonusShare = Number(bonusShare.settingValues?.[setting]?.probability);
    const expected = Number(epb.settingValues?.[setting]?.probability);
    if (![pInitial, pBonusShare, expected].every(Number.isFinite)) throw new Error(`${setting}: incomplete Research probabilities`);
    rates[setting] = pInitial * pBonusShare;
  }

  selection.features ??= [];
  const feature = {
    researchFeatureId: 'RF_EPB_AFTER_INITIAL',
    featureId: 'FEAT_EPB_AFTER_INITIAL',
    adoptionCategory: 'INCLUDE_SUPPORT',
    numeratorInputId: 'INP_EPB_AFTER_INITIAL',
    denominatorInputId: 'INP_BONUS_INITIAL',
    minimumSample: 1,
    weight: 1,
    displayFormat: 'percent',
    difficultyExposure: {
      mode: 'setting_rate',
      trialsPerGameBySetting: rates,
      quality: 'DERIVED',
      basisId: 'NORMAL_GAMES'
    },
    difficultyParticipation: 'INCLUDE',
    userReason: '初当りボーナスを母数にEPB到達率を条件付きで評価でき、初当り率・ボーナス比率と階層的に分解できるため補助採用。'
  };
  const existing = selection.features.findIndex(f => f.researchFeatureId === 'RF_EPB_AFTER_INITIAL' || f.featureId === 'FEAT_EPB_AFTER_INITIAL');
  if (existing >= 0) selection.features[existing] = feature;
  else {
    const bonusIndex = selection.features.findIndex(f => f.featureId === 'FEAT_BONUS_SHARE');
    selection.features.splice(bonusIndex >= 0 ? bonusIndex + 1 : selection.features.length, 0, feature);
  }

  if (apply) write(selectionPath, selection);
  return { machineId: MACHINE_ID, featureId: feature.featureId, exposureRates: rates };
}

const root = path.resolve(process.argv[2] ?? '.');
const apply = process.argv.includes('--apply');
if (apply) console.log('APPLIED ' + JSON.stringify(migrate(root, { apply: true })));
else {
  const tmp = fs.mkdtempSync(path.join(process.env.RUNNER_TEMP ?? process.env.TMPDIR ?? '/tmp', 'slo-v64-fire-force-epb-'));
  fs.cpSync(root, tmp, { recursive: true, filter: src => !src.includes(`${path.sep}.git${path.sep}`) });
  console.log('DRY-RUN PASS ' + JSON.stringify(migrate(tmp, { apply: true })));
}
