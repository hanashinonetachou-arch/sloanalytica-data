import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const read = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const write = (p, v) => fs.writeFileSync(path.join(ROOT, p), `${JSON.stringify(v, null, 2)}\n`, 'utf8');

function moveAfter(order, item, after) {
  const next = order.filter((x) => x !== item);
  const i = next.indexOf(after);
  if (i < 0) throw new Error(`section not found: ${after}`);
  next.splice(i + 1, 0, item);
  return next;
}

function bump(machineId) {
  for (const file of ['research-data.json', 'selection-data.json']) {
    const p = `research/${machineId}/${file}`;
    const j = read(p);
    if (file === 'research-data.json') j.machine.machineDataVersion = '0.1.2';
    else j.machineDataVersion = '0.1.2';
    write(p, j);
  }
}

// Milky: bonus small-role and bonus-end ratio sections belong immediately under Small Roles.
{
  const p = 'research/S_MILKY_HOMES_GNB/ui-design-data.json';
  const j = read(p);
  let o = j.sectionOrder.filter((x) => !['ボーナス中小役', 'ボーナス終了画面（割合）'].includes(x));
  const i = o.indexOf('小役');
  o.splice(i + 1, 0, 'ボーナス中小役', 'ボーナス終了画面（割合）');
  j.sectionOrder = o;
  write(p, j);
  bump('S_MILKY_HOMES_GNB');
}

// Sengoku Musou 3: gauge-3 AT rate immediately before Kerot Trophy.
{
  const p = 'research/S_SENGOKU_MUSOU3_ZYTCD/ui-design-data.json';
  const j = read(p);
  const o = j.sectionOrder.filter((x) => x !== 'BIG中 無双ゲージ3個');
  const i = o.indexOf('ケロットトロフィー');
  o.splice(i, 0, 'BIG中 無双ゲージ3個');
  j.sectionOrder = o;
  write(p, j);
  bump('S_SENGOKU_MUSOU3_ZYTCD');
}

// Iceborne: Normal -> normal small roles -> bonus confirmation ratio -> bonus symbol, then evidence sections.
{
  const p = 'research/S_MHW_ICEBORNE_ZF/ui-design-data.json';
  const j = read(p);
  const lead = ['通常時', '通常時小役', 'ボーナス確定画面（割合）', 'ボーナス絵柄'];
  j.sectionOrder = [...lead, ...j.sectionOrder.filter((x) => !lead.includes(x))];
  write(p, j);
  bump('S_MHW_ICEBORNE_ZF');
}

// Inuyasha 2: arrange by play flow: normal -> normal rare roles -> bonus -> AT -> misc evidence.
{
  const p = 'research/L_INUYASHA2_FK/ui-design-data.json';
  const j = read(p);
  const preferred = [
    '通常時',
    '通常時レア小役',
    '白BIG終了画面（割合）',
    '青7BIG終了画面（割合）',
    '引き戻しゾーン種別',
    'AT終了画面（割合）',
    '終了画面',
    '設定確定・否定示唆',
  ];
  j.sectionOrder = [...preferred.filter((x) => j.sectionOrder.includes(x)), ...j.sectionOrder.filter((x) => !preferred.includes(x))];
  write(p, j);
  bump('L_INUYASHA2_FK');
}

