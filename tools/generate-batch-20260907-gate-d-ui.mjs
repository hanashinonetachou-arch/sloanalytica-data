#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const IDS = [
  'L_FIRE_FORCE_2',
  'L_UMINEKO_2_A1',
  'L_KABANERI_UNATO_KESSEN_XX',
  'L_JORMUNGAND_ND01G',
  'LB_TRIPLE_CROWN_SEVEN_FG',
  'L_SHINUCHI_YOSHIMUNE_A1',
  'L_KYOKOU_SUIRI_ST',
  'L_AKUDAMA_DRIVE_TP',
  'L_MILLION_GOD_KISEKI_CX',
  'L_GUNDAM_UNICORN_KAKUSEI_DRIVE_2JA'
];

const NO_LINKED_SERVICE = new Set([
  'L_FIRE_FORCE_2',
  'L_GUNDAM_UNICORN_KAKUSEI_DRIVE_2JA',
  'L_KYOKOU_SUIRI_ST',
  'L_AKUDAMA_DRIVE_TP',
  'LB_TRIPLE_CROWN_SEVEN_FG'
]);

const semanticLocks = {
  L_UMINEKO_2_A1: [
    'Gate Bで確定したcontained / causal overlapのsuppression・fallback契約を保持し、同じ初当り情報を独立Likelihoodとして二重計上しない。'
  ],
  L_KABANERI_UNATO_KESSEN_XX: [
    'Gate Bで確定したcontained / causal overlapのsuppression・fallback契約を保持し、同じ初当り情報を独立Likelihoodとして二重計上しない。'
  ],
  L_JORMUNGAND_ND01G: [
    'REG/BIG終了画面は1つの自然観測として扱い、4種のHard Evidence画面を数値multinomialへ混ぜない。',
    'Hard Evidence画面はEvidenceとして1回だけ成立させ、同じ観測を確率FeatureとEvidenceで二重評価しない。',
    'Gate Bで確定したcontained / causal overlapのsuppression・fallback契約を保持する。'
  ],
  LB_TRIPLE_CROWN_SEVEN_FG: [
    'プラムはEXCLUDEを維持し、FEAT_PLUM入力・Observation・UIを復活させない。',
    'チェリーを通常G小役の代表Featureとし、同じ通常G情報を排他的な小役同士で独立Binomial二重計上しない。'
  ],
  L_SHINUCHI_YOSHIMUNE_A1: [
    'Gate Bで確定したcontained / causal overlapのsuppression・fallback契約を保持し、同じ初当り情報を独立Likelihoodとして二重計上しない。'
  ],
  L_KYOKOU_SUIRI_ST: [
    'Gate Bで確定したcontained / causal overlapのsuppression・fallback契約を保持し、同じ初当り情報を独立Likelihoodとして二重計上しない。'
  ],
  L_AKUDAMA_DRIVE_TP: [
    'Gate Bで確定したcontained / causal overlapのsuppression・fallback契約を保持し、同じ初当り情報を独立Likelihoodとして二重計上しない。'
  ],
  L_GUNDAM_UNICORN_KAKUSEI_DRIVE_2JA: [
    'Gate Bで確定したcontained / causal overlapのsuppression・fallback契約を保持し、同じ初当り情報を独立Likelihoodとして二重計上しない。'
  ]
};

const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const write = (p, v) => fs.writeFileSync(p, JSON.stringify(v, null, 2) + '\n', 'utf8');
const safeTitle = s => String(s ?? '').replace(/\s+(回数|試行数|ゲーム数)$/,'').trim();
const roleMap = {
  DIRECT_PLAY: 'DIRECT_PLAY',
  END_EVENT: 'END_EVENT',
  MACHINE_MENU: 'MACHINE_MENU',
  DATA_COUNTER: 'DATA_COUNTER',
  LINKED_SERVICE: 'LINKED_SERVICE',
  SEATED_STATE: 'SEATED_STATE'
};

function unresolvedItems(obs, machineId) {
  const out = [];
  for (const [k, v] of Object.entries(obs.sourceCoverage ?? {})) {
    if (v === 'UNRESOLVED') out.push(`${k}: UNRESOLVED`);
  }
  for (const x of obs.fieldVerificationItems ?? []) {
    if (x.status === 'WAITING_FOR_MACHINE') out.push(x.question ?? x.label ?? x.verificationId ?? x.itemId ?? '実機確認待ち');
  }
  if (NO_LINKED_SERVICE.has(machineId)) {
    return [...new Set(out)].filter(x => !/^linkedService: UNRESOLVED$/.test(x));
  }
  return [...new Set(out)];
}

