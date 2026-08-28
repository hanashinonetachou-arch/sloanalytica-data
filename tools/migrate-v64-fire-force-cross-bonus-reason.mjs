#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const MACHINE_ID='L_ENEN_NO_SHOUBOUTAI_JG';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');

export function migrate(root=process.cwd(),{apply=false}={}){
  const file=path.join(root,'research',MACHINE_ID,'selection-data.json');
  const selection=read(file);
  const feature=(selection.features??[]).find(f=>f.researchFeatureId==='RF_CROSS_BONUS');
  if(!feature||feature.adoptionCategory!=='EXCLUDE') throw new Error('RF_CROSS_BONUS must remain an explicit EXCLUDE feature');
  delete feature.rejectionReason;
  delete feature.userReason;
  feature.userFacingReason='十字目変換を機会分母とする条件付き初当りボーナス抽選です。全初当りボーナス率と同時利用するための経路別joint/conditional likelihood contractを現Engineで定義していないため、現版では推測計算に使用しません。';
  if(apply) write(file,selection);
  return {machineId:MACHINE_ID,researchFeatureId:'RF_CROSS_BONUS'};
}

const root=path.resolve(process.argv[2]??'.');
const apply=process.argv.includes('--apply');
if(apply) console.log('APPLIED '+JSON.stringify(migrate(root,{apply:true})));
else {
  const tmp=fs.mkdtempSync(path.join(process.env.RUNNER_TEMP??process.env.TMPDIR??'/tmp','slo-v64-fire-force-cross-'));
  fs.cpSync(root,tmp,{recursive:true,filter:src=>!src.includes(`${path.sep}.git${path.sep}`)});
  console.log('DRY-RUN PASS '+JSON.stringify(migrate(tmp,{apply:true})));
}
