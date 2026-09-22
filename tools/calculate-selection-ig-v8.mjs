import fs from 'node:fs';
const SETTINGS=['SET_1','SET_2','SET_3','SET_4','SET_5','SET_6'];
const log2=x=>Math.log(x)/Math.LN2;
const logChoose=(n,k)=>{let s=0;for(let i=1;i<=k;i++)s+=Math.log((n-k+i)/i);return s;};
const binomLogP=(n,k,p)=>logChoose(n,k)+k*Math.log(p)+(n-k)*Math.log1p(-p);
function posteriorEntropyFromBinomial(n,probs){
 let h=0;
 for(let k=0;k<=n;k++){
  const logs=probs.map(p=>binomLogP(n,k,p)-Math.log(6)); const m=Math.max(...logs);
  const ws=logs.map(x=>Math.exp(x-m)); const z=ws.reduce((a,b)=>a+b,0); const post=ws.map(x=>x/z);
  const logPred=m+Math.log(z); const pred=Math.exp(logPred);
  const hp=-post.reduce((a,p)=>p>0?a+p*log2(p):a,0); h+=pred*hp;
 }
 return h;
}
function multinomialCounts(n,k,prefix=[],out=[]){if(k===1){out.push([...prefix,n]);return out;}for(let x=0;x<=n;x++)multinomialCounts(n-x,k-1,[...prefix,x],out);return out;}
function multinomialLogP(counts,ps){const n=counts.reduce((a,b)=>a+b,0);let l=0,rem=n;for(let i=0;i<counts.length-1;i++){const x=counts[i];l+=logChoose(rem,x);rem-=x;}for(let i=0;i<counts.length;i++)if(counts[i])l+=counts[i]*Math.log(ps[i]);return l;}
export function informationGain7000Binomial(probs,n=7000){return log2(6)-posteriorEntropyFromBinomial(n,probs);}
export function informationGain7000Multinomial(distributions,n=7000){
 // Exact count-space enumeration is infeasible at 7000. Deterministically sum over settings' expected count vectors.
 // This is intentionally not a valid final estimator; callers must not use it for selection scores.
 throw new Error('V8_MULTINOMIAL_IG_EXACT_METHOD_REQUIRED');
}
export function researchProbabilities(feature){return SETTINGS.map(s=>feature.settingValues?.[s]?.probability);}
if(import.meta.url===new URL('file://'+process.argv[1]).href){
 const [researchPath,featureId]=process.argv.slice(2); const r=JSON.parse(fs.readFileSync(researchPath,'utf8')); const f=(r.numericCandidates??[]).find(x=>x.researchFeatureId===featureId); if(!f)throw new Error('FEATURE_NOT_FOUND'); const ps=researchProbabilities(f); if(ps.some(x=>!Number.isFinite(x)))throw new Error('INCOMPLETE_SETTING_PROBABILITIES'); const ig=informationGain7000Binomial(ps); console.log(JSON.stringify({featureId,ig7000Bits:ig,selectionScore:ig*200},null,2));
}
