import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MACHINES_DIR = path.join(ROOT, 'machines');
const SERVICE_NAME_RE = /(?:ユニメモ|打-WIN|打ＷＩＮ|スロプラ\s*NEXT|マイスロ)/i;

function visit(value, pointer, findings) {
  if (typeof value === 'string') {
    if (SERVICE_NAME_RE.test(value)) findings.push({ pointer, value });
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((child, index) => visit(child, `${pointer}/${index}`, findings));
    return;
  }
  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) visit(child, `${pointer}/${key}`, findings);
  }
}

const failures = [];

for (const entry of fs.readdirSync(MACHINES_DIR, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const file = path.join(MACHINES_DIR, entry.name, 'machine-package.json');
  if (!fs.existsSync(file)) continue;
  const pkg = JSON.parse(fs.readFileSync(file, 'utf8'));
  const visibleRoots = [
    ['inputs', pkg.inputs],
    ['features', pkg.features],
    ['ui', pkg.ui],
    ['selectionSummary', pkg.selectionSummary],
    ['evidence/evidences', pkg.evidence?.evidences],
  ];
  for (const [root, value] of visibleRoots) {
    if (value === undefined) continue;
    const findings = [];
    visit(value, `/${root}`, findings);
    for (const finding of findings) failures.push({ machineId: entry.name, ...finding });
  }
}

if (failures.length) {
  for (const f of failures) console.error(`ERROR [${f.machineId}${f.pointer}]: user-facing text contains a specific machine-linked service name: ${JSON.stringify(f.value)}`);
  console.error(`FAILED: ${failures.length}件のユーザー向け固有サービス名を検出しました。ResearchData内の出典・調査記録はこの監査対象外です。`);
  process.exit(1);
}

console.log('OK: ユーザー向けMachineDataに固有の実機連動サービス名はありません。');
