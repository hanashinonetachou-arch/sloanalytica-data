import fs from 'node:fs';
import path from 'node:path';

const EPS=1e-12;
const DEFAULT_TARGETS=[1500,3000,7000];
const DEFAULT_SIMULATIONS_PER_SETTING=4000;
const SCORE_WEIGHTS={information:0.45,exact:0.35,distance:0.20};

function clamp(v,a=0,b=1){return Math.max(a,Math.min(b,v));}
function clampP(p){return clamp(Number(p),EPS,1-EPS);}
function logSumExp(xs){const m=Math.max(...xs); return m+Math.log(xs.reduce((s,x)=>s+Math.exp(x-m),0));}
function entropy(ps){return -ps.reduce((s,p)=>p>0?s+p*Math.log(p):s,0);}
function bcBernoulli(p,q){p=clampP(p);q=clampP(q);return Math.sqrt(p*q)+Math.sqrt((1-p)*(1-q));}
function bcCategorical(p,q){return p.reduce((s,v,i)=>s+Math.sqrt(Math.max(0,v)*Math.max(0,q[i])),0);}
function bcPoisson(lambda1,lambda2){return Math.exp(-0.5*(Math.sqrt(Math.max(0,lambda1))-Math.sqrt(Math.max(0,lambda2)))**2);}
function trialsForBayesAccuracy80FromBC(bc){
  bc=clamp(bc,0,1);
  if(bc>=1-EPS) return null;
  if(bc<=EPS) return 1;
  // Equal-prior Bayes error upper bound: Pe <= 0.5 * BC^n. Require Pe <= 0.20.
  return Math.max(1,Math.ceil(Math.log(0.4)/Math.log(bc)));
}
function categoricalDistribution(feature,setting){
  const categories=Array.isArray(feature.categories)?feature.categories:[];
  const raw=feature.settingDistributions?.[setting];
  if(!raw||categories.length<2) return null;
  const values=categories.map(c=>Number(raw[c]));
  if(values.some(v=>!Number.isFinite(v)||v<0||v>1)) return null;
  const sum=values.reduce((a,b)=>a+b,0);
  if((feature.distributionMode??'complete')==='implicit_residual'){
    if(sum>1+1e-6)return null;
    return [...values,Math.max(0,1-sum)];
  }
  return Math.abs(sum-1)<=1e-6?values:null;
}
function featureProbability(feature,setting){
  const v=feature.settingValues?.[setting];
  const p=Number(v?.probability);
  return Number.isFinite(p)&&p>=0?p:null;
}
function pairwiseTrialEstimate(feature,settings){
  if(settings.length<2)return null;
  const low=settings[0], high=settings.at(-1);
  if(feature.candidateModel==='multinomial'){
    const p=categoricalDistribution(feature,low),q=categoricalDistribution(feature,high);
    if(!p||!q)return null;
    return {settings:[low,high],requiredTrials80:trialsForBayesAccuracy80FromBC(bcCategorical(p,q)),criterion:'equal-prior Bayes accuracy >= 80% (Bhattacharyya upper-bound estimate)'};
  }
  const p=featureProbability(feature,low),q=featureProbability(feature,high);
  if(p==null||q==null)return null;
  const bc=feature.candidateModel==='poisson'?bcPoisson(p,q):bcBernoulli(p,q);
  return {settings:[low,high],requiredTrials80:trialsForBayesAccuracy80FromBC(bc),criterion:'equal-prior Bayes accuracy >= 80% (Bhattacharyya upper-bound estimate)'};
}

