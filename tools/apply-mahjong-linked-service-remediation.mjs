import fs from 'node:fs';

const rFile = 'research/L_MAHJONG_MONOGATARI_S2/research-data.json';
const oFile = 'research/L_MAHJONG_MONOGATARI_S2/machine-observation-data.json';
const read = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const write = (f, x) => fs.writeFileSync(f, `${JSON.stringify(x, null, 2)}\n`);
const upsert = (arr, key, item) => {
  const i = arr.findIndex((x) => x?.[key] === item[key]);
  if (i >= 0) arr[i] = item; else arr.push(item);
};

const sources = [
  {
    sourceId: 'SRC_NANA_DARWIN_LITE',
    publisher: 'なな徹',
    title: 'スマスロ 麻雀物語 打-WIN LITE（隠れ凪）の設定示唆',
    url: 'https://nana-press.com/kaiseki/machine/931/29536/',
    checkedAt: '2026-09-02',
    sourceType: 'major_analysis'
  },
  {
    sourceId: 'SRC_PACHIMAGA_DARWIN_LITE',
    publisher: 'パチマガスロマガ',
    title: 'L麻雀物語 打-WIN LITE 隠れ凪のセリフ',
    url: 'https://cs62.cs-plaza.com/g/pachi/pla/s_conq/olympiaestate_slot/06/en04.php',
    checkedAt: '2026-09-02',
    sourceType: 'major_analysis'
  }
];

const research = read(rFile);
research.sources ??= [];
for (const s of sources) upsert(research.sources, 'sourceId', s);
research.linkedServiceResearch = {
  status: 'FOUND',
  serviceName: '打-WIN LITE',
  sourceRefs: sources.map((x) => x.sourceId),
  observedFields: ['隠れ凪のセリフ', '1000G消化ごとの設定示唆更新'],
  notes: 'L麻雀物語のメニュー画面から打-WIN LITEを起動し、QRコード読取後に隠れ凪のセリフを確認できることを複数攻略媒体で確認。設定推測用のAT直撃回数や煌帝試行数を自動取得できるとは確認できていないため、その用途には接続しない。'
};
write(rFile, research);

const obs = read(oFile);
obs.sources ??= [];
for (const s of sources) upsert(obs.sources, 'sourceId', s);
obs.sourceCoverage.linkedService = 'FOUND';
upsert(obs.observations, 'observationId', {
  observationId: 'OBS_DARWIN_LITE_NAGI',
  sourceType: 'LINKED_SERVICE',
  observationMode: 'LINKED_SERVICE_READ',
  status: 'FOUND',
  label: '打-WIN LITE 隠れ凪',
  categories: ['隠れ凪のセリフ'],
  timing: ['打-WIN LITE開始後、QRコード読取時', '1000G消化ごとの更新タイミング'],
  excludedConditions: [
    '打-WIN LITE開始前の遊技区間を同じセッションの観測として扱わない',
    '隠れ凪のセリフをAT直撃回数・煌帝回数・各試行数の代用にしない'
  ],
  sourceRefs: sources.map((x) => x.sourceId),
  notes: '打-WIN LITEの存在とL麻雀物語固有の隠れ凪表示はWebで確認済み。数値Featureの自動取得元としては未確認のためEvidence補助取得に限定する。'
});
obs.fieldVerificationItems = (obs.fieldVerificationItems ?? []).filter((x) => x.verificationId !== 'VFY_L_MAHJONG_MONOGATARI_S2_LINKED_SERVICE');
write(oFile, obs);

console.log('Resolved L_MAHJONG_MONOGATARI_S2 linked-service debt as FOUND (打-WIN LITE).');
