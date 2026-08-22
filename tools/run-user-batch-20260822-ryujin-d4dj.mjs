import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const run=(args)=>{const r=spawnSync(process.execPath,args,{cwd:ROOT,encoding:'utf8'});process.stdout.write(r.stdout??'');process.stderr.write(r.stderr??'');if(r.status!==0)throw new Error(`failed: node ${args.join(' ')}`);};
run(['tools/apply-user-batch-20260822-ryujin-d4dj.mjs']);
// Safety correction: weak-cherry->bonus is researched, but its per-game Difficulty exposure is not yet resolved.
// Keep it in ResearchData only; do not put it into SelectionData until the trial exposure contract is explicit.
const moe=path.join(ROOT,'research','S_MOECHIBA_GNC30','selection-data.json');
const s=JSON.parse(fs.readFileSync(moe,'utf8'));
s.inputs=(s.inputs??[]).filter(x=>!['INP_WEAK_CHERRY','INP_WEAK_CHERRY_BONUS'].includes(x.id));
s.features=(s.features??[]).filter(x=>x.researchFeatureId!=='RF_WEAK_CHERRY_BONUS');
fs.writeFileSync(moe,JSON.stringify(s,null,2)+'\n','utf8');
const ids=['S_RYUJIN_RZ30_SUIKA_VERSION','S_DIGISLO_JACK_GB1','S_SUHANA_RISING_PC30','S_MOECHIBA_GNC30','S_KIZUMONOGATARI_FS','L_D4DJ_KB','L_GEGEGE_NO_KITARO_KAKUSEI_JC','L_PACHISLO_SENRAN_KAGURA2_L9','L_ASLOT_KONOSUBA_FX'];
for(const id of ids){
 console.log(`\n=== ${id} ===`);
 run(['tools/validate-research-data.mjs',`research/${id}/research-data.json`]);
 run(['tools/evaluate-research-statistics.mjs',`research/${id}/research-data.json`,`research/${id}/statistics-report.json`]);
 run(['tools/validate-selection-data.mjs',`research/${id}/selection-data.json`,`research/${id}/research-data.json`]);
}
console.log(`\nUSER BATCH VALIDATION PASS: ${ids.length} machines; Tropicana remains HOLD.`);
