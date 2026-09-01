#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const batch = [
  [192,'L_MAGIA_RECORD_RN','スマスロ マギアレコード 魔法少女まどか☆マギカ外伝'],
  [193,'L_GODZILLA_NS','Lゴジラ'],
  [194,'L_USHIO_TORA_HAKUMEN_VH','Lうしおととら 白面決戦'],
  [195,'L_AMAZING_LIVE_PD','スマート沖スロ アメイジングライブ'],
  [196,'L_YOSHIMUNE_SC2','吉宗'],
  [197,'L_MAHJONG_MONOGATARI_S2','L麻雀物語'],
  [198,'L_IDOLMASTER_MILLION_LIVE_HC','スマスロ アイドルマスター ミリオンライブ！ ネクストプロローグ'],
  [199,'L_YOUJITSU_DE','スマスロ ようこそ実力至上主義の教室へ'],
  [200,'L_MIDORIDON_VIVA_REVIVAL_FY','スマスロ 緑ドン VIVA!情熱南米編 REVIVAL'],
  [201,'L_GUNDAM_SEED_G','Lパチスロ 機動戦士ガンダムSEED'],
];

const known = {
  L_MAGIA_RECORD_RN:{linkedService:'FOUND',linkedServiceName:'UniMemo',machineMenu:'UNRESOLVED'},
  L_GODZILLA_NS:{linkedService:'UNRESOLVED',machineMenu:'FOUND'},
  L_IDOLMASTER_MILLION_LIVE_HC:{linkedService:'FOUND',linkedServiceName:'SloPla NEXT',machineMenu:'UNRESOLVED'},
  L_MIDORIDON_VIVA_REVIVAL_FY:{linkedService:'FOUND',linkedServiceName:'UniMemo',machineMenu:'UNRESOLVED'},
  L_YOUJITSU_DE:{linkedService:'CHECKED_NONE',machineMenu:'FOUND'},
};

const semanticLocks = {
  L_AMAZING_LIVE_PD:{
    FEAT_BONUS_FIRST_HIT:[
      'BIG出現率・REG出現率・BIG+REG合算を独立尤度として併用しない',
      '初当りの境界と連チャン除外条件が不明なままデータカウンターのボーナス回数を流用しない',
      '設定Lを運用設定として保持し、存在しない設定3を生成しない',
    ],
  },
  L_MAHJONG_MONOGATARI_S2:{
    FEAT_DIRECT_AT:[
      '解析定義のAT直撃は前兆昇格を除外する',
      '前兆昇格込みの実戦AT直撃を同一Featureへ混在させない',
      'Bonus初当り・AT初当りトータル・Bonus-or-AT合算を独立尤度として併用しない',
    ],
  },
  L_YOUJITSU_DE:{
    FEAT_DAXEL_FLASH:['分母はCZ成功回数。CZ突入回数や通常ゲーム数へ置換しない'],
    FEAT_NORMAL_CYCLE_CZ_TYPE:['分母は通常周期でCZ当選した回数。レア役昇格を混ぜない'],
    FEAT_RED_BUTTON:['分母は対象連続演出の成功回数。全演出回数や通常ゲーム数へ置換しない'],
  },
  L_MIDORIDON_VIVA_REVIVAL_FY:{
    FEAT_HIGH_TRANSITION:['対象状態・対象成立契機・その抽選を受けた機会だけを分母にする'],
    FEAT_NORMAL_BONUS_WEAK_CHERRY:['通常滞在×弱チェリー成立機会だけを分母にする','ボーナス初当りとの二重評価を避ける'],
    FEAT_NORMAL_BONUS_WEAK_WAVE:['通常滞在×弱波成立機会だけを分母にする','ボーナス初当りとの二重評価を避ける'],
    FEAT_NORMAL_BONUS_CHANCE:['通常滞在×チャンス目成立機会だけを分母にする','ボーナス初当りとの二重評価を避ける'],
    FEAT_NORMAL_BONUS_STRONG_CHERRY:['通常滞在×強チェリー成立機会だけを分母にする','ボーナス初当りとの二重評価を避ける'],
    FEAT_NORMAL_BONUS_STRONG_WAVE:['通常滞在×強波成立機会だけを分母にする','ボーナス初当りとの二重評価を避ける'],
    FEAT_HIGH_BONUS_WEAK_WAVE:['高確滞在×弱波成立機会だけを分母にする','ボーナス初当りとの二重評価を避ける'],
  },
  L_GUNDAM_SEED_G:{
    FEAT_POST_RESET_ST_100G:[
      'resetまたはST終了後を1 opportunityとして数える',
      '0-49G・50-99G・100G以降のカテゴリ試行をper-game probabilityへ変換しない',
      'AT初当りが利用可能な区間ではSelectionのsuppression契約を保持する',
    ],
  },
};

