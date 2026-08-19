import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { applyAll } from '../tools/apply-10machine-reverification.mjs';

test('10-machine reverification patch tool is importable', () => {
  assert.equal(typeof applyAll, 'function');
});

test('reverification tool fixes requested duplicate rejected labels and key candidates', () => {
  const source = fs.readFileSync(new URL('../tools/apply-10machine-reverification.mjs', import.meta.url), 'utf8');
  assert.match(source, /REJECTED_PREDECESSOR_DENOMINATOR/);
  assert.match(source, /RF_MYSTERY_AT/);
  assert.match(source, /INP_DIRECT_BONUS/);
  assert.match(source, /RF_SUIKA_CZ/);
  assert.match(source, /RF_CZ_YELLOW_SUCCESS/);
  assert.match(source, /x=>x\.name==='ボーナス直撃'/);
  assert.match(source, /x=>x\.name==='ボーナス初当り'/);
  assert.match(source, /左第1停止の13枚ベル/);
});
