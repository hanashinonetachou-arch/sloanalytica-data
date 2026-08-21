import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const write = (p, v) => fs.writeFileSync(p, JSON.stringify(v, null, 2) + '\n');
const upsertSource = (r, source) => {
  r.sources ??= [];
  const i = r.sources.findIndex(x => x.sourceId === source.sourceId);
  if (i >= 0) r.sources[i] = source; else r.sources.push(source);
};
const feat = (r, id) => {
  const f = (r.features ?? []).find(x => x.researchFeatureId === id);
  if (!f) throw new Error(`Missing feature ${id}`);
  return f;
};

// Eureka TYPE-ART: replace Golden fixture provenance with external analysis sources.
{
  const p = path.join(root, 'research', 'S_EUREKA_SEVEN_HIEVO_XS', 'research-data.json');
  const r = read(p);
  r.researchedAt = '2026-08-22';
  r.sources = [];
  upsertSource(r, {
    sourceId: 'SRC_1GEKI_SETTING', publisher: '一撃',
    title: 'エウレカセブン TYPE-ART 設定差・設定判別要素まとめ',
    url: 'https://1geki.jp/slot/s_eurekahievo_art/0/', checkedAt: '2026-08-22', sourceType: 'analysis'
  });
  upsertSource(r, {
    sourceId: 'SRC_1GEKI_SMALL_ROLE', publisher: '一撃',
    title: 'エウレカセブン TYPE-ART 小役確率と通常時のベース',
    url: 'https://1geki.jp/slot/s_eurekahievo_art/4/', checkedAt: '2026-08-22', sourceType: 'analysis'
  });
  upsertSource(r, {
    sourceId: 'SRC_1GEKI_REG', publisher: '一撃',
    title: 'エウレカセブン TYPE-ART レギュラーボーナスの詳細と抽選',
    url: 'https://1geki.jp/slot/s_eurekahievo_art/62/?55=', checkedAt: '2026-08-22', sourceType: 'analysis'
  });
  upsertSource(r, {
    sourceId: 'SRC_NANA_SETTING', publisher: 'なな徹',
    title: 'エウレカセブン TYPE-ART 設定判別',
    url: 'https://nana-press.com/kaiseki/machine/634/17389/', checkedAt: '2026-08-22', sourceType: 'analysis'
  });
  r.machine.identitySourceRefs = ['SRC_1GEKI_SETTING', 'SRC_NANA_SETTING'];
  const f1 = feat(r, 'RF01');
  f1.sourceRefs = ['SRC_1GEKI_SETTING', 'SRC_NANA_SETTING'];
  f1.crossSourceStatus = 'confirmed';
  f1.trialUnit = '総ゲーム数';
  f1.observationScope = 'ART初当りとして集計するゲーム区間';
  f1.notes = 'ART初当り確率は公開解析値を複数ソースで照合。';
  const f2 = feat(r, 'RF02');
  f2.sourceRefs = ['SRC_1GEKI_SETTING', 'SRC_1GEKI_SMALL_ROLE'];
  f2.crossSourceStatus = 'confirmed';
  f2.trialUnit = '共通7枚ベル集計対象ゲーム';
  f2.observationScope = '通常時・AT中を含む共通7枚ベルの有効集計区間';
  f2.notes = '共通7枚ベルは設定1=1/14.4〜設定6=1/12.7。通常時ベル揃い合算とは別の解析値。';
  const f3 = feat(r, 'RF03');
  f3.sourceRefs = ['SRC_1GEKI_REG', 'SRC_NANA_SETTING'];
  f3.crossSourceStatus = 'confirmed';
  f3.trialUnit = '0ptのまま5G抽選を受けたREG1回';
  f3.observationScope = 'REG中5Gを通じて0pt状態が継続したケース';
  f3.notes = '一撃公開の0pt時1GあたりCMストック率（設定1=0.4%〜設定6=2.3%）から、5Gすべて0ptだったREGで1回以上当選する確率を 1-(1-p)^5 で導出。現行settingValuesはこの累積確率。';
  write(p, r);
}

