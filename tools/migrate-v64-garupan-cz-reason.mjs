#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const MACHINE_ID='L_GIRLS_UND_PANZER_FINALE_H1';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');

export function migrate(root=process.cwd(),{apply=false}={}){
  const file=path.join(root,'research',MACHINE_ID,'selection-data.json');
  const selection=read(file);
  const feature=(selection.features??[]).find(f=>f.researchFeatureId==='RF_CZ');
  if(!feature||feature.adoptionCategory!=='EXCLUDE') throw new Error('RF_CZ must remain explicit EXCLUDE');
  delete feature.rejectionReason;
  delete feature.userReason;
  feature.userFacingReason='CZ初当りは設定1→6で約1.13倍と設定差が小さく、AT初当りより単独の識別情報が弱い要素です。さらにCZ→ATの依存をAT初当りと同時利用するための依存モデルを現Engineで定義していないため、現版では推測計算に使用しません。';
  if(apply) write(file,selection);
  return {machineId:MACHINE_ID,researchFeatureId:'RF_CZ'};
}

const root=path.resolve(process.argv[2]??'.');
const apply=process.argv.includes('--apply');
if(apply) console.log('APPLIED '+JSON.stringify(migrate(root,{apply:true})));
else {
  const tmp=fs.mkdtempSync(path.join(process.env.RUNNER_TEMP??process.env.TMPDIR??'/tmp','slo-v64-garupan-cz-'));
  fs.cpSync(root,tmp,{recursive:true,filter:src=>!src.includes(`${path.sep}.git${path.sep}`)});
  console.log('DRY-RUN PASS '+JSON.stringify(migrate(tmp,{apply:true})));
}
