#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { DISPOSITIONS, REQUIRED_GATES, UNITS, buildSummary } from './lib/evidence-ui-gate0.mjs';
const COUNTERS = ['eligible', 'checked', 'passed', 'failed', 'unresolved', 'skipped'];

export function validateLedger(ledger, { expectedRows = 270 } = {}) {
  const errors = [];
  if (!Array.isArray(ledger?.rows) || ledger.rows.length !== expectedRows) errors.push(`rows must contain exactly ${expectedRows} machines`);
  const seen = new Set();
  for (const [index, row] of (ledger?.rows ?? []).entries()) {
    const at = `rows[${index}]`;
    if (!row.machineId || seen.has(row.machineId)) errors.push(`${at}.machineId missing or duplicate`); else seen.add(row.machineId);
    if (!DISPOSITIONS.includes(row.disposition)) errors.push(`${at}.disposition invalid`);
    if (row.notApplicableOutsideEligible !== true) errors.push(`${at}.notApplicableOutsideEligible must be true`);
    if (row.notApplicableUnit !== null && !UNITS.includes(row.notApplicableUnit)) errors.push(`${at}.notApplicableUnit invalid`);
    for (const name of REQUIRED_GATES) {
      const gate = row.gates?.[name];
      if (!gate) { errors.push(`${at}.gates.${name} missing`); continue; }
      validateCoverage(gate, `${at}.gates.${name}`, errors);
      if (name === 'layerCompleteness' && (gate.unit !== 'machine-layer' || gate.eligible !== 5)) errors.push(`${at}.gates.layerCompleteness must account for five machine-layer units`);
    }
  }
  if (ledger?.summary && Array.isArray(ledger?.rows)) {
    const actual = buildSummary(ledger.rows);
    if (!isDeepStrictEqual(actual, ledger.summary)) errors.push('summary does not equal row aggregation');
    for (const [name, gate] of Object.entries(ledger.summary.gates ?? {})) validateSummaryCoverage(gate, `summary.gates.${name}`, errors);
  } else errors.push('summary missing');
  return errors;
}
function validateSummaryCoverage(value, at, errors) {
  if (!UNITS.includes(value.unit)) errors.push(`${at}.unit invalid`);
  for (const key of COUNTERS) {
    if (!Number.isInteger(value[key]) || value[key] < 0) errors.push(`${at}.${key} must be a non-negative integer`);
    const total = Object.values(value.unitBreakdown ?? {}).reduce((sum, coverage) => sum + (coverage[key] ?? NaN), 0);
    if (total !== value[key]) errors.push(`${at}.unitBreakdown ${key} does not aggregate`);
  }
  if (value.eligible !== value.checked + value.skipped) errors.push(`${at}: eligible != checked + skipped`);
  if (value.checked !== value.passed + value.failed + value.unresolved) errors.push(`${at}: checked != passed + failed + unresolved`);
  if (value.skipped !== 0) errors.push(`${at}.skipped must be zero for final ledger`);
}
function validateCoverage(value, at, errors) {
  if (!UNITS.includes(value.unit)) errors.push(`${at}.unit invalid`);
  for (const key of COUNTERS) if (!Number.isInteger(value[key]) || value[key] < 0) errors.push(`${at}.${key} must be a non-negative integer`);
  if (value.eligible !== value.checked + value.skipped) errors.push(`${at}: eligible != checked + skipped`);
  if (value.checked !== value.passed + value.failed + value.unresolved) errors.push(`${at}: checked != passed + failed + unresolved`);
  if (value.skipped !== 0) errors.push(`${at}.skipped must be zero for final ledger`);
  if (!value.unitBreakdown || !Object.keys(value.unitBreakdown).length) errors.push(`${at}.unitBreakdown missing`);
  for (const [unit, coverage] of Object.entries(value.unitBreakdown ?? {})) {
    if (!UNITS.includes(unit)) errors.push(`${at}.unitBreakdown unit invalid`);
    for (const key of COUNTERS) if (coverage[key] !== value[key]) errors.push(`${at}.unitBreakdown.${unit}.${key} inconsistent`);
  }
}
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const ledger = JSON.parse(await readFile(process.argv[2], 'utf8'));
  const errors = validateLedger(ledger);
  if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; } else console.log(`Gate 0 ledger valid: ${ledger.rows.length} rows`);
}
