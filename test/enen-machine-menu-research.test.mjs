import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const research = JSON.parse(
  fs.readFileSync('research/L_ENEN_NO_SHOUBOUTAI_JG/research-data.json', 'utf8'),
);

test('Fire Force machine menu research keeps verified cumulative items and sources', () => {
  assert.equal(research.machineMenuResearch?.status, 'checked');
  assert.deepEqual(research.machineMenuResearch?.availableData, [
    'ゲーム数',
    '炎炎激闘回数',
    '歴代最大連続回数',
  ]);

  const sourceIds = new Set(research.sources.map((source) => source.sourceId));
  assert.ok(sourceIds.has('SRC_MENU_HAZUSE'));
  assert.ok(sourceIds.has('SRC_MENU_PACHIMAGA'));

  const menuSurface = research.researchCompleteness?.numericSurfaces?.find(
    (item) => item.surface === 'machine_menu_cumulative',
  );
  assert.equal(menuSurface?.status, 'CHECKED');
  assert.deepEqual(menuSurface?.sourceRefs, [
    'SRC_MENU_HAZUSE',
    'SRC_MENU_PACHIMAGA',
  ]);
});
