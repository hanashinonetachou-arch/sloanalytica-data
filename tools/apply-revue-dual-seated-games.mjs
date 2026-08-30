import fs from 'node:fs';

const machineDir = 'research/S_REVUE_STARLIGHT_CX';
const readJson = (name) => JSON.parse(fs.readFileSync(`${machineDir}/${name}`, 'utf8'));
const writeJson = (name, value) => fs.writeFileSync(`${machineDir}/${name}`, `${JSON.stringify(value, null, 2)}\n`, 'utf8');

const selection = readJson('selection-data.json');
selection.machineDataVersion = '0.1.8';
const inputs = selection.inputs;
const total = inputs.find((x) => x.id === 'INP_SEATED_TOTAL_GAMES');
const reg = inputs.find((x) => x.id === 'INP_SEATED_REG_COUNT');
const cz = inputs.find((x) => x.id === 'INP_SEATED_CZ_COUNT');
const at = inputs.find((x) => x.id === 'INP_SEATED_AT_COUNT');
if (!total || !reg || !cz || !at) throw new Error('expected seated inputs not found');
let normal = inputs.find((x) => x.id === 'INP_SEATED_NORMAL_GAMES');
if (!normal) {
  normal = {
    id: 'INP_SEATED_NORMAL_GAMES',
    name: '着席時 通常ゲーム数',
    category: 'PREDECESSOR',
    type: 'integer',
    unit: 'G',
    displayOrder: 2,
    inferenceRole: 'EXCLUDE',
    defaultValue: '',
    description: '実機メニュー「遊技履歴」の通常ゲーム数を入力してください。着席時CZ・ATの観測区間を表す分母です。',
    observationScope: 'PREDECESSOR_SNAPSHOT',
  };
  const totalIndex = inputs.findIndex((x) => x.id === total.id);
  inputs.splice(totalIndex + 1, 0, normal);
}
Object.assign(total, { displayOrder: 1, description: '実機メニュー「遊技履歴」の総ゲーム数を入力してください。リアルボーナスはAT中も抽選されるため、着席時REGの分母には総ゲーム数を使用します。' });
Object.assign(normal, { displayOrder: 2, inferenceRole: 'EXCLUDE', defaultValue: '', description: '実機メニュー「遊技履歴」の通常ゲーム数を入力してください。着席時CZ・ATの観測区間を表す分母です。' });
Object.assign(reg, { displayOrder: 3, parentInputId: 'INP_SEATED_TOTAL_GAMES' });
Object.assign(cz, { displayOrder: 4, parentInputId: 'INP_SEATED_NORMAL_GAMES' });
Object.assign(at, { displayOrder: 5, parentInputId: 'INP_SEATED_NORMAL_GAMES' });
writeJson('selection-data.json', selection);

const ui = readJson('ui-design-data.json');
const seated = ui.sections?.['着席時データ'];
if (!seated) throw new Error('seated UI section not found');
seated.inputIds = ['INP_SEATED_TOTAL_GAMES', 'INP_SEATED_NORMAL_GAMES', 'INP_SEATED_REG_COUNT', 'INP_SEATED_CZ_COUNT', 'INP_SEATED_AT_COUNT'];
seated.description = '実機メニューの遊技履歴から取得した着席前区間のデータです。REGはリアルボーナスのため総ゲーム数を分母として推測へ使用します。CZ・ATは通常ゲーム数を対応する観測分母として保存しますが、現時点では推測には使用しません。';
ui.inputContracts = ui.inputContracts || {};
ui.inputContracts.INP_SEATED_TOTAL_GAMES = { name: '着席時 総ゲーム数', mode: 'NUMBER', gridSpan: 12, directInput: true };
ui.inputContracts.INP_SEATED_NORMAL_GAMES = { name: '着席時 通常ゲーム数', mode: 'NUMBER', gridSpan: 12, directInput: true };
ui.inputContracts.INP_SEATED_REG_COUNT = { name: '着席時 REG回数', mode: 'NUMBER', gridSpan: 12, directInput: true };
writeJson('ui-design-data.json', ui);

const observation = readJson('machine-observation-data.json');
const seatedObs = observation.observations.find((x) => x.observationId === 'OBS_PREDECESSOR_REG');
if (!seatedObs) throw new Error('OBS_PREDECESSOR_REG not found');
seatedObs.label = '着席時総ゲーム数・通常ゲーム数・REG・CZ・AT回数';
seatedObs.categories = ['着席時総ゲーム数', '着席時通常ゲーム数', '着席時REG回数', '着席時Challenge Revue回数', '着席時STAR LIGHT初当り回数'];
seatedObs.excludedConditions = ['自己実戦区間を混ぜない', 'REGの分母に通常ゲーム数だけを使わない', 'CZ・ATの観測区間に総ゲーム数を代用しない'];
seatedObs.notes = 'ユーザー実機知見により、本機はリアルボーナスでAT中もREG抽選対象。前任者REGは総ゲーム数を分母として扱う。一方、CZ・ATは通常ゲーム数を対応する観測分母として保存し、現時点では推測不参加を維持する。';
writeJson('machine-observation-data.json', observation);

const lock = readJson('user-verified-ui-lock.json');
lock.status = 'REVERIFICATION_REQUIRED';
lock.updatedAt = '2026-08-30';
lock.notes = Array.isArray(lock.notes) ? lock.notes : [];
lock.notes.push('Intentional UI change: seated section now has both total games (REG denominator) and normal games (CZ/AT observation denominator). Re-verification required.');
writeJson('user-verified-ui-lock.json', lock);

console.log('UPDATED Revue seated inputs: total games -> REG; normal games -> CZ/AT');