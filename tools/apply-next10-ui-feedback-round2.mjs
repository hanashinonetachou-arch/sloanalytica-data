import fs from 'node:fs';

const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const write = (p, v) => fs.writeFileSync(p, `${JSON.stringify(v, null, 2)}\n`);
const assert = (cond, msg) => { if (!cond) throw new Error(msg); };

function walk(value, fn) {
  if (Array.isArray(value)) {
    fn(value);
    for (const item of value) walk(item, fn);
    return;
  }
  if (value && typeof value === 'object') {
    fn(value);
    for (const child of Object.values(value)) walk(child, fn);
  }
}

function replaceStringDeep(value, from, to) {
  if (Array.isArray(value)) return value.map((v) => replaceStringDeep(v, from, to));
  if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) value[k] = replaceStringDeep(v, from, to);
    return value;
  }
  return value === from ? to : value;
}

// 1) L FIRE FORCE 2: co-locate probabilistic and hard-evidence bonus-end screens.
{
  const uiPath = 'research/L_FIRE_FORCE_2/ui-design-data.json';
  const pkgPath = 'machines/L_FIRE_FORCE_2/machine-package.json';
  const ui = read(uiPath);
  const baseTitle = '炎炎ボーナス終了画面';
  const evidenceTitle = 'ボーナス終了画面・確定パターン';
  const base = ui.sections?.[baseTitle];
  const evidence = ui.sections?.[evidenceTitle];
  assert(base && evidence, 'Fire Force canonical bonus-end sections not found');
  base.inputIds = [...new Set([...base.inputIds, ...evidence.inputIds])];
  base.description = '炎炎ボーナス終了時に表示された画面を、通常の設定示唆画面・設定確定画面とも同じセクションで記録します。';
  delete ui.sections[evidenceTitle];
  ui.sectionOrder = ui.sectionOrder.filter((x) => x !== evidenceTitle);
  write(uiPath, ui);

  const pkg = read(pkgPath);
  let merged = 0;
  walk(pkg, (node) => {
    if (!Array.isArray(node)) return;
    const bi = node.findIndex((x) => x && typeof x === 'object' && x.title === baseTitle && Array.isArray(x.items));
    const ei = node.findIndex((x) => x && typeof x === 'object' && x.title === evidenceTitle && Array.isArray(x.items));
    if (bi < 0 || ei < 0) return;
    const b = node[bi], e = node[ei];
    const seen = new Set(b.items.map((x) => x?.inputId ?? x?.id));
    for (const item of e.items) {
      const key = item?.inputId ?? item?.id;
      if (!seen.has(key)) b.items.push(item);
    }
    b.description = base.description;
    node.splice(ei, 1);
    node.forEach((section, index) => { if (section && typeof section === 'object' && 'displayOrder' in section) section.displayOrder = index + 1; });
    merged++;
  });
  assert(merged >= 1, 'Fire Force generated UI section merge did not occur');
  write(pkgPath, pkg);
}

// 2) Kabaneri: make lower-bell denominator wording concrete.
{
  const uiPath = 'research/L_KABANERI_UNATO_KESSEN_XX/ui-design-data.json';
  const pkgPath = 'machines/L_KABANERI_UNATO_KESSEN_XX/machine-package.json';
  const oldName = '下段ベルを観測可能な遊技ゲーム数';
  const newName = '通常時・ST中・ボーナス中の消化ゲーム数';
  const newDesc = '通常時・ST中・ボーナス中の消化ゲーム数を母数にし、そのうち下段ベル（13枚ベル）が成立した回数を記録します。';
  const ui = read(uiPath);
  assert(ui.inputContracts?.INP_LOWER_BELL_TRIALS?.name === oldName, 'Kabaneri lower-bell old name not found');
  ui.inputContracts.INP_LOWER_BELL_TRIALS.name = newName;
  assert(ui.sections?.['下段ベル'], 'Kabaneri lower-bell section not found');
  ui.sections['下段ベル'].description = newDesc;
  write(uiPath, ui);

  let pkg = read(pkgPath);
  pkg = replaceStringDeep(pkg, oldName, newName);
  pkg = replaceStringDeep(pkg, '下段ベルを判別できるゲームだけを母数にし、そのうち下段ベルが成立した回数を記録します。', newDesc);
  write(pkgPath, pkg);
}

