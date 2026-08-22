import fs from 'node:fs';
import path from 'node:path';
import { evaluateSettingBandGames } from './evaluate-setting-band-games.mjs';

const root = process.cwd();
const machineId = 'S_CODE_GEASS_3_CC_FS';
const researchPath = path.join(root, 'research', machineId, 'research-data.json');
const selectionPath = path.join(root, 'research', machineId, 'selection-data.json');
const outJson = path.join(root, 'reports', 'geass-cc-bonus-candidate-marginal.json');
const outMd = path.join(root, 'reports', 'geass-cc-bonus-candidate-marginal.md');

const research = JSON.parse(fs.readFileSync(researchPath, 'utf8'));
const baseline = JSON.parse(fs.readFileSync(selectionPath, 'utf8'));
const candidate = structuredClone(baseline);
const sf = candidate.features.find(f => f.featureId === 'FEAT_NORMAL_BONUS_DETAIL_MULTINOMIAL');
if (!sf) throw new Error('candidate selection feature missing');
sf.adoptionCategory = 'INCLUDE_SUPPORT';
sf.weight = 1.0;
sf.difficultyParticipation = 'INCLUDE';
sf.difficultyExposure = {
  mode: 'per_game',
  factor: 1.0,
  quality: 'EXACT',
  basisId: 'NORMAL_AT_GAMES'
};
sf.userReason = 'Feature Selection Policy v2 candidate simulation only';
delete sf.rejectionReason;

const thresholds = [];
for (let p = 0.50; p <= 0.90 + 1e-9; p += 0.01) thresholds.push(Number(p.toFixed(2)));
const commonOptions = {
  thresholds,
  simulationsPerSetting: 8000,
  seed: 20260822,
  coarseStep: 250,
  fineStep: 50,
  maxGames: 30000
};
const baseReport = evaluateSettingBandGames(research, baseline, commonOptions);
const candReport = evaluateSettingBandGames(research, candidate, commonOptions);

function thresholdGames(report, t) {
  const r = report.results.find(x => Math.abs(x.threshold - t) < 1e-9);
  return r?.games ?? null;
}
function accuracyFloorAt(report, games) {
  const reached = report.results.filter(r => r.games != null && r.games <= games);
  if (!reached.length) return null;
  return Math.max(...reached.map(r => r.threshold));
}
function deltaPctPoint(a,b) {
  return a == null || b == null ? null : Number(((b-a)*100).toFixed(1));
}

const checkpoints = [1500, 3000, 7000];
const comparison = {
  thresholds: [0.60,0.70,0.80].map(t => ({
    threshold: t,
    baselineGames: thresholdGames(baseReport, t),
    candidateGames: thresholdGames(candReport, t),
    deltaGames: thresholdGames(baseReport,t) != null && thresholdGames(candReport,t) != null ? thresholdGames(candReport,t)-thresholdGames(baseReport,t) : null
  })),
  checkpoints: checkpoints.map(g => {
    const b = accuracyFloorAt(baseReport,g);
    const c = accuracyFloorAt(candReport,g);
    return { games:g, baselineAccuracyFloor:b, candidateAccuracyFloor:c, deltaPercentagePoints:deltaPctPoint(b,c) };
  })
};

const result = {
  schemaVersion:1,
  generatedAt:new Date().toISOString(),
  machineId,
  candidateFeatureId:sf.featureId,
  candidateResearchFeatureId:sf.researchFeatureId,
  candidateRequiredTrials: baseline.features.find(f=>f.featureId===sf.featureId)?.requiredTrials ?? null,
  methodology:'Same setting-band simulator and priors as production. Candidate is added in-memory only, weight=1.0, per_game 1:1 on NORMAL_AT_GAMES. Accuracy checkpoints are conservative floors inferred from 1%-step thresholds reached by each game count.',
  baselineAnalyzableFeatureIds:baseReport.analyzableFeatureIds,
  candidateAnalyzableFeatureIds:candReport.analyzableFeatureIds,
  comparison,
  baseline:baseReport,
  candidate:candReport
};
fs.mkdirSync(path.dirname(outJson),{recursive:true});
fs.writeFileSync(outJson,JSON.stringify(result,null,2)+'\n');

const md=[];
md.push('# C.C.&Kallen — ボーナス内訳Candidate限界寄与');
md.push('');
md.push(`- Candidate: ${sf.featureId}`);
md.push(`- requiredTrials: ${result.candidateRequiredTrials?.value ?? '-'} ${result.candidateRequiredTrials?.unit ?? ''}`);
md.push('- Candidateはファイルへ採用せず、メモリ上だけでINCLUDE_SUPPORT / weight=1.0として比較。');
md.push('');
md.push('## 設定帯判別G');
md.push('');
md.push('|閾値|Baseline|+Candidate|差|');
md.push('|---:|---:|---:|---:|');
for(const r of comparison.thresholds) md.push(`|${Math.round(r.threshold*100)}%|${r.baselineGames ?? '-'}G|${r.candidateGames ?? '-'}G|${r.deltaGames == null?'-':`${r.deltaGames>0?'+':''}${r.deltaGames}G`}|`);
md.push('');
md.push('## 代表ゲーム数で到達済みの精度下限');
md.push('');
md.push('|G|Baseline|+Candidate|改善|');
md.push('|---:|---:|---:|---:|');
for(const r of comparison.checkpoints) md.push(`|${r.games}|${r.baselineAccuracyFloor==null?'-':`${Math.round(r.baselineAccuracyFloor*100)}%`}|${r.candidateAccuracyFloor==null?'-':`${Math.round(r.candidateAccuracyFloor*100)}%`}|${r.deltaPercentagePoints==null?'-':`${r.deltaPercentagePoints>0?'+':''}${r.deltaPercentagePoints}pt`}|`);
md.push('');
md.push('## 判定ルール');
md.push('');
md.push('- requiredTrials単独では採否を決めない。');
md.push('- Candidateが7000G時点の設定帯識別力を実質改善し、観測可能・二重計上なし・入力負担が許容できる場合は採用へ戻す。');
md.push('- 改善がほぼ無い場合は、requiredTrialsが実戦圏でも入力負担との比較で不採用を維持できる。');
fs.writeFileSync(outMd,md.join('\n')+'\n');
console.log(md.join('\n'));
