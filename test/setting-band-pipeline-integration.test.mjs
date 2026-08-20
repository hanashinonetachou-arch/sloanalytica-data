import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const ROOT = process.cwd();
const readText = p => fs.readFileSync(path.join(ROOT, p), 'utf8');
const readJson = p => JSON.parse(readText(p));

test('machine pipeline generates setting-band report before difficulty catalog sync', () => {
  const source = readText('tools/machine-pipeline.mjs');
  const refine = source.indexOf("refine-setting-band-games.mjs");
  const sync = source.indexOf("sync-machine-difficulty-catalog.mjs");
  assert.ok(refine >= 0, 'setting-band refinement hook is missing');
  assert.ok(sync > refine, 'difficulty catalog sync must happen after setting-band refinement');
  assert.match(source, /setting-band-report\.json/);
});

test('batch guard restores setting-band reports on check or failure', () => {
  const source = readText('tools/guard-machine-pipeline.mjs');
  assert.match(source, /snapshotSettingBandReports/);
  assert.match(source, /restoreSettingBandReports/);
  assert.match(source, /checkOnly/);
});

test('outer guard restores machine registry after check mode', () => {
  const source = readText('tools/guard-machine-pipeline.mjs');
  assert.match(source, /machineRegistrySnapshot/);
  assert.match(source, /fs\.readFileSync\(machineRegistryPath\)/);
  assert.match(source, /fs\.writeFileSync\(machineRegistryPath, machineRegistrySnapshot\)/);
});

test('difficulty catalog sync requires and publishes setting-band data', () => {
  const source = readText('tools/sync-machine-difficulty-catalog.mjs');
  assert.match(source, /setting-band-report\.json/);
  assert.match(source, /settingBandDiscrimination/);
  assert.match(source, /setting-band-discrimination-g-v1/);
});

test('single publish is routed through setting-band publish guard', () => {
  const pkg = readJson('package.json');
  assert.equal(pkg.scripts['machine:publish'], 'node tools/guard-publish-machine-data.mjs');
  const source = readText('tools/guard-publish-machine-data.mjs');
  assert.match(source, /sync-machine-difficulty-catalog\.mjs/);
  assert.match(source, /refine-setting-band-games\.mjs/);
});
