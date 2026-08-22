#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const researchRoot = path.join(root, 'research');
const allowedStatus = new Set(['CHECKED', 'NOT_AVAILABLE', 'UNRESOLVED']);
const files = [];

for (const entry of fs.readdirSync(researchRoot, { withFileTypes: true })) {
  if (!entry.isDirectory() || entry.name.startsWith('_')) continue;
  const file = path.join(researchRoot, entry.name, 'machine-observation-data.json');
  if (fs.existsSync(file)) files.push(file);
}

const errors = [];
for (const file of files) {
  let data;
  try {
    data = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    errors.push(`${file}: invalid JSON: ${error.message}`);
    continue;
  }

  const rel = path.relative(root, file);
  if (data.schemaVersion !== 'machine-observation-data-v1') errors.push(`${rel}: schemaVersion must be machine-observation-data-v1`);
  if (!data.machineId || typeof data.machineId !== 'string') errors.push(`${rel}: machineId is required`);
  if (!data.displayName || typeof data.displayName !== 'string') errors.push(`${rel}: displayName is required`);

  for (const key of ['machineMenu', 'linkedService', 'predecessorData']) {
    const block = data[key];
    if (!block || typeof block !== 'object') {
      errors.push(`${rel}: ${key} block is required`);
      continue;
    }
    if (!allowedStatus.has(block.status)) errors.push(`${rel}: ${key}.status must be CHECKED / NOT_AVAILABLE / UNRESOLVED`);
    if (!Array.isArray(block.availableData)) errors.push(`${rel}: ${key}.availableData must be an array`);
    if (!Array.isArray(block.sourceRefs)) errors.push(`${rel}: ${key}.sourceRefs must be an array`);
    if (typeof block.notes !== 'string') errors.push(`${rel}: ${key}.notes must be a string`);
  }

  if (!Array.isArray(data.sources)) errors.push(`${rel}: sources must be an array`);
  else {
    const ids = new Set();
    for (const source of data.sources) {
      if (!source?.sourceId || typeof source.sourceId !== 'string') errors.push(`${rel}: every source requires sourceId`);
      else if (ids.has(source.sourceId)) errors.push(`${rel}: duplicate sourceId ${source.sourceId}`);
      else ids.add(source.sourceId);
      if (!source?.url || typeof source.url !== 'string') errors.push(`${rel}: source ${source?.sourceId ?? '?'} requires url`);
    }
    for (const key of ['machineMenu', 'linkedService', 'predecessorData']) {
      for (const ref of data[key]?.sourceRefs ?? []) {
        if (!ids.has(ref)) errors.push(`${rel}: ${key}.sourceRefs contains unknown sourceId ${ref}`);
      }
    }
  }

  if (data.predecessorData?.status === 'CHECKED') {
    if (typeof data.predecessorData.usableForInference !== 'boolean') errors.push(`${rel}: predecessorData.usableForInference boolean is required when CHECKED`);
    if (typeof data.predecessorData.usableForSelfSessionDelta !== 'boolean') errors.push(`${rel}: predecessorData.usableForSelfSessionDelta boolean is required when CHECKED`);
  }
}

console.log(`Machine Observation Data files: ${files.length}`);
if (errors.length) {
  console.error(`Validation errors: ${errors.length}`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log('Machine Observation Data validation: PASS');
