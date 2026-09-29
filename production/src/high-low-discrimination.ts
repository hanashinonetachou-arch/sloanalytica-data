export const HIGH_LOW_BENCHMARK_GAMES=[1500,3000,7000] as const;

const probability=(v:any):number=>{
  if(typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=1)return v;
  if(typeof v==='string'&&v.startsWith('1/')){
    const d=Number(v.slice(2));
    if(Number.isFinite(d)&&d>0)return 1/d;
  }
  throw new Error('HLD_PROBABILITY_INVALID:'+String(v));
};

const logBinomial=(k:number,n:number,p:number)=>{
  if(p===0)return k===0?0:-Infinity;
  if(p===1)return k===n?0:-Infinity;
  let c=0;
  const j=Math.min(k,n-k);
  for(let i=1;i<=j;i++)c+=Math.log(n-j+i)-Math.log(i);
  return c+k*Math.log(p)+(n-k)*Math.log1p(-p);
};

const mixtureMass=(ps:number[],n:number,k:number)=>{
  let total=0;
  for(const p of ps){
    const log=logBinomial(k,n,p);
    if(Number.isFinite(log))total+=Math.exp(log);
  }
  return total/ps.length;
};

export const balancedAccuracyForBernoulliBands=(distribution:any,games:number):number=>{
  const entries=Object.entries(distribution??{}).map(([k,v])=>({setting:Number(k),p:probability(v)})).filter(x=>Number.isFinite(x.setting));
  const low=entries.filter(x=>x.setting<4).map(x=>x.p);
  const high=entries.filter(x=>x.setting>=4).map(x=>x.p);
  if(!low.length||!high.length)throw new Error('HLD_SETTING_BANDS_UNAVAILABLE');
  let accuracy=0;
  for(let k=0;k<=games;k++){
    const lo=mixtureMass(low,games,k);
    const hi=mixtureMass(high,games,k);
    accuracy+=0.5*Math.max(lo,hi);
  }
  return Math.min(1,Math.max(0.5,accuracy));
};

const exactEligible=(c:any)=>c?.runtimeInferenceAllowed===true&&c?.model==='BERNOULLI'&&c?.runtimePolicyBinding?.metric==='SELECTION_SCORE';

export function buildHighLowDiscrimination(candidate:any){
  const active=(candidate?.candidates??[]).filter((c:any)=>c?.runtimeInferenceAllowed===true);
  const eligible=active.filter(exactEligible);
  if(!eligible.length){
    return {
      status:'NOT_COMPUTED',
      reason:'基準ゲーム数へ正確に換算できる設定推測要素がないため、高低判別精度を算出していません。',
      eligibleFeatureIds:[],
      excludedFeatures:active.map((c:any)=>({findingId:c.findingId,reason:'BENCHMARK_EXPOSURE_UNRESOLVED'})),
    };
  }
  const scored=eligible.map((c:any)=>({
    feature:c,
    results:HIGH_LOW_BENCHMARK_GAMES.map(games=>({
      games,
      balancedAccuracyPercent:Number((balancedAccuracyForBernoulliBands(c.settingDistribution,games)*100).toFixed(2)),
    })),
  }));
  scored.sort((a,b)=>{
    const aa=a.results.find(x=>x.games===7000)?.balancedAccuracyPercent??0;
    const bb=b.results.find(x=>x.games===7000)?.balancedAccuracyPercent??0;
    return bb-aa||String(a.feature.findingId).localeCompare(String(b.feature.findingId));
  });
  const best=scored[0];
  const selectedFeatureId=best.feature.findingId;
  return {
    status:'COMPUTED',
    method:'BEST_SINGLE_EXACT_ACTIVE_FEATURE',
    bandDefinition:{lowSettings:'SETTING_1_TO_3',highSettings:'SETTING_4_TO_6',classPrior:'BALANCED'},
    results:best.results,
    eligibleFeatureIds:eligible.map((c:any)=>c.findingId),
    selectedFeatureId,
    selectedFeatureLabel:best.feature.label,
    excludedFeatures:active.filter((c:any)=>c.findingId!==selectedFeatureId).map((c:any)=>({
      findingId:c.findingId,
      reason:exactEligible(c)?'CONSERVATIVE_SINGLE_FEATURE_NO_INDEPENDENCE_ASSUMPTION':'BENCHMARK_EXPOSURE_UNRESOLVED',
    })),
    note:'7000Gへ正確に換算できるACTIVE要素だけを候補とし、要素間の独立性を仮定せず、単独で最も高い判別精度を持つ要素から保守的に算出しています。条件付き要素はこの指標には含めませんが、実戦中に実際の観測回数が入力された場合は設定推測に使用します。',
  };
}
