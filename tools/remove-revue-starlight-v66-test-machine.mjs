import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const MACHINE_ID = 'S_REVUE_STARLIGHT_CX_TEST_V66';

function readJson(rel) { return JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8')); }
function writeJson(rel, value) { fs.writeFileSync(path.join(ROOT, rel), `${JSON.stringify(value, null, 2)}\n`, 'utf8'); }
function strip(rel, keys) {
  if (!fs.existsSync(path.join(ROOT, rel))) return;
  const doc = readJson(rel);
  for (const key of keys) if (Array.isArray(doc[key])) doc[key] = doc[key].filter((x) => x?.machineId !== MACHINE_ID);
  writeJson(rel, doc);
}

strip('catalog.json', ['machines']);
strip('difficulty-catalog.json', ['machines', 'entries']);
strip('machine-registry.json', ['machines', 'entries']);

for (const rel of [`research/${MACHINE_ID}`, `generated/${MACHINE_ID}`, `build/${MACHINE_ID}`, `machines/${MACHINE_ID}`]) {
  const abs = path.join(ROOT, rel);
  if (fs.existsSync(abs)) fs.rmSync(abs, { recursive: true, force: true });
}

const sensitivityTool = path.join(ROOT, 'tools/revue-overdispersion-sensitivity.mjs');
if (fs.existsSync(sensitivityTool)) fs.rmSync(sensitivityTool, { force: true });

const pkg = readJson('package.json');
if (pkg.scripts?.['stats:revue-overdispersion']) delete pkg.scripts['stats:revue-overdispersion'];
writeJson('package.json', pkg);

console.log(`Removed ${MACHINE_ID}, all generated/published artifacts, catalog/difficulty/registry references, and experiment-only sensitivity tooling.`);
console.log('Original S_REVUE_STARLIGHT_CX remains untouched.');
console.log('After verification, remove this one-shot cleanup script and its npm command before final merge.');
