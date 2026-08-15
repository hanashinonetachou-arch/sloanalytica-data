import fs from 'node:fs';
const p=process.argv[2]||'difficulty-catalog.json';
const doc=JSON.parse(fs.readFileSync(p,'utf8'));
const cal=doc.calibration;
if(!cal||cal.method!=='FIXED_BENCHMARK_RAW_SCALE')throw new Error('unsupported calibration');
if(!Number.isFinite(cal.referenceRaw)||cal.referenceRaw<=0)throw new Error('missing referenceRaw');
if(!Number.isFinite(cal.displayReference)||cal.displayReference<0)throw new Error('missing displayReference');
const min=Number.isFinite(cal.minimumDisplayScore)?cal.minimumDisplayScore:0;
for(const e of doc.entries||[]){
 const d=e.difficulty;
 if(d?.status!=='SCORED')continue;
 d.scores=(d.rawScores||[]).map(r=>({games:r.games,score:Math.max(min,Math.round((r.rawScore/cal.referenceRaw)*cal.displayReference))}));
 d.displayScoreSource='CALIBRATED_FROM_RAW';
 d.calibrationVersion=cal.calibrationVersion;
}
const ref=(doc.entries||[]).find(e=>e.machineId===cal.referenceMachineId)?.difficulty;
if(ref?.status==='SCORED')cal.referenceScores=[...(ref.scores||[])].sort((a,b)=>a.games-b.games);
fs.writeFileSync(p,JSON.stringify(doc,null,2)+'\n');
console.log('Difficulty display recalibration: PASS');
