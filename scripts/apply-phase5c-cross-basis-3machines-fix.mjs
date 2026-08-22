import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const targets = {
  L_BIOHAZARD_VENDETTA_FK: 'FEAT_WEAK_RARE_COMBINED',
  L_HOKUTO_AD_XR: 'FEAT_WATERMELON_COMBINED',
  L_SAO_B2: 'FEAT_COMMON_BELL'
};
const reason = '専用の実機連動／小役集計ゲーム数は推測計算の正しい分母として利用できるが、設定帯判別Gの基準である通常ゲーム数との1:1対応を公開情報から保証できないため、ゲーム数ベースDifficultyから除外。推測計算には採用する。';

for (const [machineId, featureId] of Object.entries(targets)) {
  const p = path.join(root, 'research', machineId, 'selection-data.json');
  const s = JSON.parse(fs.readFileSync(p, 'utf8'));
  const f = (s.features ?? []).find(x => x.featureId === featureId);
  if (!f) throw new Error(`${machineId}: missing ${featureId}`);
  if (f.difficultyParticipation !== 'INCLUDE') throw new Error(`${machineId}/${featureId}: expected Difficulty INCLUDE`);
  f.difficultyParticipation = 'EXCLUDE';
  f.difficultyExclusionReason = reason;
  delete f.difficultyExposure;
  fs.writeFileSync(p, JSON.stringify(s, null, 2) + '\n');
  console.log(`Updated ${machineId}: ${featureId}`);
}
console.log('Applied Phase 5c cross-basis corrections to 3 Features.');
