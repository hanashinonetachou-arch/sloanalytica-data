import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { normalizeMachineIds, shouldEnforceSelectionQuality, shouldSurfaceResearchWarning, shouldSurfaceResearchConflict, classifyMachineQuality, deriveOverallStatus, generatedPaths } from '../tools/batch-machine-pipeline.mjs';

test('batch normalizes unique machine IDs', () => {
  assert.deepEqual(normalizeMachineIds(['A_ONE,B_TWO', 'A_ONE', 'C_THREE']), ['A_ONE', 'B_TWO', 'C_THREE']);
});

test('batch rejects invalid machine IDs', () => {
  assert.throws(() => normalizeMachineIds(['bad-id']), /invalid machineId/);
});

test('batch enforces 10-machine safety limit', () => {
  assert.throws(() => normalizeMachineIds(Array.from({ length: 11 }, (_, i) => `M_${i}`)), /batch size exceeds 10/);
});

test('batch rollback snapshot includes machine registry and generated reports', () => {
  const paths = generatedPaths(['A_ONE']).map(p => p.replaceAll('\\', '/'));
  assert.ok(paths.some(p => p.endsWith('/machine-registry.json')));
  assert.ok(paths.some(p => p.endsWith('/research/A_ONE/statistics-report.json')));
  assert.ok(paths.some(p => p.endsWith('/research/A_ONE/difficulty-report.json')));
  assert.ok(paths.some(p => p.endsWith('/research/A_ONE/setting-band-report.json')));
  assert.ok(paths.some(p => p.endsWith('/machines/A_ONE/machine-package.json')));
});