// Aria II: common bell is observable in normal play and AT (normal: left-first 15-coin bell; AT: un-navigated 15-coin bell).
// Keep a hidden derived denominator = normal games + AT games so users do not need to add them manually.
{
  const machineId = 'S_HIDAN_NO_ARIA_II_JZ';
  const sp = `research/${machineId}/selection-data.json`;
  const s = read(sp);
  s.machineDataVersion = '0.1.2';
  const old = s.inputs.find((x) => x.id === 'INP_COMMON_BELL_GAMES');
  if (!old) throw new Error('Aria common-bell denominator input missing');
  old.name = '共通ベル観測ゲーム数（自動）';
  old.inputVisible = false;
  old.derivedCalculation = 'sum';
  old.derivedFromInputIds = ['INP_NORMAL_GAMES', 'INP_AT_GAMES'];
  old.defaultValue = 0;
  if (!s.inputs.some((x) => x.id === 'INP_AT_GAMES')) {
    const idx = s.inputs.findIndex((x) => x.id === 'INP_COMMON_BELL_GAMES');
    s.inputs.splice(idx, 0, {
      id: 'INP_AT_GAMES', name: 'AT中ゲーム数', category: 'SMALL_ROLE', type: 'integer', unit: 'G',
      displayOrder: 19, inferenceRole: 'INCLUDE_PRIMARY', observationScope: 'SELF_PLAY', defaultValue: 0,
    });
  }
  const f = s.features.find((x) => x.featureId === 'FEAT_COMMON_BELL');
  f.userReason = '共通ベルは設定差があり、通常時は左第1停止の15枚ベル、AT中はナビなし15枚ベルとして識別できます。分母は通常ゲーム数＋AT中ゲーム数を自動合算します。';
  f.difficultyExclusionReason = '通常時とAT中を合算した観測ゲーム数を分母とするため、通常ゲーム数ベースのDifficultyへ直接換算しない。';
  write(sp, s);

  const rp = `research/${machineId}/research-data.json`;
  const r = read(rp);
  r.machine.machineDataVersion = '0.1.2';
  const rf = r.features.find((x) => x.researchFeatureId === 'RF_COMMON_BELL');
  rf.trialUnit = '通常時ゲーム＋AT中ゲーム';
  rf.observationScope = '通常時は左第1停止15枚ベル、AT中はナビなし15枚ベルを観測';
  rf.denominatorDefinition = '通常ゲーム数＋AT中ゲーム数';
  rf.notes = '通常時は左第1停止時の15枚ベル、AT中はナビなしの15枚ベルを共通ベルとしてカウントする。';
  write(rp, r);

  const up = `research/${machineId}/ui-design-data.json`;
  const u = read(up);
  u.inputContracts.INP_AT_GAMES = {
    name: 'AT中ゲーム数', mode: 'NUMBER', gridSpan: 12, directInput: true, placeholder: 0, quickInput: false,
  };
  delete u.inputContracts.INP_COMMON_BELL_GAMES;
  for (const sec of Object.values(u.sections)) {
    sec.inputIds = (sec.inputIds || []).filter((id) => id !== 'INP_COMMON_BELL_GAMES');
  }
  const small = Object.entries(u.sections).find(([, sec]) => (sec.inputIds || []).includes('INP_COMMON_BELL_COUNT'));
  if (!small) throw new Error('Aria common-bell UI section missing');
  if (!small[1].inputIds.includes('INP_AT_GAMES')) small[1].inputIds.unshift('INP_AT_GAMES');
  small[1].description = '通常時は左第1停止時の15枚ベル、AT中はナビなし15枚ベルを共通ベルとしてカウントします。共通ベルの分母は「通常ゲーム数＋AT中ゲーム数」をアプリが自動合算します。';
  write(up, u);

  const op = `research/${machineId}/machine-observation-data.json`;
  const o = read(op);
  const map = o.featureMappings.find((x) => x.researchFeatureId === 'RF_COMMON_BELL' || x.featureId === 'FEAT_COMMON_BELL');
  if (map) {
    map.mappingType = 'DERIVABLE';
    map.inputIds = ['INP_NORMAL_GAMES', 'INP_AT_GAMES', 'INP_COMMON_BELL_COUNT'];
    map.notes = '分母は通常ゲーム数＋AT中ゲーム数を自動合算。通常時は左第1停止15枚ベル、AT中はナビなし15枚ベルを数える。';
  }
  write(op, o);
}

console.log('Applied real-device UI follow-up adjustments for Milky, Sengoku Musou 3, Iceborne, Inuyasha 2, and Aria II.');
