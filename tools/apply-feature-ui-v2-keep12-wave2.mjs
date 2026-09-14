import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const targets = {
  LB_TRIPLE_CROWN_SEVEN_FG: ['INP_BB_BGM_TRIALS', 'INP_RB_BGM_TRIALS'],
  L_BOFURI_FN: ['INP_BET_TRIALS'],
  L_BOUNTY_ANGEL: ['INP_RESET_AT_DIRECT'],
  L_DRUAGA_NO_TOU_ZA: ['INP_DC_ELIGIBLE_RARE'],
  L_HEY_ELITE_SALARYMAN_KAGAMI_PA4: ['INP_TRUNK_COUNT'],
  L_MADOKA_FORTE_UU: ['INP_PETIT_BIG_TRIALS'],
  L_MAGICAL_HALLOWEEN8_FE: ['INP_DOKOMAJI_ELIGIBLE_BONUS'],
  L_SAO2_PA1: [
    'INP_DEN_CZ_FAIL_ITEM',
    'INP_NUM_CZ_FAIL_ITEM',
    'INP_DEN_STRONG_CHANCE_CONFIRMED_CZ',
    'INP_NUM_STRONG_CHANCE_CONFIRMED_CZ',
  ],
  L_SHINUCHI_YOSHIMUNE_A1: ['INP_BATTO_METER_MAX_TRIAL'],
  L_SMASLO_TOKYO_REVENGERS_ZF: ['INP_TC_WEAK_RARE_AT', 'INP_REVENGE_ELIGIBLE_AT_END'],
  L_SUPER_RIO_ACE2_ND02H: [
    'INP_DEN_HOWARD_THRESHOLD',
    'INP_NUM_HOWARD_THRESHOLD',
    'INP_DEN_RINA_SIGN',
    'INP_NUM_RINA_SIGN',
  ],
  L_UMINEKO_2_A1: ['INP_INHERIT_TRIALS'],
  S_KABANERI_ZR: ['INP_MUMEI_3_HIT'],
  S_SENGOKU_MUSOU3_ZYTCD: ['INP_BIG_GAUGE3_AT'],
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
    if (contract.gridSpan !== 6) throw new Error(`${machineId}/${inputId}: expected gridSpan 6, got ${contract.gridSpan}`);
    contract.gridSpan = 12;
    changed += 1;
  }
  fs.writeFileSync(file, `${JSON.stringify(ui, null, 2)}\n`, 'utf8');
  console.log(`UPDATED ${machineId}: ${inputIds.length} parent/dependency input(s)`);
}

if (changed !== 22) throw new Error(`expected 22 changes, got ${changed}`);
console.log(`Feature UI v2 KEEP-12 wave2 APPLY PASS: machines=${Object.keys(targets).length} inputs=${changed}`);
