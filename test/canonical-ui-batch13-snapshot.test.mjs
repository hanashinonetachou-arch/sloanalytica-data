import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const ids = [
  'L_SENGOKU_OTOME4_S3',
  'L_SHINOBIDAMASHII3_A3',
  'L_SKY_LOVE_GNB',
  'L_SMASLO_BAKEMONOGATARI_KH',
  'L_STREET_FIGHTER5_ZD',
  'L_STRIKE_THE_BLOOD_ZC',
  'L_STRIKE_WITCHES2_TF',
  'L_SYMPHOGEAR_SEIGI_JA',
  'L_TENSURA_CD',
  'L_TOKYO_GHOUL'
];

test('batch13 legacy UI snapshot', () => {
  const out = ids.map(machineId => {
    const pkg = JSON.parse(fs.readFileSync(`machines/${machineId}/machine-package.json`, 'utf8'));
    const inputs = new Map(pkg.inputs.inputs.map(x => [x.id, x]));
    return {
      machineId,
      sections: pkg.ui.sections.map(s => ({
        id: s.id,
        title: s.title,
        description: s.description ?? null,
        items: s.items.map(i => {
          const input = inputs.get(i.inputId) ?? {};
          return {
            inputId: i.inputId,
            label: i.label ?? null,
            widget: i.widget ?? null,
            itemConfig: Object.fromEntries(Object.entries(i).filter(([k]) => !['type','inputId','label','widget'].includes(k))),
            inputType: input.type ?? null,
            inputName: input.name ?? null,
            inputDescription: input.description ?? null,
            quickAdd: input.quickAdd ?? null,
            directInput: input.directInput ?? null,
            gridSpan: input.gridSpan ?? null
          };
        })
      }))
    };
  });
  for (const row of out) console.log('# B13_UI ' + JSON.stringify(row));
  assert.equal(out.length, ids.length);
});
