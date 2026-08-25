#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve('.');
const read = machineId => {
  const p = path.join(ROOT, 'research', machineId, 'selection-data.json');
  return { p, value: JSON.parse(fs.readFileSync(p, 'utf8')) };
};
const write = ({ p, value }) => fs.writeFileSync(p, JSON.stringify(value, null, 2) + '\n', 'utf8');
const byResearch = (selection, id) => (selection.features ?? []).find(x => x.researchFeatureId === id);
const requireFeature = (selection, id) => {
  const feature = byResearch(selection, id);
  if (!feature) throw new Error(`${selection.machineId}: missing selection feature ${id}`);
  return feature;
};
const upsertExcluded = (selection, researchFeatureId, featureId, internalReason, userFacingReason) => {
  const existing = byResearch(selection, researchFeatureId);
  const next = {
    researchFeatureId,
    featureId,
    adoptionCategory: 'EXCLUDE',
    internalReason,
    userFacingReason,
  };
  if (existing) Object.assign(existing, next);
  else (selection.features ??= []).push(next);
};

{
  const doc = read('S_FAMISTA_KAIDO_FB');
  const s = doc.value;
  requireFeature(s, 'RF_REG').userReason = 'REGはボーナス抽選対象ゲーム数を分母に直接観測でき、全設定の公開確率を使えるため主Featureとして採用します。';
  requireFeature(s, 'RF_CHERRY_CT').userReason = 'チェリー成立回数を分母に、その次ゲームから始まるCT移行を直接観測できるため、条件付き当選率として主Featureに採用します。';
  requireFeature(s, 'RF_WATERMELON_CT').userReason = 'スイカ成立回数を分母に、その次ゲームから始まるCT移行を直接観測できるため、条件付き当選率として主Featureに採用します。';
  requireFeature(s, 'RF_CHERRY_REG').userFacingReason = 'REG全体の部分集合で、REG確率と同時に使うと同じREG事象を二重評価するため不採用。';
  write(doc);
}

{
  const doc = read('S_GRANBELM_ZX');
  const s = doc.value;
  upsertExcluded(
    s,
    'RF_CZ_INITIAL',
    'FEAT_CZ_INITIAL',
    'CZ初当りはAT初当りへつながる主要経路で、AT初当りと同時採用すると同じ通常時の初当り生成過程を重複評価する。',
    'AT初当りへつながる主要経路で、AT初当りと同時に使うと同じ初当り生成過程を重複評価するため不採用。',
  );
  upsertExcluded(
    s,
    'RF_BONUS_INITIAL',
    'FEAT_BONUS_INITIAL',
    'ボーナス初当りは通常時の初当り経路の一部だが、AT・CZとの依存関係を独立Featureとして安全に分離できる根拠が不足している。',
    'AT・CZなど他の初当り経路との依存関係を安全に分離できず、同時採用による重複評価を避けるため不採用。',
  );
  write(doc);
}

{
  const doc = read('S_SUPER_BINGO_NEO_CLASSIC_HH1');
  const s = doc.value;
  requireFeature(s, 'RF_DIGI_CYCLE_FIRST').userReason = 'BC後初回デジ周期の到達回数を分母にBC当選を直接観測でき、2回目以降とは異なる公開当選率を持つため独立した主Featureとして採用します。';
  requireFeature(s, 'RF_DIGI_CYCLE_LATER').userReason = '2回目以降のデジ周期到達回数を分母にBC当選を直接観測でき、初回周期とは異なる公開当選率を持つため独立した主Featureとして採用します。';
  requireFeature(s, 'RF_BC_FIRST_HIT').userReason = '通常ゲーム数からBC初当りを観測できるため、周期別データを記録していない場合のFallbackとして採用します。周期別Featureが有効な場合は抑制して同じBC生成過程の二重評価を避けます。';
  write(doc);
}

{
  const doc = read('S_ODANOBUNA_ZENKOKU_SNT');
  const s = doc.value;
  upsertExcluded(
    s,
    'RF_CZ_STRATEGY_MEETING',
    'FEAT_CZ_STRATEGY_MEETING',
    '戦略会議関連に設定差の記載はあるが、全設定の数値を確認できず尤度モデルを構築できない。',
    '設定差の記載はありますが、全設定の当選率を確認できず数値推測に必要な確率が揃わないため不採用。',
  );
  upsertExcluded(
    s,
    'RF_BATTLE_WIN',
    'FEAT_BATTLE_WIN',
    '合戦中抽選に設定差の記載はあるが、条件別の分母と全設定数値を安定して観測・モデル化できない。',
    '設定差の記載はありますが、条件別の分母を正確に観測する方法と全設定の数値が揃わないため不採用。',
  );
  upsertExcluded(
    s,
    'RF_RARE_ROLE_BATTLE',
    'FEAT_RARE_ROLE_BATTLE',
    'レア役契機の合戦抽選に設定差の記載はあるが、全設定値と状態条件を確定できず条件付き確率を安全にモデル化できない。',
    '設定差の記載はありますが、全設定の当選率と状態条件を確定できず条件付き確率を安全に比較できないため不採用。',
  );
  write(doc);
}

{
  const doc = read('S_SENGOKU_KOIHIME_FC');
  const s = doc.value;
  requireFeature(s, 'RF_BONUS_OUTCOME').userReason = 'BIG・REG・その他を通常ゲーム全体の排他的な結果としてMultinomialで一体評価でき、同一ボーナスを別Featureで重複評価しないため主Featureとして採用します。';
  requireFeature(s, 'RF_WATERMELON').userReason = 'スイカは通常ゲーム数を分母に高頻度で直接観測でき、ボーナス構成とは別の小役情報として設定差を利用できるため採用します。';
  requireFeature(s, 'RF_RARE_COMBINED').userFacingReason = '設定差の主因が採用中のスイカに含まれ、同時に使うと同じ小役差を重複評価するため不採用。';
  write(doc);
}

{
  const doc = read('L_SHIN_IKKITOUSEN_V');
  const s = doc.value;
  upsertExcluded(
    s,
    'RF_MODE',
    'FEAT_MODE',
    '内部モードは実戦中に直接観測できず、示唆から推定した状態を尤度入力にすると誤分類リスクが高い。',
    '内部モードを実戦中に正確に判別できず、推定状態を数値入力すると誤分類リスクが高いため不採用。',
  );
  upsertExcluded(
    s,
    'RF_MAGATAMA_GUIDE',
    'FEAT_MAGATAMA_GUIDE_DISTRIBUTION',
    '10G/20Gの継続振り分けはCZ失敗後とAT終了後で異なるため統合数値Featureにできない。30G以上は設定下限・確定意味が共通なのでEvidenceとして採用する。',
    'CZ失敗後とAT終了後で10G/20Gの振り分けが異なるため数値分布は統合しません。30G以上は設定下限・確定Evidenceとして別に採用します。',
  );
  write(doc);
}

{
  const doc = read('L_KYOUKARA_OREHA_FE');
  const s = doc.value;
  requireFeature(s, 'RF_WATERMELON').userReason = 'スイカは通常ゲーム数を分母に直接観測でき、ボーナス構成とは別の小役情報として公開された設定差を利用できるため採用します。';
  write(doc);
}

console.log('Selection quality calibration applied to 7 machines.');
