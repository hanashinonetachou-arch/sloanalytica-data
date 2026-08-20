import fs from 'node:fs';
import { evaluateSettingBandGames } from './evaluate-setting-band-games.mjs';

function readJson(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }
function writeJson(p, value) { fs.writeFileSync(p, JSON.stringify(value, null, 2) + '\n'); }

const [researchPath, selectionPath, outputPath] = process.argv.slice(2);
if (!researchPath || !selectionPath || !outputPath) {
  console.error('Usage: node tools/refine-setting-band-games.mjs <research.json> <selection.json> <output.json>');
  process.exit(1);
}

const research = readJson(researchPath);
const selection = readJson(selectionPath);

const THRESHOLDS = [0.6, 0.7, 0.8];
const START_GAMES = 500;
const DISPLAY_STEP = 100;
const COARSE_SIMS = 4000;
const REFINE_SIMS = 16000;
const SEED = 20260820;
// Safety guard only. User-facing values are never capped or rounded down to this value.
// 100,000,000G is intentionally far beyond any realistic play volume while preventing an infinite loop
// for a mathematically non-separable low/high model.
const SAFETY_MAX_GAMES = 100_000_000;

function evaluatePoint(threshold, games, simulationsPerSetting) {
  const report = evaluateSettingBandGames(research, selection, {
    thresholds: [threshold],
    simulationsPerSetting,
    coarseStep: games,
    fineStep: games,
    maxGames: games,
    seed: SEED,
  });
  const point = report.results?.[0] ?? null;
  return {
    report,
    point,
    passes: Boolean(point?.reachedWithinMaxGames && point.games === games && point.lowAccuracy >= threshold && point.highAccuracy >= threshold),
  };
}

function roundUp100(games) {
  return Math.max(DISPLAY_STEP, Math.ceil(games / DISPLAY_STEP) * DISPLAY_STEP);
}

// Stage 1: exponential search. Cost grows logarithmically even if a threshold is extremely far away.
function findExponentialBracket(threshold) {
  let lowFail = 0;
  let high = START_GAMES;
  while (high <= SAFETY_MAX_GAMES) {
    const result = evaluatePoint(threshold, high, COARSE_SIMS);
    if (result.passes) return { lowFail, highPass: high };
    lowFail = high;
    high *= 2;
  }
  return null;
}

// Stage 2: coarse binary narrowing with the inexpensive simulation count.
// We only need to narrow the bracket to about 1,000G before the expensive local scan.
function narrowBracket(threshold, bracket) {
  let lowFail = bracket.lowFail;
  let highPass = bracket.highPass;
  while (highPass - lowFail > 1000) {
    const mid = roundUp100((lowFail + highPass) / 2);
    if (mid >= highPass) break;
    const result = evaluatePoint(threshold, mid, COARSE_SIMS);
    if (result.passes) highPass = mid;
    else lowFail = mid;
  }
  return { lowFail, highPass };
}

// Stage 3: high-precision local scan only around the narrowed threshold.
// Because Monte Carlo results can fluctuate slightly, include one extra 500G margin below the coarse fail point.
function refineThreshold(threshold, bracket) {
  const start = roundUp100(Math.max(DISPLAY_STEP, bracket.lowFail - 500));
  const end = roundUp100(bracket.highPass + 500);
  for (let g = start; g <= end; g += DISPLAY_STEP) {
    const result = evaluatePoint(threshold, g, REFINE_SIMS);
    if (result.passes) return result.point;
  }

  // Rare fallback: if higher precision moved the crossing outside the local window,
  // continue exponentially from the end, then narrow and scan that new bracket.
  let lowFail = end;
  let high = end * 2;
  while (high <= SAFETY_MAX_GAMES) {
    const highResult = evaluatePoint(threshold, high, COARSE_SIMS);
    if (highResult.passes) {
      const narrowed = narrowBracket(threshold, { lowFail, highPass: high });
      const localStart = roundUp100(Math.max(DISPLAY_STEP, narrowed.lowFail - 500));
      const localEnd = roundUp100(narrowed.highPass + 500);
      for (let g = localStart; g <= localEnd; g += DISPLAY_STEP) {
        const exact = evaluatePoint(threshold, g, REFINE_SIMS);
        if (exact.passes) return exact.point;
      }
      lowFail = localEnd;
      high = localEnd * 2;
      continue;
    }
    lowFail = high;
    high *= 2;
  }
  return null;
}

const metadata = evaluateSettingBandGames(research, selection, {
  thresholds: [0.6],
  simulationsPerSetting: COARSE_SIMS,
  coarseStep: START_GAMES,
  fineStep: DISPLAY_STEP,
  maxGames: START_GAMES,
  seed: SEED,
});

if (metadata.status !== 'COMPLETE') {
  writeJson(outputPath, metadata);
  console.log(`Setting band refined report: ${outputPath}`);
  process.exit(0);
}

const results = THRESHOLDS.map(threshold => {
  const bracket = findExponentialBracket(threshold);
  if (!bracket) {
    return {
      threshold,
      games: null,
      reachedWithinSafetyLimit: false,
      safetyMaxGames: SAFETY_MAX_GAMES,
    };
  }
  const narrowed = narrowBracket(threshold, bracket);
  const point = refineThreshold(threshold, narrowed);
  if (!point) {
    return {
      threshold,
      games: null,
      reachedWithinSafetyLimit: false,
      safetyMaxGames: SAFETY_MAX_GAMES,
    };
  }
  return {
    threshold,
    games: point.games,
    reachedWithinSafetyLimit: true,
    lowAccuracy: point.lowAccuracy,
    highAccuracy: point.highAccuracy,
    minimumBandAccuracy: point.minimumBandAccuracy,
  };
});

const refined = {
  ...metadata,
  analyzerVersion: 'setting-band-discrimination-g-v1.0-refined',
  thresholds: THRESHOLDS,
  definition: 'Low/high setting-band discrimination game count. Exponential search locates the crossing efficiently; each displayed result is the first 100G point confirmed at high precision where both bands meet the target accuracy.',
  simulation: {
    coarseSimulationsPerSetting: COARSE_SIMS,
    refinementSimulationsPerSetting: REFINE_SIMS,
    seed: SEED,
    search: 'exponential_then_binary_then_local_100G_scan',
    startGames: START_GAMES,
    displayStep: DISPLAY_STEP,
    safetyMaxGames: SAFETY_MAX_GAMES,
    userFacingCap: null,
  },
  results,
};

writeJson(outputPath, refined);
console.log(`Setting band refined report: ${outputPath}`);
