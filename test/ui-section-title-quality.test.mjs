import test from 'node:test';
import assert from 'node:assert/strict';
import { findBadSectionTitles } from '../tools/audit-ui-section-title-quality.mjs';

test('semantic section titles pass', () => {
  const data = { sectionOrder: ['CZ初当り', 'AT初当り', 'ボーナス初当り', '設定示唆・確定演出'] };
  assert.deepEqual(findBadSectionTitles(data), []);
});

test('generic numbered normal-play titles fail', () => {
  const data = { sectionOrder: ['通常時', '通常時 2', '通常時 3'] };
  assert.deepEqual(findBadSectionTitles(data), ['通常時 2', '通常時 3']);
});

test('generic numbered evidence titles fail', () => {
  const data = { sectionOrder: ['確定・示唆演出', '確定・示唆演出 2'] };
  assert.deepEqual(findBadSectionTitles(data), ['確定・示唆演出 2']);
});

test('meaningful titles containing numbers are not rejected', () => {
  const data = { sectionOrder: ['CZ2段階目', '設定2以上示唆', 'AT中レベル2'] };
  assert.deepEqual(findBadSectionTitles(data), []);
});
