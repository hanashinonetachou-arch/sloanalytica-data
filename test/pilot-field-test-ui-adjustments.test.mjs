import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { adjustMyJuggler, adjustGalfy, adjustInitialD } from '../tools/apply-pilot-field-test-ui-adjustments.mjs';
import { validateSelectionData } from '../tools/validate-selection-data.mjs';
import { validateUiDesignData } from '../tools/validate-ui-design-data.mjs';

const read = p => JSON.parse(fs.readFileSync(new URL(p, import.meta.url), 'utf8'));

test('My Juggler uses single REG + cherry REG and derives REG total', () => {
  const research = read('../research/S_MY_JUGGLER_V_KD/research-data.json');
  const x = adjustMyJuggler(
    read('../research/S_MY_JUGGLER_V_KD/selection-data.json'),
    read('../research/S_MY_JUGGLER_V_KD/ui-design-data.json'),
    research,
  );
  const total = x.selection.inputs.find(i => i.id === 'INP_REG_COUNT');
  assert.deepEqual(total.derivedFromInputIds, ['INP_SINGLE_REG_COUNT', 'INP_CHERRY_REG_COUNT']);
  assert.equal(total.inputVisible, false);
  assert.ok(x.selection.inputs.some(i => i.id === 'INP_SINGLE_REG_COUNT'));
  const composition = x.selection.features.find(f => f.featureId === 'FEAT_SINGLE_REG_COMPOSITION');
  assert.deepEqual(composition.denominatorInputIds, ['INP_CHERRY_REG_COUNT', 'INP_SINGLE_REG_COUNT']);
  assert.deepEqual(composition.categoryInputIds, ['INP_SINGLE_REG_COUNT']);
  assert.equal(composition.categorySubtractInputIds, undefined);
  assert.ok(x.design.sections['自分の区間'].inputIds.includes('INP_SINGLE_REG_COUNT'));
  assert.ok(!x.design.sections['自分の区間'].inputIds.includes('INP_REG_COUNT'));
  assert.deepEqual(validateUiDesignData(x.design, { expectedMachineId: 'S_MY_JUGGLER_V_KD' }), []);
  const validation = validateSelectionData(x.selection, x.research);
  assert.equal(validation.ok, true, validation.errors?.join('\n'));
});

test('GALFY renames miss input to ハズレ', () => {
  const selection = read('../research/LB_SLOT_GALFY_A4/selection-data.json');
  const x = adjustGalfy(selection, read('../research/LB_SLOT_GALFY_A4/ui-design-data.json'));
  assert.equal(x.selection.inputs.find(i => i.id === 'INP_BT_MISS').name, 'ハズレ');
  assert.equal(x.design.inputContracts.INP_BT_MISS.name, 'ハズレ');
  assert.deepEqual(validateUiDesignData(x.design, { expectedMachineId: 'LB_SLOT_GALFY_A4' }), []);
  const validation = validateSelectionData(x.selection, read('../research/LB_SLOT_GALFY_A4/research-data.json'));
  assert.equal(validation.ok, true, validation.errors?.join('\n'));
});

test('Initial D derives bell denominator from normal games minus excluded games', () => {
  const x = adjustInitialD(
    read('../research/L_INITIAL_D_2ND/selection-data.json'),
    read('../research/L_INITIAL_D_2ND/ui-design-data.json'),
  );
  assert.ok(!x.selection.inputs.some(i => i.id === 'INP_BELL_TARGET_GAMES'));
  assert.ok(x.selection.inputs.some(i => i.id === 'INP_BELL_EXCLUDED_GAMES'));
  const bell = x.selection.features.find(f => f.featureId === 'FEAT_BELL_NORMAL');
  assert.equal(bell.denominatorInputId, 'INP_MY_SAMMY_NORMAL_GAMES');
  assert.deepEqual(bell.denominatorAdjustments, [{ inputId: 'INP_BELL_EXCLUDED_GAMES', multiplier: -1 }]);
  assert.deepEqual(x.design.sections['通常時ベル'].inputIds, ['INP_BELL_EXCLUDED_GAMES', 'INP_BELL_COUNT']);
  assert.deepEqual(validateUiDesignData(x.design, { expectedMachineId: 'L_INITIAL_D_2ND' }), []);
  const validation = validateSelectionData(x.selection, read('../research/L_INITIAL_D_2ND/research-data.json'));
  assert.equal(validation.ok, true, validation.errors?.join('\n'));
});
