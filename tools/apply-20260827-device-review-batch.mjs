import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = rel => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const writeJson = (rel, value) => fs.writeFileSync(path.join(ROOT, rel), JSON.stringify(value, null, 2) + '\n', 'utf8');

function updateSelection(machineId, mutate) {
  const rel = `research/${machineId}/selection-data.json`;
  const data = readJson(rel);
  mutate(data);
  writeJson(rel, data);
}
function inputMap(selection) {
  return new Map((selection.inputs ?? []).map(input => [input.id, input]));
}
function requireInput(inputs, id) {
  const input = inputs.get(id);
  if (!input) throw new Error(`required input not found: ${id}`);
  return input;
}

updateSelection('S_OVERLORD_II_SX', selection => {
  selection.uiCategoryLabels ??= {};
  selection.uiCategoryLabels.TA = 'タイムアクセラレータ天井';
  const inputs = inputMap(selection);
  requireInput(inputs, 'INP_EX_BELL').description = '通常時に成立したEXベルを数えてください。約1/8.1～1/7.5で設定差があり、弱レア役3役合算との同一試行重複を避けてEXベルだけを推測に使用します。';
  for (const [id, label] of [['INP_TA_THRESHOLD_3','3回'],['INP_TA_THRESHOLD_6','6回'],['INP_TA_THRESHOLD_10','10回']]) {
    requireInput(inputs, id).description = `タイムアクセラレータ当選までの規定回数天井が${label}だったと確定できた周期だけ加算してください。確定できない周期は未入力のままにします。`;
  }
});

updateSelection('L_MOMOTARO_DENTETSU_TEIBAN_PU', selection => {
  const inputs = inputMap(selection);
  const rival = '総決算レース後または電鉄ボーナス終了後に再抽選されたライバル社長2人の組み合わせを記録します。設定変更時の初期組み合わせは対象外です。';
  for (const id of ['INP_RIVAL_YOKIHI_ENMA','INP_RIVAL_MAMEONI_ENMA','INP_RIVAL_MAMEONI_YOKIHI']) requireInput(inputs, id).description = rival;
  const mission = 'ミッション駅停止時、レア役による書き換えがなかった場合だけ結果を記録します。急行周遊・特急周遊・カード非獲得のいずれか1つを加算してください。';
  for (const id of ['INP_MISSION_EXPRESS','INP_MISSION_LIMITED','INP_MISSION_NONE']) requireInput(inputs, id).description = mission;
  const tourism = '同一都道府県の観光マスで出現したご当地アイテムを記録します。ホール側の都道府県カスタムが有効と確認できた場合のみ使用し、確認できない場合は未入力のままにしてください。';
  for (const id of ['INP_TOURISM_NONE','INP_TOURISM_MOMOTARO','INP_TOURISM_YASHA','INP_TOURISM_KINTARO','INP_TOURISM_URASHIMA','INP_TOURISM_BINBO','INP_TOURISM_MINI','INP_TOURISM_KING']) requireInput(inputs, id).description = tourism;
});

updateSelection('L_SMASLO_DUNBINE_MF', selection => {
  const inputs = inputMap(selection);
  requireInput(inputs, 'INP_AURA_TRIAL').description = '規定ptを事後に確定できた周期だけを数えてください。確定できない周期は未入力のままにします。';
  requireInput(inputs, 'INP_AURA_11PT').description = '規定ptを確定できた周期のうち、11ptが選択されていた回数を数えてください。';
  requireInput(inputs, 'INP_ATTACK_HAZURE3').description = 'アタックMODE中にハズレ3連が成立した回数を数えてください。ハズレ4連は3連を内包するため別評価しません。';
  requireInput(inputs, 'INP_ATTACK_HAZURE3_HIGH').description = 'ハズレ3連成立後に狙え高確へ移行した回数を数えてください。';
  requireInput(inputs, 'INP_BILLBINE_END').description = 'ビルバインRUSH終了回数を数えてください。';
  requireInput(inputs, 'INP_BILLBINE_CARRY').description = 'ビルバインRUSH終了後、63G+αを超えて持ち越した回数を数えてください。';
  const cham = '設定推測対象のカットイン条件を満たした場合だけ、チャムランプの色を1回につき1つ加算してください。対象条件は実機確認待ちです。';
  for (const id of ['INP_CHAM_GREEN','INP_CHAM_RED','INP_CHAM_OTHER']) requireInput(inputs, id).description = cham;
});

console.log('Applied 2026-08-27 device-review follow-up selection wording.');
