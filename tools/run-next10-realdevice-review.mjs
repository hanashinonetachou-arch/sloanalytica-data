import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
const src='tools/apply-next10-realdevice-review.mjs';
let text=fs.readFileSync(src,'utf8');
const before="const multi=(researchFeatureId,name,trialUnit,categories,dists,sourceRefs,notes)=>({researchFeatureId,name,factStatus:'verified',candidateModel:'multinomial',trialUnit,categories,settingDistributions:dists,sourceRefs,crossSourceStatus:'cross_checked',notes});";
const after="const multi=(researchFeatureId,name,trialUnit,categories,dists,sourceRefs,notes)=>({researchFeatureId,name,factStatus:'verified',candidateModel:'multinomial',trialUnit,numeratorDefinition:'カテゴリ別観測回数',denominatorDefinition:'対象観測回数',settingValues:{},categories,settingDistributions:dists,sourceRefs,crossSourceStatus:'cross_checked',notes});";
if(!text.includes(before)) throw new Error('multi helper patch target not found');
text=text.replace(before,after);
const temp='.tmp-next10-realdevice-review.mjs';
fs.writeFileSync(temp,text);
try { await import(pathToFileURL(process.cwd()+'/'+temp).href+'?v='+Date.now()); }
finally { fs.rmSync(temp,{force:true}); }
