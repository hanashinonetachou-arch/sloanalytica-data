import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { materializeUiDesignIntoPackage } from '../tools/materialize-ui-design-into-machine-package.mjs';

const root = new URL('../', import.meta.url);
function read(rel) {
  return JSON.parse(fs.readFileSync(new URL(rel, root), 'utf8'));
}

test('M7 materializer preserves an explicit empty canonical section description', () => {
  const machineId = 'L_AKAME_GA_KILL_2';
  const pkg = read(`machines/${machineId}/machine-package.json`);
  const design = read(`research/${machineId}/ui-design-data.json`);
  const title = '初当り';

  assert.equal(design.sections[title].description, '');

  const out = materializeUiDesignIntoPackage(pkg, design);
  const section = out.ui.sections.find(s => s.title === title);

  assert.ok(section);
  assert.ok(Object.hasOwn(section, 'description'));
  assert.equal(section.description, '');
});
