import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = rel => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const writeJson = (rel, value) => fs.writeFileSync(path.join(ROOT, rel), JSON.stringify(value, null, 2) + '\n', 'utf8');

const selectionPath = 'research/L_HANABI_KM/selection-data.json';
const selection = readJson(selectionPath);

Object.assign(selection.uiCategoryLabels ??= {}, {
  BIG_GAME: 'BIG中',
  REG_GAME: 'REG中',
  HC: '花火チャレンジ',
  HG: '花火GAME',
});

const byId = new Map((selection.inputs ?? []).map(input => [input.id, input]));
const recommendedDescriptions = {
  INP_NORMAL_BELL_GAMES: '通常時の風鈴を観測したゲーム数を入力してください。RT中は含めません。（実機連動機能推奨）',
  INP_NORMAL_BELL_TOTAL: '通常時の風鈴A＋風鈴Bの合計回数を入力してください。未取得の場合は空欄のままにしてください。（実機連動機能推奨）',
  INP_BIG_GAME_TRIALS: '実際に消化したBIG中の総ゲーム数を入力してください。初版ではBIG回数から自動計算しません。（実機連動機能推奨）',
  INP_BIG_BELL_B: 'BIG中の斜め風鈴（風鈴B）の回数を入力してください。（実機連動機能推奨）',
  INP_BIG_SCATTER: 'BIG中のバラケ目の回数を入力してください。（実機連動機能推奨）',
  INP_REG_GAME_TRIALS: '実際に消化したREG中の総ゲーム数を入力してください。1枚役ハズシで変動するためREG回数から自動計算しません。（実機連動機能推奨）',
  INP_REG_ONE_COIN: 'REG中の1枚役成立回数を入力してください。（実機連動機能推奨）',
  INP_REG_SCATTER: 'REG中のバラケ目の回数を入力してください。（実機連動機能推奨）',
  INP_HC_GAMES: '実際に消化した花火チャレンジの総ゲーム数を入力してください。（実機連動機能推奨）',
  INP_HC_MISS: '花火チャレンジ中のハズレ回数を入力してください。（実機連動機能推奨）',
  INP_HG_GAMES: '実際に消化した花火GAMEの総ゲーム数を入力してください。（実機連動機能推奨）',
  INP_HG_MISS: '花火GAME中のハズレ回数を入力してください。（実機連動機能推奨）',
};

for (const [id, description] of Object.entries(recommendedDescriptions)) {
  const input = byId.get(id);
  if (!input) throw new Error(`Smart Hanabi input not found: ${id}`);
  input.description = description;
}

for (const feature of selection.features ?? []) {
  if (feature.featureId === 'FEAT_BONUS_OUTCOME') {
    feature.userReason = '特にREGに段階的な設定差があり、通常時小役データが未取得でも利用できるため採用します。通常時風鈴を観測した場合は二重評価を避けてフォールバック停止します。';
  }
}

writeJson(selectionPath, selection);

const pkgPath = 'package.json';
const pkg = readJson(pkgPath);
pkg.scripts ??= {};
pkg.scripts['audit:ui-service-names'] = 'node tools/audit-user-facing-service-names.mjs';
writeJson(pkgPath, pkg);

console.log('Applied Smart Hanabi generic machine-link wording and registered UI service-name audit.');
