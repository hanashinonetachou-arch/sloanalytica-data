#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { materializeUiDesign } from './materialize-ui-design.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function hasMaterializedUiChange(packageData, baseDesign, headDesign) {
  if (!baseDesign || !headDesign) return true;
  const before = materializeUiDesign(packageData, baseDesign);
  const after = materializeUiDesign(packageData, headDesign);
  return JSON.stringify(before) !== JSON.stringify(after);
}

function parseArgs(args) {
  const value = flag => {
    const index = args.indexOf(flag);
    if (index < 0 || !args[index + 1]) throw new Error(`${flag} is required`);
    return args[index + 1];
  };
  return { base: value('--base'), head: value('--head'), filesFrom: value('--files-from') };
}

function readAt(ref, relativePath) {
  try {
    return JSON.parse(execFileSync('git', ['show', `${ref}:${relativePath}`], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }));
  } catch {
    return null;
  }
}

function main() {
  const { base, head, filesFrom } = parseArgs(process.argv.slice(2));
  const files = fs.readFileSync(filesFrom, 'utf8').split(/\r?\n/).filter(Boolean);
  for (const relativePath of files) {
    const match = relativePath.match(/^research\/([^/]+)\/ui-design-data\.json$/);
    if (!match) throw new Error(`unexpected UI Design path: ${relativePath}`);
    const machineId = match[1];
    const packageData = readAt(head, `machines/${machineId}/machine-package.json`);
    if (!packageData) throw new Error(`${machineId}: machine-package.json is missing at ${head}`);
    const baseDesign = readAt(base, relativePath);
    const headDesign = readAt(head, relativePath);
    if (hasMaterializedUiChange(packageData, baseDesign, headDesign)) console.log(machineId);
    else console.error(`NON_MATERIALIZED_UI_CHANGE ${machineId}`);
  }
}

const invoked = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invoked) {
  try { main(); }
  catch (error) { console.error(`ERROR: ${error.message ?? error}`); process.exit(1); }
}