function mulberry32(seed){return function(){let t=seed+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};}
function normal(rng){let u=0,v=0;while(u===0)u=rng();while(v===0)v=rng();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);}
function samplePoisson(lambda,rng){
  if(lambda<=0)return 0;
  if(lambda<30){const L=Math.exp(-lambda);let k=0,p=1;do{k++;p*=rng();}while(p>L);return k-1;}
  return Math.max(0,Math.round(lambda+Math.sqrt(lambda)*normal(rng)));
}
function sampleBinomial(n,p,rng){
  n=Math.max(0,Math.round(n));p=clampP(p);
  const mean=n*p;
  if(n<=60){let x=0;for(let i=0;i<n;i++)if(rng()<p)x++;return x;}
  if(mean<20)return Math.min(n,samplePoisson(mean,rng));
  const fail=n*(1-p);if(fail<20)return n-Math.min(n,samplePoisson(fail,rng));
  return Math.max(0,Math.min(n,Math.round(mean+Math.sqrt(n*p*(1-p))*normal(rng))));
}
function sampleMultinomial(n,probs,rng){
  let remainN=Math.max(0,Math.round(n)),remainP=1;const out=[];
  for(let i=0;i<probs.length-1;i++){
    const conditional=remainP<=EPS?0:clamp(probs[i]/remainP,0,1);
    const x=sampleBinomial(remainN,conditional,rng);out.push(x);remainN-=x;remainP-=probs[i];
  }
  out.push(remainN);return out;
}
function exposureTrials(selectionFeature,trueSetting,targetGames){
  const ex=selectionFeature.difficultyExposure;
  if(!ex||typeof ex!=='object')return null;
  if(ex.mode==='per_game') return Math.max(0,Math.round(targetGames*Number(ex.factor??1)));
  if(ex.mode==='fixed_rate'){
    const rate=Number(ex.trialsPerGame);return Number.isFinite(rate)&&rate>=0?Math.max(0,Math.round(targetGames*rate)):null;
  }
  if(ex.mode==='setting_rate'){
    const rate=Number(ex.trialsPerGameBySetting?.[trueSetting]);return Number.isFinite(rate)&&rate>=0?Math.max(0,Math.round(targetGames*rate)):null;
  }
  return null;
}
function simulateObservation(researchFeature,selectionFeature,trueSetting,targetGames,rng){
  const n=exposureTrials(selectionFeature,trueSetting,targetGames);if(n==null)return null;
  if(researchFeature.candidateModel==='multinomial'){
    const probs=categoricalDistribution(researchFeature,trueSetting);if(!probs)return null;
    return {n,counts:sampleMultinomial(n,probs,rng)};
  }
  const p=featureProbability(researchFeature,trueSetting);if(p==null)return null;
  if(researchFeature.candidateModel==='poisson')return {n,count:samplePoisson(n*p,rng)};
  return {n,count:sampleBinomial(n,p,rng)};
}
function logLikelihood(researchFeature,obs,setting){
  if(researchFeature.candidateModel==='multinomial'){
    const probs=categoricalDistribution(researchFeature,setting);if(!probs)return -Infinity;
    return obs.counts.reduce((s,c,i)=>c>0?s+c*Math.log(clampP(probs[i])):s,0);
  }
  const p=featureProbability(researchFeature,setting);if(p==null)return -Infinity;
  if(researchFeature.candidateModel==='poisson'){
    const lambda=Math.max(EPS,obs.n*p);return obs.count*Math.log(lambda)-lambda;
  }
  return obs.count*Math.log(clampP(p))+(obs.n-obs.count)*Math.log(clampP(1-p));
}
function posteriorForRun(settings,featuresById,selectionFeatures,trueSetting,targetGames,rng){
  const logs=settings.map(()=>-Math.log(settings.length));
  let used=0;
  for(const sf of selectionFeatures){
    const rf=featuresById.get(sf.researchFeatureId);if(!rf)continue;
    const obs=simulateObservation(rf,sf,trueSetting,targetGames,rng);if(!obs)continue;
    const w=Number(sf.weight??1);if(!Number.isFinite(w)||w<=0)continue;
    for(let i=0;i<settings.length;i++) logs[i]+=w*logLikelihood(rf,obs,settings[i]);
    used++;
  }
  const z=logSumExp(logs);return {posterior:logs.map(v=>Math.exp(v-z)),used};
}
function analyzeTarget(settings,featuresById,selectionFeatures,targetGames,simulationsPerSetting,seed){
  const rng=mulberry32(seed+targetGames);let runs=0,correct=0,entropySum=0,distanceSum=0,posteriorTrueSum=0,usedFeatureSum=0;
  for(let ti=0;ti<settings.length;ti++){
    const trueSetting=settings[ti];
    for(let r=0;r<simulationsPerSetting;r++){
      const {posterior,used}=posteriorForRun(settings,featuresById,selectionFeatures,trueSetting,targetGames,rng);
      let best=0;for(let i=1;i<posterior.length;i++)if(posterior[i]>posterior[best])best=i;
      correct+=best===ti?1:0;distanceSum+=Math.abs(best-ti);posteriorTrueSum+=posterior[ti];entropySum+=entropy(posterior);usedFeatureSum+=used;runs++;
    }
  }
  const K=settings.length, exactAccuracy=correct/runs, randomAccuracy=1/K;
  const exactSkill=clamp((exactAccuracy-randomAccuracy)/(1-randomAccuracy));
  const normalizedInformation=K<=1?1:clamp(1-(entropySum/runs)/Math.log(K));
  const randomExpectedDistance=(K*K-1)/(3*K);
  const meanRankDistance=distanceSum/runs;
  const distanceSkill=randomExpectedDistance<=0?1:clamp(1-meanRankDistance/randomExpectedDistance);
  const raw=100*(SCORE_WEIGHTS.information*normalizedInformation+SCORE_WEIGHTS.exact*exactSkill+SCORE_WEIGHTS.distance*distanceSkill);
  return {games:targetGames,score:Math.round(raw),components:{normalizedInformation:Number(normalizedInformation.toFixed(6)),exactSettingAccuracy:Number(exactAccuracy.toFixed(6)),exactSettingSkill:Number(exactSkill.toFixed(6)),meanRankDistance:Number(meanRankDistance.toFixed(6)),rankDistanceSkill:Number(distanceSkill.toFixed(6)),meanPosteriorOnTrueSetting:Number((posteriorTrueSum/runs).toFixed(6))},simulation:{runs,simulationsPerSetting,averageUsedFeatures:Number((usedFeatureSum/runs).toFixed(3))}};
}

