#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
let root = process.cwd();
let ids = [];
if (args.length && (args[0] === '.' || args[0] === '..' || args[0].includes('/') || args[0].includes('\\'))) {
  root = path.resolve(args.shift());
}
ids = args.filter(a => !a.startsWith('--'));
const targetIds = ids.length ? new Set(ids) : null;
const errors = [];
const warnings = [];
let checked = 0;

for (const ent of fs.readdirSync(path.join(root, 'research'), { withFileTypes: true })) {
  if (!ent.isDirectory()) continue;
  const machineId = ent.name;
  if (targetIds && !targetIds.has(machineId)) continue;
  const dir = path.join(root, 'research', machineId);
  const designPath = path.join(dir, 'ui-design-data.json');
  if (!fs.existsSync(designPath)) continue;
  const selectionPath = path.join(dir, 'selection-data.json');
  checked++;
  if (!fs.existsSync(selectionPath)) {
    errors.push(`${machineId}: missing selection-data.json`);
    continue;
  }
  const design = JSON.parse(fs.readFileSync(designPath, 'utf8'));
  const selection = JSON.parse(fs.readFileSync(selectionPath, 'utf8'));
  const inputIds = new Set((selection.inputs ?? []).map(x => x.id));
  const groups = new Map((selection.evidenceUi?.groups ?? []).map(x => [x.groupId, x]));

  for (const id of Object.keys(design.inputContracts ?? {})) {
    if (!inputIds.has(id)) errors.push(`${machineId}: UI input ${id} is not in SelectionData`);
  }

  for (const [id, contract] of Object.entries(design.evidenceContracts ?? {})) {
    const group = groups.get(contract.sourceEvidenceGroupId);
    if (!group) {
      errors.push(`${machineId}: ${id} references unknown evidence group ${contract.sourceEvidenceGroupId}`);
      continue;
    }
    const selectionMode = group.selectionMode ?? 'multi';
    if (contract.selectionMode !== selectionMode) {
      errors.push(`${machineId}: ${id} selectionMode differs from SelectionData`);
    }
    if (contract.label !== group.label) {
      warnings.push(`${machineId}: ${id} label differs from SelectionData`);
    }
  }
}

if (targetIds) {
  for (const machineId of targetIds) {
    const dir = path.join(root, 'research', machineId);
    if (!fs.existsSync(path.join(dir, 'ui-design-data.json'))) errors.push(`${machineId}: missing ui-design-data.json`);
  }
}

console.log(`UI Design Selection linkage audit: ${errors.length ? 'FAIL' : 'PASS'} / designs ${checked} / warnings ${warnings.length}`);
for (const warning of warnings) console.warn(`WARNING ${warning}`);
for (const error of errors) console.error(`ERROR ${error}`);
if (errors.length) process.exit(1);
