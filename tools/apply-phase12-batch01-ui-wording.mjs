import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = rel => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const writeJson = (rel, value) => fs.writeFileSync(path.join(ROOT, rel), JSON.stringify(value, null, 2) + '\n', 'utf8');

function updateSelection(rel, mutate) {
  const data = readJson(rel);
  mutate(data);
  writeJson(rel, data);
}

updateSelection('research/L_INITIAL_D_2ND/selection-data.json', selection => {
  const feature = (selection.features ?? []).find(f => f.featureId === 'FEAT_CHANCE_CHERRY');
  if (!feature) throw new Error('L_INITIAL_D_2ND FEAT_CHANCE_CHERRY not found');
  const reason = '実機連動機能で自動カウント可能だが、1/1820.4～1/1365.3で7000Gでも数回程度かつ設定差が比較的小さく、ベル等の高頻度Featureに対する追加情報量が限定的なため不採用。';
  feature.rejectionReason = reason;
  feature.userReason = reason;
});

updateSelection('research/S_GAMERA2/selection-data.json', selection => {
  Object.assign(selection.uiCategoryLabels ??= {}, { PRIMARY: '実機連動データ' });
  const inputs = new Map((selection.inputs ?? []).map(input => [input.id, input]));
  const games = inputs.get('INP_NORMAL_GAMES');
  const cdef = inputs.get('INP_REACHME_CDEF_COUNT');
  if (!games || !cdef) throw new Error('S_GAMERA2 required inputs not found');
  games.description = '実機連動機能で確認できる通常時の集計ゲーム数を入力してください。ボーナス中等を含む総回転数とは区別してください。';
  cdef.description = '実機連動機能の小役・フラグ集計で確認できるリーチ目リプレイC/D/E/Fの合計回数を入力してください。';
  const feature = (selection.features ?? []).find(f => f.featureId === 'FEAT_REACHME_CDEF');
  if (!feature) throw new Error('S_GAMERA2 FEAT_REACHME_CDEF not found');
  feature.userReason = 'C/D/E/F合算は1/2048.0～1/936.2と設定差が大きく、実機連動機能で内訳を取得できるため採用。';
});

updateSelection('research/S_WORD_OF_LIGHTS_2/selection-data.json', selection => {
  Object.assign(selection.uiCategoryLabels ??= {}, { ROLE: '実機連動データ' });
  const inputs = new Map((selection.inputs ?? []).map(input => [input.id, input]));
  const games = inputs.get('INP_NORMAL_GAMES');
  const role4a = inputs.get('INP_ROLE_4A_COUNT');
  if (!games || !role4a) throw new Error('S_WORD_OF_LIGHTS_2 required inputs not found');
  games.description = '実機連動機能の設定差小役と同じ通常時集計ゲーム数を入力してください。';
  role4a.description = '実機連動機能で確認できる4枚役A（チェリー）の回数を入力してください。';

  const features = new Map((selection.features ?? []).map(f => [f.featureId, f]));
  const role4aFeature = features.get('FEAT_ROLE_4A');
  const role5aFeature = features.get('FEAT_ROLE_5A');
  const role5bFeature = features.get('FEAT_ROLE_5B');
  if (!role4aFeature || !role5aFeature || !role5bFeature) throw new Error('S_WORD_OF_LIGHTS_2 required features not found');
  role4aFeature.userReason = '4枚役Aは実機連動機能で直接取得でき、正しい分子を手動判別せず継続観測できるため採用。';
  role5aFeature.userReason = '5枚役Aは実機連動機能での個別分離可否が未確定のため不採用。';
  role5bFeature.userReason = '5枚役Bは実機連動機能での個別分離可否が未確定のため不採用。';
});

console.log('Applied Phase 12 batch 01 generic user-facing machine-link wording.');
