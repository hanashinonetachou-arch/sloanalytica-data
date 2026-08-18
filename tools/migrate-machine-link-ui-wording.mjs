import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SUFFIX = '（実機連動機能推奨）';
const machines = [
  'L_HANABI_KM',
  'LB_AREX_BRIGHT_BA',
  'LB_FUJIKO_M2',
  'LB_ISEKAI_QUARTET_KR',
  'LB_KELLOT_5_ND05H',
  'LB_THUNDER_V_HA',
  'L_INITIAL_D_2ND',
  'L_SMASLO_BAKEMONOGATARI_KH',
  'S_EUREKA_SEVEN_HIEVO_XS',
];

function readSelection(machineId) {
  const file = path.join(ROOT, 'research', machineId, 'selection-data.json');
  if (!fs.existsSync(file)) throw new Error(`SelectionData not found: ${machineId}`);
  return { file, data: JSON.parse(fs.readFileSync(file, 'utf8')) };
}
function writeJson(file, value) {
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n', 'utf8');
}
function inputById(s, id) {
  const input = (s.inputs ?? []).find(x => x.id === id);
  if (!input) throw new Error(`${s.machineId}: input not found: ${id}`);
  return input;
}
function featureById(s, id) {
  const f = (s.features ?? []).find(x => x.featureId === id);
  if (!f) throw new Error(`${s.machineId}: feature not found: ${id}`);
  return f;
}
function setDesc(s, id, text, recommended = false) {
  const input = inputById(s, id);
  delete input.machineLinkRecommended;
  input.description = recommended ? `${text.replace(/[。\s]+$/u, '')}。${SUFFIX}` : text;
}
function setName(s, id, name) { inputById(s, id).name = name; }
function replaceTextDeep(value, replacements) {
  if (typeof value === 'string') return replacements.has(value) ? replacements.get(value) : value;
  if (Array.isArray(value)) return value.map(v => replaceTextDeep(v, replacements));
  if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) value[k] = replaceTextDeep(v, replacements);
  }
  return value;
}

