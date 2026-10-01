function probability(v:any){if(typeof v==='number'&&v>=0&&v<=1)return v;if(typeof v==='string'&&v.startsWith('1/')){const d=Number(v.slice(2));if(Number.isFinite(d)&&d>0)return 1/d}throw new Error('EVAL_PROB:'+v)}
function h2(p:number){if(p===0||p===1)return 0;return -p*Math.log2(p)-(1-p)*Math.log2(1-p)}
function perTrialIg(ps:number[]){const m=ps.reduce((a,b)=>a+b,0)/ps.length;return h2(m)-ps.reduce((a,p)=>a+h2(p),0)/ps.length}
function entropy(ps:number[]){return -ps.reduce((a,p)=>a+(p>0?p*Math.log2(p):0),0)}
function categorical(v:any,residualPolicy:string){if(typeof v!=='string')throw new Error('EVAL_CATEGORY:'+v);const xs=[...v.matchAll(/(\d+(?:\.\d+)?)%/g)].map(m=>Number(m[1])/100);if(!xs.length)throw new Error('EVAL_CATEGORY:'+v);const sum=xs.reduce((a,b)=>a+b,0);if(residualPolicy==='SOURCE_EXHAUSTIVE'&&Math.abs(sum-1)<=0.005)return xs.map(x=>x/sum);if(sum>1.000000001)throw new Error('EVAL_CATEGORY_SUM:'+v);if(sum<0.999999999){if(residualPolicy!=='SOURCE_EXPLICIT_OTHER')throw new Error('EVAL_CATEGORY_RESIDUAL:'+v);return [...xs,1-sum]}return xs}
function categoricalIg(vs:any[],residualPolicy:string){const rows=vs.map(v=>categorical(v,residualPolicy)),k=rows[0].length;if(rows.some(r=>r.length!==k))throw new Error('EVAL_CATEGORY_SHAPE');const mean=Array.from({length:k},(_,i)=>rows.reduce((a,r)=>a+r[i],0)/rows.length);return entropy(mean)-rows.reduce((a,r)=>a+entropy(r),0)/rows.length}
function logBinomial(k:number,n:number,p:number){if(p===0)return k===0?0:-Infinity;if(p===1)return k===n?0:-Infinity;let c=0,j=Math.min(k,n-k);for(let i=1;i<=j;i++)c+=Math.log(n-j+i)-Math.log(i);return c+k*Math.log(p)+(n-k)*Math.log1p(-p)}
function binomialIg(ps:number[],n:number){let total=0;for(let k=0;k<=n;k++){const logs=ps.map(p=>logBinomial(k,n,p)),mx=Math.max(...logs);if(!Number.isFinite(mx))continue;const rel=logs.map(x=>Number.isFinite(x)?Math.exp(x-mx):0),avg=rel.reduce((a,b)=>a+b,0)/rel.length,scale=Math.exp(mx);if(!scale)continue;for(const v of rel)if(v>0)total+=(scale*v/rel.length)*Math.log2(v/avg)}return total}
const cls=(s:number)=>s>=20?'CORE':s>=10?'SUPPORT':s>=5?'JOINT_ELIGIBLE':'EXCLUDE';
const exactBenchmark=new Set(['NORMAL_GAME_TRIAL','BONUS_ELIGIBLE_GAME_TRIAL']);
const liveStatus=(f:any)=>f.liveObservation?.status??(f.trialUniverse==='LOTIS_NON_CHAIN_GAME_TRIAL'||f.trialUniverse==='NON_CHAIN_BONUS_INITIAL_GAME_TRIAL'?'RETROSPECTIVE_EXACT':'DIRECT_EXACT');
const liveReason=(f:any)=>f.liveObservation?.reason??(f.denominatorSemantics?String(f.denominatorSemantics):'対象となる試行数と観測回数を実戦で記録できる。');
const dependency=(f:any)=>{const id=f.dependencyGroupId??f.dependencyGroup;return id?{status:'DEFERRED_TO_CANDIDATE_CONTRACT',groupId:String(id),reason:f.dependencyReason??'同一exposureを共有する候補との二重評価を避けるためCandidate Contractで解決する。'}:{status:'NONE',reason:'source上で独立した観測要素として扱う。'}};
export function buildEvaluation(research:any){
 const evaluations=(research.findings??[]).filter((f:any)=>f.settingDistribution).map((f:any)=>{
  const keys=Object.keys(f.settingDistribution),trialUniverse=f.trialUniverse??'NORMAL_GAME_TRIAL',base:any={findingId:f.findingId,label:f.label,observationType:f.observationType,settingDistribution:f.settingDistribution,sourceIds:f.sourceIds??[],trialUniverse,liveObservation:{status:liveStatus(f),reason:liveReason(f)},dependency:dependency(f)};
  if(f.observationType==='reference_distribution')return {...base,model:'REFERENCE_ONLY',metrics:{igPerEligibleTrial:null,perEligibleTrialPower:null,selectionScore:{status:'NOT_APPLICABLE',value:null}},benchmarkExposure:{status:'NOT_APPLICABLE'},selectionClass:'EXCLUDE',evaluationCompleteness:'REFERENCE_ONLY'};
  if(f.observationType==='partial_distribution')return {...base,model:'UNAVAILABLE',metrics:{igPerEligibleTrial:null,perEligibleTrialPower:null,selectionScore:{status:'BLOCKED_UNRESOLVED',value:null}},benchmarkExposure:{status:'BLOCKED_UNRESOLVED'},selectionClass:'EXCLUDE',evaluationCompleteness:'INCOMPLETE_SETTING_DISTRIBUTION'};
  if(keys.length<2)throw new Error('EVALUATION_SETTINGS:'+f.findingId);
  let model:string,ig:number,categoryModel:any=undefined;
  if(f.observationType==='probability'||f.observationType==='conditional_probability'||(f.observationType==='appearance_distribution'&&keys.every(k=>typeof f.settingDistribution[k]==='number'))){model='BERNOULLI';ig=perTrialIg(keys.map(k=>probability(f.settingDistribution[k])));}
  else if(f.observationType==='appearance_distribution'){model='CATEGORICAL';categoryModel={residualPolicy:f.categoryModel?.residualPolicy??'SOURCE_EXPLICIT_OTHER'};ig=categoricalIg(keys.map(k=>f.settingDistribution[k]),categoryModel.residualPolicy);}
  else throw new Error('EVALUATION_BUILDER_UNSUPPORTED:'+f.findingId);
  const metrics:any={igPerEligibleTrial:ig,perEligibleTrialPower:ig*200,selectionScore:{status:'BLOCKED_UNRESOLVED',value:null}};
  let benchmarkExposure:any={status:'BLOCKED_UNRESOLVED'},selectionClass='EXCLUDE',evaluationCompleteness='COMPLETE_LIKELIHOOD_BENCHMARK_UNRESOLVED';
  if(f.observationType==='probability'){
    const score=binomialIg(keys.map(k=>probability(f.settingDistribution[k])),7000)*200;
    if(exactBenchmark.has(trialUniverse)){metrics.selectionScore={status:'COMPUTED',value:score};benchmarkExposure={status:'EXACT',trials:7000};selectionClass=cls(score);evaluationCompleteness='COMPLETE';}
    else{metrics.maximumSelectionScore=score;benchmarkExposure={status:'UPPER_BOUND_ONLY',maximumTrials:7000};}
  }
  return {...base,model,metrics,benchmarkExposure,selectionClass,evaluationCompleteness,...(categoryModel?{categoryModel}:{})};
 });
 const evidenceCandidates=(research.findings??[]).filter((f:any)=>f.observationType==='evidence').map((f:any)=>({findingId:f.findingId,label:f.label,sourceIds:f.sourceIds??[],details:Array.isArray(f.details)?f.details:[]}));
 return {schemaVersion:'evaluation-v2',manifestVersion:'8.5',batchId:research.batchId,machineId:research.machineId,machineName:research.machineName,evaluations,blockedItems:research.blockedItems??[],evidenceCandidates};
}