function obsForCategory(obs, category, selection, group = []) {
  const suffix = String(category).replace(/^SEL_RF_/, '');
  const direct = (obs.observations ?? []).find(o => o.observationId === `OBS_${suffix}`);
  if (direct) return [direct];
  if (String(category).startsWith('SHARED_DENOM_')) {
    const ids = new Set(group.map(x => x.id));
    const featIds = (selection.features ?? [])
      .filter(f => [f.numeratorInputId, f.denominatorInputId, ...(f.categoryInputIds ?? [])].some(x => ids.has(x)))
      .map(f => f.featureId);
    return (obs.observations ?? []).filter(o => featIds.some(fid => o.observationId === `OBS_${String(fid).replace(/^FEAT_/, '')}`));
  }
  return [];
}

function sectionTitle(category, inputs, observations, selection) {
  if (category === 'EVIDENCE') return '設定示唆・確定情報';
  if (String(category).startsWith('SHARED_DENOM_') && selection.uiCategoryLabels?.[category]) return selection.uiCategoryLabels[category];
  const names = inputs.map(x => safeTitle(x.name)).filter(Boolean);
  if (names.length === 1) return names[0];
  const common = names.reduce((a, b) => {
    let i = 0;
    while (i < a.length && i < b.length && a[i] === b[i]) i++;
    return a.slice(0, i);
  });
  const cleaned = common.replace(/[・\s]+$/, '').trim();
  if (cleaned.length >= 3) return cleaned;
  const label = observations[0]?.label;
  if (label && label.length <= 28) return label.replace(/・/g, ' / ');
  return names[0] || '実戦データ';
}

function contract(input, groupSize) {
  const type = String(input.type ?? 'integer').toLowerCase();
  const counter = type === 'counter';
  const name = String(input.name ?? input.id);
  const games = /GAME|ゲーム|GAMES|TRIAL/i.test(input.id + ' ' + name);
  return {
    name,
    mode: counter ? 'COUNTER' : (type === 'select' ? 'SELECT' : 'NUMBER'),
    gridSpan: counter && groupSize > 1 && name.length <= 20 ? 6 : 12,
    directInput: !counter,
    ...(counter ? { compact: groupSize > 1, step: 1, quickAdd: [1], quickInputEligible: true } : {}),
    ...(games && !counter ? { quickAdd: [50], quickInputEligible: false } : {}),
    inputVisible: true,
    emptyMeansUnobserved: true,
    observedZeroAllowed: true
  };
}

