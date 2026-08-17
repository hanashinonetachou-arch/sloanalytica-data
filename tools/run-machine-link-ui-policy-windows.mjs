import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const toolsDir = path.dirname(fileURLToPath(import.meta.url));
const sourcePath = path.join(toolsDir, 'apply-machine-link-ui-policy.mjs');
const tempPath = path.join(toolsDir, '.apply-machine-link-ui-policy-windows.tmp.mjs');

const original = fs.readFileSync(sourcePath, 'utf8');
const needle = "const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');";
const replacement = "const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8').replace(/\\r\\n/g, '\\n');";
if (!original.includes(needle)) throw new Error('apply script read helper not found');

fs.writeFileSync(tempPath, original.replace(needle, replacement), 'utf8');
try {
  await import(`${pathToFileURL(tempPath).href}?v=${Date.now()}`);
} finally {
  if (fs.existsSync(tempPath)) fs.rmSync(tempPath);
}
