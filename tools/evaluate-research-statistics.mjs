import fs from "node:fs";
import path from "node:path";

const EPS=1e-12;
function clampP(p){ return Math.min(1-EPS, Math.max(EPS,p)); }
function klBernoulli(p,q){
  p=clampP(p); q=clampP(q);
  return p*Math.log(p/q)+(1-p)*Math.log((1-p)/(1-q));
}
function jsBernoulli(p,q){
  const m=(p+q)/2;
  return 0.5*klBernoulli(p,m)+0.5*klBernoulli(q,m);
}
function normalApproxTrials(p,q,z=1.96){
  const d=Math.abs(p-q);
  if(!Number.isFinite(d)||d<=0) return null;
  const v=p*(1-p)+q*(1-q);
  return Math.ceil((z*z*v)/(d*d));
}
function settingEntries(feature){
  return Object.entries(feature.settingValues ?? {})
    .map(([setting,v])=>[setting, Number(v?.probability)])
    .filter(([,p])=>Number.isFinite(p)&&p>=0&&p<=1);
}
function pairwise(entries){
  const out=[];
  for(let i=0;i<entries.length;i++) for(let j=i+1;j<entries.length;j++){
    const [a,p]=entries[i], [b,q]=entries[j];
    out.push({
      settings:[a,b], absoluteGap:Math.abs(p-q),
      probabilityRatio: Math.min(p,q)>0 ? Math.max(p,q)/Math.min(p,q) : null,
      jsDivergenceNats: jsBernoulli(p,q),
      approxTrials95: normalApproxTrials(p,q)
    });
  }
  return out;
}
function evaluateFeature(f){
  const entries=settingEntries(f);
  const ps=entries.map(([,p])=>p);
  const pairs=pairwise(entries);
  const adjacent=pairs.filter(x=>{
    const ai=entries.findIndex(([s])=>s===x.settings[0]);
    const bi=entries.findIndex(([s])=>s===x.settings[1]);
    return bi===ai+1;
  });
  const hardest=(adjacent.length?adjacent:pairs)
    .filter(x=>x.approxTrials95!=null)
    .sort((a,b)=>b.approxTrials95-a.approxTrials95)[0] ?? null;
  return {
    researchFeatureId:f.researchFeatureId,
    name:f.name,
    candidateModel:f.candidateModel ?? null,
    calculable: entries.length>=2 && ["binomial","poisson"].includes(f.candidateModel),
    settingCount:entries.length,
    probabilityRange: ps.length?{min:Math.min(...ps),max:Math.max(...ps)}:null,
    extremeGap: ps.length?Math.max(...ps)-Math.min(...ps):null,
    pairwise:pairs,
    hardestAdjacentPair:hardest,
    notes: ["multinomial等はPhase 3 v1では自動試行数評価対象外"]
  };
}
export function evaluateResearchData(data){
  return {
    evaluatorVersion:"statistical-evaluator-v1",
    researchSchemaVersion:data.schemaVersion,
    machineId:data.machine?.machineId ?? null,
    generatedAt:new Date().toISOString(),
    disclaimer:"客観的な統計指標のみ。Featureの採用・不採用、重み、実戦評価は決定しない。",
    features:(data.features??[]).map(evaluateFeature)
  };
}
if(import.meta.url===`file://${process.argv[1]}`){
  const input=process.argv[2];
  if(!input){ console.error("Usage: node tools/evaluate-research-statistics.mjs <research-data.json> [output.json]"); process.exit(2); }
  const data=JSON.parse(fs.readFileSync(input,"utf8"));
  const report=evaluateResearchData(data);
  const out=process.argv[3];
  if(out){ fs.mkdirSync(path.dirname(out),{recursive:true}); fs.writeFileSync(out,JSON.stringify(report,null,2)+"\n"); console.log(`Statistical report: ${out}`); }
  else console.log(JSON.stringify(report,null,2));
}