export function evaluateMachineDifficulty(research,selection,options={}){
  const settings=Array.isArray(research.machine?.settings)?research.machine.settings:[];
  const featuresById=new Map((research.features??[]).map(f=>[f.researchFeatureId,f]));
  const numericSelection=(selection.features??[]).filter(f=>['INCLUDE_PRIMARY','INCLUDE_SUPPORT'].includes(f.adoptionCategory));
  const analyzable=numericSelection.filter(sf=>sf.difficultyExposure&&featuresById.has(sf.researchFeatureId));
  const missing=numericSelection.filter(sf=>!sf.difficultyExposure).map(sf=>sf.featureId);
  const targets=options.targets??selection.difficultyAnalysis?.targetGames??DEFAULT_TARGETS;
  const simulationsPerSetting=options.simulationsPerSetting??selection.difficultyAnalysis?.simulationsPerSetting??DEFAULT_SIMULATIONS_PER_SETTING;
  const seed=options.seed??selection.difficultyAnalysis?.seed??20260812;
  const featureEstimates=(selection.features??[]).map(sf=>{
    const rf=featuresById.get(sf.researchFeatureId);if(!rf)return null;
    return {featureId:sf.featureId,researchFeatureId:sf.researchFeatureId,name:rf.name,adoptionCategory:sf.adoptionCategory,...pairwiseTrialEstimate(rf,settings)};
  }).filter(Boolean);
  const coverage=numericSelection.length===0?1:analyzable.length/numericSelection.length;
  const status=numericSelection.length===0?'NO_NUMERIC_FEATURES':analyzable.length===numericSelection.length?'COMPLETE':analyzable.length===0?'NOT_CONFIGURED':'PARTIAL';
  const scores=analyzable.length?targets.map(g=>analyzeTarget(settings,featuresById,analyzable,g,simulationsPerSetting,seed)):[];
  return {
    analyzerVersion:'difficulty-analyzer-v1.0',machineId:research.machine?.machineId??selection.machineId??null,machineDataVersion:selection.machineDataVersion??null,
    generatedAt:new Date().toISOString(),status,
    scoreDefinition:{range:'0-100 integer; higher is easier to discriminate numerically',evidenceIncluded:false,prior:'uniform over available settings',weights:SCORE_WEIGHTS,components:['normalized posterior information','chance-corrected exact-setting accuracy','chance-corrected ordinal rank-distance'],settingDistance:'ordinal setting order, not numeric label gap'},
    coverage:{includedNumericFeatureCount:numericSelection.length,analyzableFeatureCount:analyzable.length,ratio:Number(coverage.toFixed(6)),missingDifficultyExposureFeatureIds:missing},
    targets:scores,
    featureTrialEstimates:featureEstimates,
    disclaimer:'Difficulty scores exclude Hard Evidence. Game-based scores are generated only from features with explicit difficultyExposure; missing exposure is never inferred. Required trial counts are conservative design estimates, not guarantees of real-world classification accuracy.'
  };
}

if(import.meta.url===`file://${process.argv[1]}`){
  const researchPath=process.argv[2],selectionPath=process.argv[3],out=process.argv[4];
  if(!researchPath||!selectionPath){console.error('Usage: node tools/evaluate-machine-difficulty.mjs <research-data.json> <selection-data.json> [output.json]');process.exit(2);}
  const report=evaluateMachineDifficulty(JSON.parse(fs.readFileSync(researchPath,'utf8')),JSON.parse(fs.readFileSync(selectionPath,'utf8')));
  const text=JSON.stringify(report,null,2)+'\n';
  if(out){fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,text);console.log(`Difficulty report: ${out}`);}else process.stdout.write(text);
}
