export const EVALUATION_VALIDATOR_CONTRACT='evaluation-v2';
const canonical=(v:any):string=>Array.isArray(v)?`[${v.map(canonical).join(',')}]`:v&&typeof v==='object'?`{${Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')}}`:JSON.stringify(v);
const fail=(m:string):never=>{throw new Error('EVALUATION_VALIDATION_FAILED:'+m)};
const nonEmpty=(x:any)=>typeof x==='string'&&x.trim().length>0;
function probability(v:any){if(typeof v==='number'&&v>=0&&v<=1)return v;if(typeof v==='string'&&v.startsWith('1/')){const d=Number(v.slice(2));if(Number.isFinite(d)&&d>0)return 1/d;}fail('INVALID_PROBABILITY:'+String(v))}
function h2(p:number){if(p===0||p===1)return 0;return -p*Math.log2(p)-(1-p)*Math.log2(1-p)}
function perTrialIg(ps:number[]){const mean=ps.reduce((a,b)=>a+b,0)/ps.length;return h2(mean)-ps.reduce((a,p)=>a+h2(p),0)/ps.length}
function entropy(ps:number[]){return -ps.reduce((a,p)=>a+(p>0?p*Math.log2(p):0),0)}
function categorical(v:any,residualPolicy:string){if(typeof v!=='string')fail('INVALID_CATEGORY_DISTRIBUTION:'+String(v));const xs=[...v.matchAll(/(\d+(?:\.\d+)?)%/g)].map(m=>Number(m[1])/100);if(!xs.length)fail('INVALID_CATEGORY_DISTRIBUTION:'+v);const sum=xs.reduce((a,b)=>a+b,0);if(residualPolicy==='SOURCE_EXHAUSTIVE'&&Math.abs(sum-1)<=0.005)return xs.map(x=>x/sum);if(sum>1.000000001)fail('INVALID_CATEGORY_SUM:'+v);if(sum<0.999999999){if(residualPolicy!=='SOURCE_EXPLICIT_OTHER')fail('UNSUPPORTED_RESIDUAL:'+v);return [...xs,1-sum]}return xs}
function categoricalIg(vs:any[],residualPolicy:string){const rows=vs.map(v=>categorical(v,residualPolicy)),k=rows[0].length;if(rows.some(r=>r.length!==k))fail('CATEGORY_SHAPE_MISMATCH');const mean=Array.from({length:k},(_,i)=>rows.reduce((a,r)=>a+r[i],0)/rows.length);return entropy(mean)-rows.reduce((a,r)=>a+entropy(r),0)/rows.length}
function logBinomial(k:number,n:number,p:number){if(p===0)return k===0?0:-Infinity;if(p===1)return k===n?0:-Infinity;let c=0;const j=Math.min(k,n-k);for(let i=1;i<=j;i++)c+=Math.log(n-j+i)-Math.log(i);return c+k*Math.log(p)+(n-k)*Math.log1p(-p)}
function binomialIg(ps:number[],n:number){let total=0;for(let k=0;k<=n;k++){const logs=ps.map(p=>logBinomial(k,n,p));const mx=Math.max(...logs);if(!Number.isFinite(mx))continue;const rel=logs.map(x=>Number.isFinite(x)?Math.exp(x-mx):0);const avg=rel.reduce((a,b)=>a+b,0)/rel.length;const scale=Math.exp(mx);if(scale===0)continue;for(const v of rel)if(v>0)total+=(scale*v/rel.length)*Math.log2(v/avg)}return total}
function near(a:any,b:number,tol=1e-8){return typeof a==='number'&&Number.isFinite(a)&&Math.abs(a-b)<=tol*Math.max(1,Math.abs(a),Math.abs(b))}
const liveStatuses=new Set(['DIRECT_EXACT','EXACT_WITH_SCOPE_TRACKING','EXHAUSTIVE_CATEGORICAL','RETROSPECTIVE_EXACT','UNRESOLVED']);
const depStatuses=new Set(['NONE','DEFERRED_TO_CANDIDATE_CONTRACT','UNRESOLVED']);
const exactBenchmarkTrialUniverses=new Set(['TOTAL_GAME_TRIAL','NORMAL_GAME_TRIAL','BONUS_ELIGIBLE_GAME_TRIAL']);
const selectionClass=(score:number)=>score>=20?'CORE':score>=10?'SUPPORT':score>=5?'JOINT_ELIGIBLE':'EXCLUDE';
export function validateEvaluationDocument(doc:any,research:any){
 if(doc?.schemaVersion!=='evaluation-v2'||doc?.manifestVersion!=='8.5')fail('HEADER');
 if(doc.batchId!==research.batchId||doc.machineId!==research.machineId)fail('IDENTITY');
 if(!Array.isArray(doc.evaluations)||!Array.isArray(doc.blockedItems)||!Array.isArray(doc.evidenceCandidates))fail('ARRAYS');
 const candidates=(research.findings??[]).filter((x:any)=>x.settingDistribution);
 if(doc.evaluations.length!==candidates.length)fail('CANDIDATE_COVERAGE');
 const byId=new Map(doc.evaluations.map((x:any)=>[x.findingId,x]));
 let complete=0,unavailable=0,reference=0;
 for(const f of candidates){
  const e:any=byId.get(f.findingId);if(!e)fail('MISSING:'+f.findingId);
  if(e.label!==f.label||e.observationType!==f.observationType||canonical(e.sourceIds)!==canonical(f.sourceIds??[])||canonical(e.settingDistribution)!==canonical(f.settingDistribution))fail('SOURCE_COPY:'+f.findingId);
  if(!nonEmpty(e.trialUniverse)||!e.liveObservation||!liveStatuses.has(e.liveObservation.status)||!nonEmpty(e.liveObservation.reason)||!e.dependency||!depStatuses.has(e.dependency.status)||!nonEmpty(e.dependency.reason))fail('SEMANTIC_CONTRACT:'+f.findingId);
  if(e.dependency.status==='DEFERRED_TO_CANDIDATE_CONTRACT'&&!nonEmpty(e.dependency.groupId))fail('DEPENDENCY_GROUP:'+f.findingId);
  if(f.observationType==='partial_distribution'){
   if(e.model!=='UNAVAILABLE'||e.evaluationCompleteness!=='INCOMPLETE_SETTING_DISTRIBUTION'||e.metrics?.igPerEligibleTrial!==null||e.metrics?.perEligibleTrialPower!==null||e.benchmarkExposure?.status!=='BLOCKED_UNRESOLVED')fail('PARTIAL:'+f.findingId);unavailable++;continue;
  }
  if(f.observationType==='reference_distribution'){
   if(e.model!=='REFERENCE_ONLY'||e.evaluationCompleteness!=='REFERENCE_ONLY'||e.metrics?.igPerEligibleTrial!==null||e.metrics?.perEligibleTrialPower!==null||e.benchmarkExposure?.status!=='NOT_APPLICABLE')fail('REFERENCE:'+f.findingId);reference++;continue;
  }
  const keys=Object.keys(f.settingDistribution);if(keys.length<2)fail('INSUFFICIENT_SETTINGS:'+f.findingId);
  let ig:number;
  if(f.observationType==='probability'||f.observationType==='conditional_probability'||(f.observationType==='appearance_distribution'&&keys.every(k=>typeof f.settingDistribution[k]==='number'))){
   const ps=keys.map(k=>probability(f.settingDistribution[k]));if(e.model!=='BERNOULLI')fail('MODEL:'+f.findingId);ig=perTrialIg(ps);
   if(f.observationType==='probability'){
    const score=binomialIg(ps,7000)*200;
    if(exactBenchmarkTrialUniverses.has(e.trialUniverse)){
     if(e.benchmarkExposure?.status!=='EXACT'||e.benchmarkExposure.trials!==7000||e.metrics?.selectionScore?.status!=='COMPUTED'||!near(e.metrics.selectionScore.value,score)||e.selectionClass!==selectionClass(score))fail('PROBABILITY_EXACT_BENCHMARK:'+f.findingId);
    }else{
     if(e.benchmarkExposure?.status!=='UPPER_BOUND_ONLY'||e.benchmarkExposure.maximumTrials!==7000||!near(e.metrics?.maximumSelectionScore,score)||e.metrics?.selectionScore?.status!=='BLOCKED_UNRESOLVED'||e.metrics?.selectionScore?.value!==null)fail('PROBABILITY_BENCHMARK:'+f.findingId);
    }
   }else if(e.benchmarkExposure?.status!=='BLOCKED_UNRESOLVED')fail('CONDITIONAL_BENCHMARK:'+f.findingId);
  }else if(f.observationType==='appearance_distribution'){
   if(e.model!=='CATEGORICAL')fail('MODEL:'+f.findingId);ig=categoricalIg(keys.map(k=>f.settingDistribution[k]),e.categoryModel?.residualPolicy);
   if(e.benchmarkExposure?.status!=='BLOCKED_UNRESOLVED')fail('APPEARANCE_BENCHMARK:'+f.findingId);
  }else fail('UNSUPPORTED:'+f.findingId);
  if(!near(e.metrics?.igPerEligibleTrial,ig)||!near(e.metrics?.perEligibleTrialPower,ig*200))fail('PER_TRIAL_METRIC:'+f.findingId);
  const exactSelection=f.observationType==='probability'&&exactBenchmarkTrialUniverses.has(e.trialUniverse);
  if(!exactSelection&&(e.metrics?.selectionScore?.status!=='BLOCKED_UNRESOLVED'||e.metrics?.selectionScore?.value!==null))fail('FORMAL_SELECTION_SCORE_FORBIDDEN:'+f.findingId);
  if(exactSelection?e.evaluationCompleteness!=='COMPLETE':e.evaluationCompleteness!=='COMPLETE_LIKELIHOOD_BENCHMARK_UNRESOLVED')fail('COMPLETENESS:'+f.findingId);
  complete++;
 }
 if(canonical(doc.blockedItems)!==canonical(research.blockedItems??[]))fail('BLOCKED_ITEMS_CHANGED');
 const evidence=(research.findings??[]).filter((x:any)=>x.observationType==='evidence').map((x:any)=>({findingId:x.findingId,label:x.label,sourceIds:x.sourceIds??[],details:Array.isArray(x.details)?structuredClone(x.details):[],semanticType:x.semanticType,semanticCategories:Array.isArray(x.semanticCategories)?structuredClone(x.semanticCategories):[],...(x.settingDistribution?{settingDistribution:structuredClone(x.settingDistribution)}:{})}));
 if(canonical(doc.evidenceCandidates)!==canonical(evidence))fail('EVIDENCE_CHANGED');
 return [{validator:EVALUATION_VALIDATOR_CONTRACT,candidates:candidates.length,complete,unavailable,reference,evidenceCandidates:evidence.length,blockedItems:(research.blockedItems??[]).length}];
}
export function validateEvaluationArtifacts(s:any,a:any,r:any){const out=r.producedArtifacts??[];if(out.length!==1)fail('OUTPUT_COUNT');const ref=out[0];if(ref.kind!=='evaluation'||typeof ref.path!=='string'||!ref.path.startsWith(`production/batches/${a.batchId}/artifacts/${a.machineId}/evaluation/`))fail('OUTPUT_REF');const prefix='production/';const doc=s.read(...ref.path.slice(prefix.length).split('/'));const research=s.read('batches',a.batchId,'artifacts',a.machineId,'research','result.json');return validateEvaluationDocument(doc,research)}
