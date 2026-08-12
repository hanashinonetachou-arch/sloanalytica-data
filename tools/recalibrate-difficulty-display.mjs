import fs from 'node:fs';
const p=process.argv[2]||'difficulty-catalog.json';
const doc=JSON.parse(fs.readFileSync(p,'utf8'));
const cal=doc.calibration;
if(!cal||cal.method!=='REFERENCE_RAW_TO_100')throw new Error('unsupported calibration');
for(const e of doc.entries||[]){
 const d=e.difficulty;
 if(d?.status!=='SCORED')continue;
 d.scores=(d.rawScores||[]).map(r=>{
   const cfg=cal.targets?.[String(r.games)];
   if(!cfg||!Number.isFinite(cfg.referenceRaw)||cfg.referenceRaw<=0)throw new Error(`missing referenceRaw ${r.games}`);
   return {games:r.games,score:Math.round((r.rawScore/cfg.referenceRaw)*cfg.displayReference)};
 });
 d.displayScoreSource='CALIBRATED_FROM_RAW';
 d.calibrationVersion=cal.calibrationVersion;
}
fs.writeFileSync(p,JSON.stringify(doc,null,2)+'\n');
console.log('Difficulty display recalibration: PASS');
