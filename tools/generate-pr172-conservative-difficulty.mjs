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

function settingNumber(s) {
  const m = /^SET_(\d+)$/.exec(s);
  return m ? Number(m[1]) : null;
}

for (const id of IDS) {
  const pkgPath = path.join(ROOT, 'machines', id, 'machine-package.json');
  if (!fs.existsSync(pkgPath)) throw new Error(`${id}: machine-package.json not found`);
  const pkg = read(pkgPath);
  if (pkg?.machine?.machineId !== id) throw new Error(`${id}: machineId mismatch`);

  const settings = pkg.machine.settings ?? [];
  const active = (pkg.features?.features ?? []).filter(f =>
    f.probabilityEngineUsage === true && f.adoptionCategory !== 'EXCLUDE'
  );
  const excluded = active.map(f => ({
    featureId: f.featureId,
    reason: 'Gate E時点で実戦総GへのDifficulty Exposure換算が正式確定していないため、推測本体には残したまま公開Difficulty校正からのみ除外する。',
  }));

  const difficulty = {
    analyzerVersion: 'difficulty-analyzer-v1.2',
    machineId: id,
    machineDataVersion: pkg.machine.machineDataVersion,
    generatedAt: new Date().toISOString(),
    status: 'NO_NUMERIC_FEATURES',
    scoreDefinition: {
      range: '0-100 integer; higher is easier to discriminate numerically',
      evidenceIncluded: false,
      prior: 'uniform over available settings',
      weights: { information: 0.45, exact: 0.35, distance: 0.2 },
      components: [
        'normalized posterior information',
        'chance-corrected exact-setting accuracy',
        'chance-corrected ordinal rank-distance',
      ],
      settingDistance: 'ordinal setting order, not numeric label gap',
    },
    targetGameBasis: {
      basisId: 'UNRESOLVED_OBSERVATION',
      label: 'Observationで確定する実戦Exposure',
      quality: 'UNRESOLVED',
      crossMachineComparable: false,
      note: 'Gate Eでは推測Featureの分母契約を保持し、総G換算は実機検証後に別監査で確定する。',
    },
    scoreConfidence: {
      level: 'NOT_APPLICABLE',
      basis: 'No adopted numeric inference Feature has publish-safe game-count exposure yet.',
    },
    exposurePolicy: {
      allowedQualities: ['EXACT', 'DERIVED'],
      derivedEventRate: 'source feature exposure × source event/category probability × eventMultiplier; no observed event frequency is invented',
    },
    coverage: {
      inferenceNumericFeatureCount: active.length,
      includedNumericFeatureCount: 0,
      explicitlyExcludedNumericFeatureCount: active.length,
      explicitlyExcludedNumericFeatures: excluded,
      analyzableFeatureCount: 0,
      ratio: active.length ? 1 : 0,
      missingDifficultyExposureFeatureIds: [],
      blockedDifficultyExposureFeatures: [],
    },
    targets: [],
    featureTrialEstimates: active.map(f => ({
      featureId: f.featureId,
      name: f.name,
      adoptionCategory: f.adoptionCategory,
    })),
  };

  const low = settings.filter(s => settingNumber(s) !== null && settingNumber(s) < 4);
  const high = settings.filter(s => settingNumber(s) !== null && settingNumber(s) >= 4);
  const ignored = settings.filter(s => settingNumber(s) === null);
  const settingBand = {
    analyzerVersion: 'setting-band-discrimination-g-v1.0',
    machineId: id,
    machineDataVersion: pkg.machine.machineDataVersion,
    status: 'NOT_APPLICABLE',
    definition: '低設定帯と高設定帯を見分けるために必要なゲーム数の目安です。両方の設定帯で目標正解率を満たす地点をシミュレーションで確認して表示します。',
    thresholds: [0.6],
    bands: {
      low,
      high,
      ignored,
      prior: { low: 0.5, high: 0.5, withinBand: 'uniform' },
      boundary: 'SET_4_OR_HIGHER_IS_HIGH',
    },
    evidenceIncluded: false,
    predecessorSnapshotIncluded: false,
    numericFeaturePolicy: 'Adopted numeric features with resolvable difficultyExposure only; same probability models and feature weights as inference/difficulty.',
    analyzableFeatureIds: [],
    excludedAdoptedFeatureIds: active.map(f => f.featureId),
    reason: 'Gate E時点で実戦総GへのDifficulty Exposure換算が正式確定していないため、設定帯判別Gは公開しない。',
    simulation: {
      simulationsPerSetting: 4000,
      seed: 20260820,
      coarseStep: 500,
      fineStep: 100,
      maxGames: 500,
    },
    results: [{ threshold: 0.6, games: null, reachedWithinMaxGames: false }],
  };

  const outDir = path.join(ROOT, 'research', id);
  write(path.join(outDir, 'difficulty-report.json'), difficulty);
  write(path.join(outDir, 'setting-band-report.json'), settingBand);
  console.log(`Generated conservative publish reports: ${id}`);
}
