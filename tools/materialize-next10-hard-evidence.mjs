#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const write = (p, v) => fs.writeFileSync(p, JSON.stringify(v, null, 2) + '\n', 'utf8');
const S = n => `SET_${n}`;
const all = (...xs) => xs.map(S);

const D = {
  L_IZA_BANCHO_SB8: {
    src: ['SRC_EVIDENCE_NANA', 'なな徹', 'いざ番長 AT終了画面の設定示唆・出現率', 'https://nana-press.com/kaiseki/machine/946/29803/'],
    groups: [
      ['RE_AT_END_HARD', 'AT終了画面', 'AT終了画面', [
        ['刺客襲来', all(2, 3, 4, 5, 6)],
        ['小太郎日記', all(4, 5, 6)],
        ['青龍（武蔵）', all(3, 4, 6)],
        ['朱雀（小次郎）', all(2, 5, 6)],
        ['温泉（おみさ＆コパンダ）', all(6)]
      ]]
    ]
  },
  L_ZETTAI_SHOGEKI_PLATONIC_HEART_TK: {
    src: ['SRC_EVIDENCE_NANA', 'なな徹', '継続バトル中の必殺技による設定示唆', 'https://nana-press.com/kaiseki/machine/982/30199/'],
    groups: [
      ['RE_SPECIAL_MOVE', 'AT継続バトル 必殺技', 'AT継続バトルの必殺技（ボーナス当選時のみ有効）', [
        ['邊汰品 消滅波', all(2, 3, 4, 5, 6)],
        ['覚・明火闇光', all(4, 5, 6)],
        ['覇威猛倒', all(5, 6)],
        ['六角', all(6)]
      ]]
    ]
  },
  L_WATASHI_NO_SHIAWASE_NA_KEKKON_PN: {
    src: ['SRC_EVIDENCE_NANA', 'なな徹', 'AT終了画面（コナミコマンド）による設定示唆', 'https://nana-press.com/kaiseki/machine/979/30651/'],
    groups: [
      ['RE_AT_END_COMMAND', 'AT終了画面（コナミコマンド）', 'AT終了画面（コナミコマンド入力後）', [
        ['秋', all(2, 3, 4, 5, 6)],
        ['冬', all(4, 5, 6)],
        ['お正月', all(6)]
      ]]
    ]
  },
  LB_TRIPLE_CROWN_SF4: {
    src: ['SRC_EVIDENCE_PWORLD', 'P-WORLD', 'LBトリプルクラウン 設定推測', 'https://www.p-world.co.jp/machine/database/10299'],
    groups: [
      ['RE_REG_END_LED', 'REG終了時LED', 'REG終了時LED', [
        ['クラウンランプ＆下パネル点滅', all(5, 6)],
        ['バットランプ・青点滅', all(6)]
      ]]
    ]
  },
  LB_MATADOR_3_TT: {
    src: ['SRC_EVIDENCE_NANA', 'なな徹', 'マタドールⅢ 設定判別', 'https://nana-press.com/kaiseki/machine/997/31342/'],
    groups: [],
    tendencies: [
      ['RE_CONDOR_LAMP_TENDENCY', '枚数調整時コンドルランプ', '青→黄→緑→赤→紫の順で高設定期待度アップ'],
      ['RE_PANEL_FLASH_TENDENCY', 'ボーナス終了時パネルフラッシュ', '上下パネル同時フラッシュは高設定ほど発生率が高い']
    ]
  },
  L_TENSEI_SHITARA_KEN_DESHITA_GT: {
    src: ['SRC_EVIDENCE_NANA', 'なな徹', 'AT終了画面（アリストロフィー）の設定示唆', 'https://nana-press.com/kaiseki/machine/996/31144/'],
    groups: [
      ['RE_AT_END_ILLUST', 'AT終了画面 イラスト', 'AT終了画面 イラスト', [
        ['水着フラン', all(2, 3, 4, 5, 6)],
        ['和服フラン', all(4, 5, 6)],
        ['全員集合', all(6)]
      ]],
      ['RE_ARIS_TROPHY', 'アリストロフィー', 'AT終了画面 アリストロフィー', [
        ['銅', all(2, 3, 4, 5, 6)],
        ['銀', all(3, 4, 5, 6)],
        ['金', all(4, 5, 6)],
        ['クローバー柄', all(5, 6)],
        ['虹', all(6)]
      ]]
    ]
  },
  L_DARLING_IN_THE_FRANXX_SA: {
    src: ['SRC_EVIDENCE_NANA', 'なな徹', 'ボーナス高確率終了画面／ナミちゃんトロフィーの設定示唆', 'https://nana-press.com/kaiseki/machine/989/31060/'],
    groups: [
      ['RE_NAMI_TROPHY', 'ナミちゃんトロフィー', 'ボーナス高確率終了画面 ナミちゃんトロフィー', [
        ['銅', all(2, 3, 4, 5, 6)],
        ['銀', all(3, 4, 5, 6)],
        ['金', all(4, 5, 6)],
        ['フランクス', all(5, 6)],
        ['虹', all(6)]
      ]],
      ['RE_ENDING_HARD', 'エンディング設定示唆', 'エンディング中の設定示唆', [
        ['カード：ストレリチア', all(6)],
        ['イラスト：ゼロツー＆ヒロ', all(6)]
      ]]
    ]
  },
  L_SAKI_CHOJO_KESSEN_YR: {
    src: ['SRC_EVIDENCE_NANA', 'なな徹', 'AT終了画面（クジラッキー）の設定・モード示唆', 'https://nana-press.com/kaiseki/machine/995/31248/'],
    groups: [
      ['RE_KUJIRAKKI', 'クジラッキー', 'AT終了画面 クジラッキー', [
        ['銅', all(2, 3, 4, 5, 6)],
        ['銀', all(3, 4, 5, 6)],
        ['金', all(4, 5, 6)],
        ['クマノミ柄', all(5, 6)],
        ['虹', all(6)]
      ]]
    ]
  },
  S_KONOSUBA_ZR: {
    src: ['SRC_EVIDENCE_PACHINAVI', 'パチナビ', 'この素晴らしい世界に祝福を！ 設定判別・設定示唆', 'https://pachinavi.net/machines/konosuba/settei/'],
    groups: [
      ['RE_BONUS_END', 'このすばぼーなす終了画面', 'このすばぼーなす終了画面', [
        ['ミツルギ', all(2, 3, 4, 5, 6)],
        ['ベルディア', all(3, 4, 5, 6)],
        ['寝ているアクア', all(4, 5, 6)],
        ['エリス（4人を見ている）', all(5, 6)],
        ['4人の版権絵（背景に家）', all(6)]
      ]],
      ['RE_AT_END_VOICE', 'AT終了時PUSHボイス', 'AT終了時PUSHボイス', [
        ['「そっちの名前で呼ぶなぁ〜」', all(2, 3, 4, 5, 6)],
        ['ドロップキックのセリフ', all(4, 5, 6)],
        ['「でーがらーし、めーがみが…」', all(5, 6)],
        ['「この邂逅は世界が選択せし…」', all(6)]
      ]],
      ['RE_DEBT_LINE', '非有利区間 借金額セリフ', '非有利区間の借金額セリフ', [
        ['借金246万エリス', all(2, 4, 6)],
        ['借金200万エリス以上', all(2, 3, 4, 5, 6)],
        ['借金456万エリス', all(4, 5, 6)],
        ['借金506万エリス', all(5, 6)],
        ['借金666万エリス', all(6)]
      ]]
    ]
  },
  S_RAKUEN_TSUHO_FS: {
    src: ['SRC_EVIDENCE_NANA', 'なな徹', 'パチスロ楽園追放 設定確定要素', 'https://nana-press.com/kaiseki/machine/146/4857/'],
    groups: [
      ['RE_PAYOUT', '獲得枚数表示', '獲得枚数表示', [
        ['222OVER', all(2, 3, 4, 5, 6)],
        ['444OVER', all(4, 5, 6)],
        ['555OVER', all(5, 6)],
        ['666OVER', all(6)]
      ]],
      ['RE_CZ_END_HARD', 'RD終了画面', 'RD終了画面', [
        ['設定2以上画面', all(2, 3, 4, 5, 6)],
        ['設定3以上画面', all(3, 4, 5, 6)],
        ['設定4以上画面', all(4, 5, 6)],
        ['設定5以上画面', all(5, 6)],
        ['設定6画面', all(6)]
      ]],
      ['RE_AT_END_HARD', 'AT終了画面', 'AT終了画面', [
        ['設定4以上画面', all(4, 5, 6)],
        ['設定5以上画面', all(5, 6)],
        ['設定6画面', all(6)]
      ]]
    ]
  }
};

