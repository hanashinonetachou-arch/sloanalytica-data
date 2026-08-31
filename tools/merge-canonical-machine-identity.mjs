import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const IDENTITY_KEYS = ['introductionDate', 'machineType', 'gameType'];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

/**
 * Re-applies the formal Machine Identity classification to a generated package.
 *
 * Research/Selection generation intentionally remains usable before publication,
 * so absence from machine-identity-metadata.json is not an error. Once a machine
 * is formally classified, however, regeneration must never drop those canonical
 * identity fields from machine-package.json.
 */
export function mergeCanonicalMachineIdentity(machinePackage, machineId, root = DEFAULT_ROOT) {
  if (!machinePackage?.machine || machinePackage.machine.machineId !== machineId) {
    throw new Error(`Machine package identity mismatch: expected ${machineId}`);
  }

  const identityPath = path.join(root, 'machine-identity-metadata.json');
  if (!fs.existsSync(identityPath)) return machinePackage;

  const metadata = readJson(identityPath);
  const identity = (metadata.machines ?? []).find(entry => entry?.machineId === machineId);
  if (!identity) return machinePackage;

  for (const key of IDENTITY_KEYS) {
    const value = identity[key];
    if (typeof value !== 'string' || value.length === 0) {
      throw new Error(`Canonical machine identity ${key} missing for ${machineId}`);
    }
    machinePackage.machine[key] = value;
  }

  return machinePackage;
}
