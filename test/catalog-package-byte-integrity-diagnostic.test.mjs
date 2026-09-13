import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

test('catalog package size/hash matches repository bytes for every machine', () => {
  const root = process.cwd();
  const catalog = JSON.parse(fs.readFileSync(path.join(root, 'catalog.json'), 'utf8'));
  const mismatches = [];
  for (const item of catalog.machines ?? []) {
    const file = path.join(root, 'machines', item.machineId, 'machine-package.json');
    const bytes = fs.readFileSync(file);
    const actualSize = bytes.length;
    const actualSha = crypto.createHash('sha256').update(bytes).digest('hex');
    if (actualSize !== item.packageSizeBytes || actualSha.toLowerCase() !== String(item.sha256).toLowerCase()) {
      mismatches.push({ machineId: item.machineId, catalogSize: item.packageSizeBytes, actualSize, catalogSha: item.sha256, actualSha });
    }
  }
  console.log('CATALOG_PACKAGE_INTEGRITY', JSON.stringify({ machines: catalog.machines?.length ?? 0, mismatchCount: mismatches.length, mismatches }));
  assert.equal(mismatches.length, 0, JSON.stringify(mismatches.slice(0, 20)));
});
