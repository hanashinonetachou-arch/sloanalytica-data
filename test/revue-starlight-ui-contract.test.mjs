import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const canonical = JSON.parse(fs.readFileSync(new URL('../repro-v8/S_REVUE_STARLIGHT_CX/canonical-ui.json', import.meta.url), 'utf8'));
const summary = JSON.parse(fs.readFileSync(new URL('../repro-v8/S_REVUE_STARLIGHT_CX/machine-research-summary.json', import.meta.url), 'utf8'));
const sections = canonical.sections ?? [];
const conditional = sections.find(section => section.id === 'SEC_CZ_END_LED');

test('Revue Starlight V8 exposes the conditional LED observation from Canonical UI', () => {
  assert.equal(canonical.machineId, 'S_REVUE_STARLIGHT_CX');
  assert.ok(conditional);
  assert.match(conditional.description ?? '', /設定変更時/);
  assert.match(conditional.description ?? '', /AT終了後/);
});

test('Revue Starlight conditional LED observation uses exhaustive generic category counters', () => {
  const item = conditional?.items?.[0];
  assert.ok(item);
  assert.equal(item.interaction?.type, 'CATEGORY_COUNTERS');
  assert.equal(item.interaction?.categoryCoverage, 'EXHAUSTIVE');
  assert.equal(item.interaction?.totalOpportunities, 'DERIVE_FROM_CATEGORY_COUNTS');
  assert.deepEqual(
    item.interaction?.categories?.map(category => category.label),
    ['白', '青', '緑', '赤', '紫'],
  );
});

test('Revue Starlight conditional LED observation remains record-only', () => {
  const serialized = JSON.stringify(conditional);
  assert.match(serialized, /INP_CZ_LED_PURPLE/);
  assert.doesNotMatch(serialized, /engineBinding/);
  const live = summary.selection?.liveConditional ?? [];
  assert.ok(live.some(item => item.featureId === 'FEAT_CZ_FAKE_END_LED'));
});
