import fs from "node:fs";
import path from "node:path";

const EPS=1e-12;
function clampP(p){ return Math.min(1-EPS, Math.max(EPS,p)); }
function bcBernoulli(p,q){ p=clampP(p); q=clampP(q); return Math.sqrt(p*q)+Math.sqrt((1-p)*(1-q)); }
function bcCategorical(p,q){ return p.reduce((sum,v,i)=>sum+Math.sqrt(Math.max(0,v)*Math.max(0,q[i])),0); }
function bcPoisson(lambda1,lambda2){ return Math.exp(-0.5*(Math.sqrt(Math.max(0,lambda1))-Math.sqrt(Math.max(0,lambda2)))**2); }
function trialsForBayesAccuracy80FromBC(bc){
  bc=Math.min(1,Math.max(0,bc));
  if(bc>=1-EPS) return null;
  if(bc<=EPS) return 1;
  return Math.max(1,Math.ceil(Math.log(0.4)/Math.log(bc)));
}
function klBernoulli(p,q){ p=clampP(p); q=clampP(q); return p*Math.log(p/q)+(1-p)*Math.log((1-p)/(1-q)); }
function jsBernoulli(p,q){ const m=(p+q)/2; return 0.5*klBernoulli(p,m)+0.5*klBernoulli(q,m); }
function normalApproxTrials(p,q,z=1.96){
  const d=Math.abs(p-q); if(!Number.isFinite(d)||d<=0) return null;
  return Math.ceil((z*z*(p*(1-p)+q*(1-q)))/(d*d));
}
function settingEntries(feature, settingOrder=[]){
  const obj=feature.settingValues ?? {};
  const keys=settingOrder.length ? settingOrder.filter(s=>s in obj) : Object.keys(obj);
  return keys.map(setting=>[setting,Number(obj[setting]?.probability)]).filter(([,p])=>Number.isFinite(p)&&p>=0&&p<=1);
}
function categoricalDistribution(feature, setting){
  const categories=Array.isArray(feature.categories)?feature.categories:[];
  const raw=feature.settingDistributions?.[setting];
  if(categories.length<2 || !raw || typeof raw!=="object") return null;
  const values=categories.map(c=>Number(raw[c]));
  if(values.some(p=>!Number.isFinite(p)||p<0||p>1)) return null;
  const sum=values.reduce((a,b)=>a+b,0);
  const mode=feature.distributionMode ?? "complete";
  if(mode==="complete"){
    if(Math.abs(sum-1)>1e-6) return null;
    return values;
  }
  if(mode==="implicit_residual"){
    if(sum>1+1e-6) return null;
    return [...values,Math.max(0,1-sum)];
  }
  return null;
}
function klCategorical(p,q){ let s=0; for(let i=0;i<p.length;i++){ if(p[i]<=0) continue; if(q[i]<=0) return Infinity; s+=p[i]*Math.log(p[i]/q[i]); } return s; }
function jsCategorical(p,q){ const m=p.map((v,i)=>(v+q[i])/2); return 0.5*klCategorical(p,m)+0.5*klCategorical(q,m); }
function totalVariation(p,q){ return 0.5*p.reduce((s,v,i)=>s+Math.abs(v-q[i]),0); }
function bhattacharyya(p,q){ return p.reduce((s,v,i)=>s+Math.sqrt(v*q[i]),0); }
function hellingerSquared(p,q){ return Math.max(0,1-bhattacharyya(p,q)); }
function trialsForBayesErrorUpper(p,q,targetError=0.05){
  const bc=Math.min(1,Math.max(0,bhattacharyya(p,q)));
  if(bc>=1-EPS) return null;
  if(bc<=EPS) return 1;
  return Math.max(1,Math.ceil(Math.log(2*targetError)/Math.log(bc)));
}
function getPairs(settings){ const out=[]; for(let i=0;i<settings.length;i++) for(let j=i+1;j<settings.length;j++) out.push([settings[i],settings[j],j===i+1]); return out; }
function evaluateScalarFeature(f,settingOrder){
  const entries=settingEntries(f,settingOrder), ps=entries.map(([,p])=>p), pairs=[];
  const extremePair80=entries.length>=2?{settings:[entries[0][0],entries.at(-1)[0]],requiredTrials80:trialsForBayesAccuracy80FromBC(f.candidateModel==='poisson'?bcPoisson(entries[0][1],entries.at(-1)[1]):bcBernoulli(entries[0][1],entries.at(-1)[1])),criterion:'equal-prior Bayes accuracy >= 80% (Bhattacharyya upper-bound estimate)'}:null;
  for(const [a,b,adjacent] of getPairs(entries.map(([s])=>s))){
    const p=entries.find(([s])=>s===a)[1], q=entries.find(([s])=>s===b)[1];
    pairs.push({settings:[a,b],adjacent,absoluteGap:Math.abs(p-q),probabilityRatio:Math.min(p,q)>0?Math.max(p,q)/Math.min(p,q):null,jsDivergenceNats:jsBernoulli(p,q),approxTrials95:normalApproxTrials(p,q)});
  }
  const pool=pairs.filter(x=>x.adjacent).length?pairs.filter(x=>x.adjacent):pairs;
  const hardest=pool.filter(x=>x.approxTrials95!=null).sort((a,b)=>b.approxTrials95-a.approxTrials95)[0]??null;
  return {calculable:entries.length>=2,settingCount:entries.length,probabilityRange:ps.length?{min:Math.min(...ps),max:Math.max(...ps)}:null,extremeGap:ps.length?Math.max(...ps)-Math.min(...ps):null,pairwise:pairs,hardestAdjacentPair:hardest,extremePair80};
}
function evaluateMultinomialFeature(f,settingOrder){
  const distributions={};
  for(const setting of settingOrder){ const d=categoricalDistribution(f,setting); if(d) distributions[setting]=d; }
  if(settingOrder.length===0) for(const setting of Object.keys(f.settingDistributions??{})){ const d=categoricalDistribution(f,setting); if(d) distributions[setting]=d; }
  const settings=Object.keys(distributions), pairs=[];
  const extremePair80=settings.length>=2?{settings:[settings[0],settings.at(-1)],requiredTrials80:trialsForBayesAccuracy80FromBC(bcCategorical(distributions[settings[0]],distributions[settings.at(-1)])),criterion:'equal-prior Bayes accuracy >= 80% (Bhattacharyya upper-bound estimate)'}:null;
  for(const [a,b,adjacent] of getPairs(settings)){
    const p=distributions[a],q=distributions[b];
    pairs.push({settings:[a,b],adjacent,jsDivergenceNats:jsCategorical(p,q),totalVariationDistance:totalVariation(p,q),hellingerSquared:hellingerSquared(p,q),bhattacharyyaCoefficient:bhattacharyya(p,q),approxTrialsBayesErrorUpper5pct:trialsForBayesErrorUpper(p,q,0.05)});
  }
  const pool=pairs.filter(x=>x.adjacent).length?pairs.filter(x=>x.adjacent):pairs;
  const hardest=pool.filter(x=>x.approxTrialsBayesErrorUpper5pct!=null).sort((a,b)=>b.approxTrialsBayesErrorUpper5pct-a.approxTrialsBayesErrorUpper5pct)[0]??null;
  const categories=[...(f.categories??[])];
  if((f.distributionMode??"complete")==="implicit_residual") categories.push("__RESIDUAL__");
  return {calculable:settings.length>=2,categories,distributionMode:f.distributionMode??"complete",settingCount:settings.length,pairwise:pairs,hardestAdjacentPair:hardest,extremePair80};
}
function evaluateFeature(f,settingOrder){
  const base={researchFeatureId:f.researchFeatureId,name:f.name,candidateModel:f.candidateModel??null};
  if(f.candidateModel==='multinomial') return {...base,...evaluateMultinomialFeature(f,settingOrder),notes:["completeは明示カテゴリ合計1、implicit_residualは残余確率を1-明示カテゴリ合計として数学的に追加して評価する。欠損した明示カテゴリは推測補完しない。","必要試行数は等事前確率の2仮説に対するBhattacharyya上界が5%以下になる試行数の目安。断定保証ではない。"]};
  if(["binomial","poisson"].includes(f.candidateModel)) return {...base,...evaluateScalarFeature(f,settingOrder),notes:["必要試行数は2比率の正規近似による設計比較用の目安。断定保証ではない。"]};
  return {...base,calculable:false,settingCount:0,pairwise:[],hardestAdjacentPair:null,notes:["未対応またはモデル不明のため自動統計評価対象外。"]};
}
export function evaluateResearchData(data){
  const settingOrder=Array.isArray(data.machine?.settings)?data.machine.settings:[];
  return {evaluatorVersion:"statistical-evaluator-v1.2",researchSchemaVersion:data.schemaVersion,machineId:data.machine?.machineId??null,generatedAt:new Date().toISOString(),disclaimer:"客観的な統計指標のみ。Featureの採用・不採用、重み、実戦評価は決定しない。",features:(data.features??[]).map(f=>evaluateFeature(f,settingOrder))};
}
if(import.meta.url===`file://${process.argv[1]}`){
  const input=process.argv[2]; if(!input){console.error("Usage: node tools/evaluate-research-statistics.mjs <research-data.json> [output.json]");process.exit(2);}
  const report=evaluateResearchData(JSON.parse(fs.readFileSync(input,"utf8"))); const out=process.argv[3];
  if(out){fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,2)+"\n");console.log(`Statistical report: ${out}`);} else console.log(JSON.stringify(report,null,2));
}
