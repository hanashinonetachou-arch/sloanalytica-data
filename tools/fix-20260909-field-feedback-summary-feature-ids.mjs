import fs from 'node:fs';

const configs = [
  {
    path: 'research/L_BIG_DREAM_GOLDEN_PUSHER_KR/selection-data.json',
    map: {
      'CZ JUDGEMENT': 'FEAT_CZ_INITIAL',
      'AT ゴールデンボーナス': 'FEAT_AT_INITIAL',
      'ステーションチェンジ時 初期ボール個数振り分け': 'FEAT_STATION_INITIAL_BALLS',
      'ゴールデンチャレンジ終了画面': 'FEAT_GC_END_SCREEN',
      'ゲーム数天井1499G選択': 'FEAT_GAME_CEILING_1499',
    },
  },
  {
    path: 'research/L_SUPER_RIO_ACE2_ND02H/selection-data.json',
    map: {
      'ボーナス/AT初当り': 'FEAT_INITIAL',
      'ノワールルーム突入': 'FEAT_NOIR_ROOM',
      'ボーナス直撃': 'FEAT_BONUS_DIRECT',
      '規定リプレイ50回到達時ハワードゲーム当選': 'FEAT_HOWARD_THRESHOLD',
      'ハワードゲーム': 'FEAT_HOWARD_THRESHOLD',
      'BB・AT終了画面 リナサイン': 'FEAT_RINA_SIGN',
      '内部エースモード選択': 'FEAT_ACE_MODE',
      'スイカ成立時 次回ノワールルーム成功抽選': 'FEAT_WATERMELON_NEXT_NOIR',
    },
  },
];

for (const { path, map } of configs) {
  const data = JSON.parse(fs.readFileSync(path, 'utf8'));
  const summary = data.selectionSummaryContract;
  if (!summary) throw new Error(`${path}: selectionSummaryContract missing`);
  for (const group of ['selected', 'rejected']) {
    for (const item of summary[group] ?? []) {
      const id = map[item.name];
      if (!id) throw new Error(`${path}: unmapped ${group} summary item: ${item.name}`);
      item.featureId = id;
    }
  }
  fs.writeFileSync(path, JSON.stringify(data, null, 2) + '\n');
}

console.log('PASS field-feedback selection summaries have explicit featureIds');
