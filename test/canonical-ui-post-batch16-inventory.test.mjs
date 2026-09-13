import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const exceptions = new Set([
  'LB_AREX_BRIGHT_BA','LB_CREA_BONUS_TRIGGER_A2','LB_MAGICAL_HALLOWEEN_GS','LB_SHAKE_BONUS_TRIGGER_A1',
  'L_RING_NI_KAKERO1_FS','L_MADOKA_FORTE_UU','L_KENGAN_ASHURA_ND','LB_NEW_KING_HANAHANA_V_PF',
  'L_DRAGON_HANAHANA_SENKO_JP','L_GEN_CHOMUGEN_PH','L_KEIJI_SADO_ER','L_TOARU_INDEX_JC',
  'S_GOGO_JUGGLER_3_KA','S_JUGGLER_GIRLS_SS_KH','S_MR_JUGGLER_KK','L_MONKEY_TURN5_CE',
  'L_HIGURASHI_GOU_SS','L_HOKUTO_AD_XR','L_KING_PULSAR_SLCC','L_HANABI_KM',
  'S_NEO_IM_JUGGLER_EX_KK','S_ULTRA_MIRACLE_JUGGLER_KT'
]);

test('post-batch16 canonical UI clean backlog is empty', () => {
  const root = path.resolve('research');
  const dirs = fs.readdirSync(root, { withFileTypes: true })
    .filter(d => d.isDirectory() && d.name !== '_template')
    .map(d => d.name);
  const selectionMachines = dirs.filter(id => fs.existsSync(path.join(root, id, 'selection-data.json')));
  const noCanonical = selectionMachines.filter(id => !fs.existsSync(path.join(root, id, 'ui-design-data.json')));
  const clean = noCanonical.filter(id => !exceptions.has(id)).sort();
  const exceptionMissingCanonical = noCanonical.filter(id => exceptions.has(id)).sort();
  const unknownMissing = noCanonical.filter(id => !exceptions.has(id)).sort();
  console.log('POST_BATCH16_CANONICAL_INVENTORY', JSON.stringify({
    selectionCount: selectionMachines.length,
    exceptionConfiguredCount: exceptions.size,
    noCanonicalCount: noCanonical.length,
    cleanBacklogCount: clean.length,
    cleanBacklog: clean,
    exceptionMissingCanonicalCount: exceptionMissingCanonical.length,
    exceptionMissingCanonical,
    unknownMissing
  }));
  assert.equal(exceptions.size, 22);
  assert.deepEqual(clean, []);
});
