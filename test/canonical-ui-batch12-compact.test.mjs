import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ids = [
  'L_KAGUYA_SAMA_JA','L_KEIJI_SADO_ER','L_KENGAN_ASHURA_ND','L_KING_PULSAR_SLCC','L_MADOKA_FORTE_UU',
  'L_MONKEY_TURN5_CE','L_MUSHOKU_TENSEI_NM','L_RING_NI_KAKERO1_FS','L_SENGOKU_BASARA_GIGA_ZE','L_SENGOKU_COLLECTION5_GJ'
];
const read = p => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));

test('compact canonical UI batch12 snapshot', () => {
  for (const machineId of ids) {
    const pkg = read(`machines/${machineId}/machine-package.json`);
    const obs = read(`research/${machineId}/machine-observation-data.json`);
    const inputMap = new Map((pkg.inputs?.inputs ?? []).map(i => [i.id, i]));
    const used = [];
    for (const section of pkg.ui?.sections ?? []) {
      for (const item of section.items ?? []) {
        if (item.inputId && !used.includes(item.inputId)) used.push(item.inputId);
      }
    }
    const compact = {
      machineId,
      ui: pkg.ui,
      inputs: used.map(id => {
        const i = inputMap.get(id) ?? {};
        return {id,name:i.name,type:i.type,description:i.description,uiQuickAdd:i.uiQuickAdd,options:i.options};
      }),
      unresolved: (obs.fieldVerification ?? []).filter(v => !['verified','closed','resolved','done'].includes(String(v.status ?? '').toLowerCase())),
      observationSchema: obs.schemaVersion
    };
    console.log(`CANONICAL_UI_COMPACT ${machineId} ${JSON.stringify(compact)}`);
  }
});
