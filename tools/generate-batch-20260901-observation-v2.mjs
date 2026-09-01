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
  L_IDOLMASTER_MILLION_LIVE_HC:{linkedService:'FOUND',linkedServiceName:'SloPla NEXT',machineMenu:'UNRESOLVED'},
  L_MIDORIDON_VIVA_REVIVAL_FY:{linkedService:'FOUND',linkedServiceName:'UniMemo',machineMenu:'UNRESOLVED'},
  L_YOUJITSU_DE:{linkedService:'CHECKED_NONE',machineMenu:'FOUND'},
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
      notes: 'Gate C初期写像。Difficulty exposureは取得単位・event exposureを確定するまで未参加。',
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
  if (machineId === 'L_IDOLMASTER_MILLION_LIVE_HC') {
    observations.push({
      observationId:'OBS_LINKED_SERVICE_SLOPLA_NEXT',sourceType:'LINKED_SERVICE',observationMode:'LINKED_SERVICE_READ',status:'FOUND',
      label:'スロプラNEXT遊技履歴',
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

  const sourceCoverage = {
    machineMenu: profile.machineMenu ?? 'UNRESOLVED',
    dataCounter: 'UNRESOLVED',
    linkedService: profile.linkedService ?? 'UNRESOLVED',
    directPlay: 'FOUND',
    endEvent: evidence.length ? 'FOUND' : 'NOT_REQUIRED',
    seatedState: 'UNRESOLVED',
  };

  const fieldVerificationItems = [];
  if (sourceCoverage.machineMenu === 'UNRESOLVED') fieldVerificationItems.push({verificationId:`VFY_${machineId}_MACHINE_MENU`,status:'WAITING_FOR_MACHINE',sourceType:'MACHINE_MENU',priority:'MEDIUM',question:'筐体メニュー/遊技履歴で取得できる総G・通常G・CZ・Bonus・AT・小役・履歴項目を確認する。Webで追加確認できる情報は先に解消する。'});
  if (sourceCoverage.dataCounter === 'UNRESOLVED') fieldVerificationItems.push({verificationId:`VFY_${machineId}_DATA_COUNTER`,status:'WAITING_FOR_MACHINE',sourceType:'DATA_COUNTER',priority:'HIGH',question:'ホールのデータカウンターで総G・現在G・Bonus・AT・CZ・初当り・履歴のどこまで取得でき、公開解析の分母と一致するか確認する。'});
  if (sourceCoverage.seatedState === 'UNRESOLVED') fieldVerificationItems.push({verificationId:`VFY_${machineId}_SEATED_STATE`,status:'WAITING_FOR_MACHINE',sourceType:'SEATED_STATE',priority:'HIGH',question:'着席直後に取得できる累積値を確認し、前任者区間を安全に利用可能なSelection Featureがあるか判定する。'});
  if (sourceCoverage.linkedService === 'UNRESOLVED') fieldVerificationItems.push({verificationId:`VFY_${machineId}_LINKED_SERVICE`,status:'WAITING_FOR_MACHINE',sourceType:'LINKED_SERVICE',priority:'MEDIUM',question:'機種固有の実機連動サービス/QR機能の有無と、存在する場合の具体的取得項目を確認する。一般的な系列サービスの存在だけでFOUNDにしない。'});

  const out = {
    schemaVersion:'machine-observation-data-v2',machineId,displayName,provisionalRegistrationId,researchedAt:'2026-09-01',sources:[],sourceCoverage,
    observations,featureMappings,researchReopenRequests:[],fieldVerificationItems,
  };
  fs.writeFileSync(path.join(dir,'machine-observation-data.json'),JSON.stringify(out,null,2)+'\n');
  console.log(`${machineId}: observations=${observations.length} mappings=${featureMappings.length} evidence=${evidence.length}`);
}
