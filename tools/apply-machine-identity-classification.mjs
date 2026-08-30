import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const reportsDir = path.join(root, 'reports');
const catalogPath = path.join(root, 'catalog.json');
const identityPath = path.join(root, 'machine-identity-metadata.json');
const auditPath = path.join(reportsDir, 'machine-identity-classification-audit.json');

const mode = process.argv.includes('--apply') ? 'apply' : 'verify';
const MACHINE_TYPES = new Set(['SMART_SLOT', 'MEDAL']);
const GAME_TYPES = new Set(['A_TYPE', 'AT', 'A_AT', 'A_ART', 'BT']);
const TEST_ONLY_IDS = new Set(['S_REVUE_STARLIGHT_CX_TEST_V66']);

const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const serialize = (value) => `${JSON.stringify(value, null, 2)}\n`;
const sha256 = (text) => crypto.createHash('sha256').update(Buffer.from(text, 'utf8')).digest('hex');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function validIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? '')) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

function loadIdentityEntries() {
  const audit = readJson(auditPath);
  assert(audit?.progress?.catalogEnumeration === 'COMPLETE', 'Machine identity audit must be COMPLETE before backfill.');
  const checkpointFiles = audit.checkpointFiles ?? [];
  assert(checkpointFiles.length > 0, 'No machine identity checkpoint files were declared.');

  const entries = [];
  const seen = new Set();
  for (const relative of checkpointFiles) {
    const checkpoint = readJson(path.join(root, relative));
    for (const entry of checkpoint.entries ?? []) {
      assert(entry?.machineId, `Missing machineId in ${relative}`);
      assert(!seen.has(entry.machineId), `Duplicate machineId in identity checkpoints: ${entry.machineId}`);
      assert(validIsoDate(entry.introductionDate), `Invalid introductionDate for ${entry.machineId}: ${entry.introductionDate}`);
      assert(MACHINE_TYPES.has(entry.machineType), `Invalid machineType for ${entry.machineId}: ${entry.machineType}`);
      assert(GAME_TYPES.has(entry.gameType), `Invalid gameType for ${entry.machineId}: ${entry.gameType}`);
      seen.add(entry.machineId);
      entries.push({
        machineId: entry.machineId,
        introductionDate: entry.introductionDate,
        machineType: entry.machineType,
        gameType: entry.gameType,
        sourceBatch: checkpoint.batch,
      });
    }
  }
  return { audit, entries };
}

function assertCoverage(catalog, entries, audit) {
  const production = catalog.machines.filter((m) => !TEST_ONLY_IDS.has(m.machineId));
  const byId = new Map(entries.map((e) => [e.machineId, e]));
  const catalogIds = new Set(production.map((m) => m.machineId));
  const missing = production.filter((m) => !byId.has(m.machineId)).map((m) => m.machineId);
  const extras = entries.filter((e) => !catalogIds.has(e.machineId)).map((e) => e.machineId);
  assert(missing.length === 0, `Catalog machines missing identity audit entries: ${missing.join(', ')}`);
  assert(extras.length === 0, `Identity audit entries not present in production catalog: ${extras.join(', ')}`);
  assert(production.length === audit.progress.resolvedProductionMachines,
    `Production catalog count ${production.length} != audited resolved count ${audit.progress.resolvedProductionMachines}`);
  assert(TEST_ONLY_IDS.size === audit.progress.excludedTestMachines,
    `Configured test-only count ${TEST_ONLY_IDS.size} != audited excluded count ${audit.progress.excludedTestMachines}`);
  return { production, byId };
}

function applyIdentity() {
  const catalog = readJson(catalogPath);
  const { audit, entries } = loadIdentityEntries();
  const { production, byId } = assertCoverage(catalog, entries, audit);

  const generated = {
    schemaVersion: 1,
    generatedFrom: 'reports/machine-identity-classification-audit.json',
    productionMachineCount: production.length,
    excludedTestMachineIds: [...TEST_ONLY_IDS],
    machines: production.map((m) => byId.get(m.machineId)),
  };

  if (mode === 'apply') {
    for (const catalogEntry of production) {
      const identity = byId.get(catalogEntry.machineId);
      const packagePath = path.join(root, 'machines', catalogEntry.machineId, 'machine-package.json');
      assert(fs.existsSync(packagePath), `Missing machine package: ${catalogEntry.machineId}`);
      const pkg = readJson(packagePath);
      assert(pkg?.machine?.machineId === catalogEntry.machineId, `Package machineId mismatch: ${catalogEntry.machineId}`);

      pkg.machine.introductionDate = identity.introductionDate;
      pkg.machine.machineType = identity.machineType;
      pkg.machine.gameType = identity.gameType;
      const packageText = serialize(pkg);
      fs.writeFileSync(packagePath, packageText, 'utf8');

      catalogEntry.introductionDate = identity.introductionDate;
      catalogEntry.machineType = identity.machineType;
      catalogEntry.gameType = identity.gameType;
      catalogEntry.sha256 = sha256(packageText);
      catalogEntry.packageSizeBytes = Buffer.byteLength(packageText, 'utf8');
    }
    fs.writeFileSync(identityPath, serialize(generated), 'utf8');
    fs.writeFileSync(catalogPath, serialize(catalog), 'utf8');
  }

  const currentCatalog = readJson(catalogPath);
  const currentById = new Map(currentCatalog.machines.map((m) => [m.machineId, m]));
  for (const original of production) {
    const identity = byId.get(original.machineId);
    const entry = currentById.get(original.machineId);
    const packagePath = path.join(root, 'machines', original.machineId, 'machine-package.json');
    const packageText = fs.readFileSync(packagePath, 'utf8');
    const pkg = JSON.parse(packageText);

    for (const [key, value] of Object.entries({
      introductionDate: identity.introductionDate,
      machineType: identity.machineType,
      gameType: identity.gameType,
    })) {
      assert(entry?.[key] === value, `Catalog ${key} mismatch for ${original.machineId}`);
      assert(pkg?.machine?.[key] === value, `Package ${key} mismatch for ${original.machineId}`);
    }
    assert(entry.sha256 === sha256(packageText), `Catalog sha256 mismatch for ${original.machineId}`);
    assert(entry.packageSizeBytes === Buffer.byteLength(packageText, 'utf8'), `Catalog packageSizeBytes mismatch for ${original.machineId}`);
  }

  assert(fs.existsSync(identityPath), 'machine-identity-metadata.json is missing. Run with --apply first.');
  const currentIdentity = readJson(identityPath);
  assert(currentIdentity.productionMachineCount === production.length, 'Generated identity metadata production count mismatch.');
  assert(currentIdentity.machines.length === production.length, 'Generated identity metadata entry count mismatch.');

  console.log(`PASS machine identity ${mode}: ${production.length} production machines, ${TEST_ONLY_IDS.size} test-only excluded.`);
}

try {
  applyIdentity();
} catch (error) {
  console.error(`FAIL machine identity ${mode}: ${error.message}`);
  process.exitCode = 1;
}
