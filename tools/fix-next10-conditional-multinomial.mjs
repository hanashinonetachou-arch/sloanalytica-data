import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function load(machineId, name) {
  const file = path.join(root, 'research', machineId, name);
  return { file, data: JSON.parse(fs.readFileSync(file, 'utf8')) };
}
function save(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
}
function conditionFeature(feature, keptCategories, note) {
  const next = {};
  for (const [setting, distribution] of Object.entries(feature.settingDistributions)) {
    const mass = keptCategories.reduce((sum, category) => sum + Number(distribution[category] ?? 0), 0);
    if (!(mass > 0 && mass <= 1.01)) throw new Error(`${feature.researchFeatureId}/${setting}: invalid retained mass ${mass}`);
    next[setting] = Object.fromEntries(keptCategories.map((category) => [category, Number(distribution[category] ?? 0) / mass]));
    const total = Object.values(next[setting]).reduce((a, b) => a + b, 0);
    if (Math.abs(total - 1) > 1e-12) throw new Error(`${feature.researchFeatureId}/${setting}: conditional sum ${total}`);
  }
  feature.categories = keptCategories;
  feature.settingDistributions = next;
  feature.denominatorDefinition = '非EVIDENCEカテゴリが観測された回数';
  feature.notes = note;
}
function findFeature(data, key, value) {
  const feature = data.features.find((x) => x[key] === value);
  if (!feature) throw new Error(`missing feature ${key}=${value}`);
  return feature;
}

// Azur Lane: hard confirmation screens remain Evidence. Numeric likelihood is P(non-hard category | non-hard screen).
{
  const machineId = 'L_AZURLANE_THE_ANIMATION_KN';
  const research = load(machineId, 'research-data.json');
  const selection = load(machineId, 'selection-data.json');
  const kept = ['エンタープライズ', 'ベルファスト', 'エンタープライズ&ベルファスト', '赤城'];
  const rf = findFeature(research.data, 'researchFeatureId', 'RF_END_SCREEN_NON_HARD');
  conditionFeature(rf, kept, '公開された全終了画面振り分けから、全員集合・加賀&赤城・パーティーをEvidenceへ分離し、非確定4種が出た条件下の分布へ正規化して評価する。確定画面の出現自体はこのFeatureへ入れず二重計上しない。');
  const sf = findFeature(selection.data, 'featureId', 'FEAT_END_SCREEN_NON_HARD');
  delete sf.categoryExcludeLabels;
  delete sf.normalizeRoundedCategoryProbabilities;
  sf.userReason = '設定確定画面はEvidenceへ分離し、非確定画面が出た条件下での4種内訳だけをMultinomial評価するため、確定画面との二重計上を避けられます。';
  save(research.file, research.data);
  save(selection.file, selection.data);
}

// Railgun 2: setting-limiting cards remain Evidence. Numeric likelihood is P(non-hard card | non-hard card observed).
{
  const machineId = 'L_TOARU_KAGAKU_NO_RAILGUN_2_FV';
  const research = load(machineId, 'research-data.json');
  const selection = load(machineId, 'selection-data.json');
  const kept = ['美琴&食蜂', '美琴&黒子①', '美琴&黒子②', '美琴&黒子&佐天&初春', 'その他'];
  const rf = findFeature(research.data, 'researchFeatureId', 'RF_PAYOUT_CARD_NON_HARD');
  conditionFeature(rf, kept, '公開されたカード振り分けから、美琴&黒子③・お風呂・一方通行を設定集合制約のEvidenceへ分離し、非確定5種が出た条件下の分布へ正規化して評価する。設定限定カードの出現自体はこのFeatureへ入れず二重計上しない。');
  const sf = findFeature(selection.data, 'featureId', 'FEAT_PAYOUT_CARD_NON_HARD');
  delete sf.categoryExcludeLabels;
  delete sf.normalizeRoundedCategoryProbabilities;
  sf.userReason = '設定集合を直接限定するカードはEvidenceへ分離し、非確定カードが出た条件下での5種内訳だけをMultinomial評価するため、Evidenceとの二重計上を避けられます。';
  save(research.file, research.data);
  save(selection.file, selection.data);
}

console.log('Conditional non-Evidence multinomial contracts fixed.');
