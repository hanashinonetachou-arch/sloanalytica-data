#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { assessSelectionQuality } from './selection-quality-gate.mjs';

const ROOT = path.resolve('.');
const args = process.argv.slice(2);
const strict = args.includes('--strict');
const machineIds = args.filter(x => !x.startsWith('--'));
if (!machineIds.length) {
  console.error('Usage: node tools/audit-selection-quality.mjs MACHINE_ID [MACHINE_ID ...] [--strict]');
  process.exit(2);
}

const rows = [];
for (const machineId of machineIds) {
  const dir = path.join(ROOT, 'research', machineId);
  const rp = path.join(dir, 'research-data.json');
  const sp = path.join(dir, 'selection-data.json');
  if (!fs.existsSync(rp) || !fs.existsSync(sp)) {
    rows.push({ machineId, status: 'BLOCKED', blockers: ['ResearchData or SelectionData missing'], reviews: [] });
    continue;
  }
  const research = JSON.parse(fs.readFileSync(rp, 'utf8'));
  const selection = JSON.parse(fs.readFileSync(sp, 'utf8'));
  rows.push({ machineId, ...assessSelectionQuality(research, selection) });
}

const counts = { PASS: 0, REVIEW: 0, BLOCKED: 0 };
for (const row of rows) counts[row.status] += 1;
console.log(`Selection Quality Gate: PASS ${counts.PASS} / REVIEW ${counts.REVIEW} / BLOCKED ${counts.BLOCKED}`);
for (const row of rows) {
  console.log(`\n${row.status}\t${row.machineId}`);
  if (row.coverage) console.log(`  coverage: feature ${row.coverage.classifiedFeatures}/${row.coverage.researchFeatures}, evidence ${row.coverage.classifiedEvidence}/${row.coverage.researchEvidence}`);
  for (const issue of row.blockers ?? []) console.log(`  BLOCKER: ${issue}`);
  for (const issue of row.reviews ?? []) console.log(`  REVIEW: ${issue}`);
}

if (counts.BLOCKED || (strict && counts.REVIEW)) process.exitCode = 1;
