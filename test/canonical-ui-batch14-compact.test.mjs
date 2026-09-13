import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ids = [
  'L_ULTRAMAN_TIGA_KA','L_URUSEI_YATSURA_EV','L_VALVRAVE_D','L_YOSHIMUNE_RISING_SA2','L_ZENIGATA4_L1',
  'L_ZOMBIE_LAND_SAGA','S_AOHARU_MISAO_A2','S_BAHAMA_A3_30','S_BUSOU_SHINKI','S_DANMACHI2_XZ'
];
const read = p => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));

test('compact canonical UI batch14 snapshot', () => {
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
        return {
          id,
          name:i.name,
          type:i.type,
          description:i.description,
          uiQuickAdd:i.uiQuickAdd,
          quickAdd:i.quickAdd,
          options:i.options,
          gridSpan:i.gridSpan,
          directInput:i.directInput
        };
      }),
      unresolved: (obs.fieldVerification ?? []).filter(v => !['verified','closed','resolved','done'].includes(String(v.status ?? '').toLowerCase())),
      observationSchema: obs.schemaVersion
    };
    console.log(`CANONICAL_UI_COMPACT ${machineId} ${JSON.stringify(compact)}`);
  }
});
