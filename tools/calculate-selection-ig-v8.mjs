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
export function informationGain7000Binomial(probs,n=7000){return log2(6)-posteriorEntropyFromBinomial(n,probs);}
function logMultinomialPAtCounts(counts,ps){
 const n=counts.reduce((a,b)=>a+b,0); let l=lgamma(n+1); for(const x of counts)l-=lgamma(x+1); for(let i=0;i<counts.length;i++)if(counts[i])l+=counts[i]*Math.log(ps[i]); return l;
}
function lgamma(z){const c=[0.9999999999998099,676.5203681218851,-1259.1392167224028,771.3234287776531,-176.6150291621406,12.507343278686905,-0.13857109526572012,9.984369578019572e-6,1.5056327351493116e-7];if(z<0.5)return Math.log(Math.PI)-Math.log(Math.sin(Math.PI*z))-lgamma(1-z);z-=1;let x=c[0];for(let i=1;i<c.length;i++)x+=c[i]/(z+i);const t=z+7.5;return .5*Math.log(2*Math.PI)+(z+.5)*Math.log(t)-t+Math.log(x);}
function entropy(post){return -post.reduce((a,p)=>p>0?a+p*log2(p):a,0);}
function halton(index,base){let f=1,r=0;while(index>0){f/=base;r+=f*(index%base);index=Math.floor(index/base);}return r;}
function normalQuantile(p){const a=[-39.6968302866538,220.946098424521,-275.928510446969,138.357751867269,-30.6647980661472,2.50662827745924],b=[-54.4760987982241,161.585836858041,-155.698979859887,66.8013118877197,-13.2806815528857],c=[-.00778489400243029,-.322396458041136,-2.40075827716184,-2.54973253934373,4.37466414146497,2.93816398269878],d=[.00778469570904146,.32246712907004,2.445134137143,3.75440866190742],lo=.02425,hi=1-lo;if(p<lo){const q=Math.sqrt(-2*Math.log(p));return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);}if(p>hi)return-normalQuantile(1-p);const q=p-.5,r=q*q;return (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q/(((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1);}
export function informationGain7000Multinomial(distributions,n=7000,samples=32768){
 // Deterministic quasi-Monte-Carlo over the multinomial CLT. No RNG: Halton points are fixed.
 // Counts are generated from each setting distribution by a sequential-binomial normal approximation,
 // then evaluated with exact multinomial log likelihoods. Suitable for large n; caller records method.
 const bases=[2,3,5,7]; let conditionalEntropy=0;
 for(let s=0;s<distributions.length;s++){
  const ps=distributions[s]; let hs=0;
  for(let q=1;q<=samples;q++){
   let remaining=n, mass=1, counts=[];
   for(let j=0;j<ps.length-1;j++){const cp=ps[j]/mass,mean=remaining*cp,sd=Math.sqrt(remaining*cp*(1-cp));let x=Math.round(mean+sd*normalQuantile(Math.min(1-1e-12,Math.max(1e-12,halton(q,bases[j])))));x=Math.max(0,Math.min(remaining,x));counts.push(x);remaining-=x;mass-=ps[j];}counts.push(remaining);
   const logs=distributions.map(p=>logMultinomialPAtCounts(counts,p)-Math.log(distributions.length)),m=Math.max(...logs),ws=logs.map(x=>Math.exp(x-m)),z=ws.reduce((a,b)=>a+b,0);hs+=entropy(ws.map(x=>x/z));
  } conditionalEntropy+=hs/samples/distributions.length;
 }
 return log2(distributions.length)-conditionalEntropy;
}
export function researchProbabilities(feature){return SETTINGS.map(s=>feature.settingValues?.[s]?.probability);}
if(import.meta.url===new URL('file://'+process.argv[1]).href){
 const [researchPath,featureId]=process.argv.slice(2); const r=JSON.parse(fs.readFileSync(researchPath,'utf8')); const f=(r.numericCandidates??[]).find(x=>x.researchFeatureId===featureId); if(!f)throw new Error('FEATURE_NOT_FOUND'); const ps=researchProbabilities(f); if(ps.some(x=>!Number.isFinite(x)))throw new Error('INCOMPLETE_SETTING_PROBABILITIES'); const ig=informationGain7000Binomial(ps); console.log(JSON.stringify({featureId,ig7000Bits:ig,selectionScore:ig*200},null,2));
}
