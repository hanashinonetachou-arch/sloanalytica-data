import fs from 'node:fs';

const uiPath = 'research/L_BIG_DREAM_GOLDEN_PUSHER_KR/ui-design-data.json';
const ui = JSON.parse(fs.readFileSync(uiPath, 'utf8'));
for (const section of Object.values(ui.sections ?? {})) {
  if (typeof section.description === 'string') {
    section.description = section.description
      .replace(/マイスロを使っている場合は終了画面の回数を自動で確認できます。/g, '連動サービスを使っている場合は、終了画面の回数を確認できることがあります。')
      .replace(/マイスロ利用時は終了画面の回数を自動で確認できます。/g, '連動サービスを使っている場合は、終了画面の回数を確認できることがあります。');
  }
}
fs.writeFileSync(uiPath, JSON.stringify(ui, null, 2) + '\n');

const selectionPath = 'research/L_BIG_DREAM_GOLDEN_PUSHER_KR/selection-data.json';
const selection = JSON.parse(fs.readFileSync(selectionPath, 'utf8'));
for (const feature of selection.features ?? []) {
  if (typeof feature.userFacingReason === 'string') {
    feature.userFacingReason = feature.userFacingReason
      .replace(/マイスロを使っている場合は終了画面の回数を自動で確認できます。/g, '連動サービスを使っている場合は、終了画面の回数を確認できることがあります。')
      .replace(/マイスロ利用時は終了画面の回数を自動で確認できます。/g, '連動サービスを使っている場合は、終了画面の回数を確認できることがあります。');
  }
}
for (const group of ['selected', 'rejected']) {
  for (const item of selection.selectionSummaryContract?.[group] ?? []) {
    if (typeof item.reason === 'string') {
      item.reason = item.reason
        .replace(/マイスロを使っている場合は終了画面の回数を自動で確認できます。/g, '連動サービスを使っている場合は、終了画面の回数を確認できることがあります。')
        .replace(/マイスロ利用時は終了画面の回数を自動で確認できます。/g, '連動サービスを使っている場合は、終了画面の回数を確認できることがあります。');
    }
  }
}
fs.writeFileSync(selectionPath, JSON.stringify(selection, null, 2) + '\n');

console.log('PASS Big Dream user-facing UI and selection reasons use generic linked-service wording');