const inputRefs = f => [...new Set([
  f.numeratorInputId,
  ...(f.categoryInputIds ?? []),
  f.denominatorInputId,
  ...(f.denominatorInputIds ?? []),
].filter(Boolean))];

for (const [provisionalRegistrationId,machineId,displayName] of batch) {
  const dir = path.join(root,'research',machineId);
  const selectionFile = path.join(dir,'selection-data.json');
  if (!fs.existsSync(selectionFile)) throw new Error(`${machineId}: selection-data.json missing`);
  const selection = JSON.parse(fs.readFileSync(selectionFile,'utf8'));
  const inputById = new Map((selection.inputs ?? []).map(i => [i.id,i]));
  const adopted = (selection.features ?? []).filter(f => String(f.adoptionCategory ?? '').startsWith('INCLUDE'));
  const observations = [];
  const featureMappings = [];

  for (const feature of adopted) {
    const refs = inputRefs(feature);
    const names = refs.map(id => inputById.get(id)?.name ?? id);
    const suffix = feature.featureId.replace(/^FEAT_/,'');
    const obsId = `OBS_${suffix}`;
    const conditional = feature.adoptionCategory === 'INCLUDE_FALLBACK' || Boolean(feature.inputTransform) || refs.length > 2;
    const locks = semanticLocks[machineId]?.[feature.featureId] ?? [];
    observations.push({
      observationId: obsId,
      sourceType: 'DIRECT_PLAY',
      observationMode: 'MANUAL_COUNTER',
      status: 'FOUND',
      label: names.join('・') || feature.featureId,
      categories: names,
      timing: ['自己実戦中、SelectionDataで定義された対象試行・対象イベント成立時に更新'],
      excludedConditions: [
        'SelectionDataの分母定義外の遊技状態・試行を混ぜない',
        '着席前累積値を自己実戦値へ混ぜない',
        '未観測を観測済み0として扱わない',
        ...(conditional ? ['条件付き母集団を総通常ゲームへ平坦化しない'] : []),
        ...locks,
      ],
      sourceRefs: [],
      notes: `Selection ${feature.featureId} (${feature.adoptionCategory}) の入力契約を保持。${feature.userReason ?? ''}`,
    });
    featureMappings.push({
      featureId: feature.featureId,
      mappingType: feature.inputTransform || (feature.categoryInputIds?.length ?? 0) ? 'COMBINABLE' : 'EXACT',
      observationIds: [obsId],
      collectionMethods: ['MANUAL_COUNTER'],
      usableForInference: true,
      usableForDifficulty: false,
      notes: 'Gate C写像。Difficulty exposureは取得単位・event exposureを確定するまで未参加。',
    });
  }

  const evidence = selection.evidence ?? [];
  if (evidence.length) {
    observations.push({
      observationId: 'OBS_HARD_EVIDENCE_EVENTS',
      sourceType: 'END_EVENT',
      observationMode: 'VISUAL_EVENT',
      status: 'FOUND',
      label: '設定確定・否定情報',
      categories: evidence.map(e => e.displayName ?? e.name ?? e.evidenceId),
      timing: ['各Evidenceの成立タイミングで即時確認'],
      excludedConditions: ['傾向示唆をHard Evidenceへ昇格させない','同一表示のHard部分以外を設定確定情報として扱わない'],
      sourceRefs: [],
      notes: 'SelectionData evidenceに採用済みのHard Evidenceのみ。',
    });
  }

  const profile = known[machineId] ?? {};
  if (machineId === 'L_MAGIA_RECORD_RN') {
    observations.push({
      observationId:'OBS_LINKED_SERVICE_UNIMEMO',sourceType:'LINKED_SERVICE',observationMode:'LINKED_SERVICE_READ',status:'FOUND',label:'ユニメモ遊技履歴',
      categories:['総プレイ数','通常プレイ数','ボーナス中プレイ数','マギアラッシュ中プレイ数','総ボーナス','弱チェリー','強チェリー','スイカ','チャンス目A','チャンス目B','CZ実績'],
      timing:['ユニメモ起動後、遊技中または遊技終了時に遊技履歴を確認'],
      excludedConditions:['ユニメモ未起動区間を取得済みとして扱わない','スイカ→CZは魔法少女モード「さな」等の条件差を無視して単純合算しない','CZ前兆中スイカの上位CZ昇格を通常スイカCZ当選と混同しない'],
      sourceRefs:['https://www.universal-777.com/fun/unimemo/','https://note.com/suisan_rakuraku/n/n5b7021aa2dda','https://1geki.jp/slot/l_magireco/0/','https://slonuu.com/pg/magirecounimemo'],notes:'公式UniMemo対応機種一覧と公開遊技履歴例・解析情報から取得項目を確認。',
    });
  }
  if (machineId === 'L_GODZILLA_NS') {
    observations.push({
      observationId:'OBS_MACHINE_MENU_HISTORY',sourceType:'MACHINE_MENU',observationMode:'MENU_READ',status:'FOUND',label:'PUSHメニュー 当日遊技履歴',
      categories:['当日の遊技履歴','メニュー画面キャラクター/乗り物'],timing:['PUSHボタンでメニューを開いて確認'],
      excludedConditions:['当日累積履歴の具体的な数値項目がWebで未特定のため、AT初当り分母へ直接流用しない','キャラクター/乗り物の傾向示唆をHard Evidenceへ昇格させない'],
      sourceRefs:['https://hazuse.com/machine/pachislot/SX0099/genre/202/','https://www.p-world.co.jp/machine/database/10239'],notes:'液晶左部に当日の遊技履歴が表示されることを複数公開ソースで確認。具体的履歴項目は実機確認対象。',
    });
  }
  if (machineId === 'L_IDOLMASTER_MILLION_LIVE_HC') {
    observations.push({
      observationId:'OBS_LINKED_SERVICE_SLOPLA_NEXT',sourceType:'LINKED_SERVICE',observationMode:'LINKED_SERVICE_READ',status:'FOUND',label:'スロプラNEXT遊技履歴',
      categories:['総ゲーム数','通常ゲーム数','ボーナス初当り','グロウアップチャレンジ','チェリー','スイカ','チャンスベル','デュオ役A','デュオ役B','デュオ役C','ミリシタ目'],
      timing:['遊技中または遊技終了時にスロプラNEXT履歴を確認'],excludedConditions:['サービス表示値と公開解析の分母定義が一致しない項目をそのまま推測へ流用しない'],
      sourceRefs:['https://www.yamasa-next.co.jp/slp/model/01/history/tmp/e64d871e-27ad-40a8-8035-3e98b0717e85'],notes:'公開されたスロプラNEXT途中経過ページで具体項目を確認。',
    });
  }
  if (machineId === 'L_YOUJITSU_DE') {
    observations.push({
      observationId:'OBS_MACHINE_MENU_HISTORY',sourceType:'MACHINE_MENU',observationMode:'MENU_READ',status:'FOUND',label:'遊技履歴表示',
      categories:['総ゲーム数','通常時ゲーム数','CZ回数','AT回数','レア小役確率'],timing:['当日遊技中にユーザーメニューから確認'],
      excludedConditions:['当日累積値を自己実戦区間として利用する場合は着席時スナップショットとの差分が必要','CZ種別や条件付きSupportの分母へ総ゲーム数を代用しない'],
      sourceRefs:['https://cs62.cs-plaza.com/g/pachi/pla/s_conq/daxel_slot/18/kr05.php','https://nana-press.com/kaiseki/machine/935/29511/'],notes:'公開攻略情報で遊技履歴表示の具体項目を確認。',
    });
  }
  if (machineId === 'L_MIDORIDON_VIVA_REVIVAL_FY') {
    observations.push({
      observationId:'OBS_LINKED_SERVICE_UNIMEMO',sourceType:'LINKED_SERVICE',observationMode:'LINKED_SERVICE_READ',status:'FOUND',label:'ユニメモ小役履歴',
      categories:['弱チェリー','弱波'],timing:['ユニメモ起動後、遊技中または遊技終了時に履歴を確認'],
      excludedConditions:['ユニメモ未起動区間を取得済みとして扱わない','状態×成立役のFallback分母を小役総回数だけから推定しない'],
      sourceRefs:['https://www.universal-777.com/fun/unimemo/','https://pachiseven.jp/articles/detail/24710'],notes:'公式UniMemo対応機種一覧と実戦解説で弱チェリー・弱波をUniMemoが計数することを確認。',
    });
  }

  const sourceCoverage = {
    machineMenu: profile.machineMenu ?? 'UNRESOLVED',
    dataCounter: 'UNRESOLVED',
    linkedService: profile.linkedService ?? 'UNRESOLVED',
    directPlay: 'FOUND',
    endEvent: evidence.length ? 'FOUND' : 'NOT_REQUIRED',
    seatedState: 'UNRESOLVED',
  };

  const fieldVerificationItems = [];
  if (sourceCoverage.machineMenu === 'UNRESOLVED') fieldVerificationItems.push({verificationId:`VFY_${machineId}_MACHINE_MENU`,status:'WAITING_FOR_MACHINE',sourceType:'MACHINE_MENU',priority:'MEDIUM',question:'Web調査で具体項目を確定できなかった筐体メニュー/遊技履歴について、総G・通常G・CZ・Bonus・AT・小役・履歴項目を実機で確認する。'});
  if (sourceCoverage.dataCounter === 'UNRESOLVED') fieldVerificationItems.push({verificationId:`VFY_${machineId}_DATA_COUNTER`,status:'WAITING_FOR_MACHINE',sourceType:'DATA_COUNTER',priority:'HIGH',question:'ホールのデータカウンターで総G・現在G・Bonus・AT・CZ・初当り・履歴のどこまで取得でき、公開解析の分母と一致するか確認する。ホール設備依存のためWebだけでは最終確定しない。'});
  if (sourceCoverage.seatedState === 'UNRESOLVED') fieldVerificationItems.push({verificationId:`VFY_${machineId}_SEATED_STATE`,status:'WAITING_FOR_MACHINE',sourceType:'SEATED_STATE',priority:'HIGH',question:'着席直後に実機メニュー/データカウンターから取得できる累積値を確認し、前任者区間を安全に利用可能なSelection Featureがあるか判定する。'});
  if (sourceCoverage.linkedService === 'UNRESOLVED') fieldVerificationItems.push({verificationId:`VFY_${machineId}_LINKED_SERVICE`,status:'WAITING_FOR_MACHINE',sourceType:'LINKED_SERVICE',priority:'MEDIUM',question:'Web調査では機種固有の実機連動サービス/QR機能を確定できていない。実機メニュー上のQR/連動導線の有無を確認する。一般的な系列サービスの存在だけでFOUNDにしない。'});
  if (machineId === 'L_GODZILLA_NS') fieldVerificationItems.push({verificationId:'VFY_L_GODZILLA_NS_MENU_HISTORY_FIELDS',status:'WAITING_FOR_MACHINE',sourceType:'MACHINE_MENU',priority:'HIGH',question:'PUSHメニュー左側の「当日の遊技履歴」に表示される具体的数値項目を確認し、AT初当り・襲来ZONE対戦相手等へ安全に利用できるか判定する。'});
  if (machineId === 'L_AMAZING_LIVE_PD') fieldVerificationItems.push({verificationId:'VFY_L_AMAZING_LIVE_PD_FIRST_HIT_BOUNDARY',status:'WAITING_FOR_MACHINE',sourceType:'MACHINE_MENU',priority:'HIGH',question:'ボーナス初当りの実機上の境界、連チャン扱い/除外条件、および初当り回数を取得できる表示の有無を確認する。BIG/REG/合算回数を代用しない。'});

  const out = {
    schemaVersion:'machine-observation-data-v2',machineId,displayName,provisionalRegistrationId,researchedAt:'2026-09-01',sources:[],sourceCoverage,
    observations,featureMappings,researchReopenRequests:[],fieldVerificationItems,
  };
  fs.writeFileSync(path.join(dir,'machine-observation-data.json'),JSON.stringify(out,null,2)+'\n');
  console.log(`${machineId}: observations=${observations.length} mappings=${featureMappings.length} evidence=${evidence.length}`);
}
