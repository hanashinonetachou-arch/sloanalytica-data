import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRACT_DIR = path.join(ROOT, 'ux-contracts');

function readJson(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }
function sameJson(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

export function auditUserVerifiedUxContracts({ machineIds = null } = {}) {
  const errors = [];
  const reviews = [];
  const checked = [];
  if (!fs.existsSync(CONTRACT_DIR)) return { ok: true, errors, reviews, checked };
  const wanted = machineIds ? new Set(machineIds) : null;
  const files = fs.readdirSync(CONTRACT_DIR).filter(name => name.endsWith('.json')).sort();

  for (const file of files) {
    const contractPath = path.join(CONTRACT_DIR, file);
    const contract = readJson(contractPath);
    const machineId = contract.machineId;
    if (!machineId || (wanted && !wanted.has(machineId))) continue;
    checked.push(machineId);
    if (contract.schemaVersion !== 'user-verified-ux-contract-v1') {
      errors.push(`${machineId}: unsupported UX contract schemaVersion`);
      continue;
    }
    const packagePath = path.join(ROOT, 'machines', machineId, 'machine-package.json');
    if (!fs.existsSync(packagePath)) {
      errors.push(`${machineId}: generated machine-package.json not found`);
      continue;
    }
    const pkg = readJson(packagePath);
    const inputs = new Map((pkg.inputs?.inputs ?? []).map(input => [input.id, input]));
    const uiItems = new Map();
    for (const section of pkg.ui?.sections ?? []) {
      for (const item of section.items ?? []) if (item.inputId) uiItems.set(item.inputId, { section, item });
    }

    for (const protectedInput of contract.protectedInputs ?? []) {
      const inputId = protectedInput.inputId;
      const input = inputs.get(inputId);
      if (!input) {
        errors.push(`${machineId}/${inputId}: protected input disappeared`);
        continue;
      }
      for (const [key, expected] of Object.entries(protectedInput.expectedInput ?? {})) {
        if (!sameJson(input[key], expected)) errors.push(`${machineId}/${inputId}: protected input ${key} changed; expected ${JSON.stringify(expected)}, got ${JSON.stringify(input[key])}`);
      }
      if (protectedInput.expectedUi) {
        const ui = uiItems.get(inputId)?.item;
        if (!ui) {
          errors.push(`${machineId}/${inputId}: protected UI item disappeared`);
          continue;
        }
        for (const [key, expected] of Object.entries(protectedInput.expectedUi)) {
          const actual = key === 'quickAdd' ? ui.config?.quickAdd : ui[key];
          if (!sameJson(actual, expected)) errors.push(`${machineId}/${inputId}: protected UI ${key} changed; expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
        }
      }
    }

    for (const forbiddenInput of contract.forbiddenInputs ?? []) {
      const inputId = typeof forbiddenInput === 'string' ? forbiddenInput : forbiddenInput.inputId;
      if (!inputId) continue;
      if (inputs.has(inputId)) {
        const reason = typeof forbiddenInput === 'object' && forbiddenInput.reason ? `; ${forbiddenInput.reason}` : '';
        errors.push(`${machineId}/${inputId}: user-verified forbidden input reappeared${reason}`);
      }
    }

    for (const requirement of contract.historicalRequirements ?? []) {
      if (requirement.status === 'UNRESOLVED') {
        reviews.push(`${machineId}/${requirement.requirementId}: ${requirement.kind} is known historical UX but exact contract is unresolved`);
      }
    }
  }
  return { ok: errors.length === 0, errors, reviews, checked };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const machineIds = process.argv.slice(2).filter(arg => /^[A-Z0-9_]+$/.test(arg));
  const result = auditUserVerifiedUxContracts({ machineIds: machineIds.length ? machineIds : null });
  for (const review of result.reviews) console.warn(`REVIEW [user-verified UX] ${review}`);
  for (const error of result.errors) console.error(`ERROR [user-verified UX] ${error}`);
  console.log(`User-verified UX contracts: checked ${result.checked.length}, REVIEW ${result.reviews.length}, ERROR ${result.errors.length}`);
  if (!result.ok) process.exit(1);
}
