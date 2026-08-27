import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function validateDiscoveryCompleteness(research, { required = false } = {}) {
  const errors = [];
  const inventory = research?.discoveryInventory;
  if (!Array.isArray(inventory)) {
    if (required) errors.push('discoveryInventory is required for Gate 0');
    return { ok: errors.length === 0, errors, counts: { discovered: 0, transferred: 0 } };
  }

  const featureIds = new Set((research?.features ?? []).map(item => item?.researchFeatureId).filter(Boolean));
  const evidenceIds = new Set((research?.evidenceCandidates ?? []).map(item => item?.researchEvidenceId).filter(Boolean));
  const discoveryIds = new Set();
  let transferred = 0;

  for (const item of inventory) {
    const id = item?.discoveryCandidateId ?? item?.id;
    if (!id) { errors.push('Discovery candidate is missing discoveryCandidateId/id'); continue; }
    if (discoveryIds.has(id)) errors.push(`duplicate Discovery candidate ${id}`);
    discoveryIds.add(id);
    if (!String(item?.name ?? '').trim()) errors.push(`${id}: name is required`);

    const target = item?.researchTarget ?? item?.mappedTo;
    const status = item?.transferStatus;
    if (!target && !['UNRESOLVED', 'REFERENCE'].includes(status)) {
      errors.push(`${id}: Discovery candidate missing from Research (researchTarget/mappedTo is required)`);
      continue;
    }
    if (status === 'UNRESOLVED' || status === 'REFERENCE') { transferred += 1; continue; }

    const targets = Array.isArray(target) ? target : [target];
    let resolved = false;
    for (const raw of targets) {
      if (!raw) continue;
      const value = String(raw);
      if (featureIds.has(value) || evidenceIds.has(value)) { resolved = true; continue; }
      if (value === 'evidence') {
        const evidenceRef = item?.researchEvidenceId ?? item?.evidenceId;
        if (evidenceRef && evidenceIds.has(evidenceRef)) resolved = true;
        else if (String(item?.name ?? '').trim() && (research?.evidenceCandidates ?? []).some(ev => ev?.name === item.name)) resolved = true;
      }
      if (value === 'reference' || value === 'REFERENCE' || value === 'unresolved' || value === 'UNRESOLVED') resolved = true;
    }
    if (!resolved) errors.push(`${id}: mapped Research target does not exist: ${targets.join(', ')}`);
    else transferred += 1;
  }

  return { ok: errors.length === 0, errors, counts: { discovered: inventory.length, transferred } };
}

function main() {
  const args = process.argv.slice(2);
  if (!args.length) {
    console.error('Usage: node tools/discovery-completeness-gate.mjs <MACHINE_ID|research-data.json> [...]');
    process.exit(2);
  }
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const errors = [];
  let discovered = 0;
  let transferred = 0;
  for (const arg of args) {
    const file = arg.endsWith('.json') ? path.resolve(root, arg) : path.join(root, 'research', arg, 'research-data.json');
    if (!fs.existsSync(file)) { errors.push(`${arg}: research-data.json not found`); continue; }
    const research = JSON.parse(fs.readFileSync(file, 'utf8'));
    const result = validateDiscoveryCompleteness(research, { required: true });
    discovered += result.counts.discovered;
    transferred += result.counts.transferred;
    for (const error of result.errors) errors.push(`${research?.machine?.machineId ?? arg}: ${error}`);
  }
  if (errors.length) {
    for (const error of errors) console.error(`ERROR [Gate 0] ${error}`);
    console.error(`Gate 0 — Discovery Completeness: FAIL / errors ${errors.length}`);
    process.exit(1);
  }
  console.log(`Gate 0 — Discovery Completeness: PASS / discovered ${discovered} / transferred ${transferred} / missing 0`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) main();
