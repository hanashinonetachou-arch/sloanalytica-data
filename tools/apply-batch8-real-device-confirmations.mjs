import fs from 'node:fs';

function readJson(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
function writeJson(file, value) { fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`); }
function upsertById(array, idKey, item) {
  const idx = array.findIndex((x) => x?.[idKey] === item[idKey]);
  if (idx >= 0) array[idx] = item;
  else array.push(item);
}
function removeVerification(obs, ...ids) {
  obs.fieldVerificationItems = (obs.fieldVerificationItems ?? []).filter((x) => !ids.includes(x.verificationId));
}
function setInput(selection, id, patch) {
  const input = selection.inputs?.find((x) => x.id === id);
  if (input) Object.assign(input, patch);
}
function setUiInput(ui, id, patch) {
  if (ui.inputContracts?.[id]) Object.assign(ui.inputContracts[id], patch);
}

// User-confirmed common rule for cabinet history in SloAnalytica Observation:
// unless a machine-specific source says otherwise, do not assume history survives power OFF/ON
// or a setting change. Same-day displayed cumulative history can be used only within its visible reset boundary.

// Amazing Live: no LCD/menu. Continuation zone is through 33G; first hit is 34G+.
{
  const obsFile = 'research/L_AMAZING_LIVE_PD/machine-observation-data.json';
  const obs = readJson(obsFile);
  obs.researchedAt = '2026-09-02';
  obs.sourceCoverage.machineMenu = 'CHECKED_NONE';
  const first = obs.observations.find((x) => x.observationId === 'OBS_BONUS_FIRST_HIT');
  if (first) {
    first.label = 'ボーナス初当り 回数・初当り対象ゲーム数';
    first.categories = ['ボーナス初当り 回数', '初当り対象ゲーム数'];
    first.timing = ['自己実戦中、前回ボーナス後34G以降で最初に成立したボーナスを初当りとして更新'];
    first.excludedConditions = [
      '前回ボーナス後1〜33Gの連チャンゾーン中の当りを初当りへ含めない',
      '初当り対象ゲーム数にも1〜33Gの連チャンゾーンを含めない',
      'BIG/REG種別やBIG+REG合算回数を初当り回数の代用にしない',
      '着席前累積値を自己実戦値へ混ぜない',
      '未観測を観測済み0として扱わない'
    ];
    first.notes = '液晶非搭載で筐体メニュー/遊技履歴画面なし。33Gまでを連チャンゾーンとし、34G以降の最初のボーナスを初当りとして数える。分母も同じ初当り抽選対象ゲームのみ。';
  }
  removeVerification(obs,
    'VFY_L_AMAZING_LIVE_PD_MACHINE_MENU',
    'VFY_L_AMAZING_LIVE_PD_FIRST_HIT_BOUNDARY'
  );
  for (const item of obs.fieldVerificationItems ?? []) {
    if (item.verificationId === 'VFY_L_AMAZING_LIVE_PD_DATA_COUNTER' || item.verificationId === 'VFY_L_AMAZING_LIVE_PD_SEATED_STATE') item.priority = 'LOW';
  }
  writeJson(obsFile, obs);

  const selFile = 'research/L_AMAZING_LIVE_PD/selection-data.json';
  const sel = readJson(selFile);
  setInput(sel, 'INP_BONUS_FIRST_HIT_TRIALS', { name: '初当り対象ゲーム数', unit: 'G' });
  writeJson(selFile, sel);
  const uiFile = 'research/L_AMAZING_LIVE_PD/ui-design-data.json';
  const ui = readJson(uiFile);
  setUiInput(ui, 'INP_BONUS_FIRST_HIT_TRIALS', { name: '初当り対象ゲーム数' });
  const section = ui.sections?.['ボーナス初当り'];
  if (section) section.description = '前回ボーナス後1〜33Gの連チャンゾーンを除外し、34G以降の初当り回数と対象ゲーム数を入力します。';
  writeJson(uiFile, ui);
}

// Ushio & Tora: PUSH history exists. AT is always reached through a successful CZ path,
// including ceiling/long-freeze routes, so AT first-hit can be reconstructed from menu history.
{
  const obsFile = 'research/L_USHIO_TORA_HAKUMEN_VH/machine-observation-data.json';
  const obs = readJson(obsFile);
  obs.researchedAt = '2026-09-02';
  obs.sourceCoverage.machineMenu = 'FOUND';
  upsertById(obs.observations, 'observationId', {
    observationId: 'OBS_MACHINE_MENU_HISTORY',
    sourceType: 'MACHINE_MENU',
    observationMode: 'MENU_READ',
    status: 'FOUND',
    label: 'PUSHメニュー当選履歴',
    categories: ['うしとらチャンス確率', 'BONUS間ゲーム数', '当選履歴', 'うしとらチャンス当選ゲーム数', 'うしとらBONUS当選ゲーム数・連数'],
    timing: ['着席時および遊技中にPUSHメニューの当選履歴を確認'],
    excludedConditions: [
      '表示履歴のリセット境界をまたいだ値を合算しない',
      '電源OFF/ONまたは設定変更をまたいで履歴が残る前提を置かない',
      '履歴に表示されない区間を推定で補完しない'
    ],
    sourceRefs: [],
    notes: 'ユーザー提供のインターネット画像でPUSHメニューの当選履歴表示を確認。ユーザー機種知識によりAT直撃はなく、天井・ロングフリーズも成功確定CZを経由するため、表示範囲内ではCZ当選ゲーム数の合計から通常ゲーム数、成功CZ数からAT初当りを再構成できる。実機撮影ではないためMACHINE_VERIFIEDには昇格しない。'
  });
  const mapping = obs.featureMappings?.find((x) => x.featureId === 'FEAT_AT_FIRST_HIT');
  if (mapping) {
    mapping.observationIds = [...new Set([...(mapping.observationIds ?? []), 'OBS_MACHINE_MENU_HISTORY'])];
    mapping.collectionMethods = [...new Set([...(mapping.collectionMethods ?? []), 'MENU_READ'])];
    mapping.notes = '自己実戦の手動カウントに加え、PUSHメニュー当選履歴の表示範囲から通常ゲーム数とAT初当りを再構成可能。';
  }
  removeVerification(obs, 'VFY_L_USHIO_TORA_HAKUMEN_VH_MACHINE_MENU');
  for (const item of obs.fieldVerificationItems ?? []) {
    if (item.verificationId === 'VFY_L_USHIO_TORA_HAKUMEN_VH_DATA_COUNTER' || item.verificationId === 'VFY_L_USHIO_TORA_HAKUMEN_VH_SEATED_STATE') item.priority = 'LOW';
  }
  writeJson(obsFile, obs);

  const selFile = 'research/L_USHIO_TORA_HAKUMEN_VH/selection-data.json';
  const sel = readJson(selFile);
  setInput(sel, 'INP_AT_FIRST_HIT_TRIALS', { name: '通常ゲーム数', unit: 'G' });
  writeJson(selFile, sel);
  const uiFile = 'research/L_USHIO_TORA_HAKUMEN_VH/ui-design-data.json';
  const ui = readJson(uiFile);
  setUiInput(ui, 'INP_AT_FIRST_HIT_TRIALS', { name: '通常ゲーム数' });
  const atSection = ui.sections?.['AT初当り'];
  if (atSection) {
    atSection.description = '自己実戦で数えるか、PUSHメニューの当選履歴から通常ゲーム数と成功CZ由来のAT初当りを再構成して入力します。';
    atSection.observationRefs = [...new Set([...(atSection.observationRefs ?? []), 'OBS_MACHINE_MENU_HISTORY'])];
    atSection.acquisitionSources = [...new Set([...(atSection.acquisitionSources ?? []), 'MACHINE_MENU'])];
  }
  writeJson(uiFile, ui);
}

// Youjitsu: real-device menu verified. Page 1 is play data, page 2 is small-role data;
// pages 3-7 are customization and are not history. CZ is shown only as a combined count.
{
  const obsFile = 'research/L_YOUJITSU_DE/machine-observation-data.json';
  const obs = readJson(obsFile);
  obs.researchedAt = '2026-09-02';
  obs.sourceCoverage.machineMenu = 'VERIFIED_ON_MACHINE';
  upsertById(obs.observations, 'observationId', {
    observationId: 'OBS_MACHINE_MENU_HISTORY',
    sourceType: 'MACHINE_MENU',
    observationMode: 'MENU_READ',
    status: 'VERIFIED_ON_MACHINE',
    label: '遊技履歴表示',
    categories: [
      '総ゲーム数', '通常ゲーム数', 'よう実CHANCEゲーム数', 'よう実BONUSゲーム数',
      'CZ回数（合算）', 'よう実BONUS回数', 'クラスランク別回数', '実力至上主義ZONE回数',
      '総ゲーム数（小役データ）', 'レア役合算回数・確率', '弱チェリー回数・確率',
      '強チェリー回数・確率', 'スイカ回数・確率', '弱チャンス目回数・確率', '強チャンス目回数・確率'
    ],
    timing: ['1/7「遊技データ」および2/7「小役データ」を確認'],
    excludedConditions: [
      'CZは種類別ではなく合算表示として扱う',
      'CZ種別振り分けの入力へメニューのCZ合算回数を代用しない',
      '3/7以降のカスタム機能を遊技履歴として扱わない',
      '電源OFF/ONまたは設定変更をまたいで履歴が残る前提を置かない'
    ],
    sourceRefs: [],
    notes: 'ユーザー実機画像で確認。例では総891G、通常740G、よう実CHANCE91G、よう実BONUS60G、CZ合算2回。小役ページでは総891Gを基準に各レア役回数・確率を表示。'
  });
  const mapping = obs.featureMappings?.find((x) => x.featureId === 'FEAT_CZ_FIRST_HIT');
  if (mapping) {
    mapping.observationIds = [...new Set([...(mapping.observationIds ?? []), 'OBS_MACHINE_MENU_HISTORY'])];
    mapping.collectionMethods = [...new Set([...(mapping.collectionMethods ?? []), 'MENU_READ'])];
    mapping.notes = 'CZ合算回数と通常ゲーム数は筐体メニューから直接取得可能。CZ種類別Supportはメニューでは取得不可。';
  }
  removeVerification(obs, 'VFY_L_YOUJITSU_DE_DATA_COUNTER', 'VFY_L_YOUJITSU_DE_SEATED_STATE');
  writeJson(obsFile, obs);

  const selFile = 'research/L_YOUJITSU_DE/selection-data.json';
  const sel = readJson(selFile);
  setInput(sel, 'INP_CZ_FIRST_HIT_TRIALS', { name: '通常ゲーム数', unit: 'G' });
  writeJson(selFile, sel);
  const uiFile = 'research/L_YOUJITSU_DE/ui-design-data.json';
  const ui = readJson(uiFile);
  setUiInput(ui, 'INP_CZ_FIRST_HIT_TRIALS', { name: '通常ゲーム数' });
  const czSection = ui.sections?.['CZ出現率'];
  if (czSection) {
    czSection.description = '筐体メニュー1/7のCZ合算回数と通常ゲーム数をそのまま入力できます。CZ種類別は別途実戦中に記録します。';
    czSection.observationRefs = [...new Set([...(czSection.observationRefs ?? []), 'OBS_MACHINE_MENU_HISTORY'])];
    czSection.acquisitionSources = [...new Set([...(czSection.acquisitionSources ?? []), 'MACHINE_MENU'])];
  }
  writeJson(uiFile, ui);
}

// Gundam SEED: machine menu fields verified on a real machine. Keep field semantics literal;
// do not reinterpret BONUS count as AT first-hit without a separate contract.
{
  const obsFile = 'research/L_GUNDAM_SEED_G/machine-observation-data.json';
  const obs = readJson(obsFile);
  obs.researchedAt = '2026-09-02';
  obs.sourceCoverage.machineMenu = 'VERIFIED_ON_MACHINE';
  upsertById(obs.observations, 'observationId', {
    observationId: 'OBS_MACHINE_MENU_HISTORY',
    sourceType: 'MACHINE_MENU',
    observationMode: 'MENU_READ',
    status: 'VERIFIED_ON_MACHINE',
    label: '筐体メニュー遊技データ',
    categories: ['総ゲーム数', 'STRIKE ATTACK回数', 'BONUS回数', '上位AT回数'],
    timing: ['遊技中に筐体メニューを確認'],
    excludedConditions: [
      'BONUS回数をAT初当り回数へ自動変換しない',
      'STRIKE ATTACK回数を種類別CZ回数として扱わない',
      '電源OFF/ONまたは設定変更をまたいで履歴が残る前提を置かない'
    ],
    sourceRefs: [],
    notes: 'ユーザー実機確認で総ゲーム数、STRIKE ATTACK回数、BONUS回数、上位AT回数の表示を確認。表示単位をそのままObservationとして保持する。'
  });
  removeVerification(obs, 'VFY_L_GUNDAM_SEED_G_MACHINE_MENU');
  for (const item of obs.fieldVerificationItems ?? []) {
    if (item.verificationId === 'VFY_L_GUNDAM_SEED_G_DATA_COUNTER' || item.verificationId === 'VFY_L_GUNDAM_SEED_G_SEATED_STATE') item.priority = 'LOW';
  }
  writeJson(obsFile, obs);
}

// Yoshimune: real-device Daitomo image verifies the normal-time small-role table and common 12-coin tawara.
// Daitomo is the linked player's own session and does not provide the previous player's history.
{
  const obsFile = 'research/L_YOSHIMUNE_SC2/machine-observation-data.json';
  const obs = readJson(obsFile);
  obs.researchedAt = '2026-09-02';
  const d = obs.observations?.find((x) => x.observationId === 'OBS_DAITOMO_HISTORY');
  if (d) {
    d.categories = [...new Set([...(d.categories ?? []), '通常時小役', 'チェリー回数・確率', '松回数・確率', 'チャンス目回数・確率', '共通12枚俵回数・確率', '確定チェリー回数・確率'])];
    d.excludedConditions = [
      'ダイトモは連携した本人の遊技区間のみで、前任者履歴の取得には使わない',
      '表示確率の丸め値だけから分母が一意に定まらない場合は推定分母を自動入力しない',
      '初当たり契機の履歴をBIG/REG初当り回数そのものの代用にしない'
    ];
    d.notes = 'ユーザー実機画像で「通常時小役」を確認。共通12枚俵12回・1/234.2、確定チェリー1回・1/2811.0等が同一通常時サンプルを共有し、画像例では通常時小役集計G=2811Gと整合する。ダイトモは前任者履歴を表示しない。';
  }
  removeVerification(obs, 'VFY_L_YOSHIMUNE_SC2_DAITOMO_DENOMINATOR');
  writeJson(obsFile, obs);

  const selFile = 'research/L_YOSHIMUNE_SC2/selection-data.json';
  const sel = readJson(selFile);
  setInput(sel, 'INP_COMMON_TAWARA_TRIALS', { name: '通常時小役 集計G', unit: 'G' });
  writeJson(selFile, sel);
  const uiFile = 'research/L_YOSHIMUNE_SC2/ui-design-data.json';
  const ui = readJson(uiFile);
  setUiInput(ui, 'INP_COMMON_TAWARA_TRIALS', { name: '通常時小役 集計G' });
  for (const [title, section] of Object.entries(ui.sections ?? {})) {
    if ((section.inputIds ?? []).includes('INP_COMMON_TAWARA_TRIALS')) {
      section.description = 'ダイトモの「通常時小役」に表示される共通12枚俵回数と、同じ通常時サンプルの集計Gを入力します。前任者履歴は利用できません。';
      section.acquisitionSources = [...new Set([...(section.acquisitionSources ?? []), 'LINKED_SERVICE'])];
      section.observationRefs = [...new Set([...(section.observationRefs ?? []), 'OBS_DAITOMO_HISTORY'])];
    }
  }
  writeJson(uiFile, ui);
}

// Mahjong: preserve the web-image confirmation already written into Observation; reduce unrelated
// data-counter verification to low priority because 打-WIN LITE supplies total and normal games.
{
  const obsFile = 'research/L_MAHJONG_MONOGATARI_S2/machine-observation-data.json';
  const obs = readJson(obsFile);
  obs.researchedAt = '2026-09-02';
  for (const item of obs.fieldVerificationItems ?? []) {
    if (item.verificationId === 'VFY_L_MAHJONG_MONOGATARI_S2_DATA_COUNTER') item.priority = 'LOW';
  }
  writeJson(obsFile, obs);
}

console.log('Applied 2026-09-02 batch8 real-device/web-image confirmations and denominator/UI corrections.');
