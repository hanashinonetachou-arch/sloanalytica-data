const EPS = 1e-12;
const DEFAULT_THRESHOLDS = [0.6, 0.7, 0.8];
const DEFAULT_SIMULATIONS_PER_SETTING = 4000;
const DEFAULT_ALLOWED_QUALITIES = ['EXACT', 'DERIVED', 'ESTIMATED'];
const DEFAULT_SEED = 20260820;
const DEFAULT_COARSE_STEP = 500;
const DEFAULT_FINE_STEP = 100;
const DEFAULT_MAX_GAMES = 100000;

function clamp(v, a = 0, b = 1) { return Math.max(a, Math.min(b, v)); }
function clampP(p) { return clamp(Number(p), EPS, 1 - EPS); }
function logSumExp(xs) {
  const m = Math.max(...xs);
  return m + Math.log(xs.reduce((s, x) => s + Math.exp(x - m), 0));
}
function mulberry32(seed) {
  return function rng() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function normal(rng) {
  let u = 0, v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
function samplePoisson(lambda, rng) {
  if (lambda <= 0) return 0;
  if (lambda < 30) {
    const L = Math.exp(-lambda);
    let k = 0, p = 1;
    do { k++; p *= rng(); } while (p > L);
    return k - 1;
  }
  return Math.max(0, Math.round(lambda + Math.sqrt(lambda) * normal(rng)));
}
function sampleBinomial(n, p, rng) {
  n = Math.max(0, Math.round(n));
  p = clampP(p);
  const mean = n * p;
  if (n <= 60) {
    let x = 0;
    for (let i = 0; i < n; i++) if (rng() < p) x++;
    return x;
  }
  if (mean < 20) return Math.min(n, samplePoisson(mean, rng));
  const fail = n * (1 - p);
  if (fail < 20) return n - Math.min(n, samplePoisson(fail, rng));
  return Math.max(0, Math.min(n, Math.round(mean + Math.sqrt(n * p * (1 - p)) * normal(rng))));
}
function sampleMultinomial(n, probs, rng) {
  let remainN = Math.max(0, Math.round(n));
  let remainP = 1;
  const out = [];
  for (let i = 0; i < probs.length - 1; i++) {
    const conditional = remainP <= EPS ? 0 : clamp(probs[i] / remainP, 0, 1);
    const x = sampleBinomial(remainN, conditional, rng);
    out.push(x);
    remainN -= x;
    remainP -= probs[i];
  }
  out.push(remainN);
  return out;
}
function categoricalDistribution(feature, setting) {
  const categories = Array.isArray(feature.categories) ? feature.categories : [];
  const raw = feature.settingDistributions?.[setting];
  if (!raw || categories.length < 2) return null;
  const values = categories.map(c => Number(raw[c]));
  if (values.some(v => !Number.isFinite(v) || v < 0 || v > 1)) return null;
  const sum = values.reduce((a, b) => a + b, 0);
  if ((feature.distributionMode ?? 'complete') === 'implicit_residual') {
    if (sum > 1 + 1e-6) return null;
    return [...values, Math.max(0, 1 - sum)];
  }
  return Math.abs(sum - 1) <= 1e-6 ? values : null;
}
function categoricalDistributionSelected(feature, selectionFeature, setting) {
  const base = categoricalDistribution(feature, setting);
  if (!base) return null;
  const excluded = new Set(selectionFeature?.categoryExcludeLabels ?? []);
  if (!excluded.size) return base;
  const sourceCats = feature.categories ?? [];
  const kept = [];
  for (let i = 0; i < sourceCats.length; i++) if (!excluded.has(sourceCats[i])) kept.push(base[i]);
  if ((feature.distributionMode ?? 'complete') === 'implicit_residual') kept.push(base.at(-1));
  const sum = kept.reduce((a, b) => a + b, 0);
  if (sum <= 0) return null;
  return kept.map(p => p / sum);
}
function featureProbability(feature, setting) {
  const p = Number(feature.settingValues?.[setting]?.probability);
  return Number.isFinite(p) && p >= 0 ? p : null;
}
function categoryProbability(feature, setting, categoryId) {
  if (feature.candidateModel !== 'multinomial') return null;
  const categories = Array.isArray(feature.categories) ? feature.categories : [];
  const index = categories.indexOf(categoryId);
  if (index < 0) return null;
  const dist = categoricalDistribution(feature, setting);
  return dist ? dist[index] : null;
}
function exposureQuality(ex) { return ex?.quality ?? 'EXACT'; }
function resolveExposureTrials(selectionFeature, trueSetting, targetGames, ctx, stack = new Set()) {
  const ex = selectionFeature?.difficultyExposure;
  if (!ex || typeof ex !== 'object') return null;
  if (!ctx.allowedQualities.has(exposureQuality(ex))) return null;
  if (stack.has(selectionFeature.featureId)) return null;
  const next = new Set(stack);
  next.add(selectionFeature.featureId);
  if (ex.mode === 'per_game') {
    const factor = Number(ex.factor ?? 1);
    return Number.isFinite(factor) && factor >= 0 ? Math.max(0, Math.round(targetGames * factor)) : null;
  }
  if (ex.mode === 'fixed_rate') {
    const rate = Number(ex.trialsPerGame);
    return Number.isFinite(rate) && rate >= 0 ? Math.max(0, Math.round(targetGames * rate)) : null;
  }
  if (ex.mode === 'setting_rate') {
    const rate = Number(ex.trialsPerGameBySetting?.[trueSetting]);
    return Number.isFinite(rate) && rate >= 0 ? Math.max(0, Math.round(targetGames * rate)) : null;
  }
  if (ex.mode === 'derived_event_rate') {
    const sourceSf = ctx.selectionByFeatureId.get(ex.sourceFeatureId);
    if (!sourceSf) return null;
    const sourceRf = ctx.featuresById.get(sourceSf.researchFeatureId);
    if (!sourceRf) return null;
    const sourceTrials = resolveExposureTrials(sourceSf, trueSetting, targetGames, ctx, next);
    if (sourceTrials == null) return null;
    const p = ex.sourceCategoryId
      ? categoryProbability(sourceRf, trueSetting, ex.sourceCategoryId)
      : featureProbability(sourceRf, trueSetting);
    if (p == null) return null;
    const mult = Number(ex.eventMultiplier ?? 1);
    return Number.isFinite(mult) && mult >= 0 ? Math.max(0, Math.round(sourceTrials * p * mult)) : null;
  }
  return null;
}
function simulateObservation(researchFeature, selectionFeature, trueSetting, targetGames, rng, ctx) {
  const n = resolveExposureTrials(selectionFeature, trueSetting, targetGames, ctx);
  if (n == null) return null;
  if (researchFeature.candidateModel === 'multinomial') {
    const probs = categoricalDistributionSelected(researchFeature, selectionFeature, trueSetting);
    if (!probs) return null;
    return { n, counts: sampleMultinomial(n, probs, rng) };
  }
  const p = featureProbability(researchFeature, trueSetting);
  if (p == null) return null;
  if (researchFeature.candidateModel === 'poisson') return { n, count: samplePoisson(n * p, rng) };
  return { n, count: sampleBinomial(n, p, rng) };
}
function logLikelihood(researchFeature, selectionFeature, obs, setting) {
  if (researchFeature.candidateModel === 'multinomial') {
    const probs = categoricalDistributionSelected(researchFeature, selectionFeature, setting);
    if (!probs) return -Infinity;
    return obs.counts.reduce((s, c, i) => c > 0 ? s + c * Math.log(clampP(probs[i])) : s, 0);
  }
  const p = featureProbability(researchFeature, setting);
  if (p == null) return -Infinity;
  if (researchFeature.candidateModel === 'poisson') {
    const lambda = Math.max(EPS, obs.n * p);
    return obs.count * Math.log(lambda) - lambda;
  }
  return obs.count * Math.log(clampP(p)) + (obs.n - obs.count) * Math.log(clampP(1 - p));
}
function settingNumber(setting) {
  const m = /^SET_(\d+)$/.exec(String(setting));
  return m ? Number(m[1]) : null;
}
function splitSettingBands(settings) {
  const low = [], high = [], ignored = [];
  for (const s of settings) {
    const n = settingNumber(s);
    if (n == null) ignored.push(s);
    else if (n <= 3) low.push(s);
    else high.push(s);
  }
  return { low, high, ignored };
}
function priorLogs(settings, bands) {
  const lowSet = new Set(bands.low), highSet = new Set(bands.high);
  return settings.map(s => {
    if (lowSet.has(s)) return Math.log(0.5 / bands.low.length);
    if (highSet.has(s)) return Math.log(0.5 / bands.high.length);
    return -Infinity;
  });
}
function posteriorForRun(settings, bands, featuresById, selectionFeatures, trueSetting, targetGames, rng, ctx) {
  const logs = priorLogs(settings, bands);
  let used = 0;
  for (const sf of selectionFeatures) {
    const rf = featuresById.get(sf.researchFeatureId);
    if (!rf) continue;
    const obs = simulateObservation(rf, sf, trueSetting, targetGames, rng, ctx);
    if (!obs) continue;
    const w = Number(sf.weight ?? 1);
    if (!Number.isFinite(w) || w <= 0) continue;
    for (let i = 0; i < settings.length; i++) logs[i] += w * logLikelihood(rf, sf, obs, settings[i]);
    used++;
  }
  const z = logSumExp(logs);
  return { posterior: logs.map(v => Math.exp(v - z)), used };
}
function analyzeBandAccuracy(settings, bands, featuresById, selectionFeatures, targetGames, simulationsPerSetting, seed, ctx) {
  const rng = mulberry32(seed + targetGames);
  const lowSet = new Set(bands.low), highSet = new Set(bands.high);
  const perSetting = {};
  let usedSum = 0, runs = 0;
  for (const trueSetting of [...bands.low, ...bands.high]) {
    let correct = 0;
    for (let r = 0; r < simulationsPerSetting; r++) {
      const { posterior, used } = posteriorForRun(settings, bands, featuresById, selectionFeatures, trueSetting, targetGames, rng, ctx);
      let lowP = 0, highP = 0;
      for (let i = 0; i < settings.length; i++) {
        if (lowSet.has(settings[i])) lowP += posterior[i];
        else if (highSet.has(settings[i])) highP += posterior[i];
      }
      const predicted = highP > lowP ? 'HIGH' : 'LOW';
      const actual = highSet.has(trueSetting) ? 'HIGH' : 'LOW';
      if (predicted === actual) correct++;
      usedSum += used;
      runs++;
    }
    perSetting[trueSetting] = correct / simulationsPerSetting;
  }
  const mean = xs => xs.reduce((a, b) => a + b, 0) / xs.length;
  const lowAccuracy = mean(bands.low.map(s => perSetting[s]));
  const highAccuracy = mean(bands.high.map(s => perSetting[s]));
  return {
    games: targetGames,
    lowAccuracy,
    highAccuracy,
    minimumBandAccuracy: Math.min(lowAccuracy, highAccuracy),
    perSettingAccuracy: perSetting,
    averageUsedFeatures: runs ? usedSum / runs : 0,
  };
}
function findThresholdGames(threshold, evaluator, options) {
  const { coarseStep, fineStep, maxGames } = options;
  let coarseHit = null;
  for (let g = coarseStep; g <= maxGames; g += coarseStep) {
    const result = evaluator(g);
    if (result.lowAccuracy >= threshold && result.highAccuracy >= threshold) {
      coarseHit = g;
      break;
    }
  }
  if (coarseHit == null) return { threshold, games: null, reachedWithinMaxGames: false };
  const start = Math.max(fineStep, coarseHit - coarseStep + fineStep);
  for (let g = start; g <= coarseHit; g += fineStep) {
    const result = evaluator(g);
    if (result.lowAccuracy >= threshold && result.highAccuracy >= threshold) {
      return {
        threshold,
        games: g,
        reachedWithinMaxGames: true,
        lowAccuracy: result.lowAccuracy,
        highAccuracy: result.highAccuracy,
        minimumBandAccuracy: result.minimumBandAccuracy,
      };
    }
  }
  return { threshold, games: coarseHit, reachedWithinMaxGames: true };
}

export function evaluateSettingBandGames(research, selection, options = {}) {
  const settings = Array.isArray(research.machine?.settings) ? research.machine.settings : [];
  const bands = splitSettingBands(settings);
  if (!bands.low.length || !bands.high.length) {
    return {
      analyzerVersion: 'setting-band-discrimination-g-v1.0',
      machineId: research.machine?.machineId ?? selection.machineId ?? null,
      status: 'NOT_APPLICABLE',
      reason: 'Both low (SET_1..SET_3) and high (SET_4+) setting bands are required.',
      bands,
    };
  }
  const featuresById = new Map((research.features ?? []).map(f => [f.researchFeatureId, f]));
  const selectionByFeatureId = new Map((selection.features ?? []).map(f => [f.featureId, f]));
  const adopted = (selection.features ?? []).filter(f =>
    ['INCLUDE_PRIMARY', 'INCLUDE_SUPPORT'].includes(f.adoptionCategory) &&
    f.difficultyParticipation !== 'EXCLUDE'
  );
  const allowedQualities = new Set(options.allowedExposureQualities ?? selection.difficultyAnalysis?.calibrationAllowedExposureQualities ?? DEFAULT_ALLOWED_QUALITIES);
  const ctx = { featuresById, selectionByFeatureId, allowedQualities };
  const exposureResolvable = sf => [...bands.low, ...bands.high].every(st => resolveExposureTrials(sf, st, 1000, ctx) != null);
  const analyzable = adopted.filter(sf => sf.difficultyExposure && featuresById.has(sf.researchFeatureId) && exposureResolvable(sf));
  const thresholds = options.thresholds ?? DEFAULT_THRESHOLDS;
  const simulationsPerSetting = options.simulationsPerSetting ?? selection.difficultyAnalysis?.simulationsPerSetting ?? DEFAULT_SIMULATIONS_PER_SETTING;
  const seed = options.seed ?? selection.difficultyAnalysis?.seed ?? DEFAULT_SEED;
  const coarseStep = options.coarseStep ?? DEFAULT_COARSE_STEP;
  const fineStep = options.fineStep ?? DEFAULT_FINE_STEP;
  const maxGames = options.maxGames ?? DEFAULT_MAX_GAMES;
  const cache = new Map();
  const evaluator = games => {
    if (!cache.has(games)) cache.set(games, analyzeBandAccuracy(settings, bands, featuresById, analyzable, games, simulationsPerSetting, seed, ctx));
    return cache.get(games);
  };
  const results = thresholds.map(t => findThresholdGames(t, evaluator, { coarseStep, fineStep, maxGames }));
  return {
    analyzerVersion: 'setting-band-discrimination-g-v1.0',
    machineId: research.machine?.machineId ?? selection.machineId ?? null,
    machineDataVersion: research.machine?.machineDataVersion ?? selection.machineDataVersion ?? null,
    status: analyzable.length ? 'COMPLETE' : 'NOT_APPLICABLE',
    definition: 'Low/high setting-band discrimination game count. Each result is the minimum game count where both low-band and high-band classification accuracy meet the threshold.',
    thresholds,
    bands: {
      low: bands.low,
      high: bands.high,
      ignored: bands.ignored,
      prior: { low: 0.5, high: 0.5, withinBand: 'uniform' },
      boundary: 'SET_4_OR_HIGHER_IS_HIGH',
    },
    evidenceIncluded: false,
    predecessorSnapshotIncluded: false,
    numericFeaturePolicy: 'Adopted numeric features with resolvable difficultyExposure only; same probability models and feature weights as inference/difficulty.',
    analyzableFeatureIds: analyzable.map(f => f.featureId),
    excludedAdoptedFeatureIds: adopted.filter(f => !analyzable.includes(f)).map(f => f.featureId),
    simulation: { simulationsPerSetting, seed, coarseStep, fineStep, maxGames },
    results,
  };
}
