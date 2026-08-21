import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const write = (p, v) => fs.writeFileSync(p, JSON.stringify(v, null, 2) + '\n');

const updates = [
  {
    machineId: 'L_HOKUTO_AD_XR',
    featureId: 'FEAT_WATERMELON_COMBINED',
    weight: 1,
    userReason: '実機連動機能で継続的に取得できる小役出現率で、専用の集計ゲーム数を分母として直接評価できるため採用。'
  },
  {
    machineId: 'L_SAO_B2',
    featureId: 'FEAT_COMMON_BELL',
    weight: 1,
    userReason: '実機連動機能で共通ベル回数と対応する総ゲーム数を直接取得でき、独立した小役出現率として評価できるため採用。'
  },
  {
    machineId: 'S_KABANERI_ZR',
    featureId: 'FEAT_MUMEI_3CHAIN',
    weight: 0.8,
    userReason: '無名CZ中の小役3連成功率は設定1と6で2倍超の差があります。ただし成功はボーナス当選そのもので、採用済みボーナス初当りと結果の一部を共有するため、独立証拠として過大評価しないようweight 0.8で補助採用します。'
  },
  {
    machineId: 'L_MUSHOKU_TENSEI_NM',
    featureId: 'FEAT_HITOGAMI_SPACE_PREMONITION_SUCCESS_RATE',
    weight: 0.8,
    userReason: '設定1の31.8%に対して設定6は41.0%で、本前兆期待度に設定差があります。ただし本前兆成功はボーナス当選へつながり、採用済みAT初当りと下流経路の一部を共有するため、独立証拠として過大評価しないようweight 0.8で補助採用します。'
  },
  {
    machineId: 'L_MUSHOKU_TENSEI_NM',
    featureId: 'FEAT_SHIRONE_KINGDOM_TRANSITION_RATE',
    weight: 1,
    userReason: 'ヒトガミ非移行時の有効ステージ移行を分母とした条件付き振り分けで、設定1の6.25%から設定6の10.94%まで明確な差があるため採用します。除外条件を適用した有効試行だけを入力して評価します。'
  }
];

for (const u of updates) {
  const p = path.join(root, 'research', u.machineId, 'selection-data.json');
  const s = read(p);
  const f = (s.features ?? []).find(x => x.featureId === u.featureId);
  if (!f) throw new Error(`Missing feature ${u.machineId}/${u.featureId}`);
  f.weight = u.weight;
  f.userReason = u.userReason;
  write(p, s);
}

console.log(`Applied ${updates.length} Phase 3 weight updates.`);
