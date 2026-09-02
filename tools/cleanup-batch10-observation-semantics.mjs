import fs from 'node:fs';

const ids = [
  'L_MAGIA_RECORD_RN',
  'L_GODZILLA_NS',
  'L_USHIO_TORA_HAKUMEN_VH',
  'L_AMAZING_LIVE_PD',
  'L_YOSHIMUNE_SC2',
  'L_MAHJONG_MONOGATARI_S2',
  'L_IDOLMASTER_MILLION_LIVE_HC',
  'L_YOUJITSU_DE',
  'L_MIDORIDON_VIVA_REVIVAL_FY',
  'L_GUNDAM_SEED_G',
];

const replacements = [
  ['自己実戦中、SelectionDataで定義された対象試行・対象イベント成立時に更新', '自己実戦中、対象となる試行・イベント成立時に更新'],
  ['SelectionDataの分母定義外の遊技状態・試行を混ぜない', '対象外の遊技状態・試行を分母へ混ぜない'],
  ['SelectionData evidenceに採用済みのHard Evidenceのみ。', '設定確定・否定として採用済みの表示のみ。'],
  ['Selectionのsuppressionにより独立二重評価しない', '同じ初当り情報を重複評価しない'],
  ['Selection表', '設定別確率表'],
  ['SelectionData', '推測仕様'],
  ['Selection ', '推測仕様 '],
  ['現行Feature', '現行の推測要素'],
  ['Feature', '推測要素'],
  ['Inference用Observation', '設定推測用の観測項目'],
  ['Inference', '設定推測'],
  ['Observation', '観測項目'],
  ['Evidence', '確定・否定情報'],
  ['INCLUDE_PRIMARY', '主採用'],
  ['INCLUDE_SUPPORT', '補助採用'],
  ['INCLUDE_FALLBACK', '代替採用'],
  ['GIRLS_CHALLENGE', 'ガールズチャレンジ'],
  ['MERITOCRACY_ZONE', '実力至上主義ゾーン'],
  ['GROUP_PICTURE', 'キャラ集合絵'],
  ['KUSHIDA', '櫛田桔梗'],
  ['IROHA', 'いろは'],
  ['YACHIYO', 'やちよ'],
  ['TSURUNO', '鶴乃'],
  ['SANA', 'さな'],
  ['FELICIA', 'フェリシア'],
  ['KUROE', '黒江'],
  ['HIGH10', '高確保証10G'],
  ['HIGH20', '高確保証20G'],
  ['HIGH30', '高確保証30G'],
  ['NONE', '該当なし'],
  ['MAGIA_CHALLENGE', 'マギアチャレンジ'],
  ['KUROE_CHALLENGE', '黒江チャレンジ'],
  ['NO_CZ', 'CZ非当選'],
];

const userFacingKeys = new Set([
  'label', 'categories', 'timing', 'excludedConditions', 'notes', 'description',
  'reason', 'details', 'instructions', 'acquisition', 'acquisitionNotes',
]);

function cleanText(value) {
  let out = value;
  for (const [from, to] of replacements) out = out.split(from).join(to);
  return out;
}

function cleanUserFacingFields(value) {
  if (Array.isArray(value)) return value.map(cleanUserFacingFields);
  if (!value || typeof value !== 'object') return value;
  for (const [key, child] of Object.entries(value)) {
    if (userFacingKeys.has(key)) {
      if (typeof child === 'string') value[key] = cleanText(child);
      else if (Array.isArray(child)) value[key] = child.map((item) => typeof item === 'string' ? cleanText(item) : cleanUserFacingFields(item));
      else value[key] = cleanUserFacingFields(child);
    } else if (child && typeof child === 'object') {
      cleanUserFacingFields(child);
    }
  }
  return value;
}

for (const id of ids) {
  const file = `research/${id}/machine-observation-data.json`;
  const out = cleanUserFacingFields(JSON.parse(fs.readFileSync(file, 'utf8')));

  if (id === 'L_YOUJITSU_DE') {
    const cz = out.observations.find((x) => x.observationId === 'OBS_NORMAL_CYCLE_CZ_TYPE');
    if (cz) cz.categories = ['ガールズチャレンジ', '実力至上主義ゾーン'];
    const end = out.observations.find((x) => x.observationId === 'OBS_BONUS_END_SCREEN');
    if (end) end.categories = ['キャラ集合絵', '櫛田桔梗'];
  }

  fs.writeFileSync(file, `${JSON.stringify(out, null, 2)}\n`);
}

console.log(`PASS batch10 observation semantic cleanup (${ids.length} machines)`);
