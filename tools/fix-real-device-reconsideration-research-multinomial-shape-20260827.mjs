#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT=process.cwd();
const targets=['S_MHW_ICEBORNE_ZF','L_INUYASHA2_FK'];
for(const mid of targets){
  const p=path.join(ROOT,'research',mid,'research-data.json');
  const r=JSON.parse(fs.readFileSync(p,'utf8'));
  let changed=0;
  for(const f of r.features??[]){
    if(f?.candidateModel==='multinomial' && (f.settingValues==null || typeof f.settingValues!=='object' || Array.isArray(f.settingValues))){
      f.settingValues={};
      changed++;
    }
  }
  fs.writeFileSync(p,JSON.stringify(r,null,2)+'\n','utf8');
  console.log(`${mid}: normalized multinomial settingValues=${changed}`);
}
