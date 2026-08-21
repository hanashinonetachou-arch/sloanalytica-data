import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] ?? '.');
const arr = v => Array.isArray(v) ? v : [];
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const clean = v => String(v ?? '').replace(/\s+/g, ' ').trim();
const selected = f => ['INCLUDE_PRIMARY', 'INCLUDE_SUPPORT'].includes(f?.adoptionCategory);
const explicitWeightRationale = /(weight|ウェイト|重み|過大評価|二重計上|二重評価|重複|相関|独立証拠|必ず出るわけではない|観測漏れ|判別不能|信頼度)/i;

const findings = [];
for (const ent of fs.readdirSync(path.join(root, 'research'), { withFileTypes: true })) {
  if (!ent.isDirectory()) continue;
  const p = path.join(root, 'research', ent.name, 'selection-data.json');
  if (!fs.existsSync(p)) continue;
  const s = read(p);
  const inputs = new Map(arr(s.inputs).map(x => [x.id, x]));
  const features = arr(s.features).filter(selected);
  const idsOf = f => [f.numeratorInputId, f.denominatorInputId, ...arr(f.denominatorInputIds), ...arr(f.categoryInputIds), ...arr(f.optionalCategoryInputIds)].filter(Boolean);

  for (const f of features) {
    const weight = Number(f.weight ?? 1);
    if (!Number.isFinite(weight) || Math.abs(weight - 1) < 1e-9) continue;
    const ids = new Set(idsOf(f));
    const overlaps = features.filter(g => g !== f && idsOf(g).some(id => ids.has(id))).map(g => g.featureId);
    const predecessor = idsOf(f).some(id => {
      const i = inputs.get(id);
      return i?.category === 'PREDECESSOR' || i?.observationScope === 'PREDECESSOR_SNAPSHOT';
    });
    const suppressed = arr(f.suppressedByFeatureIds);
    const text = [f.userReason, f.difficultyExclusionReason].map(clean).join(' ');
    const textual = explicitWeightRationale.test(text);
    const structural = predecessor || overlaps.length > 0 || suppressed.length > 0;
    const explained = textual || structural;
    const severity = weight <= 0 || weight > 1 ? 'HIGH_RISK' : explained ? 'INFO' : 'REVIEW';
    findings.push({ machineId: s.machineId ?? ent.name, featureId: f.featureId, weight, severity, textualRationale: textual, structuralRationale: structural, predecessor, overlaps, suppressedByFeatureIds: suppressed, reason: clean(f.userReason) });
  }
}

const rank = x => x.severity === 'HIGH_RISK' ? 2 : x.severity === 'REVIEW' ? 1 : 0;
findings.sort((a, b) => rank(b) - rank(a) || a.weight - b.weight || a.machineId.localeCompare(b.machineId));
const summary = {
  featureCount: findings.length,
  machineCount: new Set(findings.map(x => x.machineId)).size,
  highRisk: findings.filter(x => x.severity === 'HIGH_RISK').length,
  review: findings.filter(x => x.severity === 'REVIEW').length,
  explained: findings.filter(x => x.severity === 'INFO').length
};
const report = { schemaVersion: 'machine-data-nondefault-weight-audit-v2', generatedAt: new Date().toISOString(), summary, findings };
const jsonPath = path.join(root, 'reports', 'machine-data-nondefault-weight-audit-v2.json');
const mdPath = path.join(root, 'reports', 'machine-data-nondefault-weight-audit-v2.md');
fs.mkdirSync(path.dirname(jsonPath), { recursive: true });
fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2) + '\n');
const md = [
  '# MachineData Non-default Weight Audit — v2', '',
  `- Features: ${summary.featureCount}`,
  `- Machines: ${summary.machineCount}`,
  `- EXPLAINED: ${summary.explained}`,
  `- REVIEW: ${summary.review}`,
  `- HIGH_RISK: ${summary.highRisk}`, '',
  '| Machine | Feature | Weight | Status | Text | Structural | Reason |',
  '|---|---|---:|---|---|---|---|',
  ...findings.map(x => `| ${x.machineId} | ${x.featureId} | ${x.weight} | ${x.severity} | ${x.textualRationale ? 'yes' : 'no'} | ${x.structuralRationale ? 'yes' : 'no'} | ${x.reason.replaceAll('|', '／')} |`), '',
  '- 「補助採用」「入力しやすい」だけではweightを下げる根拠とはみなしません。',
  '- INFOは入力重複・前任者区間・suppression、またはweight低下を直接説明する文言が確認できるものです。',
  '- REVIEWはweight自体が誤りとは限りません。値を弱める根拠を現行SelectionDataから復元できないため個別再監査が必要です。',
].join('\n') + '\n';
fs.writeFileSync(mdPath, md);
console.log(`Non-default weight audit v2: features ${summary.featureCount} / explained ${summary.explained} / review ${summary.review} / high-risk ${summary.highRisk}`);
for (const x of findings) console.log(`${x.severity}\t${x.machineId}\t${x.featureId}\t${x.weight}\ttext=${x.textualRationale}\tstruct=${x.structuralRationale}`);
