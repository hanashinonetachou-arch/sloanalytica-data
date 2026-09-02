import fs from 'node:fs';

function readJson(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
function writeJson(file, value) { fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`); }
function upsertById(array, idKey, item) {
  const idx = array.findIndex((x) => x?.[idKey] === item[idKey]);
  if (idx >= 0) array[idx] = item;
  else array.push(item);
}

// 1) Refine the section-title review: paired count/trial inputs with one shared semantic
// stem are a valid group title. Only peer-category groups named after their first item
// should be reviewed.
{
  const file = 'tools/audit-batch8-latest-manifest.mjs';
  let src = fs.readFileSync(file, 'utf8');
  const oldBlock = `    if ((section?.inputIds?.length ?? 0) > 1) {\n      const firstId = section.inputIds[0];\n      const firstName = ui.inputContracts?.[firstId]?.name ?? inputById.get(firstId)?.name ?? '';\n      if (firstName && (title === firstName || firstName.startsWith(\`${'${title}'} \`) || title === firstName.replace(/\\s+(回数|試行数)$/,''))) {\n        add(result, 'REVIEW', 'FIRST_ITEM_SECTION_TITLE_RISK', \`Section title may be derived from the first input rather than the semantic group: ${'${title}'}\`, { section: title, firstInput: firstName });\n      }\n    }`;
  const newBlock = `    if ((section?.inputIds?.length ?? 0) > 1) {\n      const names = section.inputIds.map(id => ui.inputContracts?.[id]?.name ?? inputById.get(id)?.name ?? '').filter(Boolean);\n      const stripMeasure = (name) => name.replace(/\\s+(回数|試行数)$/,'').trim();\n      const stems = [...new Set(names.map(stripMeasure))];\n      const pairedMeasureGroup = stems.length === 1 && stems[0] === title;\n      const firstName = names[0] ?? '';\n      if (!pairedMeasureGroup && firstName && (title === firstName || firstName.startsWith(\`${'${title}'} \`) || title === stripMeasure(firstName))) {\n        add(result, 'REVIEW', 'FIRST_ITEM_SECTION_TITLE_RISK', \`Section title may be derived from the first input rather than the semantic group: ${'${title}'}\`, { section: title, firstInput: firstName });\n      }\n    }`;
  if (src.includes(oldBlock)) src = src.replace(oldBlock, newBlock);
  else if (!src.includes('const pairedMeasureGroup = stems.length === 1 && stems[0] === title;')) {
    throw new Error('Could not locate section-title audit block');
  }
  fs.writeFileSync(file, src);
}

// 2) Yoshimune: web research resolves the linked-service existence and concrete useful
// fields. Keep denominator compatibility as a field-verification item; do not infer it.
{
  const researchFile = 'research/L_YOSHIMUNE_SC2/research-data.json';
  const research = readJson(researchFile);
  research.sources ??= [];
  upsertById(research.sources, 'sourceId', {
    sourceId: 'SRC_DAITOMO_OFFICIAL',
    publisher: 'パオン・ディーピー / 大都技研',
    title: '大都技研の実機連動サービス「ダイトモ」',
    url: 'https://paon-dp.com/products/daitomo/',
    checkedAt: '2026-09-02',
    sourceType: 'official'
  });
  upsertById(research.sources, 'sourceId', {
    sourceId: 'SRC_DAITOMO_YOSHIMUNE_RELEASE',
    publisher: 'パオン・ディーピー',
    title: '「大都吉宗CITY」公式情報アプリ ダイトモ新機種追加のお知らせ',
    url: 'https://paon-dp.com/news20250414/',
    checkedAt: '2026-09-02',
    sourceType: 'official'
  });
  upsertById(research.sources, 'sourceId', {
    sourceId: 'SRC_NANA_YOSHIMUNE_SETTING',
    publisher: 'なな徹',
    title: 'スマスロ吉宗 設定差・設定示唆演出まとめ',
    url: 'https://nana-press.com/kaiseki/machine/920/29003/',
    checkedAt: '2026-09-02',
    sourceType: 'major_analysis'
  });
  upsertById(research.sources, 'sourceId', {
    sourceId: 'SRC_ALTEMA_YOSHIMUNE_TAWARA',
    publisher: 'アルテマ',
    title: '吉宗 スマスロ 共通俵の出現率と設定差',
    url: 'https://altema.jp/pachimo/lyosimune2tawara',
    checkedAt: '2026-09-02',
    sourceType: 'analysis'
  });
  research.linkedServiceResearch = {
    status: 'FOUND',
    serviceName: 'ダイトモ',
    sourceRefs: ['SRC_DAITOMO_OFFICIAL', 'SRC_DAITOMO_YOSHIMUNE_RELEASE', 'SRC_NANA_YOSHIMUNE_SETTING', 'SRC_ALTEMA_YOSHIMUNE_TAWARA'],
    observedFields: ['遊技履歴', '総プレイ数', 'ボーナス回数', '小役確率', '共通12枚俵', '初当たり契機'],
    notes: '公式対応機種一覧と吉宗追加告知でダイトモ対応を確認。攻略情報で吉宗では共通俵が「共通12枚俵」として自動カウントされ、小役確率・初当たり契機を確認できることを確認。解析上の共通俵分母との完全一致は実機表示で最終確認する。'
  };
  writeJson(researchFile, research);

  const obsFile = 'research/L_YOSHIMUNE_SC2/machine-observation-data.json';
  const obs = readJson(obsFile);
  obs.sources ??= [];
  for (const s of research.sources.filter((x) => x.sourceId.startsWith('SRC_DAITOMO') || x.sourceId.includes('YOSHIMUNE'))) upsertById(obs.sources, 'sourceId', s);
  obs.sourceCoverage.linkedService = 'FOUND';
  upsertById(obs.observations, 'observationId', {
    observationId: 'OBS_DAITOMO_HISTORY',
    sourceType: 'LINKED_SERVICE',
    observationMode: 'LINKED_SERVICE_READ',
    status: 'FOUND',
    label: 'ダイトモ遊技履歴',
    categories: ['遊技履歴', '総プレイ数', 'ボーナス回数', '小役確率', '共通12枚俵', '初当たり契機'],
    timing: ['遊技開始前にダイトモを連携し、遊技中または遊技終了時に確認'],
    excludedConditions: [
      '共通12枚俵の集計対象ゲームが解析上の共通俵分母と一致することを未確認のまま分母へ自動転記しない',
      '初当たり契機の履歴をBIG/REG初当り回数そのものの代用にしない'
    ],
    sourceRefs: ['SRC_DAITOMO_OFFICIAL', 'SRC_DAITOMO_YOSHIMUNE_RELEASE', 'SRC_NANA_YOSHIMUNE_SETTING', 'SRC_ALTEMA_YOSHIMUNE_TAWARA'],
    notes: 'ダイトモ対応と吉宗固有の共通12枚俵カウントをWebで確認済み。利用できる項目は補助取得元として扱い、分母境界が一致する項目だけを推測入力へ接続する。'
  });
  obs.fieldVerificationItems = (obs.fieldVerificationItems ?? []).filter((x) => x.verificationId !== 'VFY_L_YOSHIMUNE_SC2_LINKED_SERVICE');
  upsertById(obs.fieldVerificationItems, 'verificationId', {
    verificationId: 'VFY_L_YOSHIMUNE_SC2_DAITOMO_DENOMINATOR',
    status: 'WAITING_FOR_MACHINE',
    sourceType: 'LINKED_SERVICE',
    priority: 'HIGH',
    question: 'ダイトモの「共通12枚俵」がどの遊技状態を集計し、同画面の総プレイ数等から解析上の「共通俵を同条件で観測可能なゲーム数」を正確に構成できるか確認する。'
  });
  writeJson(obsFile, obs);
}

// 3) Green Don: strengthen the already-FOUND Unimemo path with current official support
// evidence and an explicit field observation. This does not restore latent-state features.
{
  const obsFile = 'research/L_MIDORIDON_VIVA_REVIVAL_FY/machine-observation-data.json';
  const obs = readJson(obsFile);
  obs.sources ??= [];
  upsertById(obs.sources, 'sourceId', {
    sourceId: 'SRC_UNIMEMO_OFFICIAL',
    publisher: 'ユニバーサルエンターテインメント',
    title: 'ユニメモ 対応機種一覧',
    url: 'https://universal-777.com/fun/unimemo/',
    checkedAt: '2026-09-02',
    sourceType: 'official'
  });
  upsertById(obs.sources, 'sourceId', {
    sourceId: 'SRC_GREEN_DON_UNIMEMO_COUNT',
    publisher: 'パチ7',
    title: 'スマスロ 緑ドン VIVA!情熱南米編 REVIVAL 設定6挙動まとめ',
    url: 'https://pachiseven.jp/articles/detail/24710',
    checkedAt: '2026-09-02',
    sourceType: 'analysis'
  });
  upsertById(obs.observations, 'observationId', {
    observationId: 'OBS_UNIMEMO_SMALL_ROLES',
    sourceType: 'LINKED_SERVICE',
    observationMode: 'LINKED_SERVICE_READ',
    status: 'FOUND',
    label: 'ユニメモ小役カウント',
    categories: ['弱チェリー', '弱波'],
    timing: ['ユニメモ連携後の遊技履歴確認時'],
    excludedConditions: [
      'ユニメモを開始していない区間を同一集計へ混ぜない',
      '内部状態をユニメモ小役カウントから推測して状態依存Featureを復活させない'
    ],
    sourceRefs: ['SRC_UNIMEMO_OFFICIAL', 'SRC_GREEN_DON_UNIMEMO_COUNT'],
    notes: '公式対応機種一覧で緑ドンREVIVALのユニメモ対応を確認。攻略情報でも弱チェリー・弱波をユニメモが自動カウントすると確認できる。'
  });
  writeJson(obsFile, obs);
}

console.log('Resolved web-solvable batch8 debt for audit semantics, Yoshimune Daitomo, and Green Don Unimemo.');
