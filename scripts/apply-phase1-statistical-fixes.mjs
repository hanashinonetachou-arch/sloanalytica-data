import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = p => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const write = (p, v) => fs.writeFileSync(path.join(root, p), JSON.stringify(v, null, 2) + '\n');
const feature = (s, id) => s.features.find(f => f.featureId === id);
const rfeature = (r, id) => r.features.find(f => f.researchFeatureId === id);
const input = (s, id) => s.inputs.find(i => i.id === id);
const evidence = (s, id) => s.evidence.find(e => e.evidenceId === id);
const bump = s => {
  const parts = String(s.machineDataVersion ?? '0.1.0').split('.').map(Number);
  parts[2] = (parts[2] || 0) + 1;
  s.machineDataVersion = parts.join('.');
};
const excludeDifficulty = (f, reason) => {
  f.difficultyParticipation = 'EXCLUDE';
  f.difficultyExclusionReason = reason;
  delete f.difficultyExposure;
};

// 1) C.C.&Kallen: split confirmed AT-end screens from probability distribution,
// fix the legacy '2+' mislabel to the actual setting-1 denial, and honor Research
// policy that conditional opportunity features do not participate in game-based Difficulty.
{
  const rp = 'research/S_CODE_GEASS_3_CC_FS/research-data.json';
  const sp = 'research/S_CODE_GEASS_3_CC_FS/selection-data.json';
  const r = read(rp), s = read(sp);

  if (!r.sources.some(x => x.sourceId === 'SRC_NANA_AT_END')) {
    r.sources.push({
      sourceId: 'SRC_NANA_AT_END',
      publisher: 'なな徹',
      title: 'C.C.&Kallen ver. ボーナス・AT終了画面の示唆内容',
      url: 'https://nana-press.com/kaiseki/machine/552/15292/',
      checkedAt: '2026-08-22',
      sourceType: 'analysis'
    });
  }
  const rf = rfeature(r, 'RF04');
  rf.sourceRefs = ['SRC_NANA_AT_END'];
  rf.crossSourceStatus = 'single_source';
  rf.trialUnit = '非エンディングAT終了時（確定・否定画面を除く通常示唆画面）';
  rf.observationScope = 'AT終了画面のうち、デフォルト・偶数示唆・高設定示唆弱・高設定示唆強';
  rf.numeratorDefinition = '偶数示唆画面回数';
  rf.denominatorDefinition = '確定・否定画面を除いた通常示唆4種類のAT終了画面回数';
  rf.categories = [
    'CAT_1_INP_AT_END_EVEN_COUNT',
    'CAT_2_INP_AT_END_HIGH_WEAK_COUNT',
    'CAT_3_INP_AT_END_HIGH_STRONG_COUNT'
  ];
  rf.distributionMode = 'implicit_residual';
  rf.notes = '設定1否定・設定4以上・設定5以上・設定6の画面はEvidenceとして別評価し、Multinomialには入れない。通常示唆4種類は確定・否定画面を除いた条件付き分布へ再正規化。';
  const raw = {
    SET_1: {d:0.6675,e:0.1875,w:0.10,h:0.045,c:0},
    SET_2: {d:0.58,e:0.25,w:0.10,h:0.045,c:0.025},
    SET_3: {d:0.6025,e:0.1875,w:0.125,h:0.06,c:0.025},
    SET_4: {d:0.505,e:0.25,w:0.125,h:0.06,c:0.06},
    SET_5: {d:0.4975,e:0.1875,w:0.15,h:0.10,c:0.065},
    SET_6: {d:0.43,e:0.25,w:0.15,h:0.10,c:0.07}
  };
  rf.settingDistributions = Object.fromEntries(Object.entries(raw).map(([set,x]) => {
    const normal = 1 - x.c;
    return [set, {
      CAT_1_INP_AT_END_EVEN_COUNT: x.e / normal,
      CAT_2_INP_AT_END_HIGH_WEAK_COUNT: x.w / normal,
      CAT_3_INP_AT_END_HIGH_STRONG_COUNT: x.h / normal
    }];
  }));

  const legacyNot1 = input(s, 'INP_AT_END_SET2_COUNT');
  legacyNot1.name = '設定1否定';
  legacyNot1.description = 'ナナリー・スザク・ルルーシュの終了画面が出た回数。1回でも出現すれば設定1を否定します。';
  input(s, 'INP_AT_END_SET4_COUNT').description = 'ルルーシュ＋ヒロイン3人の終了画面が出た回数。1回でも出現すれば設定4以上。';
  input(s, 'INP_AT_END_SET5_COUNT').description = '黒の騎士団の終了画面が出た回数。1回でも出現すれば設定5以上。';
  input(s, 'INP_AT_END_SET6_COUNT').description = '亡国のアキトの終了画面が出た回数。1回でも出現すれば設定6。';

  const mf = feature(s, 'FEAT_AT_END_SCREEN_MULTINOMIAL');
  mf.categoryInputIds = ['INP_AT_END_HIGH_WEAK_COUNT','INP_AT_END_HIGH_STRONG_COUNT'];
  mf.denominatorInputIds = ['INP_AT_END_DEFAULT_COUNT','INP_AT_END_EVEN_COUNT','INP_AT_END_HIGH_WEAK_COUNT','INP_AT_END_HIGH_STRONG_COUNT'];
  mf.userReason = 'AT終了画面のうち、デフォルト・偶数示唆・高設定示唆弱・強の4種類を条件付きMultinomialで評価。設定否定・設定確定画面はEvidenceへ分離し二重計上しません。';
  excludeDifficulty(mf, 'AT終了画面の試行回数はAT終了回数であり、ゲーム数から一意に導出できないため。');
  excludeDifficulty(feature(s, 'FEAT_RB_INFINITE_AT_BINOMIAL'), 'RB後C.C.高確の有効対象Gはゲーム数から一意に導出できないため。');

  const ev = evidence(s, 'EVI_AT_END_SET2');
  ev.name = '終了画面：設定1否定';
  ev.displayName = '終了画面で設定1否定を確認';
  ev.confirmedSettings = [];
  ev.deniedSettings = ['SET_1'];
  bump(s);
  write(rp, r); write(sp, s);
}

