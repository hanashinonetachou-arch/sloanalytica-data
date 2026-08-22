import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const write = (rel, value) => fs.writeFileSync(path.join(ROOT, rel), JSON.stringify(value, null, 2) + '\n');
const upsert = (arr, key, value) => {
  const index = arr.findIndex((item) => item?.[key] === value?.[key]);
  if (index >= 0) arr[index] = value;
  else arr.push(value);
};

function updateZombieLandSaga() {
  const rel = 'research/L_ZOMBIE_LAND_SAGA/selection-data.json';
  const selection = read(rel);
  selection.machineDataVersion = '0.1.2';
  if (selection.uiCategoryLabels) delete selection.uiCategoryLabels.WAF;

  const waf = selection.inputs.find((input) => input.id === 'INP_CZ_WAF');
  const success = selection.inputs.find((input) => input.id === 'INP_WAF_ST_SUCCESS');
  const house = selection.inputs.find((input) => input.id === 'INP_CZ_HOUSE');
  const saga = selection.inputs.find((input) => input.id === 'INP_CZ_SAGA_ROCK');
  if (!waf || !success || !house || !saga) throw new Error('Zombie Land Saga expected inputs are missing');

  waf.displayOrder = 2;
  success.name = 'We Are Franchouchou成功回数';
  success.category = 'CZ';
  success.displayOrder = 3;
  success.description = 'We Are Franchouchouから最終的にSTへ当選した回数を数えてください。';
  house.displayOrder = 4;
  saga.displayOrder = 5;
  write(rel, selection);
}

function updateGamera2() {
  const researchRel = 'research/S_GAMERA2/research-data.json';
  const selectionRel = 'research/S_GAMERA2/selection-data.json';
  const research = read(researchRel);
  const selection = read(selectionRel);
  selection.machineDataVersion = '0.1.2';

  const bonusDescription = '実機連動機能で取得できない場合はこちらを入力してください。リーチ目リプレイがカウントできる場合はそちらが優先されるため無効になります。';
  for (const id of ['INP_BIG_COUNT', 'INP_REG_COUNT']) {
    const input = selection.inputs.find((item) => item.id === id);
    if (!input) throw new Error(`Gamera2 missing ${id}`);
    input.description = bonusDescription;
  }

  research.sources = research.sources ?? [];
  upsert(research.sources, 'sourceId', {
    sourceId: 'SRC_PACHI7_TROPHY',
    publisher: 'パチ7',
    title: 'パチスロ ガメラ2 設定判別・サミートロフィー',
    url: 'https://pachiseven.jp/machines/6891/cutout/1005',
    checkedAt: '2026-08-22',
    sourceType: 'analysis',
  });

  const settings = research.machine.settings;
  const floorEvidence = [
    ['EV_TROPHY_BRONZE_2PLUS', 'サミートロフィー 銅', 2],
    ['EV_TROPHY_SILVER_3PLUS', 'サミートロフィー 銀', 3],
    ['EV_TROPHY_GOLD_4PLUS', 'サミートロフィー 金', 4],
    ['EV_TROPHY_KIRIN_5PLUS', 'サミートロフィー キリン柄', 5],
    ['EV_TROPHY_RAINBOW_6', 'サミートロフィー 虹', 6],
  ];
  research.evidenceCandidates = research.evidenceCandidates ?? [];
  for (const [id, name, floor] of floorEvidence) {
    const allowedSettings = settings.filter((setting) => Number(setting.replace('SET_', '')) >= floor);
    const deniedSettings = settings.filter((setting) => !allowedSettings.includes(setting));
    upsert(research.evidenceCandidates, 'researchEvidenceId', {
      researchEvidenceId: id,
      name,
      allowedSettings,
      deniedSettings,
      sourceRefs: ['SRC_PACHI7_TROPHY'],
      notes: 'ボーナス終了後に出現するサミートロフィー。色に応じて設定下限を示す。',
    });
  }

  selection.evidenceUi = selection.evidenceUi ?? { groups: [] };
  const trophyGroup = {
    groupId: 'SAMMY_TROPHY',
    label: 'サミートロフィー',
    selectionMode: 'single',
    normalizationMode: 'ALLOWED_SETTINGS',
    options: [
      { value: 'BRONZE_2PLUS', label: '銅（設定2以上）', allowedSettings: settings.filter((s) => Number(s.replace('SET_', '')) >= 2), sourceEvidenceIds: ['EV_TROPHY_BRONZE_2PLUS'] },
      { value: 'SILVER_3PLUS', label: '銀（設定3以上）', allowedSettings: settings.filter((s) => Number(s.replace('SET_', '')) >= 3), sourceEvidenceIds: ['EV_TROPHY_SILVER_3PLUS'] },
      { value: 'GOLD_4PLUS', label: '金（設定4以上）', allowedSettings: settings.filter((s) => Number(s.replace('SET_', '')) >= 4), sourceEvidenceIds: ['EV_TROPHY_GOLD_4PLUS'] },
      { value: 'KIRIN_5PLUS', label: 'キリン柄（設定5以上）', allowedSettings: settings.filter((s) => Number(s.replace('SET_', '')) >= 5), sourceEvidenceIds: ['EV_TROPHY_KIRIN_5PLUS'] },
      { value: 'RAINBOW_6', label: '虹（設定6）', allowedSettings: settings.filter((s) => Number(s.replace('SET_', '')) >= 6), sourceEvidenceIds: ['EV_TROPHY_RAINBOW_6'] },
    ],
  };
  upsert(selection.evidenceUi.groups, 'groupId', trophyGroup);
  write(researchRel, research);
  write(selectionRel, selection);
}

function verifyGodEater() {
  const rel = 'research/L_GOD_EATER_RESURRECTION/selection-data.json';
  const selection = read(rel);
  const group = selection.evidenceUi?.groups?.find((item) => item.groupId === 'DENIED_SETTINGS');
  const option = group?.options?.find((item) => item.value === 'NOT_234');
  if (!option) throw new Error('God Eater NOT_234 option is missing');
  const expected = ['SET_2', 'SET_3', 'SET_4'];
  if (JSON.stringify(option.excludedSettings) !== JSON.stringify(expected)) {
    throw new Error(`God Eater AT終了画面：ユウ must deny SET_2, SET_3, SET_4; actual=${JSON.stringify(option.excludedSettings)}`);
  }
  option.label = 'AT終了画面：ユウ（設定2・3・4否定）';
  selection.selectionNotes = selection.selectionNotes ?? [];
  const note = 'AT終了画面のユウは設定2・3・4否定。ストーリー終了ボイスのユウ（設定2・3否定）とは別要素。';
  if (!selection.selectionNotes.includes(note)) selection.selectionNotes.push(note);
  write(rel, selection);
}

updateZombieLandSaga();
updateGamera2();
verifyGodEater();
console.log('Applied batch01 machine-check follow-up v2: Zombie Land Saga layout, Gamera2 bonus/trophy evidence, God Eater clarification.');
