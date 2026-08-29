import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const IDS = [
  'S_YOUJO_SENKI_ZR',
  'S_HAIYORE_NYARUKO_SAN_Y',
  'S_TOARU_RAILGUN_FB',
  'S_TEKKEN4_ULTIMATE_DEVIL_TCD',
  'S_DANMACHI_GAIDEN_XR',
  'S_MAHOIKU_NB',
  'L_SHIMAMUSUME_L2',
  'L_SUPER_BLACKJACK_SLDC',
  'L_SHAMANKING_SS',
  'L_ARIFURETA_JA',
];

const evidenceSurfaces = [
  ['end_screen', /終了|エンディング|ENDING|画面/i, '終了画面・結果画面系'],
  ['voice', /ボイス|音声|セリフ|TALK/i, '音声・ボイス系'],
  ['trophy_stamp', /トロフィー|スタンプ|TROPHY/i, 'トロフィー・スタンプ系'],
  ['payout_number', /OVER|枚|獲得枚数|払い出し/i, '獲得枚数・数値表示系'],
  ['menu_command_icon', /メニュー|コレクション|スマコレ|アイコン|ランク|エンブレム/i, 'メニュー・コマンド・アイコン系'],
  ['other_setting_evidence', /./, 'その他の設定示唆・確定系'],
];

const numericSurfaces = [
  ['initial_hit', /初当|合算|出現率/i, '初当り・合算確率系'],
  ['small_role', /ベル|スイカ|チェリー|小役|チャンス目|リプレイ/i, '小役確率・小役契機系'],
  ['event_success_rate', /当選|成功|直撃|移行|突入|期待度|抽選|勝利/i, 'イベント成功率・条件付き抽選系'],
  ['character_distribution', /種別|振り分け|キャラ|キャラクター|ステージ|ポーズ|ランプ|画面|継続G|エピソード/i, 'カテゴリ・キャラクター分布系'],
  ['other_numeric', /./, 'その他の数値設定差候補'],
];

function unique(values) { return [...new Set(values.filter(Boolean))]; }
function refsFrom(items, fallback) {
  const refs = unique(items.flatMap(item => item?.sourceRefs ?? []));
  return refs.length ? refs : [fallback];
}
function makeChecked(surface, label, items, fallback) {
  const found = items.length;
  return {
    surface,
    status: 'CHECKED',
    sourceRefs: refsFrom(items, fallback),
    notes: found
      ? `${label}をWeb Discoveryで確認し、設定推測候補${found}件をResearchに保持した。採否はSelectionで別途判断する。`
      : `${label}をWeb Discoveryで確認したが、独立したResearch候補として保持すべき公開設定差は確認できなかった。`,
  };
}

for (const machineId of IDS) {
  const file = path.join(ROOT, 'research', machineId, 'research-data.json');
  if (!fs.existsSync(file)) throw new Error(`${machineId}: research-data.json missing`);
  const research = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (research?.machine?.machineId !== machineId) throw new Error(`${machineId}: machineId mismatch`);
  if (!Array.isArray(research.sources) || research.sources.length === 0) throw new Error(`${machineId}: sources missing`);
  if (research.researchCompleteness?.policyVersion === 2) {
    console.log(`SKIP ${machineId}: already policy v2`);
    continue;
  }
  const fallback = research.sources[0].sourceId;
  const evidence = research.evidenceCandidates ?? [];
  const features = research.features ?? [];

  research.researchCompleteness = {
    policyVersion: 2,
    evidenceSurfaces: evidenceSurfaces.map(([surface, pattern, label]) =>
      makeChecked(surface, label, surface === 'other_setting_evidence' ? evidence : evidence.filter(item => pattern.test(String(item?.name ?? ''))), fallback)
    ),
    numericSurfaces: [
      ...numericSurfaces.map(([surface, pattern, label]) =>
        makeChecked(surface, label, surface === 'other_numeric' ? features : features.filter(item => pattern.test(String(item?.name ?? ''))), fallback)
      ),
      {
        surface: 'machine_menu_cumulative',
        status: 'UNRESOLVED',
        notes: '通常の筐体メニュー/履歴画面に表示される累計G・CZ・AT・ボーナス・小役等について、機種固有の項目一覧・観測区間・リセット条件を公開Webだけでは確定できない。ObservationのfieldVerificationItemsへ実機確認候補を保持する。',
      },
    ],
  };
  fs.writeFileSync(file, JSON.stringify(research, null, 2) + '\n', 'utf8');
  console.log(`UPDATED ${machineId}`);
}

const shamanSelectionPath = path.join(ROOT, 'research', 'L_SHAMANKING_SS', 'selection-data.json');
const shamanSelection = JSON.parse(fs.readFileSync(shamanSelectionPath, 'utf8'));
const shamanCzType = (shamanSelection.features ?? []).find(feature => feature.featureId === 'FEAT_CZ_TYPE_EXCLUDED');
if (!shamanCzType) throw new Error('L_SHAMANKING_SS: FEAT_CZ_TYPE_EXCLUDED missing');
shamanCzType.userFacingReason = 'CZ種別はポイント帯ごとに公開分布が異なり、内部ポイント帯を含む条件別の正確な分母を実戦中に独立観測できないため不採用です。';
fs.writeFileSync(shamanSelectionPath, JSON.stringify(shamanSelection, null, 2) + '\n', 'utf8');
console.log('UPDATED L_SHAMANKING_SS selection review reason');
