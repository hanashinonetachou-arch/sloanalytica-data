#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
const MACHINE_ID='L_KING_PULSAR_SLCC';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');
export function migrate(root=process.cwd(),{apply=false}={}){
  const file=path.join(root,'research',MACHINE_ID,'selection-data.json');
  const selection=read(file);
  const feature=(selection.features??[]).find(f=>f.researchFeatureId==='RF_CZ');
  if(!feature||feature.adoptionCategory!=='EXCLUDE') throw new Error('RF_CZ must remain explicit EXCLUDE');
  delete feature.rejectionReason;
  delete feature.userReason;
  feature.userFacingReason='CZ突入率にも設定差はありますが、採用済みオレンジ出現率と同じ通常ゲーム上で相関する観測です。オレンジとCZを同時利用するjoint likelihood contractを現Engineで定義していないため、独立尤度として二重評価せず現版では推測計算に使用しません。';
  if(apply) write(file,selection);
  return {machineId:MACHINE_ID,researchFeatureId:'RF_CZ'};
}
const root=path.resolve(process.argv[2]??'.');
const apply=process.argv.includes('--apply');
if(apply) console.log('APPLIED '+JSON.stringify(migrate(root,{apply:true})));
else {
  const tmp=fs.mkdtempSync(path.join(process.env.RUNNER_TEMP??process.env.TMPDIR??'/tmp','slo-v64-kp-cz-'));
  fs.cpSync(root,tmp,{recursive:true,filter:src=>!src.includes(`${path.sep}.git${path.sep}`)});
  console.log('DRY-RUN PASS '+JSON.stringify(migrate(tmp,{apply:true})));
}
