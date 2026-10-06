import fs from 'node:fs';
import {RepoStore,fingerprint} from './core.ts';
import {PRODUCTION_STAGES,deps} from './runtime.ts';
const batchId='batch-20261007-007';
const s=new RepoStore(process.cwd());
const spec=s.read<any>('batches',batchId,'batch.json');
for(const w of spec.waves){
  s.write(w,'batches',batchId,'waves',w.waveId+'.json');
  for(const machineId of w.machineIds){
    s.write({machineId,waveId:w.waveId},'batches',batchId,'machines',machineId,'machine.json');
    for(const name of PRODUCTION_STAGES){
      const p=s.p('batches',batchId,'machines',machineId,'stages',name+'.json');
      if(fs.existsSync(p)) continue;
      s.write({
        batchId,machineId,name,
        state:name==='RESEARCH'?'READY':'PENDING',
        revision:0,
        dependencies:deps(name),
        authoritativeInputFingerprint:fingerprint({machineId,stage:name,manifestVersion:spec.manifestVersion}),
        contractVersion:'production-1'
      },'batches',batchId,'machines',machineId,'stages',name+'.json');
    }
  }
}
if(!s.exists('batches',batchId,'runtime-policy-config.json')){
  s.write(s.read<any>('config','runtime-policy-v8.5.json'),'batches',batchId,'runtime-policy-config.json');
}
console.log(JSON.stringify({batchId,status:'BOOTSTRAPPED',machines:spec.waves.flatMap((w:any)=>w.machineIds).length},null,2));
