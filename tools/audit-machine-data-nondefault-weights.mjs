import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] ?? '.');
const arr = v => Array.isArray(v) ? v : [];
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const clean = v => String(v ?? '').replace(/\s+/g, ' ').trim();
const selected = f => ['INCLUDE_PRIMARY', 'INCLUDE_SUPPORT'].includes(f?.adoptionCategory);
const rationale = /(重複|相関|補助|前任|着席|構成|内訳|条件|推定|参考|二重|主要経路|独立|信頼)/;

const findings = [];
for (const ent of fs.readdirSync(path.join(root, 'research'), { withFileTypes: true })) {
  if (!ent.isDirectory()) continue;
  const p = path.join(root, 'research', ent.name, 'selection-data.json');
  if (!fs.existsSync(p)) continue;
  const s = read(p);
  const inputs = new Map(arr(s.inputs).map(x => [x.id, x]));
  const features = arr(s.features).filter(selected);
  const idsOf = f => [f.numeratorInputId, f.denominatorInputId, ...arr(f.denominatorInputIds), ...arr(f.categoryInputIds)].filter(Boolean);

  for (const f of features) {
    const weight = Number(f.weight ?? 1);
    if (!Number.isFinite(weight) || Math.abs(weight - 1) < 1e-9) continue;
    const ids = new Set(idsOf(f));
    const overlaps = features.filter(g => g !== f && idsOf(g).some(id => ids.has(id))).map(g => g.featureId);
    const predecessor = idsOf(f).some(id => {
      const i = inputs.get(id);
      return i?.category === 'PREDECESSOR' || i?.observationScope === 'PREDECESSOR_SNAPSHOT';
    });
    const text = [f.userReason, f.difficultyExclusionReason].map(clean).join(' ');
    const explained = rationale.test(text) || predecessor || overlaps.length > 0 || arr(f.suppressedByFeatureIds).length > 0;
    const severity = weight <= 0 || weight > 1 ? 'HIGH_RISK' : explained ? 'INFO' : 'REVIEW';
    findings.push({ machineId: s.machineId ?? ent.name, featureId: f.featureId, weight, severity, predecessor, overlaps, reason: clean(f.userReason) });
  }
}

findings.sort((a, b) => a.severity.localeCompare(b.severity) || a.weight - b.weight || a.machineId.localeCompare(b.machineId));
const summary = {
  featureCount: findings.length,
  machineCount: new Set(findings.map(x => x.machineId)).size,
  highRisk: findings.filter(x => x.severity === 'HIGH_RISK').length,
  review: findings.filter(x => x.severity === 'REVIEW').length,
  explained: findings.filter(x => x.severity === 'INFO').length
};
const report = { schemaVersion: 'machine-data-nondefault-weight-audit-v1', generatedAt: new Date().toISOString(), summary, findings };
const jsonPath = path.join(root, 'reports', 'machine-data-nondefault-weight-audit-v1.json');
const mdPath = path.join(root, 'reports', 'machine-data-nondefault-weight-audit-v1.md');
fs.mkdirSync(path.dirname(jsonPath), { recursive: true });
fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2) + '\n');
const md = [
  '# MachineData Non-default Weight Audit — v1', '',
  `- Features: ${summary.featureCount}`,
  `- Machines: ${summary.machineCount}`,
  `- EXPLAINED: ${summary.explained}`,
  `- REVIEW: ${summary.review}`,
  `- HIGH_RISK: ${summary.highRisk}`, '',
  '| Machine | Feature | Weight | Status | Predecessor | Overlaps | Reason |',
  '|---|---|---:|---|---|---|---|',
  ...findings.map(x => `| ${x.machineId} | ${x.featureId} | ${x.weight} | ${x.severity} | ${x.predecessor ? 'yes' : 'no'} | ${x.overlaps.join(', ')} | ${x.reason.replaceAll('|', '／')} |`), '',
  'REVIEWは現行SelectionDataだけではweightを弱める根拠を確認できない候補です。weight≠1を自動的に誤りとは扱いません。',
].join('\n') + '\n';
fs.writeFileSync(mdPath, md);
console.log(`Non-default weight audit: features ${summary.featureCount} / explained ${summary.explained} / review ${summary.review} / high-risk ${summary.highRisk}`);
for (const x of findings) console.log(`${x.severity}\t${x.machineId}\t${x.featureId}\t${x.weight}\t${x.overlaps.join(',')}`);
