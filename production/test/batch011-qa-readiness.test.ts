import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {validateMachineQaReadiness} from '../src/qa-readiness-validator.ts';
const base='batches/batch-20261011-011';
const read=(p:string)=>JSON.parse(fs.readFileSync(p,'utf8'));
const spec=read(base+'/batch.json');
for(const w of spec.waves)for(const machineId of w.machineIds){
 test(machineId+' completed production package passes real QA readiness',()=>{
  const pkg=read(base+'/artifacts/'+machineId+'/app_runtime/result.json').package;
  const states=Object.fromEntries(fs.readdirSync(base+'/machines/'+machineId+'/stages').map(f=>[f.replace('.json',''),read(base+'/machines/'+machineId+'/stages/'+f)]));
  const report=read(base+'/validation/'+w.waveId+'-app-reports/'+machineId+'.json');
  assert.equal(validateMachineQaReadiness(machineId,states,pkg,report).status,'QA_READY');
  if(machineId==='S_HAIYORE_NYARUKO_SAN_Y'){
   const bad=structuredClone(pkg),section=bad.ui.v8Sections.find((s:any)=>s.id==='OBS_bonus-end');
   section.items[0].interaction.categories.find((c:any)=>c.meaning==='設定6').meaning='設定4以上';
   assert.throws(()=>validateMachineQaReadiness(machineId,states,bad,report),/EVIDENCE_(?:UI_COVERAGE|CATEGORY_MISMATCH)/);
  }
 });
}