for (const machineId of IDS) {
  const dir = path.join(ROOT, 'research', machineId);
  const selection = read(path.join(dir, 'selection-data.json'));
  const obs = read(path.join(dir, 'machine-observation-data.json'));
  const inputs = [...(selection.inputs ?? [])]
    .filter(input => input.inferenceRole !== 'EXCLUDE')
    .sort((a,b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999));
  const groups = new Map();
  for (const input of inputs) {
    const category = input.category ?? 'OTHER';
    if (!groups.has(category)) groups.set(category, []);
    groups.get(category).push(input);
  }

  // Shared denominator inputs (for example normal games used by multiple initial-hit Features)
  // belong in the same user-facing section as the linked numerators.  Selection linkage, not
  // the synthetic SHARED_DENOM_* category, owns that grouping decision.
  const inputById = new Map(inputs.map(input => [input.id, input]));
  const categoryByInputId = new Map(inputs.map(input => [input.id, input.category ?? 'OTHER']));
  const consumedCategories = new Set();
  const groupedEntries = [];

  for (const [category, group] of groups.entries()) {
    if (consumedCategories.has(category)) continue;
    if (!String(category).startsWith('SHARED_DENOM_')) {
      groupedEntries.push({ category, group, titleCategory: category, sharedDenominator: false });
      continue;
    }

    const denominatorIds = new Set(group.map(input => input.id));
    const linkedCategories = [];
    for (const feature of selection.features ?? []) {
      if (feature.adoptionCategory === 'EXCLUDE' || feature.adoptionCategory === 'DISPLAY_ONLY') continue;
      const featureDenominators = [feature.denominatorInputId, ...(feature.denominatorInputIds ?? [])].filter(Boolean);
      if (!featureDenominators.some(id => denominatorIds.has(id))) continue;
      const linkedIds = [feature.numeratorInputId, ...(feature.numeratorInputIds ?? []), ...(feature.categoryInputIds ?? [])].filter(Boolean);
      for (const id of linkedIds) {
        const linkedCategory = categoryByInputId.get(id);
        if (!linkedCategory || linkedCategory === category || linkedCategory === 'EVIDENCE' || String(linkedCategory).startsWith('SHARED_DENOM_')) continue;
        if (!linkedCategories.includes(linkedCategory)) linkedCategories.push(linkedCategory);
      }
    }

    if (!linkedCategories.length) {
      groupedEntries.push({ category, group, titleCategory: category, sharedDenominator: false });
      continue;
    }

    const linkedInputs = linkedCategories.flatMap(linkedCategory => groups.get(linkedCategory) ?? []);
    const mergedGroup = [
      ...group,
      ...linkedInputs.sort((a,b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999))
    ];
    for (const linkedCategory of linkedCategories) consumedCategories.add(linkedCategory);
    consumedCategories.add(category);

    const linkedNames = linkedInputs.map(input => safeTitle(input.name)).filter(Boolean);
    let sharedTitle;
    if (linkedNames.length >= 2 && linkedNames.every(name => name.includes('初当り'))) sharedTitle = '初当り';
    else if (linkedNames.length >= 2 && linkedNames.every(name => /^(BB|RB)/.test(name))) sharedTitle = 'ボーナス回数';
    else sharedTitle = linkedNames[0] || selection.uiCategoryLabels?.[category] || safeTitle(group[0]?.name) || '実戦データ';

    groupedEntries.push({ category, group: mergedGroup, titleCategory: linkedCategories[0], sharedDenominator: true, sharedTitle });
  }

  // Categories consumed by a shared-denominator section may have appeared before the shared
  // denominator in Selection display order. Remove those provisional entries and keep the
  // merged section at the earliest display position of any member.
  const normalizedGroups = groupedEntries
    .filter(entry => !consumedCategories.has(entry.category) || entry.sharedDenominator)
    .map(entry => ({
      ...entry,
      minDisplayOrder: Math.min(...entry.group.map(input => input.displayOrder ?? 999))
    }))
    .sort((a,b) => {
      if (a.category === 'EVIDENCE' && b.category !== 'EVIDENCE') return 1;
      if (b.category === 'EVIDENCE' && a.category !== 'EVIDENCE') return -1;
      return a.minDisplayOrder - b.minDisplayOrder;
    });

  // Ordinary inference sections first; hard Evidence last by policy.
  const orderedGroups = normalizedGroups;
  const sectionOrder = [];
  const sections = {};
  const inputContracts = {};

  for (const entry of orderedGroups) {
    const { category, group, titleCategory, sharedDenominator, sharedTitle } = entry;
    const observations = obsForCategory(obs, category, selection, group);
    let title = sharedDenominator ? sharedTitle : sectionTitle(titleCategory, group, observations, selection);
    let base = title, n = 2;
    while (sections[title]) title = `${base} ${n++}`;
    sectionOrder.push(title);
    const found = observations.find(o => ['FOUND','VERIFIED_ON_MACHINE'].includes(o.status));
    const acquisitionSources = [...new Set(observations.map(o => o.sourceType).filter(Boolean))];
    sections[title] = {
      inputIds: group.map(x => x.id),
      description: category === 'EVIDENCE'
        ? '実戦中に確認できた設定確定・否定情報だけを入力します。通常の確率Featureとは分離して扱います。'
        : (found?.timing?.[0] ?? '自己実戦中、Selectionで定義された対象試行・対象イベントに合わせて更新します。'),
      ...(found?.sourceType && roleMap[found.sourceType] ? { observationRole: roleMap[found.sourceType] } : {}),
      observationRefs: observations.map(o => o.observationId),
      acquisitionSources,
      collapsible: category === 'EVIDENCE' || String(category).includes('SEATED'),
      defaultExpanded: category !== 'EVIDENCE' && !String(category).includes('SEATED')
    };
    for (const input of group) inputContracts[input.id] = contract(input, group.length);
  }

  const unresolved = unresolvedItems(obs, machineId);
  const notes = [
    'Selection EXCLUDE-only inputは生成しない。SelectionData inputsに存在してもinferenceRole=EXCLUDEの入力はUIから除外する。',
    '空欄=未観測、0=観測済み0回を維持する。',
    '条件付きFeatureはroute/state固有のeligible attemptsを分母として維持し、総通常Gへ置換しない。',
    '前任者区間と自己実戦区間はObservationで明示された場合のみ接続し、field verification待ちから架空の着席時入力を生成しない。',
    'Hard Evidenceは確率Featureから分離し、原則最後のセクションに置く。0=未確認、1以上=成立のpresence semanticsを維持し、反復確認でEvidence強度を増幅しない。',
    'linked-service / machine-menuは取得補助であり必須入力にしない。',
    ...(NO_LINKED_SERVICE.has(machineId)
      ? ['この機種はユーザー実機確認により連動遊技履歴機能なし。LINKED_SERVICE入力・導線・実機確認待ちを生成しない。']
      : []),
    ...(semanticLocks[machineId] ?? [])
  ];

  const doc = {
    schemaVersion: 'ui-design-data-v1',
    machineId,
    status: unresolved.length ? 'PASS_WITH_UNRESOLVED' : 'PASS',
    generatedFrom: {
      selection: `research/${machineId}/selection-data.json`,
      observation: `research/${machineId}/machine-observation-data.json`
    },
    sectionOrder,
    sections,
    inputContracts,
    unresolved,
    auditNotes: notes
  };
  write(path.join(dir, 'ui-design-data.json'), doc);
}

console.log(`Gate D UI Design generated: ${IDS.length}/10`);
