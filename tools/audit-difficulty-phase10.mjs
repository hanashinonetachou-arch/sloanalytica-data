#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(process.argv[2]??'.');
const out=path.resolve(process.argv[3]??path.join(root,'reports','phase10-difficulty-final-audit.json'));
const catalog=JSON.parse(fs.readFileSync(path.join(root,'difficulty-catalog.json'),'utf8'));
const entries=Array.isArray(catalog.entries)?catalog.entries:[];
const expectedGames=[1500,3000,7000];
const expectedAccuracy=[60,70,80];
const rows=[];const globalErrors=[];
const finite=n=>Number.isFinite(Number(n));
for(const e of entries){
 const d=e.difficulty??{};const errors=[];const reviews=[];
 const scoreMap=new Map((d.scores??[]).map(x=>[Number(x.games),Number(x.score)]));
 if(d.status==='SCORED'){
  for(const g of expectedGames) if(!finite(scoreMap.get(g))) errors.push(`missing ${g}G score`);
  const vals=expectedGames.map(g=>scoreMap.get(g));
  if(vals.every(finite)&&!(vals[0]<=vals[1]&&vals[1]<=vals[2])) errors.push('difficulty scores are not monotonic');
  if(vals.some(v=>finite(v)&&v<0)) errors.push('negative difficulty score');
  if(finite(vals[2])&&(vals[2]>=120||vals[2]<=15)) reviews.push(`extreme 7000G score=${vals[2]}`);
 } else if((d.scores??[]).length) errors.push(`${d.status} has numeric scores`);
 const band=d.settingBandDiscrimination??{};let bandGames=[];
 if(band.status==='COMPLETE'){
  const src=band.thresholds??band.results??[];
  bandGames=expectedAccuracy.map(a=>{
   const x=src.find(v=>Number(v.accuracy)===a||Math.round(Number(v.threshold)*100)===a);return x?Number(x.games):null;
  });
  if(bandGames.some(v=>!finite(v)||v<0)) errors.push('setting-band 60/70/80 missing or invalid');
  if(bandGames.every(finite)&&!(bandGames[0]<=bandGames[1]&&bandGames[1]<=bandGames[2])) errors.push('setting-band games are not monotonic');
  if(finite(bandGames[2])&&(bandGames[2]<=1000||bandGames[2]>=100000)) reviews.push(`extreme 80% discrimination=${bandGames[2]}G`);
 }
 rows.push({machineId:e.machineId,displayName:e.displayName,status:errors.length?'ERROR':reviews.length?'REVIEW':'PASS',scores:Object.fromEntries(expectedGames.map(g=>[g,scoreMap.get(g)??null])),settingBand:Object.fromEntries(expectedAccuracy.map((a,i)=>[a,bandGames[i]??null])),errors,reviews});
}
const bench=rows.find(r=>r.machineId==='S_MY_JUGGLER_V_KD');
if(!bench) globalErrors.push('benchmark S_MY_JUGGLER_V_KD missing');
else if(bench.scores['7000']!==80) globalErrors.push(`benchmark 7000G score expected 80, got ${bench.scores['7000']}`);
const scored=rows.filter(r=>finite(r.scores['7000']));
const ranked=[...scored].sort((a,b)=>b.scores['7000']-a.scores['7000']);
const bandRanked=[...rows].filter(r=>finite(r.settingBand['80'])).sort((a,b)=>a.settingBand['80']-b.settingBand['80']);
const summary={machineCount:rows.length,scoredCount:scored.length,completeSettingBandCount:bandRanked.length,pass:rows.filter(r=>r.status==='PASS').length,review:rows.filter(r=>r.status==='REVIEW').length,error:rows.filter(r=>r.status==='ERROR').length,globalErrorCount:globalErrors.length};
const report={schemaVersion:'phase10-difficulty-final-audit-v1',generatedAt:new Date().toISOString(),summary,globalErrors,extremes:{highest7000:ranked.slice(0,10).map(r=>({machineId:r.machineId,displayName:r.displayName,score:r.scores['7000']})),lowest7000:ranked.slice(-10).reverse().map(r=>({machineId:r.machineId,displayName:r.displayName,score:r.scores['7000']})),fastest80:bandRanked.slice(0,10).map(r=>({machineId:r.machineId,displayName:r.displayName,games:r.settingBand['80']})),slowest80:bandRanked.slice(-10).reverse().map(r=>({machineId:r.machineId,displayName:r.displayName,games:r.settingBand['80']}))},machines:rows};
fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');
console.log(`Phase 10 Difficulty Audit: PASS ${summary.pass} / REVIEW ${summary.review} / ERROR ${summary.error} / TOTAL ${summary.machineCount}`);
console.log(`Scored ${summary.scoredCount}; Setting-band COMPLETE ${summary.completeSettingBandCount}; global errors ${summary.globalErrorCount}`);
for(const r of rows.filter(x=>x.status!=='PASS')) console.log(`${r.status}\t${r.machineId}\t${[...r.errors,...r.reviews].join('; ')}`);
if(summary.error||globalErrors.length) process.exit(1);
