import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const MACHINE_ID = 'S_REVUE_STARLIGHT_CX_TEST_V66';
const TARGETS = [
  `research/${MACHINE_ID}`,
  `generated/${MACHINE_ID}`,
  `build/${MACHINE_ID}`,
  `machines/${MACHINE_ID}`,
];

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
}
function writeJson(rel, value) {
  fs.writeFileSync(path.join(ROOT, rel), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}
function removeFromArrayFile(rel, keys) {
  if (!fs.existsSync(path.join(ROOT, rel))) return;
  const doc = readJson(rel);
  for (const key of keys) {
    if (Array.isArray(doc[key])) doc[key] = doc[key].filter((x) => x?.machineId !== MACHINE_ID);
  }
  writeJson(rel, doc);
}

removeFromArrayFile('catalog.json', ['machines']);
removeFromArrayFile('difficulty-catalog.json', ['machines', 'entries']);
removeFromArrayFile('machine-registry.json', ['machines', 'entries']);

for (const rel of TARGETS) {
  const abs = path.join(ROOT, rel);
  if (fs.existsSync(abs)) fs.rmSync(abs, { recursive: true, force: true });
}

// Remove experiment-only sensitivity artifacts/scripts; they are not part of the product contract.
for (const rel of [
  'tools/revue-overdispersion-sensitivity.mjs',
  `research/${MACHINE_ID}/overdispersion-sensitivity-v66.json`,
]) {
  const abs = path.join(ROOT, rel);
  if (fs.existsSync(abs)) fs.rmSync(abs, { force: true });
}

// Remove package script if present.
const pkgPath = path.join(ROOT, 'package.json');
if (fs.existsSync(pkgPath)) {
  const pkg = readJson('package.json');
  if (pkg.scripts?.['stats:revue-overdispersion']) delete pkg.scripts['stats:revue-overdispersion'];
  writeJson('package.json', pkg);
}

console.log(`Removed ${MACHINE_ID} test-machine data and catalog/registry references.`);
console.log('Original S_REVUE_STARLIGHT_CX is untouched.');