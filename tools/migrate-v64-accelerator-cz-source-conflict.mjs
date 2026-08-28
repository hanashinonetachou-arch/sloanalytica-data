#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const MACHINE_ID = 'L_TOARU_ACCELERATOR_RZ';
const SET3_DUAL_DENOMINATOR = 1182.1;
const SET3_DUAL_PROBABILITY = 1 / SET3_DUAL_DENOMINATOR;
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const write = (p, v) => fs.writeFileSync(p, JSON.stringify(v, null, 2) + '\n');
const arr = v => Array.isArray(v) ? v : [];

export function migrate(root = process.cwd(), { apply = false } = {}) {
  const researchPath = path.join(root, 'research', MACHINE_ID, 'research-data.json');
  const research = read(researchPath);
  const dual = arr(research.features).find(f => f.researchFeatureId === 'RF_CZ_DUAL');
  const outcome = arr(research.features).find(f => f.researchFeatureId === 'RF_CZ_OUTCOME');
  const total = arr(research.features).find(f => f.researchFeatureId === 'RF_CZ_TOTAL');
  if (!dual || !outcome || !total) throw new Error('required Accelerator CZ Research features missing');

  if (!arr(research.sources).some(s => s.sourceId === 'SRC_1GEKI_CZ')) {
    research.sources.push({
      sourceId: 'SRC_1GEKI_CZ',
      publisher: '一撃',
      title: 'アクセラレータ（スマスロ）設定差・設定判別要素まとめ',
      url: 'https://1geki.jp/slot/l_accelerator/0/',
      checkedAt: '2026-08-29',
      sourceType: 'major_analysis'
    });
  }

  dual.settingValues.SET_3 = {
    probability: SET3_DUAL_PROBABILITY,
    rawDisplay: '1/1182.1'
  };
  dual.sourceRefs = [...new Set([...(dual.sourceRefs ?? []), 'SRC_1GEKI_CZ'])];
  dual.crossSourceStatus = 'resolved_by_internal_consistency';
  dual.notes = 'なな徹は設定3を1/1058.9、一撃は1/1182.1と掲載。設定3の3種類CZ確率の和を公開CZ合算1/134.1と照合すると1/1182.1が整合するため、Selection候補値は1/1182.1へ解決。公開ソース競合はconflictsに保持。';

  outcome.settingDistributions.SET_3.DUAL_CZ = SET3_DUAL_PROBABILITY;
  outcome.sourceRefs = [...new Set([...(outcome.sourceRefs ?? []), 'SRC_1GEKI_CZ'])];
  outcome.crossSourceStatus = 'derived_from_resolved_components';
  outcome.notes = 'CZ合算および種類別binomialと二重評価しない。残余カテゴリはCZ非当選。設定3 DUAL_CZは公開ソース競合をCZ合算との内部整合性で1/1182.1へ解決。';

  research.conflicts ??= [];
  const conflictId = 'CONFLICT_CZ_DUAL_SET3';
  const conflict = {
    conflictId,
    subject: 'RF_CZ_DUAL SET_3 一方通行＆打ち止めCZ確率',
    status: 'RESOLVED',
    sourceRefs: ['SRC_NANA', 'SRC_1GEKI_CZ'],
    candidates: [
      { sourceRef: 'SRC_NANA', rawDisplay: '1/1058.9' },
      { sourceRef: 'SRC_1GEKI_CZ', rawDisplay: '1/1182.1' }
    ],
    resolution: '1/1182.1',
    rationale: '設定3の一方通行CZ 1/159.6、打ち止めCZ 1/2892.9、DUAL 1/1182.1 の確率和がCZ合算1/134.1と丸め誤差内で一致する。1/1058.9では合算値と明確に不整合。'
  };
  const idx = research.conflicts.findIndex(c => c.conflictId === conflictId);
  if (idx >= 0) research.conflicts[idx] = conflict;
  else research.conflicts.push(conflict);

  const componentSum = 1 / 159.6 + 1 / 2892.9 + SET3_DUAL_PROBABILITY;
  const totalP = Number(total.settingValues?.SET_3?.probability);
  if (!Number.isFinite(totalP) || Math.abs(componentSum - totalP) > 0.000001) {
    throw new Error(`SET_3 CZ component sum mismatch after resolution: components=${componentSum} total=${totalP}`);
  }

  if (apply) write(researchPath, research);
  return { componentSum, totalP, difference: Math.abs(componentSum - totalP) };
}

const root = path.resolve(process.argv[2] ?? '.');
const apply = process.argv.includes('--apply');
if (apply) {
  const result = migrate(root, { apply: true });
  console.log(`APPLIED ${MACHINE_ID}: diff=${result.difference}`);
} else {
  const tmp = fs.mkdtempSync(path.join(process.env.RUNNER_TEMP ?? process.env.TMPDIR ?? '/tmp', 'slo-v64-accelerator-cz-'));
  fs.cpSync(root, tmp, { recursive: true, filter: src => !src.includes(`${path.sep}.git${path.sep}`) });
  const result = migrate(tmp, { apply: true });
  console.log(`DRY-RUN PASS ${MACHINE_ID}: diff=${result.difference}`);
}
