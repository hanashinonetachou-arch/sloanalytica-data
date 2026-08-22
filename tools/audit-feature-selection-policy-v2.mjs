import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const researchRoot = path.join(root, 'research');
const outJson = path.join(root, 'reports', 'feature-selection-policy-v2-audit.json');
const outMd = path.join(root, 'reports', 'feature-selection-policy-v2-audit.md');

const trialWords = /(必要試行|試行量|サンプル|低頻度|頻度|終日|ゲーム数|G必要|重い|出現率が低|大半の実戦)/i;
const otherReasonWords = /(重複|二重|分母|判別|取得|観測|入力|停止形|打ち方|状態|依存|数値.*未公開|設定差.*小|差が小|情報量|包含|確定|示唆|誤差|取りこぼし)/i;

function loadJson(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }
function fmt(n) { return Number.isFinite(n) ? Math.round(n).toLocaleString('ja-JP') : '-'; }

const rows = [];
const machineDirs = fs.readdirSync(researchRoot, { withFileTypes: true }).filter(d => d.isDirectory());
for (const dir of machineDirs) {
  const selPath = path.join(researchRoot, dir.name, 'selection-data.json');
  if (!fs.existsSync(selPath)) continue;
  const sel = loadJson(selPath);
  for (const f of sel.features ?? []) {
    const trials = Number(f.requiredTrials?.value);
    if (!Number.isFinite(trials) || trials <= 0) continue;
    const reason = String(f.rejectionReason ?? f.userReason ?? '');
    const excluded = f.adoptionCategory === 'EXCLUDE';
    const trialReason = trialWords.test(reason);
    const otherReason = otherReasonWords.test(reason);
    let classification = 'INFO';
    let rationale = '';

    if (excluded && trialReason && !otherReason && trials <= 10000) {
      classification = 'HIGH_PRIORITY_REVIEW';
      rationale = '終日実戦圏のrequiredTrialsなのに、不採用理由が試行量中心で他の構造的理由を確認できない。';
    } else if (excluded && trialReason && !otherReason && trials <= 15000) {
      classification = 'REVIEW';
      rationale = 'requiredTrialsが終日〜延長実戦圏で、不採用理由が試行量中心。7000G時点の追加情報量を再評価する価値がある。';
    } else if (excluded && trialReason && !otherReason) {
      classification = 'TRIAL_ONLY_EXCLUSION';
      rationale = '試行量を主理由として不採用。固定閾値ではなく7000G追加情報量と入力負担で再確認する。';
    } else if (!excluded && trials > 15000) {
      classification = 'INCLUDED_HIGH_REQUIRED_TRIALS';
      rationale = 'requiredTrialsが15,000超でも採用されている。試行量だけを採否閾値にしていない現行例として確認対象。';
    } else if (excluded && trials <= 10000) {
      classification = 'EXCLUDED_WITH_PRACTICAL_TRIALS_OTHER_REASON';
      rationale = 'requiredTrialsは実戦圏だが、試行量以外の理由も存在するため個別理由を優先。';
    }

    rows.push({
      machineId: sel.machineId ?? dir.name,
      machineDataVersion: sel.machineDataVersion ?? null,
      featureId: f.featureId,
      researchFeatureId: f.researchFeatureId ?? null,
      adoptionCategory: f.adoptionCategory,
      requiredTrials: trials,
      requiredTrialsUnit: f.requiredTrials?.unit ?? null,
      reason,
      trialReason,
      otherReason,
      classification,
      rationale
    });
  }
}

const priority = { HIGH_PRIORITY_REVIEW: 0, REVIEW: 1, TRIAL_ONLY_EXCLUSION: 2, INCLUDED_HIGH_REQUIRED_TRIALS: 3, EXCLUDED_WITH_PRACTICAL_TRIALS_OTHER_REASON: 4, INFO: 5 };
rows.sort((a,b) => (priority[a.classification] ?? 9) - (priority[b.classification] ?? 9) || a.requiredTrials - b.requiredTrials || a.machineId.localeCompare(b.machineId));

const counts = rows.reduce((m,r) => (m[r.classification] = (m[r.classification] ?? 0) + 1, m), {});
const trialOnly = rows.filter(r => ['HIGH_PRIORITY_REVIEW','REVIEW','TRIAL_ONLY_EXCLUSION'].includes(r.classification));
const includedHigh = rows.filter(r => r.classification === 'INCLUDED_HIGH_REQUIRED_TRIALS');

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  policyDraft: {
    principle: 'requiredTrialsは採否の固定閾値ではなく、実用性を示す一指標として扱う。',
    reviewBands: {
      practical: '<=10000: 試行量だけを理由にEXCLUDEならHIGH_PRIORITY_REVIEW',
      extended: '10001-15000: 試行量だけを理由にEXCLUDEならREVIEW',
      long: '>15000: 低頻度でも発生時情報量・自動取得・独立性を含めて判断'
    },
    finalDecisionInputs: ['observability','denominator validity','independence/double-count risk','input burden','7000G marginal information gain']
  },
  summary: {
    featuresWithRequiredTrials: rows.length,
    counts,
    trialOnlyExclusions: trialOnly.length,
    includedHighRequiredTrials: includedHigh.length
  },
  rows
};
fs.mkdirSync(path.dirname(outJson), { recursive: true });
fs.writeFileSync(outJson, JSON.stringify(report, null, 2) + '\n');

const md = [];
md.push('# Feature Selection Policy v2 — requiredTrials audit');
md.push('');
md.push(`- Features with requiredTrials: ${rows.length}`);
for (const key of Object.keys(priority)) md.push(`- ${key}: ${counts[key] ?? 0}`);
md.push('');
md.push('## Draft principle');
md.push('');
md.push('`requiredTrials` は Feature 採否の固定閾値にしない。まず観測可能性・正しい分母・二重計上・入力負担を確認し、最終的には 1500G / 3000G / 7000G 時点で既存推測へ追加したときの限界情報量で判断する。');
md.push('');
md.push('## Priority candidates');
md.push('');
md.push('|Class|Machine|Feature|requiredTrials|Decision|Reason|');
md.push('|---|---|---|---:|---|---|');
for (const r of rows.filter(x => x.classification !== 'INFO')) {
  md.push(`|${r.classification}|${r.machineId}|${r.featureId}|${fmt(r.requiredTrials)} ${r.requiredTrialsUnit ?? ''}|${r.adoptionCategory}|${String(r.reason).replaceAll('|','\\|')}|`);
}
md.push('');
md.push('## Interpretation');
md.push('');
md.push('- HIGH_PRIORITY_REVIEW / REVIEW は自動採用を意味しない。試行量だけでは除外根拠として弱いことを示す。');
md.push('- INCLUDED_HIGH_REQUIRED_TRIALS は、既存データ自身が「requiredTrialsだけを採否閾値にしていない」比較例。');
md.push('- 次段階では候補Featureごとに Baseline と Baseline+Candidate の7000G設定帯識別性能差を測定する。');
fs.writeFileSync(outMd, md.join('\n') + '\n');

console.log(`Feature Selection Policy v2 audit: ${rows.length} features with requiredTrials`);
for (const key of Object.keys(priority)) console.log(`${key}\t${counts[key] ?? 0}`);
