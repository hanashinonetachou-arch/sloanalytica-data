import fs from 'node:fs';
import path from 'node:path';

const target = path.join(process.cwd(), 'tools', 'build-machine-data.mjs');
const text = fs.readFileSync(target, 'utf8');
if (text.includes('\r\n')) {
  fs.writeFileSync(target, text.replace(/\r\n/g, '\n'));
  console.log('Normalized CRLF for migration target: tools/build-machine-data.mjs');
}
await import('./apply-granbelm-nakamimieru-tabs.mjs');
await import('./normalize-granbelm-nakamimieru-distributions.mjs');
