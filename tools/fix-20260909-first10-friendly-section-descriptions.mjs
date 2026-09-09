import fs from 'node:fs';

const ids = [
  'L_ANIMAL_SLOT_DOCCHI_ZT','L_BIG_DREAM_GOLDEN_PUSHER_KR','L_BIOHAZARD_RE3_ZD','L_TAKT_OP_DESTINY_M1',
  'L_SUPER_RIO_ACE2_ND02H','L_BIRDIE_WING_BC','L_SAO2_PA1','L_SENGOKU_OTOME5_L8','L_DARK_HAIBI_SB','L_LOTIS_TN'
];

function friendly(text) {
  if (typeof text !== 'string') return text;
  let s = text;
  s = s.replace(/「([^」]+)」を分母として、同じ実戦中に各項目を数えます。/g,
    '自分で確認できた「$1」と、このセクションの各項目の回数を入力してください。');
  s = s.replace(/数え方：[^。]+。/g,
    '該当する出来事が起きるたびに1回数えてください。');
  s = s.replace(/数えない範囲：希少だが試行数だけを理由に候補から除外しない。/g, '');
  s = s.replace(/数えない範囲：([^。]+)。/g, '次の場合は数えません：$1。');
  s = s.replace(/自分で確認できた回数だけを入力してください。/g, '自分で確認できたものだけを入力してください。');
  s = s.replace(/同じ観測区間/g, '同じ実戦中');
  s = s.replace(/観測区間/g, '実戦中');
  s = s.replace(/対象条件下の/g, '該当する');
  s = s.replace(/対象条件下/g, '該当する場面');
  s = s.replace(/数える範囲：/g, '数えるもの：');
  return s.replace(/\s{2,}/g, ' ').trim();
}

const explicit = {
  L_SAO2_PA1: {
    '通常時': '自分で回した通常ゲーム数と、その間に確認できたCZ初当り・AT初当り・シノンAT直撃・確定CZを入力してください。CZ中の途中昇格は数えません。',
    '低確滞在時スイカ→シューティングチャージ': '低確中にスイカが成立するたびに1回数え、そのスイカからシューティングチャージへ当選した回数を入力してください。',
    '低確滞在時 強チェリー→CZ': '低確中に強チェリーが成立するたびに1回数え、その強チェリーからCZへ当選した回数を入力してください。',
    '高確滞在時 強チェリー→CZ': '高確中に強チェリーが成立するたびに1回数え、その強チェリーからCZへ当選した回数を入力してください。',
    'CZ失敗時アイテム獲得': 'CZに失敗するたびに1回数え、その失敗時にアイテムを獲得した回数を入力してください。',
    '強チャンス目→確定CZ': '強チャンス目A/Bが成立するたびに1回数え、確定CZに当選した回数を入力してください。',
    'AT初当り時ステージ選択率': 'AT初当りごとに開始ステージを確認し、当てはまる項目を1回数えてください。50G以内の引き戻しは含めますが、高確率スタートとその後のステージ移行は数えません。'
  },
  L_SENGOKU_OTOME5_L8: {
    '通常時': '自分で回した通常ゲーム数と、その間のAT初当り・戦国乙女ボーナスの回数を入力してください。',
    '巫女ポイント0pt到達時 乙女アタック当選': '巫女ポイントが0ptまで到達するたびに1回数え、そのとき乙女アタックへ当選した回数を入力してください。リールロック2段階からの当選と、乙女ストラップモード「カンスケ」滞在中は数えません。'
  },
  L_DARK_HAIBI_SB: {
    '通常時': '自分で回した通常ゲーム数と、連チャン中を除いたボーナス初当り回数を入力してください。連チャン中のボーナスは数えません。',
    'BB': 'BBを数えているゲーム数と、その間のBB当選回数を入力してください。',
    'RB': 'RBを数えているゲーム数と、その間のRB当選回数を入力してください。'
  }
};

for (const id of ids) {
  const p = `research/${id}/ui-design-data.json`;
  const data = JSON.parse(fs.readFileSync(p, 'utf8'));
  for (const [title, section] of Object.entries(data.sections ?? {})) {
    if (explicit[id]?.[title]) section.description = explicit[id][title];
    else if (typeof section.description === 'string') section.description = friendly(section.description);
  }
  const descriptions = Object.values(data.sections ?? {}).map(s => s.description ?? '').join('\n');
  const banned = descriptions.match(/観測区間|対象条件下|同じ観測|分母として|数え方：/g);
  if (banned) throw new Error(`${id}: technical section wording remains: ${[...new Set(banned)].join(', ')}`);
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n');
}
console.log('PASS first10 section descriptions use user-facing action wording');
