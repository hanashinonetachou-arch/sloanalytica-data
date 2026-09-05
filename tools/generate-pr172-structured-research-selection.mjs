import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const IDS = [
  'L_AZURLANE_THE_ANIMATION_KN',
  'L_DRUAGA_NO_TOU_ZA',
  'L_SMASLO_TOKYO_REVENGERS_ZF',
  'L_BABEL_BA',
  'L_SHIN_ONIMUSHA_3_SA',
  'L_ZENIGATA_5_L2',
  'L_TOARU_KAGAKU_NO_RAILGUN_2_FV',
  'L_ZETTAI_SHOGEKI_FORCE_FH',
  'L_KAKUMEIKI_VALVRAVE_2_JF',
  'L_NEO_PLANET_SLED',
];

const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const write = (p, v) => {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(v, null, 2) + '\n', 'utf8');
};
const publisherFromUrl = url => {
  try { return new URL(url).hostname.replace(/^www\./, ''); }
  catch { return 'source'; }
};
const rfId = featureId => `RF_${String(featureId).replace(/^FEAT_/, '')}`;

function researchSources(pkg) {
  return (pkg.evidence?.sources ?? []).map(s => ({
    sourceId: s.id,
    publisher: publisherFromUrl(s.url),
    title: s.pageName ?? s.id,
    url: s.url,
    checkedAt: s.checkedAt ?? '2026-09-05',
    sourceType: String(s.classification ?? 'ANALYSIS').toLowerCase(),
  }));
}

function buildResearch(pkg) {
  const inputs = new Map((pkg.inputs?.inputs ?? []).map(i => [i.id, i]));
  const sources = researchSources(pkg);
  const sourceIds = new Set(sources.map(s => s.sourceId));
  const fallbackSource = sources[0]?.sourceId;
  if (!fallbackSource) throw new Error(`${pkg.machine.machineId}: no public source inventory in MachinePackage`);

  const features = (pkg.features?.features ?? []).map(f => {
    const den = inputs.get(f.denominatorInputId);
    const num = inputs.get(f.numeratorInputId);
    const sourceRefs = (f.sourceEvidenceRefs ?? []).filter(x => sourceIds.has(x));
    if (!sourceRefs.length) throw new Error(`${pkg.machine.machineId}/${f.featureId}: no valid source refs`);
    const settingValues = {};
    for (const [setting, probability] of Object.entries(f.probabilities ?? {})) {
      settingValues[setting] = { probability, rawDisplay: String(probability) };
    }
    return {
      researchFeatureId: rfId(f.featureId),
      name: f.name,
      factStatus: 'verified',
      candidateModel: f.modelType ?? 'binomial',
      trialUnit: den?.name ?? f.denominatorInputId ?? '公開条件を満たす対象試行',
      numeratorDefinition: num?.name ?? f.numeratorInputId ?? `${f.name}の観測回数`,
      denominatorDefinition: den?.name ?? f.denominatorInputId ?? `${f.name}の対象試行数`,
      settingValues,
      sourceRefs,
      crossSourceStatus: sourceRefs.length > 1 ? 'cross_checked' : 'single_source_checked',
      notes: 'Gate A/B/Cで確定しGate D MachineDataへ物質化済みの採用Featureを、公開確率・入力契約・出典参照を変更せず構造化移行。',
    };
  });

  const evidenceCandidates = (pkg.evidence?.evidences ?? []).map(e => {
    const refs = (e.sourceEvidenceRefs ?? []).filter(x => sourceIds.has(x));
    if (!refs.length) throw new Error(`${pkg.machine.machineId}/${e.id}: no valid evidence source refs`);
    return {
      researchEvidenceId: `RE_${e.id}`,
      name: e.displayName ?? e.name,
      factStatus: 'verified',
      allowedSettings: [...(e.confirmedSettings ?? [])],
      deniedSettings: [...(e.deniedSettings ?? [])],
      sourceRefs: refs,
      sourceWording: 'Gate D MachineDataでSETTING_CONFIRMATIONとして物質化済みの公開設定確定／下限／否定情報。',
      notes: e.contextNote ?? '出現傾向の強弱ではなく、公開された設定集合制約だけをEvidenceとして使用する。',
    };
  });

  return {
    schemaVersion: 'research-data-v1',
    machine: {
      machineId: pkg.machine.machineId,
      displayName: pkg.machine.displayName,
      formalName: pkg.machine.displayName,
      modelNumber: pkg.machine.modelName,
      manufacturer: pkg.machine.manufacturer,
      introductionDate: '2026-09-05',
      settings: [...pkg.machine.settings],
      identitySourceRefs: [fallbackSource],
    },
    researchedAt: '2026-09-05',
    sources,
    features,
    evidenceCandidates,
    conflicts: [],
    migrationNote: 'Gate A/Bの網羅候補・不採用理由の一次記録は research/batch-20260905-next10/ 配下のGate文書。ここではGate Dで確定した実行契約をPhase 12互換の構造化ResearchDataとして再表現し、未採用候補を新たな数値Featureへ昇格させない。',
  };
}

