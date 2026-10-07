import fs from 'node:fs';import {spawnSync} from 'node:child_process';
const [batch,waveId]=process.argv.slice(2);if(!batch||!waveId)throw new Error('BATCH_AND_WAVE_REQUIRED');
const spec=JSON.parse(fs.readFileSync(`batches/${batch}/batch.json`,'utf8')),wave=spec.waves.find((w:any)=>w.waveId===waveId);if(!wave)throw new Error('UNKNOWN_WAVE');
for(const machineId of wave.machineIds){
 const p=`batches/${batch}/artifacts/${machineId}/research/result.json`;
 if(!fs.existsSync(p))continue;
 const old=JSON.parse(fs.readFileSync(p,'utf8'));delete old.workId;
 const draft=JSON.parse(fs.readFileSync(`batches/${batch}/research-drafts/${waveId}/${machineId}.json`,'utf8'));
 if(JSON.stringify(old)===JSON.stringify(draft))continue;
 const result=spawnSync(process.execPath,['--experimental-strip-types','src/invalidate-machine-downstream.ts',batch,machineId,'--include-research'],{stdio:'inherit'});if(result.status!==0)throw new Error('INVALIDATION_FAILED:'+machineId);
}
