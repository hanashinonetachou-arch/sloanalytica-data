import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { buildMachineData } from '../tools/build-machine-data.mjs';
import { auditSelectionPolicyMigration } from '../tools/audit-selection-policy-migration.mjs';

const ids = [
  'LB_AREX_BRIGHT_BA','LB_CREA_BONUS_TRIGGER_A2','LB_MAGICAL_HALLOWEEN_GS','LB_SHAKE_BONUS_TRIGGER_A1',
  'L_RING_NI_KAKERO1_FS','L_MADOKA_FORTE_UU','L_KENGAN_ASHURA_ND','LB_NEW_KING_HANAHANA_V_PF',
  'L_DRAGON_HANAHANA_SENKO_JP','L_GEN_CHOMUGEN_PH','L_KEIJI_SADO_ER','L_TOARU_INDEX_JC',
  'S_GOGO_JUGGLER_3_KA','S_JUGGLER_GIRLS_SS_KH','S_MR_JUGGLER_KK','L_MONKEY_TURN5_CE',
  'L_HIGURASHI_GOU_SS','L_HOKUTO_AD_XR','L_KING_PULSAR_SLCC','L_HANABI_KM',
  'S_NEO_IM_JUGGLER_EX_KK','S_ULTRA_MIRACLE_JUGGLER_KT'
];
const read = p => JSON.parse(fs.readFileSync(p,'utf8'));
const uiInputs = pkg => [...new Set((pkg.ui?.sections ?? []).flatMap(s => (s.items ?? []).filter(x => x.type === 'input').map(x => x.inputId)))];
const activeFeatures = pkg => (pkg.features?.features ?? []).filter(f => f.calculationRole !== 'DISPLAY_ONLY' && f.adoptionCategory !== 'DISPLAY_ONLY').map(f => f.featureId).sort();

test('diagnose all approved safety-removal exceptions', () => {
  const audit = auditSelectionPolicyMigration(path.resolve('.'));
  const byId = new Map(audit.machines.map(x => [x.machineId, x]));
  const rows = [];
  for (const id of ids) {
    const rp = `research/${id}/research-data.json`;
    const sp = `research/${id}/selection-data.json`;
    const statp = `research/${id}/statistics-report.json`;
    const mp = `machines/${id}/machine-package.json`;
    const current = read(mp);
    const generated = buildMachineData(read(rp), read(sp), fs.existsSync(statp) ? read(statp) : null);
    const currentInputs = uiInputs(current);
    const generatedInputs = uiInputs(generated);
    const currentSet = new Set(currentInputs), generatedSet = new Set(generatedInputs);
    const reviewed = byId.get(id)?.reviewedDiffs ?? [];
    rows.push({
      machineId: id,
      reviewedRemoval: reviewed.flatMap(x => x.published.filter(fid => !x.generated.includes(fid))).sort(),
      currentActive: activeFeatures(current),
      generatedActive: activeFeatures(generated),
      removedUiInputs: currentInputs.filter(x => !generatedSet.has(x)),
      addedUiInputs: generatedInputs.filter(x => !currentSet.has(x)),
      currentUiInputCount: currentInputs.length,
      generatedUiInputCount: generatedInputs.length
    });
  }
  console.log('SAFETY_REMOVAL_EXCEPTION_IMPACT', JSON.stringify(rows));
  assert.equal(rows.length, 22);
  assert.ok(rows.every(r => r.reviewedRemoval.length >= 1));
});
