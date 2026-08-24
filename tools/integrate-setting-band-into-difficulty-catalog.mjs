import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const catalogPath = path.join(root, 'difficulty-catalog.json');
const batchPath = path.join(root, 'reports', 'setting-band-batch-report.json');

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const batch = JSON.parse(fs.readFileSync(batchPath, 'utf8'));
const byMachine = new Map((batch.machines ?? []).map((m) => [m.machineId, m]));

function userFacingNotApplicableReason(rawReason) {
  const reason = String(rawReason ?? '').trim();
  if (!reason) return '設定帯判別Gに利用できる数値推測要素がありません。';
  if (/No adopted numeric inference feature has resolvable game-count exposure/i.test(reason)) {
    return '採用している数値推測要素はありますが、設定帯判別Gに必要なゲーム数換算の根拠が確定していないため算出できません。';
  }
  if (/Both low .*high .*setting bands are required/i.test(reason)) {
    return '低設定帯と高設定帯の両方を構成できない設定構成のため、設定帯判別Gの算出対象外です。';
  }
  if (/[A-Za-z]{3,}/.test(reason)) {
    return '設定帯判別Gに利用できる数値推測要素がありません。';
  }
  return reason;
}

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
    reason: band.status === 'COMPLETE' ? null : userFacingNotApplicableReason(band.reason),
  };
  updated++;
}

catalog.generatedAt = new Date().toISOString();
fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + '\n');
console.log(`OK: setting-band discrimination integrated into ${updated} difficulty entries.`);
