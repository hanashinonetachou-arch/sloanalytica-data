import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const pkg = JSON.parse(fs.readFileSync(new URL('../machines/S_REVUE_STARLIGHT_CX/machine-package.json', import.meta.url), 'utf8'));
const sections = pkg.ui?.sections ?? [];
const inputs = pkg.inputs?.inputs ?? [];

const sectionIndex = title => sections.findIndex(section => section.title === title);
const inputById = id => inputs.find(input => input.id === id);

test('Revue Starlight section order keeps lamp and CZ directly below predecessor data', () => {
  const predecessor = sectionIndex('着席時データ');
  assert.ok(predecessor >= 0);
  assert.equal(sections[predecessor + 1]?.title, 'CZ関連終了時のランプ色');
  assert.equal(sections[predecessor + 2]?.title, 'CZ初当り');
});

test('Revue Starlight BIG end counters are two-column plus/minus only', () => {
  const section = sections.find(item => item.title === 'BIG終了画面');
  assert.ok(section);
  assert.ok(section.items.length >= 7);
  for (const item of section.items) {
    assert.equal(item.gridSpan, 6);
    assert.equal(item.config?.directInput, false);
    assert.equal(item.config?.compact, true);
  }
});

test('Revue Starlight lamp guidance excludes AT-end red lamp', () => {
  const section = sections.find(item => item.title === 'CZ関連終了時のランプ色');
  assert.equal(section?.description, 'CZ失敗時、CZ前兆失敗時のランプ色を入力。AT終了時の赤ランプは対象外です。');
});

test('Revue Starlight Evidence inputs expose recognizable voice and payout cues', () => {
  assert.match(inputById('INP_AT_VOICE_SET2_COUNT')?.name ?? '', /あなたにもあるでしょう/);
  assert.match(inputById('INP_AT_VOICE_SET4_COUNT')?.name ?? '', /運命の二人/);
  assert.match(inputById('INP_AT_VOICE_SET6_COUNT')?.name ?? '', /これこそ私が観たかった舞台/);
  assert.match(inputById('INP_PAYOUT_SET4_COUNT')?.name ?? '', /456 OVER/);
  assert.match(inputById('INP_PAYOUT_SET5_COUNT')?.name ?? '', /99 OVER/);
  assert.match(inputById('INP_PAYOUT_SET6_COUNT')?.name ?? '', /666 OVER/);
});
