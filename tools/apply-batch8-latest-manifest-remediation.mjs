import fs from 'node:fs';
import path from 'node:path';

const MACHINE_IDS = [
  'L_USHIO_TORA_HAKUMEN_VH',
  'L_AMAZING_LIVE_PD',
  'L_YOSHIMUNE_SC2',
  'L_MAHJONG_MONOGATARI_S2',
  'L_IDOLMASTER_MILLION_LIVE_HC',
  'L_YOUJITSU_DE',
  'L_MIDORIDON_VIVA_REVIVAL_FY',
  'L_GUNDAM_SEED_G',
];

const NORMAL_DESCRIPTION = '実戦中に対象回数と対応する試行数を記録します。対象外の状態・区間は含めません。';
const EVIDENCE_DESCRIPTION = 'このタイミングで確認できた設定示唆・設定確定パターンを記録します。';

const GREEN_DON_LATENT_FEATURES = new Set([
  'FEAT_HIGH_TRANSITION',
  'FEAT_NORMAL_BONUS_WEAK_CHERRY',
  'FEAT_NORMAL_BONUS_WEAK_WAVE',
  'FEAT_NORMAL_BONUS_CHANCE',
  'FEAT_NORMAL_BONUS_STRONG_CHERRY',
  'FEAT_NORMAL_BONUS_STRONG_WAVE',
  'FEAT_HIGH_BONUS_WEAK_WAVE',
]);

const GREEN_DON_REASON = '通常・高確などの内部状態を各試行で確定観測できる手段を確認できず、状態の推測を分母へ混ぜると観測条件が一定にならないため、設定推測には使用しません。';

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}
function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}
function isEvidenceInput(inputId) {
  return /^INP_/.test(inputId) && (
    /PAYOUT|TROPHY|STAMP|END_|BONUS_END|AT_END|AT_ADD|INTRO|VOICE|HANAFUDA|HIDDEN|HARURUNA|OVER|MEDAL/.test(inputId)
  );
}
function evidenceGroup(inputId) {
  if (/PAYOUT|OVER|MEDAL/.test(inputId)) return ['獲得枚数表示', 10];
  if (/TROPHY/.test(inputId)) return ['トロフィー', 20];
  if (/HANAFUDA|BONUS_END/.test(inputId)) return ['ボーナス終了時', 30];
  if (/AT_END/.test(inputId)) return ['AT終了時', 40];
  if (/AT_ADD/.test(inputId)) return ['AT上乗せ時', 50];
  if (/INTRO/.test(inputId)) return ['キャラ紹介', 60];
  if (/END_TRICK/.test(inputId)) return ['エンディング中', 70];
  if (/XR_VOICE|VOICE/.test(inputId)) return ['ボイス・セリフ', 80];
  if (/HARURUNA/.test(inputId)) return ['Last Judge', 90];
  if (/HIDDEN/.test(inputId)) return ['隠し示唆', 100];
  if (/STAMP|END_SCREEN/.test(inputId)) return ['終了画面・スタンプ', 110];
  return ['その他の設定示唆', 999];
}

function splitEvidenceSections(ui) {
  const sectionEntries = Object.entries(ui.sections ?? {});
  const evidenceIds = [];
  const kept = [];
  for (const [title, section] of sectionEntries) {
    const ids = section.inputIds ?? [];
    const evidenceCount = ids.filter(isEvidenceInput).length;
    const genericEvidence = title === '設定示唆・確定情報' || (ids.length > 0 && evidenceCount === ids.length && section.collapsible === true);
    if (genericEvidence) evidenceIds.push(...ids);
    else kept.push([title, section]);
  }
  if (!evidenceIds.length) return;

  const groups = new Map();
  for (const id of evidenceIds) {
    const [title, order] = evidenceGroup(id);
    if (!groups.has(title)) groups.set(title, { order, ids: [] });
    groups.get(title).ids.push(id);
  }
  const orderedGroups = [...groups.entries()].sort((a, b) => a[1].order - b[1].order);
  for (const [title, group] of orderedGroups) {
    kept.push([title, {
      inputIds: group.ids,
      description: EVIDENCE_DESCRIPTION,
      observationRefs: [],
      acquisitionSources: [],
      collapsible: true,
      defaultExpanded: false,
    }]);
  }
  ui.sections = Object.fromEntries(kept);
  ui.sectionOrder = kept.map(([title]) => title);
}

