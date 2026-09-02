import fs from 'node:fs';

const file = 'research/L_YOUJITSU_DE/machine-observation-data.json';
const data = JSON.parse(fs.readFileSync(file, 'utf8'));

const replacements = [
  ['自己実戦中、SelectionDataで定義された対象試行・対象イベント成立時に更新', '自己実戦中、対象となる試行・イベント成立時に更新'],
  ['SelectionDataの分母定義外の遊技状態・試行を混ぜない', '対象外の遊技状態・試行を分母へ混ぜない'],
  ['Selection FEAT_CZ_FIRST_HIT (INCLUDE_PRIMARY) の入力契約を保持。', 'CZ初当りの入力条件を保持。'],
  ['Selection FEAT_DAXEL_FLASH (INCLUDE_SUPPORT) の入力契約を保持。', 'CZ成功時ダクセルフラッシュの入力条件を保持。'],
  ['Selection FEAT_NORMAL_CYCLE_CZ_TYPE (INCLUDE_SUPPORT) の入力契約を保持。', '通常周期のCZ種別の入力条件を保持。'],
  ['Selection FEAT_RED_BUTTON (INCLUDE_SUPPORT) の入力契約を保持。', '連続演出成功時赤ボタンの入力条件を保持。'],
  ['Selection FEAT_BONUS_END_SCREEN (INCLUDE_SUPPORT) の入力契約を保持。', 'よう実BONUS終了画面の入力条件を保持。'],
  ['SelectionData evidenceに採用済みのHard Evidenceのみ。', '設定確定・否定として採用済みの表示のみ。'],
  ['GIRLS_CHALLENGE・MERITOCRACY_ZONE', 'ガールズチャレンジ・実力至上主義ゾーン'],
  ['GROUP_PICTURE・KUSHIDA', 'キャラ集合絵・櫛田桔梗'],
];

let text = JSON.stringify(data, null, 2);
for (const [from, to] of replacements) text = text.split(from).join(to);
const out = JSON.parse(text);
const cz = out.observations.find((x) => x.observationId === 'OBS_NORMAL_CYCLE_CZ_TYPE');
if (cz) cz.categories = ['ガールズチャレンジ', '実力至上主義ゾーン'];
const end = out.observations.find((x) => x.observationId === 'OBS_BONUS_END_SCREEN');
if (end) end.categories = ['キャラ集合絵', '櫛田桔梗'];
fs.writeFileSync(file, `${JSON.stringify(out, null, 2)}\n`);
console.log('PASS batch10 observation semantic cleanup');