for (const machineId of machines) {
  const { file, data: s } = readSelection(machineId);

  if (machineId === 'L_HANABI_KM') {
    Object.assign(s.uiCategoryLabels ??= {}, {
      BIG_GAME: 'BIG中', REG_GAME: 'REG中', HC: '花火チャレンジ', HG: '花火GAME',
    });
    setDesc(s, 'INP_NORMAL_BELL_GAMES', '通常時の風鈴を観測したゲーム数を入力してください。RT中は含めません', true);
    setDesc(s, 'INP_NORMAL_BELL_TOTAL', '通常時の風鈴A＋風鈴Bの合計回数を入力してください。未取得の場合は空欄のままにしてください', true);
    setDesc(s, 'INP_BIG_GAME_TRIALS', '実際に消化したBIG中の総ゲーム数を入力してください。初版ではBIG回数から自動計算しません', true);
    setDesc(s, 'INP_BIG_BELL_B', 'BIG中の斜め風鈴（風鈴B）の回数を入力してください', true);
    setDesc(s, 'INP_BIG_SCATTER', 'BIG中のバラケ目の回数を入力してください', true);
    setDesc(s, 'INP_REG_GAME_TRIALS', '実際に消化したREG中の総ゲーム数を入力してください。1枚役ハズシで変動するためREG回数から自動計算しません', true);
    setDesc(s, 'INP_REG_ONE_COIN', 'REG中の1枚役成立回数を入力してください', true);
    setDesc(s, 'INP_REG_SCATTER', 'REG中のバラケ目の回数を入力してください', true);
    setDesc(s, 'INP_HC_GAMES', '実際に消化した花火チャレンジの総ゲーム数を入力してください', true);
    setDesc(s, 'INP_HC_MISS', '花火チャレンジ中のハズレ回数を入力してください', true);
    setDesc(s, 'INP_HG_GAMES', '実際に消化した花火GAMEの総ゲーム数を入力してください', true);
    setDesc(s, 'INP_HG_MISS', '花火GAME中のハズレ回数を入力してください', true);
    featureById(s, 'FEAT_BONUS_OUTCOME').userReason = '特にREGに段階的な設定差があり、通常時小役データが未取得でも利用できるため採用します。通常時風鈴を観測した場合は二重評価を避けてフォールバック停止します。';
  }

  if (machineId === 'LB_AREX_BRIGHT_BA') {
    setDesc(s, 'INP_NORMAL_GAMES', '自分が遊技した通常ゲーム数を入力します。当機種で実機連動機能から取得できる具体的なゲーム数項目は実機確認待ちです。');
    const f = featureById(s, 'FEAT_BIG_SMALL_GAME_OUTCOME_PENDING');
    f.rejectionReason = '実機連動機能の取得項目を実機確認待ち。';
    f.userReason = '羽羽鳥A・B・Cの解析値は有力ですが、実機連動機能で分母となるBIG小役ゲーム数と各回数を取得できるか未確認のため、未調査版では推測に使用しません。';
  }

  if (machineId === 'LB_FUJIKO_M2') {
    setDesc(s, 'INP_NORMAL_GAMES', '実機連動機能で確認した通常ゲーム数を入力してください。不二子TIME中・ボーナス中は含めません', true);
    setDesc(s, 'INP_BIG', '通常中ボーナス詳細のBIG BONUS回数を入力してください。SUPER BIGは含めません', true);
    setDesc(s, 'INP_REG', '通常中ボーナス詳細のREG BONUS回数を入力してください', true);
    setDesc(s, 'INP_PLUM_A', '通常時小役詳細の平行プラム回数（プラムA）を入力してください', true);
    setDesc(s, 'INP_PLUM_B', '通常時小役詳細の斜めプラム回数（プラムB）を入力してください', true);
    setDesc(s, 'INP_BIG_PLUM_PARALLEL', 'ボーナス中詳細のBIG BONUS中 平行プラム回数を入力してください', true);
    setDesc(s, 'INP_BIG_PLUM_DIAGONAL', 'ボーナス中詳細のBIG BONUS中 斜めプラム回数を入力してください', true);
    featureById(s, 'FEAT_NORMAL_PLUM').userReason = '実機連動機能で自動取得でき、通常ゲーム数に対して平行・斜めプラムをまとめて評価できます。未入力の小役は0回扱いしません。';
    featureById(s, 'FEAT_BIG_DIAGONAL_PLUM').userReason = '（SUPER）BIG中は斜めプラムが高設定ほど出やすく、実機連動機能で平行・斜めを自動集計できます。設定5と6は同値なので低～高設定の補助判別として使います。';
  }

  if (machineId === 'LB_ISEKAI_QUARTET_KR') {
    const reps = new Map([
      ['着席時にデータカウンターへ表示されている総ゲーム数を入力してください。この値は着席前の初当り確率にだけ使用し、自分のマイスロ区間のゲーム数には加算しません。', '着席時にデータカウンターへ表示されている総ゲーム数を入力してください。この値は着席前の初当り確率にだけ使用し、自分の実機連動区間のゲーム数には加算しません。'],
      ['マイスロの黒BAR BIG回数を入力してください。BIG中の試行ゲーム数は内部で自動算出します。', `黒BAR BIG回数を入力してください。BIG中の試行ゲーム数は内部で自動算出します。${SUFFIX}`],
      ['マイスロの赤7 BIGと青7 BIGの回数を合計して入力してください。', `赤7 BIGと青7 BIGの回数を合計して入力してください。${SUFFIX}`],
      ['特殊7枚役（規定数2枚・マイスロ）', '特殊7枚役（規定数2枚）'],
      ['マイスロ「規定数2枚」に表示されるスイカ回数を入力してください。BT中の試行ゲーム数を自動算出するために使います。', `実機連動機能の「規定数2枚」に表示されるスイカ回数を入力してください。BT中の試行ゲーム数を自動算出するために使います。${SUFFIX}`],
      ['通常時（マイスロ規定数3枚）', '通常時（規定数3枚）'],
      ['BT中（マイスロ規定数2枚）', 'BT中（規定数2枚）'],
      ['データカウンターで初当り回数を確認できる場合、着席時の総ゲーム数と初当り回数から前任者区間のボーナス初当り確率を補助的に評価します。着席時総ゲーム数は自分のマイスロ区間には加算しません。', 'データカウンターで初当り回数を確認できる場合、着席時の総ゲーム数と初当り回数から前任者区間のボーナス初当り確率を補助的に評価します。着席時総ゲーム数は自分の実機連動区間には加算しません。'],
      ['マイスロのベル回数と表示確率から規定数3枚の試行Gを自動復元し、ベル・スイカ・チェリー・特殊15枚役を一体評価します。ユーザー自身が通常時Gを計算する必要はありません。', '実機連動機能のベル回数と表示確率から規定数3枚の試行Gを自動復元し、ベル・スイカ・チェリー・特殊15枚役を一体評価します。ユーザー自身が通常時Gを計算する必要はありません。'],
      ['マイスロの規定数2枚スイカまたはチェリーの回数と表示確率からBT中有効Gを自動復元し、特殊7枚役を評価します。特殊7枚役0回でも観測として利用できます。', '実機連動機能の規定数2枚スイカまたはチェリーの回数と表示確率からBT中有効Gを自動復元し、特殊7枚役を評価します。特殊7枚役0回でも観測として利用できます。'],
      ['自分の遊技区間では通常時小役・いせかる目・BIG直撃と発生過程が重複し、マイスロから初当り母数を直接取得できないため不採用です。着席前区間はデータカウンターで初当り回数を確認できる場合のみ別Featureとして利用します。', '自分の遊技区間では通常時小役・いせかる目・BIG直撃と発生過程が重複し、実機連動機能から初当り母数を直接取得できないため不採用です。着席前区間はデータカウンターで初当り回数を確認できる場合のみ別Featureとして利用します。'],
    ]);
    replaceTextDeep(s, reps);
  }

  if (machineId === 'LB_KELLOT_5_ND05H') {
    const i = s.inputs?.[0];
    if (i?.description) i.description = '【実機連動機能未調査】実機連動機能で取得できる実戦データの詳細は後日確認予定です。現在は通常ゲーム数を直接入力し、小役は実戦中に手動でカウントした項目だけ入力してください。数えていない小役は空欄のままにしてください。';
  }

  if (machineId === 'LB_THUNDER_V_HA') {
    Object.assign(s.uiCategoryLabels ??= {}, { SMALL_ROLE: '通常時小役', BIG_GAME: 'BIG中' });
    for (const id of ['INP_BELL_A','INP_BELL_B','INP_WATERMELON_A','INP_WATERMELON_B','INP_CHERRY_B']) {
      const i = inputById(s, id);
      const role = i.name;
      setDesc(s, id, `${role}回数を入力してください。未取得の場合は空欄のままにしてください`, true);
    }
    setDesc(s, 'INP_BIG_BELL_B', 'BIG中ベルB回数を入力してください', true);
    setDesc(s, 'INP_BIG_BELL_C', 'BIG中ベルC回数を入力してください', true);
    setDesc(s, 'INP_BIG_REACH_PATTERN', 'BIG中リーチ目回数を入力してください', true);
    const reps = new Map([
      ['着席前の通常ゲーム数・BIG・REGは自分のユニメモ区間とは独立した観測なので、前任者区間の設定推測情報として採用します。', '着席前の通常ゲーム数・BIG・REGは自分の実機連動区間とは独立した観測なので、前任者区間の設定推測情報として採用します。'],
      ['ユニメモで自動取得できる設定差あり5小役を分離して主力Featureとして一体評価します。各役が異なる設定識別情報を持ち、未入力項目は0回ではなく未観測として扱います。', '実機連動機能で自動取得できる設定差あり5小役を分離して主力Featureとして一体評価します。各役が異なる設定識別情報を持ち、未入力項目は0回ではなく未観測として扱います。'],
      ['BIG中ベルBは偶奇、ベルCとリーチ目は高設定側の識別に有効で、ユニメモで取得できるため実戦Inferenceには採用します。', 'BIG中ベルBは偶奇、ベルCとリーチ目は高設定側の識別に有効で、実機連動機能で取得できるため実戦Inferenceには採用します。'],
    ]);
    replaceTextDeep(s, reps);
  }

  if (machineId === 'L_INITIAL_D_2ND') {
    for (const i of s.inputs ?? []) if (i.name === 'マイスロ通常ゲーム数') i.name = '通常ゲーム数';
  }

  if (machineId === 'L_SMASLO_BAKEMONOGATARI_KH') {
    const reps = new Map([
      ['マイスロの通常ゲーム数とAT初当り解析値の分母定義が一致しないため、マイスロ表示の「回数＋1/○○」から試行数を復元する。AT初当り全体と弱チェリー直撃の二重計上も排他的Multinomialで回避する。', '実機連動機能の通常ゲーム数とAT初当り解析値の分母定義が一致しないため、実機連動表示の「回数＋1/○○」から試行数を復元する。AT初当り全体と弱チェリー直撃の二重計上も排他的Multinomialで回避する。'],
      ['マイスロ表示から復元したAT初当り抽選対象ゲーム', '実機連動表示から復元したAT初当り抽選対象ゲーム'],
    ]);
    replaceTextDeep(s, reps);
  }

  if (machineId === 'S_EUREKA_SEVEN_HIEVO_XS') {
    for (const i of s.inputs ?? []) if (i.name === 'マイスロ表示確率の分母') i.name = '表示確率の分母';
  }

  writeJson(file, s);
  console.log(`UPDATED ${machineId}`);
}

console.log(`DONE: ${machines.length}機種のSelectionDataを一般化しました。`);
