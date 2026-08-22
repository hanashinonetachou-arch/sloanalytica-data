import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FILE = path.join(ROOT, 'research', 'S_WORD_OF_LIGHTS_2', 'research-data.json');
const data = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const TARGETS = new Set(['RF_BIG_END_SCREEN', 'RF_ADJUST_MAGIC']);
let changed = 0;
for (const feature of data.features ?? []) {
  if (!TARGETS.has(feature.researchFeatureId) || feature.candidateModel !== 'multinomial') continue;
  for (const [setting, dist] of Object.entries(feature.settingDistributions ?? {})) {
    const entries = Object.entries(dist);
    const sum = entries.reduce((acc, [, value]) => acc + Number(value), 0);
    if (!Number.isFinite(sum) || sum <= 0) throw new Error(`${feature.researchFeatureId}/${setting}: invalid distribution sum ${sum}`);
    const delta = Math.abs(sum - 1);
    if (delta > 0.005) throw new Error(`${feature.researchFeatureId}/${setting}: rounding delta too large ${sum}`);
    if (delta <= 1e-12) continue;
    for (const [key, value] of entries) dist[key] = Number(value) / sum;
    changed += 1;
  }
  const suffix = ' 公開振り分けは小数1桁%の丸め値を含むため、ResearchDataでは各設定内で合計1になるよう比例正規化している。相対比は公開値を維持。';
  if (!String(feature.notes ?? '').includes('比例正規化')) feature.notes = `${feature.notes ?? ''}${suffix}`.trim();
}
fs.writeFileSync(FILE, JSON.stringify(data, null, 2) + '\n');
console.log(`Normalized Word of Lights rounded multinomial distributions: ${changed} setting distributions.`);
