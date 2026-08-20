import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateSettingBandGames } from '../tools/evaluate-setting-band-games.mjs';

function baseResearch(settings, probabilities) {
  return {
    machine: { machineId: 'TEST_MACHINE', machineDataVersion: '0.0.1', settings },
    features: [{
      researchFeatureId: 'RF_MAIN',
      name: 'main',
      candidateModel: 'binomial',
      settingValues: Object.fromEntries(settings.map(s => [s, { probability: probabilities[s] }])),
    }],
  };
}
function baseSelection(extraFeatures = []) {
  return {
    machineId: 'TEST_MACHINE',
    machineDataVersion: '0.0.1',
    difficultyAnalysis: { seed: 12345, simulationsPerSetting: 800 },
    features: [{
      researchFeatureId: 'RF_MAIN',
      featureId: 'FEAT_MAIN',
      adoptionCategory: 'INCLUDE_PRIMARY',
      weight: 1,
      difficultyParticipation: 'INCLUDE',
      difficultyExposure: { mode: 'per_game', factor: 1, quality: 'EXACT', basisId: 'GAMES' },
    }, ...extraFeatures],
  };
}

test('SET_4以上を高設定帯として分割し、帯事前確率を50:50に固定する', () => {
  const settings = ['SET_1', 'SET_2', 'SET_4', 'SET_5', 'SET_6', 'SET_L'];
  const research = baseResearch(settings, {
    SET_1: 0.1, SET_2: 0.1, SET_4: 0.2, SET_5: 0.2, SET_6: 0.2, SET_L: 0.1,
  });
  const result = evaluateSettingBandGames(research, baseSelection(), {
    thresholds: [0.6], simulationsPerSetting: 200, coarseStep: 100, fineStep: 100, maxGames: 1000,
  });
  assert.deepEqual(result.bands.low, ['SET_1', 'SET_2']);
  assert.deepEqual(result.bands.high, ['SET_4', 'SET_5', 'SET_6']);
  assert.deepEqual(result.bands.ignored, ['SET_L']);
  assert.deepEqual(result.bands.prior, { low: 0.5, high: 0.5, withinBand: 'uniform' });
});

test('設定確定系相当・着席時相当のdifficultyParticipation=EXCLUDEは設定帯判別Gから除外する', () => {
  const settings = ['SET_1', 'SET_2', 'SET_4', 'SET_5', 'SET_6'];
  const research = baseResearch(settings, {
    SET_1: 0.1, SET_2: 0.1, SET_4: 0.2, SET_5: 0.2, SET_6: 0.2,
  });
  research.features.push({
    researchFeatureId: 'RF_PREDECESSOR', name: 'predecessor', candidateModel: 'binomial',
    settingValues: Object.fromEntries(settings.map(s => [s, { probability: s === 'SET_1' ? 0.01 : 0.99 }])),
  });
  const selection = baseSelection([{
    researchFeatureId: 'RF_PREDECESSOR', featureId: 'FEAT_PREDECESSOR', adoptionCategory: 'INCLUDE_SUPPORT',
    weight: 1, difficultyParticipation: 'EXCLUDE',
    difficultyExposure: { mode: 'per_game', factor: 1, quality: 'EXACT', basisId: 'GAMES' },
  }]);
  const result = evaluateSettingBandGames(research, selection, {
    thresholds: [0.6], simulationsPerSetting: 200, coarseStep: 100, fineStep: 100, maxGames: 1000,
  });
  assert.deepEqual(result.analyzableFeatureIds, ['FEAT_MAIN']);
  assert.ok(!result.analyzableFeatureIds.includes('FEAT_PREDECESSOR'));
});

test('閾値は低設定帯・高設定帯の双方が到達した最小Gとする', () => {
  const settings = ['SET_1', 'SET_2', 'SET_3', 'SET_4', 'SET_5', 'SET_6'];
  const research = baseResearch(settings, {
    SET_1: 0.10, SET_2: 0.11, SET_3: 0.12,
    SET_4: 0.18, SET_5: 0.19, SET_6: 0.20,
  });
  const result = evaluateSettingBandGames(research, baseSelection(), {
    thresholds: [0.6, 0.7, 0.8], simulationsPerSetting: 1000,
    coarseStep: 500, fineStep: 100, maxGames: 10000,
  });
  assert.equal(result.status, 'COMPLETE');
  const reached = result.results.filter(r => r.games != null);
  assert.ok(reached.length >= 2);
  for (const r of reached) {
    assert.ok(r.lowAccuracy >= r.threshold);
    assert.ok(r.highAccuracy >= r.threshold);
    assert.ok(r.minimumBandAccuracy >= r.threshold);
    assert.equal(r.games % 100, 0);
  }
  for (let i = 1; i < reached.length; i++) assert.ok(reached[i].games >= reached[i - 1].games);
});
