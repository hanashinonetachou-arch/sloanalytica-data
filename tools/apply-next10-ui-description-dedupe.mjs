import fs from 'node:fs';

const changes = {
  L_AZURLANE_THE_ANIMATION_KN: {
    '終了画面（非確定）': '海戦BONUS失敗時またはAT終了時の非確定4種だけを数えます。全員集合／加賀&赤城／パーティーはここに含めず、設定確定演出へ入力します。',
    '加賀バトル キャラ紹介': '加賀バトル前半失敗後の6シナリオを数えます。AT濃厚の赤城／加賀混在シナリオは除外します。',
  },
  L_DRUAGA_NO_TOU_ZA: {
    'DC中 何もないマス': 'DC中のモンスター／鍵マス以外で成立したスイカ・チェリーだけを母数にし、その対象役から宝箱を1個獲得した回数を数えます。EX-DCは除外します。',
  },
  L_SMASLO_TOKYO_REVENGERS_ZF: {
    '東卍CHANCE レア役': '東卍CHANCE中に成立した弱チェリー／スイカだけを母数にし、その契機で東卍RUSHへ当選した回数を数えます。卍目は対象外です。',
    'AT終了後 REVENGE': '一触即発または東卍CHANCEに一度以上当選した東卍RUSH終了だけを母数にし、その後のREVENGEフリーズ発生を数えます。駆け抜けATは除外します。',
  },
  L_SHIN_ONIMUSHA_3_SA: {
    'ボーナス中ナビボイス': 'ボーナス開始時の擬似遊技で全リールを4コマ以内に目押しできた赤7＋青7ボーナスだけを母数にし、その中のオールキャストナビ発生を数えます。',
  },
  L_TOARU_KAGAKU_NO_RAILGUN_2_FV: {
    'AT開始ステージ': 'AT開始時のステージを「駆動鎧／ドッペルゲンガー／BUNNY DANCE」の3種類で数えます。',
    'CZ種類': 'CZ合算とは別に、当選したCZを「GIRLS JUDGE／上位CZ」の種類別に数えます。',
    'エピソードBONUS直撃': '通常時からエピソードBONUSへ直撃した回数を数えます。',
    '獲得枚数キャラカード（非確定）': '獲得枚数到達時のキャラカードを数えます。美琴&黒子③／お風呂／一方通行など確定・設定限定カードはここに含めず、設定確定演出側へ分離します。',
  },
  L_ZETTAI_SHOGEKI_FORCE_FH: {
    '弱チェリー→夜ステージ': '通常時の弱チェリーを母数にし、その契機で夜ステージへ新規移行した回数を数えます。夜ステージ中の保障再セット目的の弱チェリーは母数から除外し、新規移行にも数えません。',
  },
};

for (const [id, sections] of Object.entries(changes)) {
  const uiPath = `research/${id}/ui-design-data.json`;
  const ui = JSON.parse(fs.readFileSync(uiPath, 'utf8'));
  for (const [title, description] of Object.entries(sections)) {
    const section = ui.sections?.[title];
    if (!section) throw new Error(`${id}: missing section ${title}`);
    section.description = description;
    section.suppressInputDescriptions = true;
  }
  const note = 'UI description policy: shared observation conditions belong to the section description; repeated per-input descriptions are suppressed for these grouped counters.';
  if (!ui.auditNotes.includes(note)) ui.auditNotes.push(note);
  fs.writeFileSync(uiPath, JSON.stringify(ui, null, 2) + '\n');
}
console.log(`Updated UI description ownership for ${Object.keys(changes).length} machines.`);
