import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const researchRoot = path.join(ROOT, 'research');
const exceptions = new Set([
  'LB_AREX_BRIGHT_BA','LB_CREA_BONUS_TRIGGER_A2','LB_MAGICAL_HALLOWEEN_GS','LB_SHAKE_BONUS_TRIGGER_A1',
  'L_RING_NI_KAKERO1_FS','L_MADOKA_FORTE_UU','L_KENGAN_ASHURA_ND','LB_NEW_KING_HANAHANA_V_PF',
  'L_DRAGON_HANAHANA_SENKO_JP','L_GEN_CHOMUGEN_PH','L_KEIJI_SADO_ER','L_TOARU_INDEX_JC',
  'S_GOGO_JUGGLER_3_KA','S_JUGGLER_GIRLS_SS_KH','S_MR_JUGGLER_KK','L_MONKEY_TURN5_CE',
  'L_HIGURASHI_GOU_SS','L_HOKUTO_AD_XR','L_KING_PULSAR_SLCC','L_HANABI_KM','S_NEO_IM_JUGGLER_EX_KK',
  'S_ULTRA_MIRACLE_JUGGLER_KT'
]);

test('inventory next clean canonical UI backlog', () => {
  const rows = [];
  for (const machineId of fs.readdirSync(researchRoot).sort()) {
    const dir = path.join(researchRoot, machineId);
    if (!fs.statSync(dir).isDirectory() || machineId === '_template' || exceptions.has(machineId)) continue;
    if (!fs.existsSync(path.join(dir, 'selection-data.json'))) continue;
    if (fs.existsSync(path.join(dir, 'ui-design-data.json'))) continue;
    const obsPath = path.join(dir, 'machine-observation-data.json');
    let obsSchema = null;
    let unresolved = null;
    if (fs.existsSync(obsPath)) {
      const obs = JSON.parse(fs.readFileSync(obsPath, 'utf8'));
      obsSchema = obs.schemaVersion;
      unresolved = (obs.fieldVerification ?? []).filter(v => !['verified','closed','resolved','done'].includes(String(v.status ?? '').toLowerCase())).length;
    }
    rows.push({machineId, obsSchema, unresolved});
  }
  console.log(`CANONICAL_UI_CLEAN_BACKLOG_COUNT ${rows.length}`);
  console.log(`CANONICAL_UI_NEXT10 ${JSON.stringify(rows.slice(0,10))}`);
});
