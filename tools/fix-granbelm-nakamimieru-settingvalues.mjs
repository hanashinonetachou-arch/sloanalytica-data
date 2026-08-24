import fs from 'node:fs';
const p='research/S_GRANBELM_ZX/research-data.json';
const r=JSON.parse(fs.readFileSync(p,'utf8'));
let changed=0;
for(const f of r.features||[]){
  if(String(f.researchFeatureId||'').startsWith('RF_NAKAMI_') && f.candidateModel==='multinomial'){
    if(f.settingValues==null){ f.settingValues={}; changed++; }
  }
}
fs.writeFileSync(p,JSON.stringify(r,null,2)+'\n');
console.log(`Granbelm Nakamimieru settingValues normalized: ${changed} feature(s)`);
