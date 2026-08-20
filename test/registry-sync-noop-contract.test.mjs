import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync('tools/sync-machine-registry.mjs', 'utf8');

test('registry sync does not rewrite generatedAt for a no-op sync', () => {
  assert.match(source, /const beforeComparable=comparable\(registry\)/);
  assert.match(source, /const changed=beforeComparable!==comparable\(registry\)/);
  assert.match(source, /if\(changed\)\{/);
  assert.match(source, /registry\.generatedAt=previousGeneratedAt/);
});
