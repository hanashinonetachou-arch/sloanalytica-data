import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RESEARCH = path.join(ROOT, 'research');
const EXCEPTIONS = new Set([
  'LB_AREX_BRIGHT_BA','LB_CREA_BONUS_TRIGGER_A2','LB_MAGICAL_HALLOWEEN_GS','LB_SHAKE_BONUS_TRIGGER_A1',
  'L_RING_NI_KAKERO1_FS','L_MADOKA_FORTE_UU','L_KENGAN_ASHURA_ND','LB_NEW_KING_HANAHANA_V_PF',
  'L_DRAGON_HANAHANA_SENKO_JP','L_GEN_CHOMUGEN_PH','L_KEIJI_SADO_ER','L_TOARU_INDEX_JC',
  'S_GOGO_JUGGLER_3_KA','S_JUGGLER_GIRLS_SS_KH','S_MR_JUGGLER_KK','L_MONKEY_TURN5_CE',
  'L_HIGURASHI_GOU_SS','L_HOKUTO_AD_XR','L_KING_PULSAR_SLCC','L_HANABI_KM',
  'S_NEO_IM_JUGGLER_EX_KK','S_ULTRA_MIRACLE_JUGGLER_KT'
]);
const readJson = p => JSON.parse(fs.readFileSync(p, 'utf8'));

test('inventory remaining clean canonical UI backlog after batch14', () => {
  const all = fs.readdirSync(RESEARCH, { withFileTypes: true })
    .filter(d => d.isDirectory() && d.name !== '_template')
    .map(d => d.name)
    .filter(id => fs.existsSync(path.join(RESEARCH, id, 'selection-data.json')))
    .sort();

  const missingCanonical = all.filter(id => !fs.existsSync(path.join(RESEARCH, id, 'ui-design-data.json')));
  const excludedExceptions = missingCanonical.filter(id => EXCEPTIONS.has(id));
  const clean = missingCanonical.filter(id => !EXCEPTIONS.has(id));

  console.log(`CANONICAL_UI_BACKLOG allSelection=${all.length} missingCanonical=${missingCanonical.length} migrationExceptions=${excludedExceptions.length} clean=${clean.length}`);
  console.log(`CANONICAL_UI_EXCEPTIONS ${JSON.stringify(excludedExceptions)}`);

  for (const id of clean) {
    const obsPath = path.join(RESEARCH, id, 'machine-observation-data.json');
    const pkgPath = path.join(ROOT, 'machines', id, 'machine-package.json');
    const obs = fs.existsSync(obsPath) ? readJson(obsPath) : null;
    const unresolved = obs?.fieldVerification?.filter(v => !['verified','closed','resolved','done'].includes(String(v.status ?? '').toLowerCase())) ?? [];
    console.log(`CANONICAL_UI_CLEAN ${id} observation=${obs?.schemaVersion ?? 'MISSING'} unresolved=${unresolved.length} package=${fs.existsSync(pkgPath) ? 'yes' : 'no'}`);
  }

  console.log(`CANONICAL_UI_NEXT10 ${JSON.stringify(clean.slice(0, 10))}`);
});
