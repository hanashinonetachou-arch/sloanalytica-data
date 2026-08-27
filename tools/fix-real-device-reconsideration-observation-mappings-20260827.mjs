import fs from 'node:fs';
import path from 'node:path';

const ROOT=process.cwd();
const IDS=['S_MILKY_HOMES_GNB','S_SENGOKU_MUSOU3_ZYTCD','S_MHW_ICEBORNE_ZF','L_INUYASHA2_FK','L_DUMBBELL_X'];
for(const id of IDS){
  const p=path.join(ROOT,'research',id,'machine-observation-data.json');
  const d=JSON.parse(fs.readFileSync(p,'utf8'));
  let changed=0;
  for(const m of d.featureMappings??[]){
    if(m.mappingType==='DIRECT'){ m.mappingType='EXACT'; changed++; }
  }
  fs.writeFileSync(p,JSON.stringify(d,null,2)+'\n','utf8');
  console.log(`${id}: normalized ${changed} DIRECT mapping(s) to EXACT`);
}
