import fs from 'node:fs';

const ids = [
  'L_GODZILLA_NS','L_USHIO_TORA_HAKUMEN_VH','L_AMAZING_LIVE_PD','L_YOSHIMUNE_SC2',
  'L_MAHJONG_MONOGATARI_S2','L_IDOLMASTER_MILLION_LIVE_HC','L_YOUJITSU_DE','L_GUNDAM_SEED_G'
];
const specific = {
  FEAT_AT_FIRST_HIT: '推測では有効通常ゲーム数を母数に使うが、共通Difficultyの基準である総プレイGから有効通常Gへ変換する根拠ある固定比率がないためDifficultyには参加させない。',
  FEAT_BONUS_FIRST_HIT: '推測では有効通常ゲーム数（または初当り抽選対象ゲーム数）を母数に使うが、総プレイGから同じ母集団へ変換する根拠ある固定比率がないためDifficultyには参加させない。',
  FEAT_COMMON_TAWARA: 'ダイトモの通常プレイ数を母数にするFeatureで、総プレイGから通常プレイ数へ変換する固定比率は機種仕様として確定できないためDifficultyには参加させない。',
  FEAT_SHURAI_OPPONENT: '襲来ZONEの発生1回を試行とするカテゴリFeatureで、総プレイGあたりの襲来ZONE試行数を根拠なく仮定できないためDifficultyには参加させない。',
  FEAT_CZ_FIRST_HIT: '有効通常ゲーム数を母数にするCZ Featureで、総プレイGから有効通常Gへ変換する根拠ある固定比率がないためDifficultyには参加させない。',
  FEAT_DAXEL_FLASH: 'CZ成功1回を試行とする条件付きFeatureで、総プレイGあたりのCZ成功機会数を設定別に安全に導けないためDifficultyには参加させない。',
  FEAT_NORMAL_CYCLE_CZ_TYPE: '通常周期（AT後1・4周期目等を除外）のCZ当選1回を試行とする条件付きFeatureで、総プレイGあたりの対象試行数を安全に導けないためDifficultyには参加させない。',
  FEAT_RED_BUTTON: '連続演出成功1回を試行とする条件付きFeatureで、総プレイGあたりの対象演出成功機会数を安全に導けないためDifficultyには参加させない。',
  FEAT_BONUS_END_SCREEN: 'よう実BONUS終了1回を試行とするカテゴリFeatureで、総プレイGあたりの対象終了画面試行数を安全に導けないためDifficultyには参加させない。',
  FEAT_POST_RESET_ST_100G: 'リセット後またはST終了後を1 opportunityとするFeatureで、総プレイGあたりのopportunity数を固定値として仮定できないためDifficultyには参加させない。'
};
for (const id of ids) {
  const file = `research/${id}/selection-data.json`;
  const s = JSON.parse(fs.readFileSync(file,'utf8'));
  s.difficultyAnalysis ??= {};
  s.difficultyAnalysis.targetGameBasis = { basisId:'TOTAL_PLAY_GAMES', label:'全状態の総プレイゲーム数', quality:'EXACT', crossMachineComparable:true };
  for (const f of s.features ?? []) {
    if (!['INCLUDE_PRIMARY','INCLUDE_SUPPORT','INCLUDE_FALLBACK'].includes(f.adoptionCategory)) continue;
    if (f.difficultyExposure) continue;
    f.difficultyParticipation = 'EXCLUDE';
    f.difficultyExclusionReason = specific[f.featureId] ?? 'Inferenceでは採用するが、総プレイGからこのFeatureの実戦試行数へ変換する検証済みExposureがないためDifficultyには参加させない。';
  }
  fs.writeFileSync(file, JSON.stringify(s,null,2)+'\n');
}
console.log('Reconciled Difficulty participation after Observation for 8 non-total-play machines.');
