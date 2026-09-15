#!/usr/bin/env node
import { readdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { auditMachine, buildSummary, readJson } from './lib/evidence-ui-gate0.mjs';
import { validateLedger } from './validate-evidence-ui-gate0-ledger.mjs';
const root = resolve(new URL('..', import.meta.url).pathname);
const machineIds = (await readdir(join(root, 'machines'), { withFileTypes: true })).filter(x => x.isDirectory()).map(x => x.name).sort();
const rows = [];
for (const machineId of machineIds) {
  const base = join(root, 'research', machineId);
  rows.push(auditMachine(machineId, {
    research: await readJson(join(base, 'research-data.json')),
    selection: await readJson(join(base, 'selection-data.json')),
    observation: await readJson(join(base, 'machine-observation-data.json')),
    ui: await readJson(join(base, 'ui-design-data.json')),
    package: await readJson(join(root, 'machines', machineId, 'machine-package.json')),
  }));
}
const ledger = { schemaVersion: 'evidence-ui-gate0-ledger-v1', generatedAt: new Date().toISOString(), rows };
ledger.summary = buildSummary(rows);
const errors = validateLedger(ledger);
if (errors.length) { console.error(errors.join('\n')); process.exit(2); }
const outputArg = process.argv.find(x => x.startsWith('--output='));
const output = outputArg?.slice(9) || join(tmpdir(), 'evidence-ui-gate0-ledger.json');
await writeFile(output, `${JSON.stringify(ledger, null, 2)}\n`);
console.log(JSON.stringify({ output, ...ledger.summary }, null, 2));
if ((ledger.summary.statuses.BLOCKED ?? 0) > 0) process.exitCode = 1;