// 3) Jormungand: 4 normal end-screen choices in a 2-column grid.
{
  const ids = new Set([
    'INP_BONUS_END_SCREEN_DEFAULT',
    'INP_BONUS_END_SCREEN_EVENING',
    'INP_BONUS_END_SCREEN_SLEEPING_VALMET',
    'INP_BONUS_END_SCREEN_THREE_DOCTORS',
  ]);
  const uiPath = 'research/L_JORMUNGAND_ND01G/ui-design-data.json';
  const pkgPath = 'machines/L_JORMUNGAND_ND01G/machine-package.json';
  const ui = read(uiPath);
  for (const id of ids) {
    assert(ui.inputContracts?.[id], `Jormungand input missing: ${id}`);
    ui.inputContracts[id].gridSpan = 6;
  }
  write(uiPath, ui);

  const pkg = read(pkgPath);
  let touched = 0;
  walk(pkg, (node) => {
    if (Array.isArray(node) || !node || typeof node !== 'object') return;
    const id = node.inputId ?? node.id;
    if (ids.has(id) && Object.hasOwn(node, 'gridSpan')) {
      node.gridSpan = 6;
      touched++;
    }
  });
  assert(touched >= 4, `Jormungand generated layout touched only ${touched} records`);
  write(pkgPath, pkg);
}

// 4) Triple Crown: hide standalone EXCLUDE summaries when their observation is actually used by adopted joint Multinomial features.
{
  const selPath = 'research/LB_TRIPLE_CROWN_SEVEN_FG/selection-data.json';
  const pkgPath = 'machines/LB_TRIPLE_CROWN_SEVEN_FG/machine-package.json';
  const sel = read(selPath);
  const suppressIds = new Set();
  for (const f of sel.features ?? []) {
    if (f.adoptionCategory !== 'EXCLUDE') continue;
    const reason = `${f.userReason ?? ''} ${f.reason ?? ''}`;
    const integrated = /Multinomial|統合|情報自体は推測から捨てていない|同じ観測/.test(reason) && /二重|単独|分解|統合|同時/.test(reason);
    const trueUnused = /BT.*リプレイ.*BB|リプレイ.*BB/.test(`${f.featureId ?? ''} ${f.researchFeatureId ?? ''} ${reason}`);
    if (integrated && !trueUnused) {
      f.summarySuppressed = true;
      suppressIds.add(f.featureId);
    }
  }
  assert(suppressIds.size >= 3, `Triple Crown integrated EXCLUDE suppression too small: ${suppressIds.size}`);
  const btReplay = (sel.features ?? []).find((f) => /BT.*REPLAY.*BB/i.test(`${f.featureId ?? ''} ${f.researchFeatureId ?? ''}`) || /BT中リプレイ.*BB/.test(`${f.userReason ?? ''} ${f.reason ?? ''}`));
  if (btReplay) assert(btReplay.summarySuppressed !== true, 'Triple Crown true-unused BT replay+BB must remain visible');
  write(selPath, sel);

  const pkg = read(pkgPath);
  let removed = 0;
  walk(pkg, (node) => {
    if (!Array.isArray(node)) return;
    const looksRejected = node.some((x) => x && typeof x === 'object' && x.featureId && Object.hasOwn(x, 'reason'));
    if (!looksRejected) return;
    for (let i = node.length - 1; i >= 0; i--) {
      if (suppressIds.has(node[i]?.featureId)) {
        node.splice(i, 1);
        removed++;
      }
    }
  });
  assert(removed >= suppressIds.size, `Triple Crown generated rejected entries removed ${removed}/${suppressIds.size}`);
  write(pkgPath, pkg);
}

// 5) Kyokou Suiri: EXCLUDE-only Selection inputs must not leak into the app fallback "追加入力" section.
{
  const sel = read('research/L_KYOKOU_SUIRI_ST/selection-data.json');
  const pkgPath = 'machines/L_KYOKOU_SUIRI_ST/machine-package.json';
  const excludeIds = new Set((sel.inputs ?? []).filter((x) => x.inferenceRole === 'EXCLUDE').map((x) => x.id));
  assert(excludeIds.size >= 5, `Kyokou expected EXCLUDE-only inputs, found ${excludeIds.size}`);
  const pkg = read(pkgPath);
  let removed = 0;
  walk(pkg, (node) => {
    if (!Array.isArray(node)) return;
    for (let i = node.length - 1; i >= 0; i--) {
      const item = node[i];
      if (item && typeof item === 'object' && excludeIds.has(item.id) && String(item.id).startsWith('INP_')) {
        node.splice(i, 1);
        removed++;
      }
    }
  });
  assert(removed >= excludeIds.size, `Kyokou EXCLUDE-only generated inputs removed ${removed}/${excludeIds.size}`);
  const serialized = JSON.stringify(pkg);
  for (const id of excludeIds) assert(!serialized.includes(`\"id\":\"${id}\"`), `Kyokou EXCLUDE input still emitted as input object: ${id}`);
  write(pkgPath, pkg);
}

console.log('Next10 UI feedback round2 transform: PASS');
