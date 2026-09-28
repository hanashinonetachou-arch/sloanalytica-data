export const EVALUATION_VALIDATOR_CONTRACT='evaluation-v1';
const canonical=(v:any):string=>Array.isArray(v)?`[${v.map(canonical).join(',')}]`:v&&typeof v==='object'?`{${Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')}}`:JSON.stringify(v);
const fail=(m:string):never=>{throw new Error('EVALUATION_VALIDATION_FAILED:'+m)};
function probability(v:any){if(typeof v==='number'&&v>=0&&v<=1)return v;if(typeof v==='string'&&v.startsWith('1/')){const d=Number(v.slice(2));if(Number.isFinite(d)&&d>0)return 1/d;}fail('INVALID_PROBABILITY:'+String(v))}
function h2(p:number){if(p===0||p===1)return 0;return -p*Math.log2(p)-(1-p)*Math.log2(1-p)}
function perTrialIg(ps:number[]){const mean=ps.reduce((a,b)=>a+b,0)/ps.length;return h2(mean)-ps.reduce((a,p)=>a+h2(p),0)/ps.length}
function logBinomial(k:number,n:number,p:number){if(p===0)return k===0?0:-Infinity;if(p===1)return k===n?0:-Infinity;let c=0;const j=Math.min(k,n-k);for(let i=1;i<=j;i++)c+=Math.log(n-j+i)-Math.log(i);return c+k*Math.log(p)+(n-k)*Math.log1p(-p)}
function binomialIg(ps:number[],n:number){let total=0;for(let k=0;k<=n;k++){const logs=ps.map(p=>logBinomial(k,n,p));const mx=Math.max(...logs);if(!Number.isFinite(mx))continue;const rel=logs.map(x=>Number.isFinite(x)?Math.exp(x-mx):0);const avg=rel.reduce((a,b)=>a+b,0)/rel.length;const scale=Math.exp(mx);if(scale===0)continue;for(const v of rel)if(v>0)total+=(scale*v/rel.length)*Math.log2(v/avg)}return total}
function near(a:number,b:number,tol=1e-8){return Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=tol*Math.max(1,Math.abs(a),Math.abs(b))}
const selectionClass=(v:number)=>v>=20?'CORE':v>=10?'SUPPORT':v>=5?'JOINT_ELIGIBLE':'EXCLUDE';
export function validateEvaluationDocument(doc:any,research:any){
 if(doc?.schemaVersion!=='evaluation-v1'||doc?.manifestVersion!=='8.5')fail('HEADER');
 if(doc.batchId!==research.batchId||doc.machineId!==research.machineId)fail('IDENTITY');
 if(!Array.isArray(doc.evaluations)||!Array.isArray(doc.blockedItems)||!Array.isArray(doc.evidenceCandidates))fail('ARRAYS');
 const candidates=(research.findings??[]).filter((x:any)=>x.settingDistribution);
 if(doc.evaluations.length!==candidates.length)fail('CANDIDATE_COVERAGE');
 const byId=new Map(doc.evaluations.map((x:any)=>[x.findingId,x]));
 let scored=0,unscored=0;
 for(const f of candidates){
  const e:any=byId.get(f.findingId);if(!e)fail('MISSING:'+f.findingId);
  if(canonical(e.settingDistribution)!==canonical(f.settingDistribution))fail('DISTRIBUTION_CHANGED:'+f.findingId);
  const keys=Object.keys(f.settingDistribution);
  if(f.observationType==='partial_distribution'){
   if(e.metric!=='UNSCORABLE'||e.value!==null||e.rawInformationGainBits!==null||typeof e.reason!=='string'||e.reason.length===0)fail('PARTIAL_DISTRIBUTION:'+f.findingId);
   unscored++;continue;
  }
  if(f.observationType==='reference_distribution'){
   if(e.metric!=='REFERENCE_ONLY'||e.value!==null||e.rawInformationGainBits!==null||typeof e.reason!=='string'||e.reason.length===0)fail('REFERENCE_DISTRIBUTION:'+f.findingId);
   unscored++;continue;
  }
  if(keys.length<2)fail('INSUFFICIENT_SETTINGS:'+f.findingId);
  const ps=keys.map(k=>probability(f.settingDistribution[k]));let ig:number,metric:string;
  if(f.observationType==='probability'){metric='SELECTION_SCORE';if(e.benchmarkGames!==7000)fail('BENCHMARK:'+f.findingId);ig=binomialIg(ps,7000)}
  else if(f.observationType==='conditional_probability'||f.observationType==='appearance_distribution'){metric='PER_ELIGIBLE_TRIAL_POWER';ig=perTrialIg(ps)}
  else fail('UNSUPPORTED_OBSERVATION:'+f.findingId);
  if(e.metric!==metric)fail('METRIC:'+f.findingId);
  if(!near(e.rawInformationGainBits,ig)||!near(e.value,ig*200))fail('SCORE:'+f.findingId);
  if(metric==='SELECTION_SCORE'&&e.selectionClass!==selectionClass(e.value))fail('SELECTION_CLASS:'+f.findingId);
  scored++;
 }
 if(canonical(doc.blockedItems)!==canonical(research.blockedItems??[]))fail('BLOCKED_ITEMS_CHANGED');
 const evidence=(research.findings??[]).filter((x:any)=>x.observationType==='evidence').map((x:any)=>({findingId:x.findingId,label:x.label,sourceIds:x.sourceIds??[]}));
 if(canonical(doc.evidenceCandidates)!==canonical(evidence))fail('EVIDENCE_CHANGED');
 return [{validator:EVALUATION_VALIDATOR_CONTRACT,candidates:candidates.length,scored,unscored,blockedItems:(research.blockedItems??[]).length,evidenceCandidates:evidence.length}];
}
export function validateEvaluationArtifacts(s:any,a:any,r:any){const out=r.producedArtifacts??[];if(out.length!==1)fail('OUTPUT_COUNT');const ref=out[0];if(ref.kind!=='evaluation'||typeof ref.path!=='string'||!ref.path.startsWith(`production/batches/${a.batchId}/artifacts/${a.machineId}/evaluation/`))fail('OUTPUT_REF');const prefix='production/';if(!ref.path.startsWith(prefix))fail('OUTPUT_PATH');const doc=s.read(...ref.path.slice(prefix.length).split('/'));const research=s.read('batches',a.batchId,'artifacts',a.machineId,'research','result.json');return validateEvaluationDocument(doc,research)}
