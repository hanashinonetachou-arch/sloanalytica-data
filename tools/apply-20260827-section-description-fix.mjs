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
function byId(selection) {
  return new Map((selection.inputs ?? []).map(input => [input.id, input]));
}
function clearDescription(inputs, ids) {
  for (const id of ids) {
    const input = inputs.get(id);
    if (!input) throw new Error(`required input not found: ${id}`);
    delete input.description;
  }
}

updateSelection('S_OVERLORD_II_SX', selection => {
  selection.uiCategoryLabels ??= {};
  selection.uiCategoryLabels.TA = 'タイムアクセラレータ天井';
  selection.uiCategoryDescriptions ??= {};
  selection.uiCategoryDescriptions.NORMAL = '通常ゲーム数とAT初当りを記録します。EXベルは通常時に成立したEXベルを数えます。約1/8.1～1/7.5で設定差があり、弱レア役3役合算との同一試行重複を避けてこちらだけを推測に使用します。';
  selection.uiCategoryDescriptions.TA = '天井発動時はタイムアクセラレータ終了時にATへ入ります。ただし、下記条件を満たした場合はサンプルから除外してください。\n・強レア小役を引いた\n・全点灯した\n・紫時計を獲得';
  const inputs = byId(selection);
  clearDescription(inputs, ['INP_EX_BELL','INP_TA_THRESHOLD_3','INP_TA_THRESHOLD_6','INP_TA_THRESHOLD_10']);
});

updateSelection('L_MOMOTARO_DENTETSU_TEIBAN_PU', selection => {
  selection.uiCategoryDescriptions ??= {};
  selection.uiCategoryDescriptions.RIVAL = '総決算レース後または電鉄ボーナス終了後に再抽選されたライバル社長2人の組み合わせを1回につき1つ記録します。設定変更時の初期組み合わせは対象外です。';
  selection.uiCategoryDescriptions.MISSION = 'ミッション駅停止時、レア役による書き換えがなかった場合だけ、急行周遊・特急周遊・カード非獲得のいずれか1つを記録します。';
  selection.uiCategoryDescriptions.TOURISM = '同一都道府県の観光マスで出現したご当地アイテムを1回につき1つ記録します。ホール側の都道府県カスタムが有効と確認できた場合のみ使用し、確認できない場合は全項目を未観測のままにします。';
  const inputs = byId(selection);
  clearDescription(inputs, [
    'INP_RIVAL_YOKIHI_ENMA','INP_RIVAL_MAMEONI_ENMA','INP_RIVAL_MAMEONI_YOKIHI',
    'INP_MISSION_EXPRESS','INP_MISSION_LIMITED','INP_MISSION_NONE',
    'INP_TOURISM_NONE','INP_TOURISM_MOMOTARO','INP_TOURISM_YASHA','INP_TOURISM_KINTARO',
    'INP_TOURISM_URASHIMA','INP_TOURISM_BINBO','INP_TOURISM_MINI','INP_TOURISM_KING'
  ]);
});

updateSelection('L_SMASLO_DUNBINE_MF', selection => {
  selection.uiCategoryDescriptions ??= {};
  selection.uiCategoryDescriptions.AURA = '規定ptを事後に確定できた周期だけを対象に、判別できた周期数と11pt選択回数を記録します。確定できない周期は未観測のままにします。';
  selection.uiCategoryDescriptions.ATTACK = 'アタックMODE中のハズレ3連成立回数と、そこから狙え高確へ移行した回数を記録します。ハズレ4連は3連を内包するため別入力しません。';
  selection.uiCategoryDescriptions.BILLBINE = 'ビルバインRUSH終了回数と、終了後に63G+αを超えて持ち越した回数を記録します。実機で毎回判定可能か確認するまでは未解決扱いです。';
  selection.uiCategoryDescriptions.CHAM = '設定推測対象のカットイン条件を満たした場合だけ、チャムランプの緑・赤・その他のいずれか1つを加算します。対象条件は実機確認待ちです。';
  selection.uiCategoryDescriptions.EVIDENCE = '設定下限・設定6などの確定情報が出現した場合に、該当する項目を選択してください。';
  const inputs = byId(selection);
  clearDescription(inputs, [
    'INP_AURA_TRIAL','INP_AURA_11PT','INP_ATTACK_HAZURE3','INP_ATTACK_HAZURE3_HIGH',
    'INP_BILLBINE_END','INP_BILLBINE_CARRY','INP_CHAM_GREEN','INP_CHAM_RED','INP_CHAM_OTHER'
  ]);
});

console.log('Applied 2026-08-27 section-description placement fix.');
