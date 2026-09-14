import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const targets = {
  LB_TRIPLE_CROWN_X300: ['INP_NUM_BB', 'INP_NUM_RB'],
  L_KARAKURI_CIRCUS2_JG: ['INP_NUM_AT_INITIAL'],
  L_NANGOKU_SPECIAL_M1: ['INP_NUM_BONUS_INITIAL'],
  L_SENGOKU_COLLECTION6_KS: ['INP_NUM_AT_INITIAL'],
  L_TOARU_INDEX2_FA: ['INP_NUM_CZ_INITIAL', 'INP_NUM_AT_INITIAL', 'INP_NUM_AT_DIRECT'],
  L_TONDEMO_SKILL_KM: ['INP_NUM_CZ_INITIAL', 'INP_NUM_BONUS_INITIAL'],
  L_ULTRAMAN_FINAL_BATTLE_ME: ['INP_NUM_AM_INITIAL', 'INP_NUM_CZ_INITIAL', 'INP_NUM_AT_INITIAL'],
  L_WORLD_DAI_STAR_PA3: ['INP_NUM_CZ_INITIAL', 'INP_NUM_BONUS_INITIAL'],
  L_YABACHIBA_ZM: ['INP_NUM_BELL_CONCENTRATION'],
  L_YAJIKITA_MAIRU_BG: ['INP_NUM_CZ_INITIAL', 'INP_NUM_AT_INITIAL'],
  S_IM_JUGGLER_EX_TP: ['INP_BIG_COUNT', 'INP_REG_COUNT'],
};

let changed = 0;
for (const [machineId, inputIds] of Object.entries(targets)) {
  const file = path.join(ROOT, 'research', machineId, 'ui-design-data.json');
  if (!fs.existsSync(file)) throw new Error(`${machineId}: ui-design-data.json missing`);
  const ui = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (ui.machineId !== machineId || ui.schemaVersion !== 'ui-design-data-v1') {
    throw new Error(`${machineId}: unexpected canonical UI identity/schema`);
  }
  for (const inputId of inputIds) {
    const contract = ui.inputContracts?.[inputId];
    if (!contract) throw new Error(`${machineId}: missing input contract ${inputId}`);
    if (contract.mode !== 'NUMBER') throw new Error(`${machineId}/${inputId}: expected NUMBER, got ${contract.mode}`);
    if (contract.gridSpan !== 12) throw new Error(`${machineId}/${inputId}: expected gridSpan 12, got ${contract.gridSpan}`);
    contract.gridSpan = 6;
    changed += 1;
  }
  fs.writeFileSync(file, `${JSON.stringify(ui, null, 2)}\n`, 'utf8');
  console.log(`UPDATED ${machineId}: ${inputIds.length} input(s)`);
}

if (changed !== 20) throw new Error(`expected 20 changes, got ${changed}`);
console.log(`Feature UI v2 AUTO-6 wave1 APPLY PASS: machines=${Object.keys(targets).length} inputs=${changed}`);
