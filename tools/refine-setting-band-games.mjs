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

const baseline = evaluateSettingBandGames(research, selection, {
  simulationsPerSetting: 4000,
  coarseStep: 500,
  fineStep: 100,
  maxGames: 100000,
});

if (baseline.status !== 'COMPLETE') {
  writeJson(outputPath, baseline);
  console.log(`Setting band refined report: ${outputPath}`);
  process.exit(0);
}

const refinedResults = [];
for (const base of baseline.results) {
  if (!base.reachedWithinMaxGames || base.games == null) {
    refinedResults.push(base);
    continue;
  }
  const threshold = base.threshold;
  const start = Math.max(100, base.games - 500);
  const end = Math.min(100000, base.games + 500);
  let chosen = null;
  for (let g = start; g <= end; g += 100) {
    const exact = evaluateSettingBandGames(research, selection, {
      thresholds: [threshold],
      simulationsPerSetting: 16000,
      coarseStep: g,
      fineStep: g,
      maxGames: g,
      seed: 20260820,
    });
    const point = exact.results[0];
    if (point?.reachedWithinMaxGames && point.games === g && point.lowAccuracy >= threshold && point.highAccuracy >= threshold) {
      chosen = point;
      break;
    }
  }
  refinedResults.push(chosen ?? base);
}

const refined = {
  ...baseline,
  analyzerVersion: 'setting-band-discrimination-g-v1.0-refined',
  simulation: {
    ...baseline.simulation,
    refinementSimulationsPerSetting: 16000,
    refinementWindowGames: 500,
    refinementStep: 100,
  },
  results: refinedResults,
};

writeJson(outputPath, refined);
console.log(`Setting band refined report: ${outputPath}`);
