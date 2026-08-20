import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const catalogPath = path.join(root, 'difficulty-catalog.json');
const batchPath = path.join(root, 'reports', 'setting-band-batch-report.json');

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const batch = JSON.parse(fs.readFileSync(batchPath, 'utf8'));
const byMachine = new Map((batch.machines ?? []).map((m) => [m.machineId, m]));

let updated = 0;
for (const entry of catalog.entries ?? []) {
  const band = byMachine.get(entry.machineId);
  if (!band || !entry.difficulty) continue;

  const results = Array.isArray(band.results) ? band.results : [];
  entry.difficulty.settingBandDiscrimination = {
    schemaVersion: 'setting-band-discrimination-display-v1',
    status: band.status === 'COMPLETE' ? 'COMPLETE' : 'NOT_APPLICABLE',
    definition: '低設定側・高設定側のどちらに属するかを、各正解率で判別できるようになるゲーム数の目安です。',
    thresholds: [60, 70, 80].map((accuracy) => {
      const r = results.find((x) => Math.round(Number(x.threshold) * 100) === accuracy);
      return { accuracy, games: Number.isFinite(Number(r?.games)) ? Number(r.games) : null };
    }),
    reason: band.status === 'COMPLETE' ? null : (band.reason ?? '設定帯判別Gに利用できる数値推測要素がありません。'),
  };
  updated++;
}

catalog.generatedAt = new Date().toISOString();
fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + '\n');
console.log(`OK: setting-band discrimination integrated into ${updated} difficulty entries.`);
