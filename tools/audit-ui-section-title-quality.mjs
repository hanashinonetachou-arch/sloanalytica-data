#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const GENERIC_BASES = [
  '通常時',
  'AT中',
  'CZ中',
  'ボーナス中',
  '実戦中の設定推測要素',
  '確定・示唆演出',
  '設定示唆・確定演出',
  '終了画面・終了時示唆',
  'ボイス・PUSH示唆',
];

const escaped = GENERIC_BASES.map((value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
const GENERIC_NUMBERED_RE = new RegExp(`^(?:${escaped.join('|')})\\s+[2-9]\\d*$`);

export function findBadSectionTitles(data) {
  const order = Array.isArray(data?.sectionOrder) ? data.sectionOrder : [];
  return order.filter((title) => GENERIC_NUMBERED_RE.test(String(title ?? '').trim()));
}

function changedUiFiles(baseRef) {
  const output = execFileSync('git', ['diff', '--name-only', `${baseRef}...HEAD`], { encoding: 'utf8' });
  return output
    .split(/\r?\n/)
    .map((value) => value.trim())
    .filter(Boolean)
    .filter((value) => /^research\/[^/]+\/ui-design-data\.json$/.test(value));
}

function main() {
  const baseRef = process.argv[2];
  if (!baseRef) {
    console.error('Usage: node tools/audit-ui-section-title-quality.mjs <base-ref>');
    process.exit(2);
  }

  const files = changedUiFiles(baseRef);
  const failures = [];

  for (const file of files) {
    if (!fs.existsSync(file)) continue;
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    for (const title of findBadSectionTitles(data)) {
      failures.push(`${file}: generic numbered section title "${title}" is forbidden; use a semantic user-facing title such as CZ初当り / AT初当り / ボーナス初当り`);
    }
  }

  if (failures.length) {
    for (const failure of failures) console.error(`ERROR ${failure}`);
    console.error(`UI section title quality audit: FAIL / ${failures.length} violation(s)`);
    process.exit(1);
  }

  console.log(`UI section title quality audit: PASS / changed UI files ${files.length}`);
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) main();
