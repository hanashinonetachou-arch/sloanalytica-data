import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { validateResearchData } from '../tools/validate-research-data.mjs';

const IDS = [
  'L_BAKI_L3',
  'L_VALVRAVE_D',
  'L_HEY_ELITE_SALARYMAN_KAGAMI_PA4',
  'L_HOKUTO_AD_XR',
  'L_ZENIGATA4_L1',
  'L_SAO_B2',
  'L_BERSERK_MUSOU_EV',
  'L_NYANKO_BIGBANG_MK',
  'L_KARAKURI_CIRCUS_G',
  'L_BIOHAZARD_VENDETTA_FK',
];

for (const machineId of IDS) {
  test(`batch001 ResearchData validates: ${machineId}`, () => {
    const file = path.resolve('research', machineId, 'research-data.json');
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    const result = validateResearchData(data);
    assert.equal(result.status, 'PASS', JSON.stringify(result.errors, null, 2));
    assert.equal(data.machine.machineId, machineId);
  });
}

test('batch001 contains exactly 10 unique machineIds', () => {
  assert.equal(IDS.length, 10);
  assert.equal(new Set(IDS).size, 10);
});
