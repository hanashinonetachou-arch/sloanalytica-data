import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveCatalogTimestamps } from '../tools/catalog-update-timestamp.mjs';

const now = '2026-09-12T02:30:00.000Z';

test('new catalog entry gets addedAt and updatedAt', () => {
  assert.deepEqual(resolveCatalogTimestamps(null, 'new-sha', now), {
    addedAt: now,
    updatedAt: now,
  });
});

test('changed package advances updatedAt while preserving addedAt', () => {
  assert.deepEqual(resolveCatalogTimestamps({
    addedAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
    sha256: 'old-sha',
  }, 'new-sha', now), {
    addedAt: '2026-08-01T00:00:00.000Z',
    updatedAt: now,
  });
});

test('unchanged package preserves existing updatedAt', () => {
  assert.deepEqual(resolveCatalogTimestamps({
    addedAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
    sha256: 'same-sha',
  }, 'same-sha', now), {
    addedAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
  });
});

test('unchanged legacy entry stays without synthetic updatedAt', () => {
  assert.deepEqual(resolveCatalogTimestamps({
    addedAt: '2026-08-01T00:00:00.000Z',
    sha256: 'same-sha',
  }, 'same-sha', now), {
    addedAt: '2026-08-01T00:00:00.000Z',
  });
});