// 2) Tokyo Ghoul: Research explicitly resolved these conditional-opportunity features
// as inference-only for game-based Difficulty. Restore that contract.
{
  const p = 'research/L_TOKYO_GHOUL/selection-data.json'; const s = read(p);
  excludeDifficulty(feature(s, 'FEAT_AT_RETURN'), 'AT終了回数はゲーム数から一意に導出できないため。');
  excludeDifficulty(feature(s, 'FEAT_CZ_WITHIN_100'), '100G到達機会は周期進行・CZ/AT当選で変動し、ゲーム数から一意に導出できないため。');
  bump(s); write(p, s);
}

// 3) Mushoku Tensei: valid stage-change opportunities cannot be safely converted from games.
{
  const p = 'research/L_MUSHOKU_TENSEI_NM/selection-data.json'; const s = read(p);
  excludeDifficulty(feature(s, 'FEAT_SHIRONE_KINGDOM_TRANSITION_RATE'), '除外条件適用後の有効ステージ移行回数は通常Gから安全に導出できないため。');
  bump(s); write(p, s);
}

// 4) Baki: Hanma-meter-5 opportunities are observed trials, but no defensible game exposure exists.
{
  const p = 'research/L_BAKI_L3/selection-data.json'; const s = read(p);
  excludeDifficulty(feature(s, 'FEAT_HANMA5_CZ'), '範馬メーター5個到達という抽選機会をゲーム数から一意に導出できないため。');
  bump(s); write(p, s);
}

// 5) Biohazard: Vendetta: silent-mode -> AT is conditional on silent-mode entries.
{
  const p = 'research/L_BIOHAZARD_VENDETTA_FK/selection-data.json'; const s = read(p);
  excludeDifficulty(feature(s, 'FEAT_SILENT_MODE_AT_SUCCESS'), 'サイレントモード突入回数を試行とする条件付きFeatureで、ゲーム数ベースの試行量を安全に固定できないため。');
  bump(s); write(p, s);
}

// 6) HEY! Elite Salaryman Kagami: AT pullback is conditional on AT endings.
{
  const p = 'research/L_HEY_ELITE_SALARYMAN_KAGAMI_PA4/selection-data.json'; const s = read(p);
  excludeDifficulty(feature(s, 'FEAT_AT_PULLBACK'), 'AT終了回数を試行とする条件付きFeatureで、ゲーム数から終了機会を一意に導出できないため。');
  bump(s); write(p, s);
}

console.log('Applied Phase 1 statistical fixes to 6 machines.');
