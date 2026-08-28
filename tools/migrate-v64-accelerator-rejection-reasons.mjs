#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const MACHINE_ID='L_TOARU_ACCELERATOR_RZ';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');

const REASONS={
  RF_AT_INITIAL:'AT初当りはCZ当選とは別の観測ですが、CZ経由と直撃経路を含む総AT初当りをCZ合算と同時利用するためのjoint/conditional likelihood contractを現Engineで定義していないため不採用です。Research値は保持し、依存モデル確立後に再評価します。',
  RF_SHUTTER_OPEN:'チャンス目成立回数を分母とする条件付き抽選です。必要なチャンス目成立回数を実戦中に継続して正確に取得できるObservationが未確定のため、現版では推測計算に使用しません。',
  RF_SHUTTER_DURATION:'シャッター開放1回ごとの18G・23G・33G継続を分類する条件付き分布です。各開放の継続Gを実戦中に毎回判別・記録するObservation設計をまだ確定していないため、現版では推測計算に使用しません。',
  RF_SHUTTER_ROLE_CZ:'シャッター開放中の対応役成立回数を分母とする条件付きCZ抽選です。対応役の機会分母Observationが未確定で、CZ総当選率と併用するjoint/conditional likelihood contractも未実装のため、現版では不採用です。',
  RF_SHUTTER_NONROLE_CZ:'シャッター開放中の非対応役成立回数を分母とする条件付きCZ抽選です。非対応役の機会分母Observationが未確定で、CZ総当選率と併用するjoint/conditional likelihood contractも未実装のため、現版では不採用です。',
  RF_CHANCE3_CZ_TYPE:'3連チャンス目成立時だけを母数とするCZ種類構成です。3連チャンス目の機会数を継続記録するObservationと、通常のCZ種類構成と併用するconditional likelihood contractをまだ確定していないため、現版では不採用です。',
};

export function migrate(root=process.cwd(),{apply=false}={}){
  const base=path.join(root,'research',MACHINE_ID);
  const sp=path.join(base,'selection-data.json');
  const op=path.join(base,'machine-observation-data.json');
  const selection=read(sp), observation=read(op);
  for(const [rfid,reason] of Object.entries(REASONS)){
    const sf=(selection.features??[]).find(f=>f.researchFeatureId===rfid);
    if(!sf||sf.adoptionCategory!=='EXCLUDE') throw new Error(`${rfid}: expected EXCLUDE Selection feature`);
    delete sf.rejectionReason;
    delete sf.userReason;
    sf.userFacingReason=reason;
  }

  // researchReopenRequests is a blocking four-layer contract. These are future
  // reconsideration candidates, not evidence that the current MachineData is invalid,
  // so do not create RESEARCH_REOPEN_REQUIRED records here.
  const ids=new Set([
    'RR_ACCEL_AT_INITIAL_MODEL',
    'RR_ACCEL_SHUTTER_OPEN_OBSERVATION',
    'RR_ACCEL_SHUTTER_DURATION_OBSERVATION',
    'RR_ACCEL_SHUTTER_ROLE_CZ_CONDITIONAL',
    'RR_ACCEL_SHUTTER_NONROLE_CZ_CONDITIONAL',
    'RR_ACCEL_CHANCE3_CZ_TYPE_CONDITIONAL',
  ]);
  observation.researchReopenRequests=(observation.researchReopenRequests??[]).filter(r=>!ids.has(r.requestId) && !Object.hasOwn(REASONS,r.researchFeatureId));

  if(apply){write(sp,selection);write(op,observation);}
  return {machineId:MACHINE_ID,updated:Object.keys(REASONS),blockingReopenRequestsAdded:0};
}

const root=path.resolve(process.argv[2]??'.');
const apply=process.argv.includes('--apply');
if(apply) console.log('APPLIED '+JSON.stringify(migrate(root,{apply:true})));
else {
  const tmp=fs.mkdtempSync(path.join(process.env.RUNNER_TEMP??process.env.TMPDIR??'/tmp','slo-v64-accelerator-reasons-'));
  fs.cpSync(root,tmp,{recursive:true,filter:src=>!src.includes(`${path.sep}.git${path.sep}`)});
  console.log('DRY-RUN PASS '+JSON.stringify(migrate(tmp,{apply:true})));
}
