#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const file=path.join(root,'research','L_INUYASHA2_FK','research-data.json');
const data=JSON.parse(fs.readFileSync(file,'utf8'));
const rf=(data.features??[]).find(f=>f.researchFeatureId==='RF_COMEBACK_ZONE');
if(!rf) throw new Error('RF_COMEBACK_ZONE not found');
for(const [setting,dist] of Object.entries(rf.settingDistributions??{})){
  const vals=Object.entries(dist).map(([k,v])=>[k,Number(v)]);
  if(vals.some(([,v])=>!Number.isFinite(v)||v<0)) throw new Error(`${setting}: invalid probability`);
  const total=vals.reduce((s,[,v])=>s+v,0);
  if(total<=0) throw new Error(`${setting}: probability sum must be positive`);
  if(Math.abs(total-1)>1e-12){
    for(const [k,v] of vals) dist[k]=v/total;
  }
}
rf.notes=((rf.notes??'')+' 公開割合は丸めにより設定1～5で合計100.1%となるため、MachineDataでは各設定内の比率を保持して1.0へ再正規化する。').trim();
fs.writeFileSync(file,JSON.stringify(data,null,2)+'\n','utf8');
console.log('Normalized L_INUYASHA2_FK RF_COMEBACK_ZONE setting distributions.');
