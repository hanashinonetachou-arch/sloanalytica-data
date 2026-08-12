import fs from 'node:fs';
const statuses=new Set(['SCORED','EVIDENCE_DOMINANT','NOT_CONFIGURED']);
const games=new Set([1500,3000,7000]);
export function validateDifficultyDisplay(pkg){
 const errors=[],d=pkg?.difficulty;
 if(!d)return ['missing difficulty'];
 if(d.schemaVersion!=='difficulty-display-v1')errors.push('invalid schemaVersion');
 if(!statuses.has(d.status))errors.push('invalid status');
 if(typeof d.isProvisional!=='boolean')errors.push('isProvisional must be boolean');
 if(!Array.isArray(d.scores))errors.push('scores must be array');
 if(d.status==='SCORED'){
   const seen=new Set();
   for(const s of d.scores??[]){
     if(!games.has(s.games))errors.push(`invalid games ${s.games}`);
     if(!Number.isInteger(s.score)||s.score<0)errors.push(`invalid score ${s.score}`);
     seen.add(s.games);
   }
   for(const g of games)if(!seen.has(g))errors.push(`missing score ${g}G`);
 }
 if(d.status!=='SCORED'&&(d.scores??[]).length)errors.push('non-scored status must not have scores');
 if(d.scoreRange!=null&&!Array.isArray(d.scoreRange))errors.push('scoreRange must be null or array');
 return errors;
}
if(import.meta.url===`file://${process.argv[1]}`){
 const p=process.argv[2];if(!p){console.error('Usage: node tools/validate-difficulty-display.mjs <machine-package.json>');process.exit(2);}
 const pkg=JSON.parse(fs.readFileSync(p,'utf8'));const e=validateDifficultyDisplay(pkg);
 if(e.length){for(const x of e)console.error('ERROR:',x);process.exit(1);}
 console.log('Difficulty display validation: PASS');
}
