import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const targets = {
  L_BASILISK_KIZUNA2_TENZEN_ZN: 'FEAT_WEAK_CHERRY',
  L_BIOHAZARD_VILLAGE_XA: 'FEAT_WEAK_CHERRY',
  L_HIGURASHI_GOU_SS: 'FEAT_WATERMELON',
  L_MADOKA_FORTE_UU: 'FEAT_WEAK_CHERRY',
  L_MAGICAL_HALLOWEEN8_FE: 'FEAT_COMMON_COIN',
  L_SAEKANO_SA3: 'FEAT_WATERMELON',
  L_SKY_LOVE_GNB: 'FEAT_WEAK_CHERRY',
  L_YOSHIMUNE_RISING_SA2: 'FEAT_COMMON_BELL'
};

const reason = '専用の小役集計ゲーム数と設定帯判別Gの対応率を公開情報から一意に導出できないため、ゲーム数ベースDifficultyから除外。推測計算には採用する。';

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

console.log(`Applied Phase 5 cross-basis fixes to ${Object.keys(targets).length} Features.`);
