import fs from 'node:fs';

const fixes = [
  {
    path: 'research/L_BOFURI_FN/selection-data.json',
    from: '上段5枚ベルを実際に観測した対象ゲーム数を入力します。マイスロ総Gには擬似遊技が含まれるため、その総Gを分母へ直接入力しないでください。',
    to: '上段5枚ベルを実際に観測した対象ゲーム数を入力します。実機連動機能の総Gには擬似遊技が含まれるため、その総Gを分母へ直接入力しないでください。',
  },
  {
    path: 'research/L_HOKUTO_MUSOU_FS/selection-data.json',
    from: 'マイスロ起動時はスイカを自動集計できます。自分のマイスロ区間と通常ゲーム数の集計範囲を揃えて入力してください。',
    to: '実機連動機能を利用するとスイカを自動集計できます。連動機能の遊技区間と通常ゲーム数の集計範囲を揃えて入力してください。',
  },
];

for (const f of fixes) {
  let text = fs.readFileSync(f.path, 'utf8');
  if (!text.includes(f.from)) throw new Error(`target text not found: ${f.path}`);
  text = text.replace(f.from, f.to);
  fs.writeFileSync(f.path, text);
}
console.log('generic linked-service wording applied');
