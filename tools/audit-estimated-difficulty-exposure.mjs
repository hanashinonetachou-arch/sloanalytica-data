import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const researchRoot = path.join(root, 'research');
const reportDir = path.join(root, 'reports');
const jsonOut = path.join(reportDir, 'estimated-difficulty-exposure-audit-v1.json');
const mdOut = path.join(reportDir, 'estimated-difficulty-exposure-audit-v1.md');
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const text = v => typeof v === 'string' ? v.trim() : '';
const finitePositive = v => Number.isFinite(Number(v)) && Number(v) > 0;

const results = [];
let estimatedFeatureCount = 0;
let provisionalIncludedCount = 0;

for (const dir of fs.readdirSync(researchRoot, { withFileTypes: true })) {
  if (!dir.isDirectory()) continue;
  const selectionPath = path.join(researchRoot, dir.name, 'selection-data.json');
  const researchPath = path.join(researchRoot, dir.name, 'research-data.json');
  if (!fs.existsSync(selectionPath) || !fs.existsSync(researchPath)) continue;

  const s = read(selectionPath);
  const r = read(researchPath);
  const machine = r.machine?.displayName ?? s.machineId;
  const settings = r.machine?.settings ?? [];
  const targetBasis = s.difficultyAnalysis?.targetGameBasis ?? null;
  const allowed = new Set(s.difficultyAnalysis?.calibrationAllowedExposureQualities ?? ['EXACT', 'DERIVED', 'ESTIMATED']);
  const issues = [];
  const estimated = [];

  for (const f of s.features ?? []) {
    if (f.difficultyParticipation !== 'INCLUDE') continue;
    const dx = f.difficultyExposure;
    if (!dx) continue;
    if (dx.quality === 'PROVISIONAL') {
      provisionalIncludedCount++;
      if (!allowed.has('PROVISIONAL')) issues.push({severity:'HIGH_RISK', featureId:f.featureId, code:'PROVISIONAL_NOT_EXPLICITLY_ALLOWED'});
      if (!text(dx.estimationBasis) || !text(dx.uncertaintyNote)) issues.push({severity:'HIGH_RISK', featureId:f.featureId, code:'PROVISIONAL_WITHOUT_FULL_JUSTIFICATION'});
      continue;
    }
    if (dx.quality !== 'ESTIMATED') continue;

    estimatedFeatureCount++;
    const featureIssues = [];
    if (!text(dx.basisId)) featureIssues.push(['HIGH_RISK', 'MISSING_BASIS_ID']);
    if (!text(dx.confidence)) featureIssues.push(['REVIEW', 'MISSING_CONFIDENCE']);
    if (text(dx.estimationBasis).length < 12) featureIssues.push(['HIGH_RISK', 'MISSING_OR_THIN_ESTIMATION_BASIS']);
    if (text(dx.uncertaintyNote).length < 12) featureIssues.push(['REVIEW', 'MISSING_OR_THIN_UNCERTAINTY_NOTE']);

    if (dx.mode === 'per_game' && dx.factor != null && !finitePositive(dx.factor)) featureIssues.push(['HIGH_RISK', 'NONPOSITIVE_PER_GAME_FACTOR']);
    if (dx.mode === 'fixed_rate' && !finitePositive(dx.trialsPerGame)) featureIssues.push(['HIGH_RISK', 'NONPOSITIVE_FIXED_RATE']);
    if (dx.mode === 'setting_rate') {
      const rates = dx.trialsPerGameBySetting ?? {};
      if (settings.some(setting => !finitePositive(rates[setting]))) featureIssues.push(['HIGH_RISK', 'INCOMPLETE_SETTING_RATE']);
    }
    if (dx.mode === 'derived_event_rate') {
      if (!text(dx.sourceFeatureId)) featureIssues.push(['HIGH_RISK', 'MISSING_SOURCE_FEATURE']);
      if (dx.eventMultiplier != null && !finitePositive(dx.eventMultiplier)) featureIssues.push(['HIGH_RISK', 'NONPOSITIVE_EVENT_MULTIPLIER']);
    }

    if (text(dx.basisId)) {
      if (!targetBasis) featureIssues.push(['REVIEW', 'NO_TARGET_GAME_BASIS']);
      else if (targetBasis.basisId !== dx.basisId) featureIssues.push(['REVIEW', 'BASIS_ID_MISMATCH']);
    }
    if (targetBasis?.quality === 'ESTIMATED' && text(targetBasis.note).length < 12) featureIssues.push(['REVIEW', 'THIN_TARGET_GAME_BASIS_NOTE']);

    estimated.push({
      featureId: f.featureId,
      mode: dx.mode,
      basisId: dx.basisId ?? null,
      confidence: dx.confidence ?? null,
      issues: featureIssues.map(([,code]) => code)
    });
    for (const [severity, code] of featureIssues) issues.push({severity, featureId:f.featureId, code});
  }

  if (estimated.length === 0 && issues.length === 0) continue;
  const status = issues.some(x => x.severity === 'HIGH_RISK') ? 'HIGH_RISK' : issues.length ? 'REVIEW' : 'PASS';
  results.push({machineId:s.machineId, machine, status, estimated, issues});
}

const counts = {PASS:0, REVIEW:0, HIGH_RISK:0};
for (const x of results) counts[x.status]++;
const report = {
  schemaVersion:'estimated-difficulty-exposure-audit-v1',
  generatedAt:new Date().toISOString(),
  machinesWithEstimatedOrFlaggedExposure:results.length,
  estimatedFeatureCount,
  provisionalIncludedCount,
  counts,
  results
};
fs.mkdirSync(reportDir, {recursive:true});
fs.writeFileSync(jsonOut, JSON.stringify(report, null, 2) + '\n');

const rows = results.map((x,i) => `| ${i+1} | ${x.machine} (${x.machineId}) | ${x.status} | ${x.estimated.length} | ${x.issues.map(y=>`${y.featureId}:${y.code}`).join(', ') || '-'} |`);
const md = `# Estimated Difficulty Exposure Audit — v1\n\n- Machines with ESTIMATED/flagged exposure: ${results.length}\n- ESTIMATED Features: ${estimatedFeatureCount}\n- PROVISIONAL included Features: ${provisionalIncludedCount}\n- PASS: ${counts.PASS}\n- REVIEW: ${counts.REVIEW}\n- HIGH_RISK: ${counts.HIGH_RISK}\n\n## Priority\n\n| # | Machine | Status | ESTIMATED Features | Flags |\n|---:|---|---|---:|---|\n${rows.join('\n')}\n\n## Interpretation\n\n- ESTIMATED exposure itself is allowed. This audit checks whether the games-to-trials estimate has an explicit basis, confidence, uncertainty note, and a coherent target-game basis.\n- PROVISIONAL exposure is HIGH_RISK unless calibration explicitly opts into PROVISIONAL and the estimate is fully justified.\n- REVIEW means the estimate may be valid but its documentation is not sufficient to audit mechanically.\n- This audit is advisory and does not change SelectionData, MachineData, Difficulty scores, or setting-band values.\n`;
fs.writeFileSync(mdOut, md);

console.log(`Estimated Difficulty exposure audit: PASS ${counts.PASS} / REVIEW ${counts.REVIEW} / HIGH_RISK ${counts.HIGH_RISK} / ESTIMATED Features ${estimatedFeatureCount}`);
for (const x of results.filter(x=>x.status!=='PASS')) console.log(`${x.status}\t${x.machineId}\t${x.issues.map(y=>`${y.featureId}:${y.code}`).join(',')}`);
