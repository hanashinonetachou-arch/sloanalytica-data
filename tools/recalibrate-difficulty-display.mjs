import fs from 'node:fs';
const p=process.argv[2]||'difficulty-catalog.json';
const doc=JSON.parse(fs.readFileSync(p,'utf8'));
const cal=doc.calibration;
if(!cal||cal.method!=='GLOBAL_REFERENCE_RAW_TO_100')throw new Error('unsupported calibration');
if(!Number.isFinite(cal.referenceRaw)||cal.referenceRaw<=0)throw new Error('missing referenceRaw');
for(const e of doc.entries||[]){
 const d=e.difficulty;
 if(d?.status!=='SCORED')continue;
 d.scores=(d.rawScores||[]).map(r=>({games:r.games,score:Math.round((r.rawScore/cal.referenceRaw)*cal.displayReference)}));
 d.displayScoreSource='CALIBRATED_FROM_RAW';
 d.calibrationVersion=cal.calibrationVersion;
}
fs.writeFileSync(p,JSON.stringify(doc,null,2)+'\n');
console.log('Difficulty display recalibration: PASS');
