import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { evaluateMachineDifficulty } from './evaluate-machine-difficulty.mjs';

const root = process.cwd();
const machineId = 'L_MAGIA_RECORD_RN';
const researchDir = path.join(root, 'research', machineId);
const researchPath = path.join(researchDir, 'research-data.json');
const selectionPath = path.join(researchDir, 'selection-data.json');
const reportPath = path.join(researchDir, 'difficulty-report.json');

const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const writeJson = (p, v) => fs.writeFileSync(p, JSON.stringify(v, null, 2) + '\n');

const research = readJson(researchPath);
const selection = readJson(selectionPath);

selection.difficultyAnalysis = {
  targetGames: [1500, 3000, 7000],
  targetGameBasis: {
    basisId: 'TOTAL_PLAY_GAMES',
    label: '全状態の総プレイゲーム数',
    quality: 'EXACT',
    crossMachineComparable: true
  },
  calibrationAllowedExposureQualities: ['EXACT', 'DERIVED', 'ESTIMATED'],
  simulationsPerSetting: 4000,
  seed: 20260812
};

const byId = new Map(selection.features.map((f) => [f.featureId, f]));
const weakCherry = byId.get('FEAT_WEAK_CHERRY');
const atFirstHit = byId.get('FEAT_AT_FIRST_HIT');
const episode = byId.get('FEAT_EPISODE_BONUS_TYPE');

assert.ok(weakCherry, 'FEAT_WEAK_CHERRY missing');
assert.ok(atFirstHit, 'FEAT_AT_FIRST_HIT missing');
assert.ok(episode, 'FEAT_EPISODE_BONUS_TYPE missing');

// Real-device verification established that weak-cherry trials use the linked
// service's TOTAL play games, including normal/AT/etc. Therefore a target of
// N play games maps exactly to N weak-cherry trials without any latent-state or
// state-mix assumption.
delete weakCherry.difficultyParticipation;
delete weakCherry.difficultyExclusionReason;
weakCherry.difficultyExposure = {
  mode: 'per_game',
  factor: 1,
  quality: 'EXACT',
  confidence: 'HIGH',
  basisId: 'TOTAL_PLAY_GAMES'
};

// Keep AT first hit out of game-based calibration. Its denominator is effective
// normal games, and no justified conversion from total play games is available.
atFirstHit.difficultyParticipation = 'EXCLUDE';
atFirstHit.difficultyExclusionReason = 'Difficultyの基準Gは全状態の総プレイG数だが、AT初当りの分母は有効通常ゲーム数。総プレイG→有効通常Gの根拠ある変換率がないためDifficultyでは除外する。';
delete atFirstHit.difficultyExposure;

// Episode-bonus type is observable, but the number of eligible selection trials
// per total play game is not established. Do not invent an event exposure rate.
episode.difficultyParticipation = 'EXCLUDE';
episode.difficultyExclusionReason = '通常抽選エピソードの選択試行回数を総プレイG数から導く根拠ある発生率がないため、Difficultyでは試行回数を仮定せず除外する。';
delete episode.difficultyExposure;

writeJson(selectionPath, selection);

const report = evaluateMachineDifficulty(research, selection);
assert.equal(report.status, 'COMPLETE');
assert.equal(report.coverage.inferenceNumericFeatureCount, 3);
assert.equal(report.coverage.includedNumericFeatureCount, 1);
assert.equal(report.coverage.explicitlyExcludedNumericFeatureCount, 2);
assert.equal(report.coverage.analyzableFeatureCount, 1);
assert.deepEqual(report.targets.map((x) => x.games), [1500, 3000, 7000]);
assert.ok(report.targets.every((x) => Number.isInteger(x.score) && x.score >= 0 && x.score <= 100));
assert.equal(report.targetGameBasis?.basisId, 'TOTAL_PLAY_GAMES');
assert.equal(report.scoreConfidence?.level, 'HIGH');
assert.deepEqual(report.coverage.missingDifficultyExposureFeatureIds, []);
assert.deepEqual(report.coverage.blockedDifficultyExposureFeatures, []);

writeJson(reportPath, report);
console.log(JSON.stringify({
  machineId,
  status: report.status,
  scoreConfidence: report.scoreConfidence,
  coverage: report.coverage,
  targets: report.targets.map(({ games, score, simulation }) => ({ games, score, averageUsedFeatures: simulation.averageUsedFeatures }))
}, null, 2));