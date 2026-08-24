import fs from 'node:fs';
import path from 'node:path';

const target = path.join(process.cwd(), 'research', 'S_GRANBELM_ZX', 'research-data.json');
const research = JSON.parse(fs.readFileSync(target, 'utf8'));
let touched = 0;
for (const feature of (research.features || []).filter((item) => String(item.researchFeatureId || '').startsWith('RF_NAKAMI_'))) {
  const keys = Array.isArray(feature.categories) ? feature.categories : [];
  if (keys.length < 2) continue;
  const residualKey = keys[keys.length - 1];
  for (const distribution of Object.values(feature.settingDistributions || {})) {
    const prefixSum = keys.slice(0, -1).reduce((sum, key) => sum + Number(distribution[key]), 0);
    distribution[residualKey] = Number((1 - prefixSum).toFixed(10));
    touched += 1;
  }
}
fs.writeFileSync(target, JSON.stringify(research, null, 2) + '\n');
console.log(`OK: normalized ${touched} Granbelm Nakamimieru setting distributions with residual category.`);