for (const [id, d] of Object.entries(D)) {
  const dir = path.join(ROOT, 'research', id);
  const rp = path.join(dir, 'research-data.json');
  const sp = path.join(dir, 'selection-data.json');
  const op = path.join(dir, 'machine-observation-data.json');
  const r = read(rp);
  const s = read(sp);
  const o = read(op);

  const [sourceId, publisher, title, url] = d.src;
  const source = { sourceId, publisher, title, url, checkedAt: '2026-09-04', sourceType: 'major_analysis' };
  if (!r.sources.some(x => x.sourceId === sourceId)) r.sources.push(source);
  if (!o.sources.some(x => x.sourceId === sourceId)) o.sources.push(source);

  r.evidenceCandidates = (r.evidenceCandidates ?? []).filter(x => !String(x.researchEvidenceId).startsWith('RE_GATE_D_'));
  const decisions = [];
  const groups = [];
  const hardCats = [];
  let order = 100;

  for (const [rawId, name, label, opts] of d.groups ?? []) {
    const eid = `RE_GATE_D_${rawId.replace(/^RE_/, '')}`;
    const union = [...new Set(opts.flatMap(x => x[1]))];
    r.evidenceCandidates.push({
      researchEvidenceId: eid,
      name,
      factStatus: 'verified',
      allowedSettings: union,
      deniedSettings: [],
      sourceRefs: [sourceId],
      sourceWording: '公開解析で特定設定集合が濃厚/確定とされる設定示唆。',
      notes: 'Gate DではHard Evidenceとしてのみ使用し、出現率や傾向強度を数値尤度へ変換しない。'
    });
    decisions.push({
      researchEvidenceId: eid,
      disposition: 'INCLUDE_UI',
      reason: '公開解析で許容設定集合が明示されたHard Evidence。傾向示唆とは分離して設定集合の絞り込みだけに使用する。'
    });
    groups.push({
      groupId: `EVG_${eid.replace(/^RE_GATE_D_/, '')}`,
      label,
      selectionMode: 'multi',
      normalizationMode: 'ALLOWED_SETTINGS_INTERSECTION',
      displayOrder: order++,
      options: opts.map(([olabel, allowed], i) => ({
        value: `V${i + 1}`,
        label: olabel,
        allowedSettings: allowed,
        excludedSettings: [],
        sourceEvidenceIds: [eid]
      }))
    });
    hardCats.push(...opts.map(([olabel]) => `${label}: ${olabel}`));
  }

  for (const [rawId, name, wording] of d.tendencies ?? []) {
    const eid = `RE_GATE_D_${rawId.replace(/^RE_/, '')}`;
    const settings = r.machine.settings;
    r.evidenceCandidates.push({
      researchEvidenceId: eid,
      name,
      factStatus: 'verified',
      allowedSettings: settings,
      deniedSettings: [],
      sourceRefs: [sourceId],
      sourceWording: wording,
      notes: '傾向示唆。Hard Evidenceとして設定除外には使わない。'
    });
    decisions.push({
      researchEvidenceId: eid,
      disposition: 'EXCLUDE',
      reason: '高設定期待度などの傾向示唆で設定集合を確定できないため、Hard Evidenceの排除ロジックには入れない。'
    });
  }

  s.evidenceDecisions = [
    ...(s.evidenceDecisions ?? []).filter(x => !String(x.researchEvidenceId).startsWith('RE_GATE_D_')),
    ...decisions
  ];
  s.evidenceReview = {
    policyVersion: 1,
    exclusions: s.evidenceDecisions
      .filter(x => x.disposition === 'EXCLUDE')
      .map(x => ({ researchEvidenceId: x.researchEvidenceId, reason: x.reason }))
  };
  s.evidenceUi = { groups };
  s.uiCategoryLabels = { ...(s.uiCategoryLabels ?? {}), EVIDENCE: '設定示唆・確定情報' };

  o.observations = (o.observations ?? []).filter(x => x.observationId !== 'OBS_HARD_EVIDENCE_EVENTS');
  if (hardCats.length) {
    o.observations.push({
      observationId: 'OBS_HARD_EVIDENCE_EVENTS',
      sourceType: 'END_EVENT',
      observationMode: 'VISUAL_EVENT',
      status: 'FOUND',
      label: '設定示唆・確定情報',
      categories: hardCats,
      timing: ['該当する終了画面・ランプ・トロフィー・音声・獲得枚数などを実戦中に確認した時'],
      excludedConditions: [
        '傾向示唆を設定確定・設定否定へ昇格させない',
        '表示条件・復活条件など追加条件がある場合は条件成立を確認してから記録する',
        '未確認の表示を推測で入力しない'
      ],
      sourceRefs: [sourceId],
      notes: 'SelectionでINCLUDE_UIとしたHard Evidenceのみ。1回の物理観測を重複入力しない。'
    });
  }

  write(rp, r);
  write(sp, s);
  write(op, o);
  console.log(`${id}: hard groups=${groups.length}, tendency-only=${(d.tendencies ?? []).length}`);
}

console.log('Materialized source-backed hard evidence. Tendency-only evidence remains excluded from hard setting intersection.');
