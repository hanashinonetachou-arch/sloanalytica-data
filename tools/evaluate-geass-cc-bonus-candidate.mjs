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

function enableBonusCandidate(selection) {
  const sf = selection.features.find(f => f.featureId === 'FEAT_NORMAL_BONUS_DETAIL_MULTINOMIAL');
  if (!sf) throw new Error('candidate selection feature missing');
  sf.adoptionCategory = 'INCLUDE_SUPPORT';
  sf.weight = 1.0;
  sf.difficultyParticipation = 'INCLUDE';
  sf.difficultyExposure = { mode:'per_game', factor:1.0, quality:'EXACT', basisId:'NORMAL_AT_GAMES' };
  sf.userReason = 'Feature Selection Policy v2 candidate simulation only';
  delete sf.rejectionReason;
  return sf;
}

const naiveAdd = structuredClone(baseline);
const candidateSf = enableBonusCandidate(naiveAdd);

const replacement = structuredClone(baseline);
enableBonusCandidate(replacement);
const smallRole = replacement.features.find(f => f.featureId === 'FEAT_CHERRY_WATERMELON_MULTINOMIAL');
if (!smallRole) throw new Error('small-role feature missing');
smallRole.adoptionCategory = 'EXCLUDE';
smallRole.difficultyParticipation = 'EXCLUDE';
smallRole.rejectionReason = 'Candidate replacement experiment only';
delete smallRole.difficultyExposure;

const thresholds=[];
for(let p=0.50;p<=0.90+1e-9;p+=0.01) thresholds.push(Number(p.toFixed(2)));
const options={thresholds,simulationsPerSetting:8000,seed:20260822,coarseStep:250,fineStep:50,maxGames:30000};

const reports={
  baseline:evaluateSettingBandGames(research,baseline,options),
  naiveAdd:evaluateSettingBandGames(research,naiveAdd,options),
  replacement:evaluateSettingBandGames(research,replacement,options)
};

function thresholdGames(report,t){const r=report.results.find(x=>Math.abs(x.threshold-t)<1e-9);return r?.games??null;}
function accuracyFloorAt(report,games){const reached=report.results.filter(r=>r.games!=null&&r.games<=games);return reached.length?Math.max(...reached.map(r=>r.threshold)):null;}
function summary(report){return {thresholds:[0.60,0.70,0.80].map(t=>({threshold:t,games:thresholdGames(report,t)})),checkpoints:[1500,3000,7000].map(g=>({games:g,accuracyFloor:accuracyFloorAt(report,g)})),analyzableFeatureIds:report.analyzableFeatureIds};}
const summaries=Object.fromEntries(Object.entries(reports).map(([k,v])=>[k,summary(v)]));

const result={
  schemaVersion:2,
  generatedAt:new Date().toISOString(),
  machineId,
  candidateFeatureId:candidateSf.featureId,
  candidateRequiredTrials:baseline.features.find(f=>f.featureId===candidateSf.featureId)?.requiredTrials??null,
  dependenceWarning:'Naive add is not a valid adoption estimate because bonus detail includes cherry+RB while the current small-role Feature counts cherry, so the two Features share underlying events. Replacement scenario avoids direct double-counting by comparing bonus detail instead of the small-role Feature.',
  scenarios:{
    baseline:'Current production Difficulty Feature set.',
    naiveAdd:'Diagnostic upper-bound only: current Features plus bonus detail. Correlation is ignored, so improvement may be overstated.',
    replacement:'Bonus detail included and cherry/watermelon Feature removed from Difficulty. This is a cleaner non-double-counted alternative comparison, though it does not prove the two can be jointly modeled independently.'
  },
  summaries,
  reports
};
fs.mkdirSync(path.dirname(outJson),{recursive:true});
fs.writeFileSync(outJson,JSON.stringify(result,null,2)+'\n');

const md=[];
md.push('# C.C.&Kallen — ボーナス内訳Candidate再評価');
md.push('');
md.push(`- requiredTrials: ${result.candidateRequiredTrials?.value??'-'} ${result.candidateRequiredTrials?.unit??''}`);
md.push('- **注意:** ボーナス内訳にはチェリー＋RBが含まれ、現行チェリーFeatureと事象を共有するため、単純追加は二重計上リスクがあります。');
md.push('- そのため「+Candidate」は上限的な参考値とし、正式な比較には「小役Featureをボーナス内訳へ置換」したシナリオも併記します。');
md.push('');
md.push('## 設定帯判別G');
md.push('');
md.push('|閾値|Baseline|単純追加※|小役→ボーナス置換|');
md.push('|---:|---:|---:|---:|');
for(const t of [0.60,0.70,0.80]){
  const b=thresholdGames(reports.baseline,t), n=thresholdGames(reports.naiveAdd,t), r=thresholdGames(reports.replacement,t);
  md.push(`|${Math.round(t*100)}%|${b??'-'}G|${n??'-'}G|${r??'-'}G|`);
}
md.push('');
md.push('## 代表ゲーム数で到達済みの精度下限');
md.push('');
md.push('|G|Baseline|単純追加※|小役→ボーナス置換|');
md.push('|---:|---:|---:|---:|');
for(const g of [1500,3000,7000]){
  const f=x=>{const v=accuracyFloorAt(x,g);return v==null?'-':`${Math.round(v*100)}%`;};
  md.push(`|${g}|${f(reports.baseline)}|${f(reports.naiveAdd)}|${f(reports.replacement)}|`);
}
md.push('');
md.push('※単純追加は相関を無視するため、正式採用性能としては使用しません。');
md.push('');
md.push('## Policy v2への含意');
md.push('');
md.push('- requiredTrialsだけでFeatureを除外しない。');
md.push('- Candidateの追加情報量を評価する前に、既採用Featureとの事象共有・包含・条件付き依存を確認する。');
md.push('- 相関がある場合は、単純な尤度積ではなく「置換」「排他的な統合Multinomial」「条件付きモデル」のいずれかを検討する。');
md.push('- 採否は、正しい観測・分母・重複回避を満たしたモデルでの1500G/3000G/7000G限界寄与と入力負担を合わせて判断する。');
fs.writeFileSync(outMd,md.join('\n')+'\n');
console.log(md.join('\n'));
