import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { auditRepository } from '../tools/audit-public-data.mjs';
import { buildMachineData } from '../tools/build-machine-data.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SETTING_L_MACHINES = [
  ['S_BOOWY_SV', ['SET_1', 'SET_2', 'SET_4', 'SET_5', 'SET_6']],
  ['S_BIG_SHIMAUTA_E2_30', ['SET_1', 'SET_2', 'SET_3', 'SET_5', 'SET_6']],
  ['S_WARAU4_KH', ['SET_1', 'SET_2', 'SET_4', 'SET_5', 'SET_6']],
];

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

test('setting L machines retain SET_L for identity but exclude it from numeric inference', () => {
  for (const [machineId, expectedInferenceSettings] of SETTING_L_MACHINES) {
    const research = readJson(path.join(ROOT, 'research', machineId, 'research-data.json'));
    const selection = readJson(path.join(ROOT, 'research', machineId, 'selection-data.json'));
    const pkg = buildMachineData(research, selection);

    assert.ok(pkg.machine.settings.includes('SET_L'), `${machineId}: SET_L must remain in machine.settings`);
    assert.deepEqual(pkg.machine.inferenceSettings, expectedInferenceSettings, `${machineId}: inferenceSettings mismatch`);
    assert.ok(!pkg.machine.inferenceSettings.includes('SET_L'), `${machineId}: SET_L must not be a numeric inference hypothesis`);

    for (const feature of pkg.features.features) {
      if (feature.calculationRole === 'DISPLAY_ONLY') continue;
      const map = feature.modelType === 'multinomial' || feature.modelType === 'conditional_partial_multinomial'
        ? feature.categoryProbabilities
        : feature.probabilities;
      if (!map) continue;
      assert.equal(Object.hasOwn(map, 'SET_L'), false, `${machineId}/${feature.featureId}: SET_L probability must not be synthesized`);
      for (const setting of expectedInferenceSettings) {
        assert.ok(Object.hasOwn(map, setting), `${machineId}/${feature.featureId}: missing ${setting}`);
      }
    }
  }
});

test('public-data audit accepts SET_L identity when inferenceSettings excludes SET_L', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sloanalytica-setting-l-'));
  try {
    const packagePath = path.join(root, 'machines', 'TEST_SETTING_L', 'machine-package.json');
    fs.mkdirSync(path.dirname(packagePath), { recursive: true });
    const pkg = {
      machine: {
        machineId: 'TEST_SETTING_L',
        machineDataVersion: '1.0.0',
        settings: ['SET_1', 'SET_6', 'SET_L'],
        inferenceSettings: ['SET_1', 'SET_6'],
      },
      inputs: { inputs: [{ id: 'INP_GAMES' }, { id: 'INP_HITS' }] },
      features: { features: [{
        featureId: 'FEAT_BINOMIAL',
        modelType: 'binomial',
        calculationRole: 'PROBABILITY',
        probabilityEngineUsage: true,
        numeratorInputId: 'INP_HITS',
        denominatorInputId: 'INP_GAMES',
        probabilities: { SET_1: 0.1, SET_6: 0.2 },
      }] },
      evidence: { evidences: [] },
      ui: { sections: [{ items: [{ type: 'input', inputId: 'INP_GAMES' }] }] },
    };
    const bytes = Buffer.from(JSON.stringify(pkg));
    fs.writeFileSync(packagePath, bytes);
    fs.writeFileSync(path.join(root, 'catalog.json'), JSON.stringify({
      generatedAt: '2026-08-31T00:00:00Z',
      machines: [{
        machineId: 'TEST_SETTING_L',
        displayName: 'Test Setting L',
        manufacturer: 'Test',
        machineDataVersion: '1.0.0',
        packageUrl: 'https://example.test/machine-package.json',
        sha256: crypto.createHash('sha256').update(bytes).digest('hex'),
        packageSizeBytes: bytes.length,
        status: 'available',
        requiredCapabilities: ['binomial'],
      }],
    }));

    const result = auditRepository(root);
    assert.equal(result.errors.length, 0, result.errors.map(error => error.message).join('\n'));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
