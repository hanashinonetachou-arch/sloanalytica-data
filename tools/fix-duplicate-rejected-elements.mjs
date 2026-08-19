import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const DUPLICATE_REJECTED_ELEMENT_IDS = {
  L_YOSHIMUNE_RISING_SA2: ['REJECTED_AT_NESTED'],
  L_MACROSS_FRONTIER4_BA: ['REJECTED_UTAHIME_OVERLAP'],
  L_BIOHAZARD_VILLAGE_XA: ['REJECTED_INITIAL_OVERLAP'],
  L_STRIKE_WITCHES2_TF: ['REJECTED_CZ_SMALL_DIFF'],
  L_SKY_LOVE_GNB: ['REJECTED_ST_OVERLAP'],
  L_G1_YUSHUN_CLUB_GOLD_KD: ['REJECTED_G1_BONUS_TINY_DIFF', 'REJECTED_G1_ROAD_TINY_DIFF'],
  L_SAEKANO_SA3: ['REJECTED_CZ_OVERLAP'],
  L_CODE_GEASS_REVIVAL_ZS: ['REJECTED_BIG_OVERLAP', 'REJECTED_DIRECT_NESTED'],
};

export function removeDuplicateRejectedElements(selection, ids) {
  const remove = new Set(ids);
  return {
    ...selection,
    rejectedElements: (selection.rejectedElements ?? []).filter(item => !remove.has(item?.id)),
  };
}

function selectionPath(machineId) {
  return path.join(ROOT, 'research', machineId, 'selection-data.json');
}

function main() {
  for (const [machineId, ids] of Object.entries(DUPLICATE_REJECTED_ELEMENT_IDS)) {
    const file = selectionPath(machineId);
    const selection = JSON.parse(fs.readFileSync(file, 'utf8'));
    const before = selection.rejectedElements?.length ?? 0;
    const updated = removeDuplicateRejectedElements(selection, ids);
    const after = updated.rejectedElements?.length ?? 0;
    const expectedRemoved = ids.filter(id => (selection.rejectedElements ?? []).some(item => item?.id === id)).length;
    if (before - after !== expectedRemoved) {
      throw new Error(`${machineId}: duplicate rejected-element removal mismatch`);
    }
    fs.writeFileSync(file, JSON.stringify(updated, null, 2) + '\n', 'utf8');
    console.log(`${machineId}: removed ${before - after} duplicate rejected element(s)`);
  }
  console.log('Duplicate rejected-element cleanup completed for 8 machines.');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
