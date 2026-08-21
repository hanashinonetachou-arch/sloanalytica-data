import fs from 'node:fs';

const path = 'research/L_ENEN_NO_SHOUBOUTAI_JG/research-data.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));

const sources = [
  {
    sourceId: 'SRC_MENU_HAZUSE',
    publisher: 'HAZUSE',
    url: 'https://hazuse.com/machine/pachislot/2S0167/',
    checkedAt: '2026-08-21',
    sourceType: 'major_analysis',
  },
  {
    sourceId: 'SRC_MENU_PACHIMAGA',
    publisher: 'パチマガスロマガ',
    url: 'https://cs62.cs-plaza.com/g/pachi/pla/s_conq/sankyo_slot/79/kh02.php',
    checkedAt: '2026-08-21',
    sourceType: 'major_analysis',
  },
];

for (const source of sources) {
  if (!data.sources.some((item) => item.sourceId === source.sourceId)) {
    data.sources.push(source);
  }
}

data.machineMenuResearch = {
  status: 'checked',
  availableData: [
    'ゲーム数',
    '炎炎激闘回数',
    '歴代最大連続回数',
  ],
  notes: '公開解析でメニュー画面のゲーム数・炎炎激闘回数・歴代最大連続回数を確認。ゲーム数と炎炎激闘回数は設定変更・電源OFF/ONでリセットされ、歴代最大連続回数は引き継がれる。短時間の電源OFFでは保持される場合があるため、着席時データを推測Featureへ機械的に流用しない。',
};

const numeric = data.researchCompleteness?.numericSurfaces?.find(
  (item) => item.surface === 'machine_menu_cumulative',
);
if (numeric) {
  numeric.status = 'CHECKED';
  numeric.sourceRefs = ['SRC_MENU_HAZUSE', 'SRC_MENU_PACHIMAGA'];
  numeric.notes = '実機メニューにゲーム数・炎炎激闘回数・歴代最大連続回数があることを公開解析で確認。リセット条件が項目ごとに異なるため、前任者区間Featureへの利用可否は別途評価する。';
}

fs.writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
console.log(`updated ${path}`);
