#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
const ROOT=process.cwd();
const IDS=['S_MHW_ICEBORNE_ZF','S_HIDAN_NO_ARIA_II_JZ','L_TOARU_ACCELERATOR_RZ','L_KYOUKARA_OREHA_FE','S_SENGOKU_KOIHIME_FC','S_SUPER_BINGO_NEO_CLASSIC_HH1','S_GRANBELM_ZX'];
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
function itemId(x){return x?.inputId??x?.id??x?.sourceInputId??x?.ref??null;}
const machines=[];
for(const id of IDS){
 const ui=read(path.join(ROOT,'research',id,'ui-design-data.json'));
 const pkg=read(path.join(ROOT,'machines',id,'machine-package.json'));
 const pSecs=(pkg.ui?.sections??[]).map(s=>({title:s.title??s.name??s.id,id:s.id??null,inputIds:(s.items??s.inputIds??[]).map(x=>typeof x==='string'?x:itemId(x)).filter(Boolean)}));
 const canonical=(ui.sectionOrder??[]).map(title=>({title,inputIds:ui.sections?.[title]?.inputIds??[]}));
 const mismatches=[];
 for(const c of canonical){
   const p=pSecs.find(x=>x.title===c.title);
   if(!p){mismatches.push({type:'MISSING_SECTION',title:c.title,canonicalInputIds:c.inputIds});continue;}
   const missing=c.inputIds.filter(x=>!p.inputIds.includes(x));
   const extra=p.inputIds.filter(x=>!c.inputIds.includes(x));
   if(missing.length||extra.length)mismatches.push({type:'INPUT_PLACEMENT',title:c.title,missing,extra,canonicalInputIds:c.inputIds,packageInputIds:p.inputIds});
 }
 for(const p of pSecs) if(!canonical.some(c=>c.title===p.title)) mismatches.push({type:'EXTRA_SECTION',title:p.title,packageInputIds:p.inputIds});
 machines.push({machineId:id,canonicalSections:canonical,packageSections:pSecs,mismatches});
}
const out={schemaVersion:'ui-materialization-parity-v7-v1',generatedAt:new Date().toISOString(),machineCount:IDS.length,mismatchMachines:machines.filter(x=>x.mismatches.length).length,mismatchCount:machines.reduce((n,x)=>n+x.mismatches.length,0),machines};
fs.writeFileSync(path.join(ROOT,'reports','ui-materialization-parity-v7.json'),JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify({mismatchMachines:out.mismatchMachines,mismatchCount:out.mismatchCount,machines:machines.map(x=>({machineId:x.machineId,mismatches:x.mismatches}))},null,2));