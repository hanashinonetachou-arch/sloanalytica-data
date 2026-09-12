#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
const ROOT=process.cwd();
const IDS=['L_TOARU_INDEX2_FA','LB_TRIPLE_CROWN_X300','S_MHW_ICEBORNE_ZF','S_HIDAN_NO_ARIA_II_JZ','L_TOARU_ACCELERATOR_RZ','L_KYOUKARA_OREHA_FE','S_SENGOKU_KOIHIME_FC','S_SUPER_BINGO_NEO_CLASSIC_HH1','S_GRANBELM_ZX'];
const out={schemaVersion:'package-ui-shape-v7-v1',machines:{}};
for(const id of IDS){
 const p=JSON.parse(fs.readFileSync(path.join(ROOT,'machines',id,'machine-package.json'),'utf8'));
 out.machines[id]={ui:p.ui??null,inputIds:(p.inputs?.inputs??[]).map(x=>x.id),evidence:(p.evidence?.evidences??[]).map(x=>({id:x.id,inputId:x.inputId,displayName:x.displayName??x.name}))};
}
fs.writeFileSync(path.join(ROOT,'reports','package-ui-shape-v7.json'),JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify({machines:Object.fromEntries(Object.entries(out.machines).map(([id,x])=>[id,{ui:x.ui}]))},null,2));