test('selection quality is mandatory for new machines and calibrated machines, but legacy packages remain compatible', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sloanalytica-quality-phase-'));
  try {
    assert.equal(shouldEnforceSelectionQuality('NEW_MACHINE', root), true);
    const legacyPackage = path.join(root, 'machines', 'LEGACY_MACHINE', 'machine-package.json');
    fs.mkdirSync(path.dirname(legacyPackage), { recursive: true });
    fs.writeFileSync(legacyPackage, '{}\n');
    assert.equal(shouldEnforceSelectionQuality('LEGACY_MACHINE', root), false);
    assert.equal(shouldEnforceSelectionQuality('S_GRANBELM_ZX', root), true);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('clean validations and selection quality classify PASS', () => {
  assert.deepEqual(classifyMachineQuality({
    researchValidation: { status: 'PASS', warnings: [] },
    selectionValidation: { ok: true, warnings: [] },
    selectionQuality: { status: 'PASS', blockers: [], reviews: [] },
    research: { machine: { displayName: 'Machine' }, conflicts: [] },
  }), { status: 'PASS', reasons: [] });
});

test('selection quality blocker classifies BLOCKED before generation', () => {
  const result = classifyMachineQuality({
    researchValidation: { status: 'PASS', warnings: [] },
    selectionValidation: { ok: true, warnings: [] },
    selectionQuality: { status: 'BLOCKED', blockers: ['unclassified research feature: RF_X'], reviews: [] },
    research: { machine: { displayName: 'Machine' }, conflicts: [] },
  });
  assert.equal(result.status, 'BLOCKED');
  assert.deepEqual(result.reasons, ['Selection quality: unclassified research feature: RF_X']);
});

test('selection quality review classifies REVIEW', () => {
  const result = classifyMachineQuality({
    researchValidation: { status: 'PASS', warnings: [] },
    selectionValidation: { ok: true, warnings: [] },
    selectionQuality: { status: 'REVIEW', blockers: [], reviews: ['selected FEAT_X: reason is too generic'] },
    research: { machine: { displayName: 'Machine' }, conflicts: [] },
  });
  assert.equal(result.status, 'REVIEW');
  assert.ok(result.reasons.includes('Selection quality: selected FEAT_X: reason is too generic'));
});

test('warnings or provisional naming classify REVIEW', () => {
  const result = classifyMachineQuality({
    researchValidation: { status: 'PASS', warnings: [{ message: 'check source' }] },
    selectionValidation: { ok: true, warnings: [] },
    selectionQuality: { status: 'PASS', blockers: [], reviews: [] },
    research: { machine: { displayName: 'Machine（暫定版）' }, conflicts: [] },
  });
  assert.equal(result.status, 'REVIEW');
  assert.equal(result.reasons.length, 2);
});

test('rounded multinomial warning is resolved when Selection excludes the feature', () => {
  const warning={ code:'MULTINOMIAL_ROUNDED_SUM', message:'Feature RF_ROUNDED / SET_1 の公開カテゴリ確率は丸めにより合計が1.001です。' };
  const selection={ features:[{ researchFeatureId:'RF_ROUNDED', adoptionCategory:'EXCLUDE' }] };
  assert.equal(shouldSurfaceResearchWarning(warning,selection),false);
  assert.equal(classifyMachineQuality({
    researchValidation:{status:'PASS',warnings:[warning]}, selectionValidation:{ok:true,warnings:[]},
    selectionQuality:{status:'PASS',blockers:[],reviews:[]}, research:{machine:{displayName:'Machine'},conflicts:[]}, selection
  }).status,'PASS');
});

test('rounded multinomial warning is resolved by explicit bounded Selection normalization', () => {
  const warning={ code:'MULTINOMIAL_ROUNDED_SUM', message:'Feature RF_ROUNDED / SET_4 の公開カテゴリ確率は丸めにより合計が1.001です。' };
  const selection={ features:[{ researchFeatureId:'RF_ROUNDED', adoptionCategory:'INCLUDE_SUPPORT', normalizeRoundedCategoryProbabilities:true }] };
  assert.equal(shouldSurfaceResearchWarning(warning,selection),false);
  assert.equal(classifyMachineQuality({
    researchValidation:{status:'PASS',warnings:[warning]}, selectionValidation:{ok:true,warnings:[]},
    selectionQuality:{status:'PASS',blockers:[],reviews:[]}, research:{machine:{displayName:'Machine'},conflicts:[]}, selection
  }).status,'PASS');
});

test('unresolved selected rounded multinomial warning remains REVIEW', () => {
  const warning={ code:'MULTINOMIAL_ROUNDED_SUM', message:'Feature RF_ROUNDED / SET_4 の公開カテゴリ確率は丸めにより合計が1.001です。' };
  const selection={ features:[{ researchFeatureId:'RF_ROUNDED', adoptionCategory:'INCLUDE_SUPPORT' }] };
  assert.equal(shouldSurfaceResearchWarning(warning,selection),true);
  assert.equal(classifyMachineQuality({
    researchValidation:{status:'PASS',warnings:[warning]}, selectionValidation:{ok:true,warnings:[]},
    selectionQuality:{status:'PASS',blockers:[],reviews:[]}, research:{machine:{displayName:'Machine'},conflicts:[]}, selection
  }).status,'REVIEW');
});

test('research conflict with explicit resolution is not surfaced as REVIEW', () => {
  const conflict={ conflictId:'CF_RESOLVED', resolution:'Use value supported by multiple primary sources; retain minority discrepancy.' };
  assert.equal(shouldSurfaceResearchConflict(conflict),false);
  assert.equal(classifyMachineQuality({
    researchValidation:{status:'PASS',warnings:[]}, selectionValidation:{ok:true,warnings:[]},
    selectionQuality:{status:'PASS',blockers:[],reviews:[]}, research:{machine:{displayName:'Machine'},conflicts:[conflict]}, selection:{features:[]}
  }).status,'PASS');
});

test('research conflict without resolution remains REVIEW', () => {
  const conflict={ conflictId:'CF_OPEN' };
  assert.equal(shouldSurfaceResearchConflict(conflict),true);
  assert.equal(classifyMachineQuality({
    researchValidation:{status:'PASS',warnings:[]}, selectionValidation:{ok:true,warnings:[]},
    selectionQuality:{status:'PASS',blockers:[],reviews:[]}, research:{machine:{displayName:'Machine'},conflicts:[conflict]}, selection:{features:[]}
  }).status,'REVIEW');
});

test('validation failure classifies BLOCKED', () => {
  assert.equal(classifyMachineQuality({
    researchValidation: { status: 'FAIL', warnings: [] },
    selectionValidation: { ok: true, warnings: [] },
    selectionQuality: { status: 'PASS', blockers: [], reviews: [] },
    research: {},
  }).status, 'BLOCKED');
});

test('overall status prioritizes repository failure and BLOCKED over REVIEW', () => {
  assert.equal(deriveOverallStatus([{ status: 'PASS' }], false), 'BLOCKED');
  assert.equal(deriveOverallStatus([{ status: 'REVIEW' }, { status: 'BLOCKED' }], true), 'BLOCKED');
  assert.equal(deriveOverallStatus([{ status: 'PASS' }, { status: 'REVIEW' }], true), 'REVIEW');
  assert.equal(deriveOverallStatus([{ status: 'PASS' }], true), 'PASS');
});
