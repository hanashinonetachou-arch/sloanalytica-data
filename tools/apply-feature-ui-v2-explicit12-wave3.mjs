import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TARGETS = {
  L_SMASLO_BAKEMONOGATARI_KH: ['INP_AT_INITIAL_OBSERVED_DENOMINATOR'],
  L_ULTRAMAN_TIGA_KA: ['INP_TC36_TRIALS', 'INP_TC36_PLUS'],
  S_KABANERI_ZR: ['INP_ST_END_TOTAL'],
  S_NAMENEKO_QQ: ['INP_INITIAL_TOTAL', 'INP_INITIAL_BIG'],
};

for (const [machineId, inputIds] of Object.entries(TARGETS)) {
  const file = path.join(ROOT, 'research', machineId, 'ui-design-data.json');
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const inputId of inputIds) {
    const contract = data.inputContracts?.[inputId];
    if (!contract) throw new Error(`${machineId}/${inputId}: missing canonical input contract`);
    if (contract.gridSpan != null && contract.gridSpan !== 12) {
      throw new Error(`${machineId}/${inputId}: expected undefined or 12, got ${contract.gridSpan}`);
    }
    contract.gridSpan = 12;
  }
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
  console.log(`explicit KEEP-12: ${machineId} ${inputIds.join(',')}`);
}
