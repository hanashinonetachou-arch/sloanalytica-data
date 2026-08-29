import fs from 'node:fs';

const targets = [
  {
    machineId: 'L_HANABI_KM',
    service: 'ユニメモ',
    source: {
      sourceId: 'OBS_SRC_UNIMEMO_OFFICIAL',
      publisher: 'ユニバーサルエンターテインメント',
      title: 'ユニメモ 対応機種一覧',
      url: 'https://www.universal-777.com/fun/unimemo/',
      checkedAt: '2026-08-29',
      sourceType: 'official'
    }
  },
  {
    machineId: 'L_BASILISK_KIZUNA2_TENZEN_ZN',
    service: 'ユニメモ',
    source: {
      sourceId: 'OBS_SRC_UNIMEMO_OFFICIAL',
      publisher: 'ユニバーサルエンターテインメント',
      title: 'ユニメモ 対応機種一覧',
      url: 'https://www.universal-777.com/fun/unimemo/',
      checkedAt: '2026-08-29',
      sourceType: 'official'
    }
  },
  {
    machineId: 'L_CODE_GEASS_REVIVAL_ZS',
    service: 'マイスロ',
    source: {
      sourceId: 'OBS_SRC_MYSLOT_OFFICIAL',
      publisher: 'サミー株式会社',
      title: 'マイスロ NEWS',
      url: 'https://www.sammy.co.jp/japanese/myslot/news/',
      checkedAt: '2026-08-29',
      sourceType: 'official'
    }
  },
  {
    machineId: 'L_DISCUP_ULTRA_REMIX_XR',
    service: 'マイスロ',
    source: {
      sourceId: 'OBS_SRC_MYSLOT_OFFICIAL',
      publisher: 'サミー株式会社',
      title: 'マイスロ NEWS',
      url: 'https://www.sammy.co.jp/japanese/myslot/news/',
      checkedAt: '2026-08-29',
      sourceType: 'official'
    }
  }
];

for (const t of targets) {
  const path = `research/${t.machineId}/machine-observation-data.json`;
  const data = JSON.parse(fs.readFileSync(path, 'utf8'));
  data.sources ??= [];
  if (!data.sources.some(s => s.sourceId === t.source.sourceId && s.url === t.source.url)) {
    data.sources.push(t.source);
  }
  data.sourceCoverage ??= {};
  data.sourceCoverage.linkedService = 'FOUND';

  if (t.machineId === 'L_DISCUP_ULTRA_REMIX_XR') {
    const v = (data.fieldVerificationItems ?? []).find(x => x.verificationId === 'FV_LINKED_SERVICE');
    if (v) {
      v.question = 'マイスロ対応自体はサミー公式NEWSで確認済み。ULTRAREMIXで取得できる具体的なゲーム数・小役・ボーナス・REG示唆等の項目を実機結果画面で確認する。具体項目未確認のためactive Featureの自動取得扱いにはしない。';
    }
  }

  const generic = (data.fieldVerificationItems ?? []).find(x => x.priority === 'LOW' && /実機連動機能/.test(x.question ?? ''));
  if (generic) {
    generic.question = `${t.service}対応自体はメーカー公式情報で確認済み。筐体メニュー・データカウンター、および${t.service}で取得できる機種固有の具体項目を確認する。現行active Featureの入力契約は変更しない。`;
  }

  fs.writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
  console.log(`UPDATED ${t.machineId} linkedService=${t.service}`);
}
