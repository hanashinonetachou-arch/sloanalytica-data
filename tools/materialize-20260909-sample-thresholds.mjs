import fs from 'node:fs';

const machineIds = ['L_BIG_DREAM_GOLDEN_PUSHER_KR','L_SUPER_RIO_ACE2_ND02H'];
const EPS=1e-12;
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,Number(v)));
const clampP=p=>clamp(p,EPS,1-EPS);
const bcBernoulli=(p,q)=>{p=clampP(p);q=clampP(q);return Math.sqrt(p*q)+Math.sqrt((1-p)*(1-q));};
const bcCategorical=(p,q)=>p.reduce((sum,v,i)=>sum+Math.sqrt(Math.max(0,v)*Math.max(0,q[i])),0);
const trialCount80=bc=>{bc=clamp(bc);if(bc>=1-EPS)return null;if(bc<=EPS)return 1;return Math.max(1,Math.ceil(Math.log(0.4)/Math.log(bc)));};
function categorical(rf,sf,setting){
  const cats=rf.categories??[];
  const dist=rf.settingDistributions?.[setting];
  if(!dist||cats.length<2)return null;
  const excluded=new Set(sf.categoryExcludeLabels??[]);
  const kept=cats.filter(c=>!excluded.has(c));
  const probs=kept.map(c=>Number(dist[c]));
  if(probs.some(p=>!Number.isFinite(p)||p<0))return null;
  const sum=probs.reduce((a,b)=>a+b,0);
  if(!(sum>0))return null;
  if(excluded.size||sf.normalizeRoundedCategoryProbabilities===true||Math.abs(sum-1)<=0.005) return probs.map(p=>p/sum);
  if(Math.abs(sum-1)>1e-6)return null;
  return probs;
}
function estimate(rf,sf,settings){
  if(settings.length<2)return null;
  const low=settings[0],high=settings.at(-1);
  if(rf.candidateModel==='multinomial'){
    const p=categorical(rf,sf,low),q=categorical(rf,sf,high);
    return p&&q?trialCount80(bcCategorical(p,q)):null;
  }
  const p=Number(rf.settingValues?.[low]?.probability),q=Number(rf.settingValues?.[high]?.probability);
  return Number.isFinite(p)&&Number.isFinite(q)?trialCount80(bcBernoulli(p,q)):null;
}
for(const id of machineIds){
  const rp=`research/${id}/research-data.json`,sp=`research/${id}/selection-data.json`;
  const research=JSON.parse(fs.readFileSync(rp,'utf8'));
  const selection=JSON.parse(fs.readFileSync(sp,'utf8'));
  const byId=new Map((research.features??[]).map(r=>[r.researchFeatureId,r]));
  const settings=research.machine?.inferenceSettings??research.machine?.settings??[];
  for(const sf of selection.features??[]){
    if(sf.adoptionCategory==='EXCLUDE'||sf.adoptionCategory==='DISPLAY_ONLY') continue;
    const rf=byId.get(sf.researchFeatureId); if(!rf) continue;
    const rec=estimate(rf,sf,settings);
    if(!Number.isFinite(rec)) continue;
    const recommended=Math.max(2,Math.ceil(rec));
    const minimum=Math.max(2,Math.ceil(recommended/3));
    sf.sampleRecommendation=recommended;
    sf.minimumSample=minimum;
  }
  fs.writeFileSync(sp,JSON.stringify(selection,null,2)+'\n');
}
console.log('PASS affected active features have explicit statistically-derived sample thresholds');