function buildSelection(pkg, research) {
  const evidenceByInput = new Map();
  for (const e of pkg.evidence?.evidences ?? []) {
    if (!evidenceByInput.has(e.inputId)) evidenceByInput.set(e.inputId, []);
    evidenceByInput.get(e.inputId).push(e);
  }
  const inputById = new Map((pkg.inputs?.inputs ?? []).map(i => [i.id, i]));

  const groups = [];
  let evidenceOrder = 100;
  for (const [inputId, evs] of evidenceByInput) {
    const input = inputById.get(inputId);
    groups.push({
      groupId: `EVG_${inputId.replace(/^INP_EVI_/, '')}`,
      label: input?.name ?? inputId,
      selectionMode: input?.type === 'enum' ? 'single' : 'multi',
      normalizationMode: 'ALLOWED_SETTINGS_INTERSECTION',
      displayOrder: evidenceOrder++,
      options: evs.map(e => ({
        value: e.triggerValue,
        label: e.displayName ?? e.name,
        allowedSettings: [...(e.confirmedSettings ?? [])],
        excludedSettings: [...(e.deniedSettings ?? [])],
        sourceEvidenceIds: [`RE_${e.id}`],
      })),
    });
  }

  const features = (pkg.features?.features ?? []).map(f => ({
    researchFeatureId: rfId(f.featureId),
    featureId: f.featureId,
    adoptionCategory: f.adoptionCategory,
    weight: f.reliabilityProfile?.weight ?? 1,
    ...(f.numeratorInputId ? { numeratorInputId: f.numeratorInputId } : {}),
    ...(f.denominatorInputId ? { denominatorInputId: f.denominatorInputId } : {}),
    userReason: 'Gate Bで採用し、Gate Cの観測契約を経てGate D MachineDataに物質化済み。分子・分母・設定別確率はMachineDataと同一。',
    difficultyParticipation: 'EXCLUDE',
    difficultyExclusionReason: 'Gate E時点では実戦総GへのDifficulty Exposure換算を別監査するため、推測Featureは維持したままDifficulty校正のみ除外する。',
  }));

  const evidenceDecisions = (research.evidenceCandidates ?? []).map(e => ({
    researchEvidenceId: e.researchEvidenceId,
    disposition: 'INCLUDE_UI',
    reason: 'Gate DでSETTING_CONFIRMATIONとして物質化済み。設定集合の絞り込みだけに使用する。',
  }));

  const uiCategoryLabels = {};
  for (const i of pkg.inputs?.inputs ?? []) {
    if (i.category && i.category !== 'EVIDENCE' && !uiCategoryLabels[i.category]) uiCategoryLabels[i.category] = i.name;
  }
  if ((pkg.evidence?.evidences ?? []).length) uiCategoryLabels.EVIDENCE = '設定示唆・確定情報';

  return {
    schemaVersion: 'selection-data-v1',
    machineId: pkg.machine.machineId,
    machineDataVersion: pkg.machine.machineDataVersion,
    inputs: (pkg.inputs?.inputs ?? []).map(i => ({ ...i })),
    features,
    evidence: [],
    evidenceDecisions,
    evidenceReview: { policyVersion: 1, exclusions: [] },
    evidenceUi: { groups },
    uiCategoryLabels,
    difficultyAnalysis: {
      targetGames: [1500, 3000, 7000],
      targetGameBasis: {
        basisId: 'UNRESOLVED_OBSERVATION',
        label: 'Observationで確定する実戦観測量',
        quality: 'UNRESOLVED',
        crossMachineComparable: false,
        note: '数値推測ではGate Cで固定した正しい入力分母を使い、総G換算は実機検証後の別監査で確定する。',
      },
      calibrationAllowedExposureQualities: ['EXACT', 'DERIVED'],
    },
    migrationNote: 'Gate A/Bの不採用候補一覧はbatch Gate文書とMachineData selectionSummaryに保持。Phase 12構造化SelectionDataでは、現在実行される採用Feature/Evidence契約のみをMachineDataから無変換で再表現する。',
  };
}

for (const id of IDS) {
  const pkg = read(path.join(ROOT, 'machines', id, 'machine-package.json'));
  if (pkg?.machine?.machineId !== id) throw new Error(`${id}: machineId mismatch`);
  const research = buildResearch(pkg);
  const selection = buildSelection(pkg, research);
  const dir = path.join(ROOT, 'research', id);
  write(path.join(dir, 'research-data.json'), research);
  write(path.join(dir, 'selection-data.json'), selection);
  console.log(`Generated structured Research/Selection: ${id}`);
}
