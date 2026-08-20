import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const partsDir = path.resolve(process.cwd(), 'tools/.seed-10-machines-20260821');
const payload = [0, 1, 2, 3]
  .map((i) => fs.readFileSync(path.join(partsDir, `part${i}.b64`), 'utf8').trim())
  .join('');
const data = JSON.parse(zlib.gunzipSync(Buffer.from(payload, 'base64')).toString('utf8'));

for (const [relativePath, value] of Object.entries(data)) {
  const fullPath = path.resolve(process.cwd(), relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, JSON.stringify(value, null, 2) + '\n', 'utf8');
  console.log(`WROTE ${relativePath}`);
}
console.log(`SEEDED ${Object.keys(data).length} files`);
