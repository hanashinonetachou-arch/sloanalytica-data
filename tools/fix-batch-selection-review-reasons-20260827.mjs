import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const fixes = {
  L_INUYASHA2_FK: {
    researchFeatureId: 'RF_AT_INITIAL',
    userReason: 'AT初当りはユーザー自身の通常ゲーム数を分母として直接観測でき、CZ初当り・CZ回数別天井選択・レア小役など同一遊技過程の上流情報と二重評価せずに扱えるため、代表Featureとして採用します。',
  },
  S_MILKY_HOMES_GNB: {
    researchFeatureId: 'RF_WEAK_WATER',
    userReason: '弱スイカはユーザー自身の通常ゲーム数を分母として直接観測でき、全設定の公開確率が揃ったうえで特に設定6と他設定の設定差が大きいため、独立した数値Featureとして採用します。',
  },
};

for (const [machineId, fix] of Object.entries(fixes)) {
  const file = path.join(ROOT, 'research', machineId, 'selection-data.json');
  const selection = JSON.parse(fs.readFileSync(file, 'utf8'));
  const feature = (selection.features ?? []).find(item => item.researchFeatureId === fix.researchFeatureId);
  if (!feature) throw new Error(`${machineId}: ${fix.researchFeatureId} not found`);
  feature.userReason = fix.userReason;
  fs.writeFileSync(file, JSON.stringify(selection, null, 2) + '\n', 'utf8');
  console.log(`UPDATED ${machineId}: ${fix.researchFeatureId}`);
}
