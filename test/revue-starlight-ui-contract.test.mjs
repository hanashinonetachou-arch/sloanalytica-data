import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const pkg = JSON.parse(fs.readFileSync(new URL('../machines/S_REVUE_STARLIGHT_CX/machine-package.json', import.meta.url), 'utf8'));
const sections = pkg.ui?.sections ?? [];
const conditional = sections.find(section => section.title === 'CZ・フェイク前兆終了時LED');

test('Revue Starlight V8 exposes the conditional LED observation from Canonical UI', () => {
  assert.equal(pkg.v8?.source, 'REPRO_V8_UPSTREAM_ONLY');
  assert.ok(conditional);
  assert.match(conditional.description ?? '', /設定変更時/);
  assert.match(conditional.description ?? '', /AT終了後/);
  assert.match(conditional.description ?? '', /設定推測には使用しません/);
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
  const summary = pkg.v8?.machineResearchSummary?.selection;
  const excluded = summary?.excluded ?? [];
  assert.ok(excluded.some(item => item.featureId === 'FEAT_CZ_END_LED'));
});
