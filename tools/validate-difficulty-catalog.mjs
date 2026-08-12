import fs from 'node:fs';
const c=JSON.parse(fs.readFileSync('catalog.json','utf8'));
const d=JSON.parse(fs.readFileSync('difficulty-catalog.json','utf8'));
const errors=[];
if(d.schemaVersion!==1)errors.push('difficulty catalog schemaVersion must be 1');
if(!Array.isArray(d.entries))errors.push('entries must be array');
if(!d.calibration||d.calibration.method!=='REFERENCE_RAW_TO_100')errors.push('calibration missing/invalid');
for(const g of [1500,3000,7000]){
 const t=d.calibration?.targets?.[String(g)];
 if(!t||!Number.isFinite(t.referenceRaw)||t.referenceRaw<=0)errors.push(`invalid calibration target ${g}`);
}
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
 }
 if(x?.status==='EVIDENCE_DOMINANT'&&(x.scores||[]).length)errors.push(`evidence dominant must not have scores ${e.machineId}`);
 for(const r of x?.rejectedFeatures||[])if(/Hard\s*Evidence/i.test(r.reason||''))errors.push(`internal wording leaked ${e.machineId}`);
}
for(const id of ids)if(!dids.has(id))errors.push(`missing difficulty entry ${id}`);
if(errors.length){for(const e of errors)console.error('ERROR:',e);process.exit(1);}
console.log(`Difficulty Catalog validation: PASS (${d.entries.length} machines)`);
