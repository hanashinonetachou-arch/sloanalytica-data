#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const MACHINE_ID = 'S_MILKY_HOMES_GNB';
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const write = (p, v) => fs.writeFileSync(p, JSON.stringify(v, null, 2) + '\n');
const arr = v => Array.isArray(v) ? v : [];
const uniq = xs => [...new Set(xs.filter(Boolean))];
const MAP = {
  RE_END_COPPER: ['COPPER', 'INP_END_COPPER'],
  RE_END_GOLD: ['GOLD', 'INP_END_GOLD'],
  RE_END_STAR: ['STAR', 'INP_END_STAR'],
  RE_END_RAINBOW: ['RAINBOW', 'INP_END_RAINBOW'],
};

function uiOption(selection, evidenceId) {
  for (const group of arr(selection.evidenceUi?.groups)) {
    for (const option of arr(group.options)) {
      if (arr(option.sourceEvidenceIds).includes(evidenceId)) return option;
    }
  }
  return null;
}

function migrate(root, apply) {
  const base = path.join(root, 'research', MACHINE_ID);
  const rp = path.join(base, 'research-data.json');
  const sp = path.join(base, 'selection-data.json');
  const op = path.join(base, 'machine-observation-data.json');
  const research = read(rp), selection = read(sp), observation = read(op);
  const rf = arr(research.features).find(x => x.researchFeatureId === 'RF_BONUS_END');
  const sf = arr(selection.features).find(x => x.researchFeatureId === 'RF_BONUS_END');
  if (!rf || !sf) throw new Error('RF_BONUS_END missing');

  const excluded = new Set(arr(sf.categoryExcludeLabels));
  const oldIds = uniq([sf.numeratorInputId, ...arr(sf.categoryInputIds)]);
  const template = arr(selection.inputs).find(x => oldIds.includes(x.id)) ?? {};
  let order = Math.max(...arr(selection.inputs).filter(x => oldIds.includes(x.id)).map(x => Number(x.displayOrder)).filter(Number.isFinite), 62) + 1;
  const inputs = new Map(arr(selection.inputs).map(x => [x.id, x]));
  selection.evidence ??= [];

  for (const [reId, [category, inputId]] of Object.entries(MAP)) {
    if (!arr(rf.categories).includes(category) || !excluded.has(category)) throw new Error(`category mismatch ${category}`);
    const option = uiOption(selection, reId);
    if (!option) throw new Error(`evidenceUi option missing ${reId}`);
    if (!inputs.has(inputId)) {
      const input = { id: inputId, name: option.label ?? category, category: template.category ?? 'SETTING_SIGNAL', type: 'counter', unit: '回', displayOrder: order++, inferenceRole: 'INCLUDE_SUPPORT', observationScope: template.observationScope ?? 'SELF_PLAY', defaultValue: template.defaultValue ?? null, uiQuickAdd: 1 };
      selection.inputs.push(input); inputs.set(inputId, input);
    }
    sf.categoryInputIds = uniq([...arr(sf.categoryInputIds), inputId]);
    const current = selection.evidence.find(x => x.researchEvidenceId === reId);
    const record = { researchEvidenceId: reId, evidenceId: current?.evidenceId ?? `EVI_${reId.replace(/^RE_/, '')}`, inputId, sharedFeatureIds: uniq([...(current?.sharedFeatureIds ?? []), sf.featureId]) };
    if (current) Object.assign(current, record); else selection.evidence.push(record);
  }

  delete sf.categoryExcludeLabels;
  sf.normalizeRoundedCategoryProbabilities = true;
  sf.userReason = 'ボーナス終了画面は全カテゴリを同じ入力で記録し、公開丸め値は採用時に正規化した完全分布として数値推測へ利用します。銅・金・星・虹は同じ入力をEvidenceEngineにも共有するため、二重入力は不要です。';
  delete sf.userFacingReason;
  const note = 'v6.4再監査: Evidenceカテゴリも完全分布へ戻し、同一inputをNumeric FeatureとEvidenceEngineで共有。公開丸め値はResearch原値を保持し、Selection採用時に厳密確率へ正規化する。';
  rf.notes = rf.notes ? `${rf.notes} ${note}` : note;

  const evidenceIds = new Set(Object.keys(MAP));
  if (selection.evidenceUi?.groups) {
    selection.evidenceUi.groups = selection.evidenceUi.groups.map(g => ({...g, options: arr(g.options).filter(o => !arr(o.sourceEvidenceIds).some(id => evidenceIds.has(id)))})).filter(g => g.options.length);
  }

  const obs = arr(observation.observations).find(x => x.observationId === 'OBS_BONUS_END_NON_EVIDENCE');
  if (!obs) throw new Error('OBS_BONUS_END_NON_EVIDENCE missing');
  obs.label = 'ボーナス終了画面振り分け';
  obs.excludedConditions = arr(obs.excludedConditions).filter(x => !/Evidence/u.test(String(x)));
  obs.categories = uniq([...arr(obs.categories), 'evidence_shared']);
  obs.semanticNote = 'v6.4: 同一Observation/inputをNumeric FeatureとEvidenceEngineで共有。';

  const mapped = uniq([sf.numeratorInputId, ...arr(sf.categoryInputIds)]).length;
  if (mapped !== arr(rf.categories).length) throw new Error(`category mapping mismatch ${mapped}/${arr(rf.categories).length}`);
  if (apply) { write(rp, research); write(sp, selection); write(op, observation); }
  return mapped;
}

const root = path.resolve(process.argv[2] ?? '.');
const apply = process.argv.includes('--apply');
if (apply) console.log(`APPLIED categories=${migrate(root, true)}`);
else {
  const tmp = fs.mkdtempSync(path.join(process.env.RUNNER_TEMP ?? '/tmp', 'slo-v64-milky-'));
  fs.cpSync(root, tmp, { recursive: true, filter: src => !src.includes(`${path.sep}.git${path.sep}`) });
  console.log(`DRY-RUN PASS categories=${migrate(tmp, true)}`);
}