// Code Geass C.C.&Kallen: replace Golden fixture provenance for all Research features.
{
  const p = path.join(root, 'research', 'S_CODE_GEASS_3_CC_FS', 'research-data.json');
  const r = read(p);
  r.researchedAt = '2026-08-22';
  const atEnd = (r.sources ?? []).find(x => x.sourceId === 'SRC_NANA_AT_END');
  r.sources = atEnd ? [atEnd] : [];
  upsertSource(r, {
    sourceId: 'SRC_1GEKI_SETTING', publisher: '一撃',
    title: 'コードギアス3 C.C.&Kallen ver. 設定差・設定判別要素まとめ',
    url: 'https://1geki.jp/slot/s_codegeass3cc/0/', checkedAt: '2026-08-22', sourceType: 'analysis'
  });
  upsertSource(r, {
    sourceId: 'SRC_1GEKI_SMALL_ROLE', publisher: '一撃',
    title: 'コードギアス3 C.C.&Kallen ver. 小役確率と通常時のベース',
    url: 'https://1geki.jp/slot/s_codegeass3cc/4/', checkedAt: '2026-08-22', sourceType: 'analysis'
  });
  upsertSource(r, {
    sourceId: 'SRC_NANA_SETTING', publisher: 'なな徹',
    title: 'コードギアス3 C.C.&Kallen ver. 設定差のある要素・設定示唆まとめ',
    url: 'https://nana-press.com/kaiseki/machine/552/15270/', checkedAt: '2026-08-22', sourceType: 'analysis'
  });
  upsertSource(r, {
    sourceId: 'SRC_NANA_SMALL_ROLE', publisher: 'なな徹',
    title: 'コードギアス3 C.C.&Kallen ver. ボーナス確率・小役確率',
    url: 'https://nana-press.com/kaiseki/machine/552/14240/', checkedAt: '2026-08-22', sourceType: 'analysis'
  });
  r.machine.identitySourceRefs = ['SRC_1GEKI_SETTING', 'SRC_NANA_SETTING'];
  const f1 = feat(r, 'RF01');
  f1.sourceRefs = ['SRC_1GEKI_SETTING', 'SRC_NANA_SETTING'];
  f1.crossSourceStatus = 'confirmed';
  f1.trialUnit = '通常時の有効ゲーム';
  f1.observationScope = '公開された設定差のある同時当選ボーナス内訳';
  f1.notes = '設定差のある同時当選ボーナス確率を外部解析で再確認。Selectionでは必要試行量の観点から不採用。';
  const f2 = feat(r, 'RF02');
  f2.sourceRefs = ['SRC_1GEKI_SMALL_ROLE', 'SRC_NANA_SMALL_ROLE'];
  f2.crossSourceStatus = 'confirmed';
  f2.trialUnit = '通常時・AT中の共通有効ゲーム';
  f2.observationScope = 'チェリー・スイカ（通常時とAT中で共通の出現率）';
  f2.notes = 'チェリー・スイカ確率は一撃・なな徹で設定別数値を照合。';
  const f3 = feat(r, 'RF03');
  f3.sourceRefs = ['SRC_1GEKI_SETTING', 'SRC_NANA_SETTING'];
  f3.crossSourceStatus = 'confirmed';
  f3.trialUnit = 'RB終了後AT(50G)中のC.C.高確対象ゲーム';
  f3.observationScope = 'RB後AT中の無限移行C.C.揃い';
  f3.notes = '設定1=1/993.0〜設定6=1/331.0を一撃・なな徹で再確認。ゲーム数ベースDifficultyには不参加。';
  for (const c of r.conflicts ?? []) {
    if (c.targetId === 'RF03') c.sourceRefs = ['SRC_1GEKI_SETTING', 'SRC_NANA_SETTING'];
    if (c.targetId === 'RF04') c.sourceRefs = ['SRC_NANA_AT_END'];
  }
  write(p, r);
}

console.log('Applied Phase 4 provenance fixes to 2 ResearchData files.');
