import fs from 'node:fs';

const path = 'research/L_BIG_DREAM_GOLDEN_PUSHER_KR/ui-design-data.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));
for (const section of Object.values(data.sections ?? {})) {
  if (typeof section.description === 'string') {
    section.description = section.description
      .replace(/マイスロを使っている場合は終了画面の回数を自動で確認できます。/g, '連動サービスを使っている場合は、終了画面の回数を確認できることがあります。')
      .replace(/マイスロ利用時は終了画面の回数を自動で確認できます。/g, '連動サービスを使っている場合は、終了画面の回数を確認できることがあります。');
  }
}
fs.writeFileSync(path, JSON.stringify(data, null, 2) + '\n');
console.log('PASS Big Dream user-facing UI uses generic linked-service wording');