function remediateUi(machineId) {
  const file = path.join('research', machineId, 'ui-design-data.json');
  const ui = readJson(file);

  for (const section of Object.values(ui.sections ?? {})) {
    if (typeof section.description === 'string' && /SelectionData|Feature/.test(section.description)) {
      section.description = section.collapsible === true ? EVIDENCE_DESCRIPTION : NORMAL_DESCRIPTION;
    }
  }

  splitEvidenceSections(ui);

  if (machineId === 'L_YOUJITSU_DE' && ui.sections?.GIRLS_CHALLENGE) {
    ui.sections['CZ種別'] = ui.sections.GIRLS_CHALLENGE;
    delete ui.sections.GIRLS_CHALLENGE;
    ui.sectionOrder = (ui.sectionOrder ?? []).map((x) => x === 'GIRLS_CHALLENGE' ? 'CZ種別' : x);
    // Re-establish section map in sectionOrder to keep deterministic display ordering.
    const rebuilt = {};
    for (const title of ui.sectionOrder) if (ui.sections[title]) rebuilt[title] = ui.sections[title];
    for (const [title, section] of Object.entries(ui.sections)) if (!rebuilt[title]) rebuilt[title] = section;
    ui.sections = rebuilt;
  }

  if (machineId === 'L_MIDORIDON_VIVA_REVIVAL_FY') {
    const selection = readJson(path.join('research', machineId, 'selection-data.json'));
    const excludedInputIds = new Set();
    for (const feature of selection.features ?? []) {
      if (!GREEN_DON_LATENT_FEATURES.has(feature.featureId)) continue;
      for (const key of ['numeratorInputId', 'denominatorInputId']) if (feature[key]) excludedInputIds.add(feature[key]);
    }
    ui.sectionOrder = (ui.sectionOrder ?? []).filter((title) => {
      const ids = ui.sections?.[title]?.inputIds ?? [];
      return !ids.length || !ids.every((id) => excludedInputIds.has(id));
    });
    ui.sections = Object.fromEntries(Object.entries(ui.sections ?? {}).filter(([title]) => ui.sectionOrder.includes(title)));
    for (const id of excludedInputIds) delete ui.inputContracts?.[id];
  }

  ui.auditNotes = (ui.auditNotes ?? []).filter((note) => !/SelectionData|Feature/.test(note));
  ui.auditNotes.push('空欄は未観測、0は観測済み0回として区別します。');
  ui.auditNotes.push('着席前の値は、取得元とリセット境界が確認できた場合だけ自己実戦との差分計算に使用します。');
  writeJson(file, ui);
}

function remediateGreenDonSelection() {
  const file = path.join('research', 'L_MIDORIDON_VIVA_REVIVAL_FY', 'selection-data.json');
  const selection = readJson(file);
  const removeInputs = new Set();

  for (const feature of selection.features ?? []) {
    if (!GREEN_DON_LATENT_FEATURES.has(feature.featureId)) continue;
    if (feature.numeratorInputId) removeInputs.add(feature.numeratorInputId);
    if (feature.denominatorInputId) removeInputs.add(feature.denominatorInputId);
    feature.adoptionCategory = 'EXCLUDE';
    feature.userReason = GREEN_DON_REASON;
    feature.difficultyParticipation = 'EXCLUDE';
    feature.difficultyExclusionReason = GREEN_DON_REASON;
    delete feature.numeratorInputId;
    delete feature.denominatorInputId;
    delete feature.denominatorInputIds;
    delete feature.categoryInputMap;
    delete feature.categoryInputIds;
    delete feature.inputTransform;
    delete feature.suppressedByFeatureIds;
    delete feature.difficultyExposure;
  }

  // Keep an input only if another active feature/evidence still references it.
  const liveRefs = new Set();
  const collect = (value) => {
    if (typeof value === 'string' && value.startsWith('INP_')) liveRefs.add(value);
    else if (Array.isArray(value)) value.forEach(collect);
    else if (value && typeof value === 'object') Object.values(value).forEach(collect);
  };
  for (const feature of selection.features ?? []) if (feature.adoptionCategory !== 'EXCLUDE') collect(feature);
  collect(selection.evidence ?? selection.evidenceUi ?? []);
  selection.inputs = (selection.inputs ?? []).filter((input) => !removeInputs.has(input.id) || liveRefs.has(input.id));

  selection.rejectedElements = selection.rejectedElements ?? [];
  for (const featureId of GREEN_DON_LATENT_FEATURES) {
    const researchFeatureId = (selection.features ?? []).find((x) => x.featureId === featureId)?.researchFeatureId;
    if (!researchFeatureId) continue;
    const existing = selection.rejectedElements.find((x) => x.researchFeatureId === researchFeatureId || x.featureId === featureId);
    if (existing) existing.reason = GREEN_DON_REASON;
  }
  writeJson(file, selection);
}

function remediateGreenDonObservation() {
  const file = path.join('research', 'L_MIDORIDON_VIVA_REVIVAL_FY', 'machine-observation-data.json');
  const observation = readJson(file);
  const latentObsIds = new Set();
  for (const mapping of observation.featureMappings ?? []) {
    if (!GREEN_DON_LATENT_FEATURES.has(mapping.featureId)) continue;
    if (mapping.observationId) latentObsIds.add(mapping.observationId);
    mapping.inferenceParticipates = false;
    mapping.difficultyParticipates = false;
    mapping.compatibility = 'NOT_USED_FOR_INFERENCE';
    mapping.notes = GREEN_DON_REASON;
  }
  for (const obs of observation.observations ?? []) {
    if (!latentObsIds.has(obs.observationId)) continue;
    obs.notes = GREEN_DON_REASON;
    obs.excludedConditions = [...new Set([...(obs.excludedConditions ?? []), '通常・高確などの内部状態を推測だけで分類しない'])];
  }
  observation.auditNotes = observation.auditNotes ?? [];
  observation.auditNotes.push('通常・高確などの内部状態は示唆演出だけでは各試行の確定分類にならないため、状態依存の7候補は設定推測から除外します。');
  writeJson(file, observation);
}

for (const machineId of MACHINE_IDS) {
  if (machineId === 'L_MIDORIDON_VIVA_REVIVAL_FY') {
    remediateGreenDonSelection();
    remediateGreenDonObservation();
  }
  remediateUi(machineId);
}

console.log(`Remediated ${MACHINE_IDS.length} machines for latest manifest semantics.`);
