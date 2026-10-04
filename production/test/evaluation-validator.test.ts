import test from 'node:test';import assert from 'node:assert/strict';import {validateEvaluationDocument} from '../src/evaluation-validator.ts';import {buildEvaluation} from '../src/evaluation-builder.ts';
function h2(p:number){if(p===0||p===1)return 0;return -p*Math.log2(p)-(1-p)*Math.log2(1-p)}
function perTrialIg(ps:number[]){const mean=ps.reduce((a,b)=>a+b,0)/ps.length;return h2(mean)-ps.reduce((a,p)=>a+h2(p),0)/ps.length}
function logBinomial(k:number,n:number,p:number){if(p===0)return k===0?0:-Infinity;if(p===1)return k===n?0:-Infinity;let c=0;const j=Math.min(k,n-k);for(let i=1;i<=j;i++)c+=Math.log(n-j+i)-Math.log(i);return c+k*Math.log(p)+(n-k)*Math.log1p(-p)}
function binomialIg(ps:number[],n:number){let total=0;for(let k=0;k<=n;k++){const logs=ps.map(p=>logBinomial(k,n,p));const mx=Math.max(...logs);if(!Number.isFinite(mx))continue;const rel=logs.map(x=>Number.isFinite(x)?Math.exp(x-mx):0);const avg=rel.reduce((a,b)=>a+b,0)/rel.length;const scale=Math.exp(mx);if(scale===0)continue;for(const v of rel)if(v>0)total+=(scale*v/rel.length)*Math.log2(v/avg)}return total}
const research={batchId:'b',machineId:'M',blockedItems:[],findings:[{findingId:'f',label:'初当り',observationType:'probability',sourceIds:['s'],settingDistribution:{'1':'1/200','6':'1/150'}}]};
const ps=[1/200,1/150],ig=perTrialIg(ps),score=binomialIg(ps,7000)*200;
const base:any={schemaVersion:'evaluation-v2',manifestVersion:'8.5',batchId:'b',machineId:'M',dependencyReview:{status:'COMPLETE',candidateCount:1,groupCount:0,groups:[]},evaluations:[{findingId:'f',label:'初当り',observationType:'probability',sourceIds:['s'],settingDistribution:research.findings[0].settingDistribution,trialUniverse:'NORMAL_GAME_TRIAL',liveObservation:{status:'DIRECT_EXACT',reason:'direct'},dependency:{status:'NONE',kind:'REVIEWED_NO_SEMANTIC_OVERLAP',reason:'同じ観測母数を使うことだけでは情報重複とはみなさず、同じ成功事象・包含関係・上流下流関係が明示されていないため別の設定差情報として扱う。'},model:'BERNOULLI',benchmarkExposure:{status:'EXACT',trials:7000,reason:'7000 normal game trials'},metrics:{igPerEligibleTrial:ig,perEligibleTrialPower:ig*200,selectionScore:{status:'COMPUTED',value:score}},selectionClass:score>=20?'CORE':score>=10?'SUPPORT':score>=5?'JOINT_ELIGIBLE':'EXCLUDE',evaluationCompleteness:'COMPLETE'}],blockedItems:[],evidenceCandidates:[]};
test('accepts formal selection score for exact normal-game benchmark',()=>{assert.doesNotThrow(()=>validateEvaluationDocument(base,research))});
test('rejects upper-bound-only downgrade for exact normal-game benchmark',()=>{const d=structuredClone(base);d.evaluations[0].benchmarkExposure={status:'UPPER_BOUND_ONLY',maximumTrials:7000};d.evaluations[0].metrics.selectionScore={status:'BLOCKED_UNRESOLVED',value:null};d.evaluations[0].metrics.maximumSelectionScore=score;d.evaluations[0].evaluationCompleteness='COMPLETE_LIKELIHOOD_BENCHMARK_UNRESOLVED';assert.throws(()=>validateEvaluationDocument(d,research),/PROBABILITY_EXACT_BENCHMARK/)});


test('validator accepts bounded published categorical rounding',()=>{
 const roundedResearch:any={batchId:'b',machineId:'M',blockedItems:[],findings:[{findingId:'c',label:'公開丸め表',observationType:'appearance_distribution',sourceIds:['s'],trialUniverse:'EVENT_TRIAL',settingDistribution:{'1':'A 54% / B 36% / C 4% / D 1% / E 2% / F 2% / G 2%','6':'A 34% / B 52% / C 4% / D 1% / E 2% / F 3% / G 3%'},categoryModel:{residualPolicy:'SOURCE_EXHAUSTIVE'}}]};
 const built=buildEvaluation(roundedResearch);
 assert.doesNotThrow(()=>validateEvaluationDocument(built,roundedResearch));
 const badResearch=structuredClone(roundedResearch);badResearch.findings[0].settingDistribution['1']='A 60% / B 45%';
 assert.throws(()=>{const bad=buildEvaluation(badResearch);validateEvaluationDocument(bad,badResearch)},/EVAL_CATEGORY_SUM|INVALID_CATEGORY_SUM/);
});
