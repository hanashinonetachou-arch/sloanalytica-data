import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const targets = {
  L_AZURLANE_THE_ANIMATION_KN: ['FEAT_END_SCREEN_NON_HARD','FEAT_KAGA_CHARACTER_SEQUENCE'],
  L_TOARU_KAGAKU_NO_RAILGUN_2_FV: ['FEAT_AT_START_STAGE'],
};
for (const [machineId, featureIds] of Object.entries(targets)) {
  const file = path.join(root,'research',machineId,'selection-data.json');
  const data = JSON.parse(fs.readFileSync(file,'utf8'));
  for (const featureId of featureIds) {
    const feature = data.features.find((x) => x.featureId === featureId);
    if (!feature) throw new Error(`${machineId}: missing ${featureId}`);
    feature.normalizeRoundedCategoryProbabilities = true;
  }
  fs.writeFileSync(file, JSON.stringify(data,null,2)+'\n');
  console.log(`normalized contract: ${machineId} / ${featureIds.join(', ')}`);
}
