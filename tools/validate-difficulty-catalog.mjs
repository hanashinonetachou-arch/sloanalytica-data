import fs from 'node:fs';
const c=JSON.parse(fs.readFileSync('catalog.json','utf8'));
const d=JSON.parse(fs.readFileSync('difficulty-catalog.json','utf8'));
const errors=[];
if(d.schemaVersion!==1)errors.push('difficulty catalog schemaVersion must be 1');
if(!Array.isArray(d.entries))errors.push('entries must be array');
const cal=d.calibration;
if(!cal||cal.method!=='FIXED_BENCHMARK_RAW_SCALE')errors.push('calibration missing/invalid');
if(!Number.isFinite(cal?.referenceRaw)||cal.referenceRaw<=0)errors.push('invalid referenceRaw');
if(!Number.isFinite(cal?.displayReference)||cal.displayReference<0)errors.push('invalid displayReference');
if(typeof cal?.referenceMachineId!=='string'||!cal.referenceMachineId)errors.push('invalid referenceMachineId');
if(!Number.isFinite(cal?.referenceGames)||cal.referenceGames<=0)errors.push('invalid referenceGames');
if(cal?.unboundedAbove!==true)errors.push('unboundedAbove must be true');
const ids=new Set(c.machines.map(x=>x.machineId)), dids=new Set();
for(const e of d.entries||[]){
 if(!ids.has(e.machineId))errors.push(`unknown machineId ${e.machineId}`);
 if(dids.has(e.machineId))errors.push(`duplicate machineId ${e.machineId}`);
 dids.add(e.machineId);
 const x=e.difficulty;
 if(!x||x.schemaVersion!=='difficulty-display-v1')errors.push(`invalid difficulty ${e.machineId}`);
 if(x?.status==='SCORED'){
  const rg=(x.rawScores||[]).map(s=>s.games).sort((a,b)=>a-b).join(',');
  const dg=(x.scores||[]).map(s=>s.games).sort((a,b)=>a-b).join(',');
  if(rg!=='1500,3000,7000')errors.push(`missing raw targets ${e.machineId}`);
  if(dg!=='1500,3000,7000')errors.push(`missing display targets ${e.machineId}`);
  const ordered=[...(x.scores||[])].sort((a,b)=>a.games-b.games);
  for(let i=1;i<ordered.length;i++)if(ordered[i].score<ordered[i-1].score)errors.push(`non-monotonic display score ${e.machineId}`);
  for(const s of ordered)if(!Number.isFinite(s.score)||s.score<0)errors.push(`invalid display score ${e.machineId}`);
 }
 if(x?.status==='EVIDENCE_DOMINANT'&&(x.scores||[]).length)errors.push(`evidence dominant must not have scores ${e.machineId}`);
 for(const r of x?.rejectedFeatures||[])if(/Hard\s*Evidence/i.test(r.reason||''))errors.push(`internal wording leaked ${e.machineId}`);
}
for(const id of ids)if(!dids.has(id))errors.push(`missing difficulty entry ${id}`);
const refEntry=(d.entries||[]).find(e=>e.machineId===cal?.referenceMachineId);
if(!refEntry)errors.push('reference machine missing from difficulty catalog');
else if(refEntry.difficulty?.status!=='SCORED')errors.push('reference machine must be SCORED');
else {
 const rr=(refEntry.difficulty.rawScores||[]).find(x=>x.games===cal.referenceGames)?.rawScore;
 const rs=(refEntry.difficulty.scores||[]).find(x=>x.games===cal.referenceGames)?.score;
 if(rr!==cal.referenceRaw)errors.push(`referenceRaw mismatch: catalog=${cal.referenceRaw}, entry=${rr}`);
 if(rs!==cal.displayReference)errors.push(`displayReference mismatch: catalog=${cal.displayReference}, entry=${rs}`);
}
if(errors.length){for(const e of errors)console.error('ERROR:',e);process.exit(1);}
console.log(`Difficulty Catalog validation: PASS (${d.entries.length} machines)`);
