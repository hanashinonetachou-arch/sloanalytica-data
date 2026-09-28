import fs from 'node:fs';
import {RepoStore} from './core.ts';
import type {Stage,Lease,Attempt} from './core.ts';
import type {BatchSpec} from './runtime.ts';

export function migrationPreflight(root:string,batchId:string){
 const s=new RepoStore(root);
 const spec=s.read<BatchSpec>('batches',batchId,'batch.json');
 const machineIds=spec.waves.flatMap(w=>w.machineIds);
 if(machineIds.length!==10||new Set(machineIds).size!==10) throw new Error('MIGRATION_INVALID_BATCH_SHAPE');
 const machines=machineIds.map(machineId=>{
  const research=s.read<Stage>('batches',batchId,'machines',machineId,'stages','RESEARCH.json');
  const evaluation=s.read<Stage>('batches',batchId,'machines',machineId,'stages','EVALUATION.json');
  if(research.state!=='COMPLETE') throw new Error(`MIGRATION_RESEARCH_NOT_COMPLETE:${machineId}:${research.state}`);
  if(!research.activeAttemptId||!research.activeLeaseId) throw new Error(`MIGRATION_RESEARCH_COMPLETION_REFS_MISSING:${machineId}`);
  const attempt=s.read<Attempt>('batches',batchId,'machines',machineId,'attempts',research.activeAttemptId+'.json');
  const lease=s.read<Lease>('batches',batchId,'leases',research.activeLeaseId+'.json');
  if(attempt.status!=='COMPLETE') throw new Error(`MIGRATION_RESEARCH_ATTEMPT_NOT_COMPLETE:${machineId}:${attempt.status}`);
  if(lease.status!=='RELEASED') throw new Error(`MIGRATION_RESEARCH_LEASE_NOT_RELEASED:${machineId}:${lease.status}`);
  if(attempt.attemptId!==lease.attemptId||attempt.workId!==lease.workId||lease.machineId!==machineId||lease.stage!=='RESEARCH') throw new Error(`MIGRATION_RESEARCH_COMPLETION_REF_MISMATCH:${machineId}`);
  if(evaluation.state!=='READY') throw new Error(`MIGRATION_EVALUATION_NOT_READY:${machineId}:${evaluation.state}`);
  const artifact=s.p('batches',batchId,'artifacts',machineId,'research','result.json');
  if(!fs.existsSync(artifact)) throw new Error(`MIGRATION_RESEARCH_ARTIFACT_MISSING:${machineId}`);
  return {machineId,research:research.state,evaluation:evaluation.state};
 });
 const leaseDir=s.p('batches',batchId,'leases');
 const activeResearchLeases=fs.existsSync(leaseDir)?fs.readdirSync(leaseDir).filter(f=>f.endsWith('.json')).map(f=>s.read<Lease>('batches',batchId,'leases',f)).filter(l=>l.stage==='RESEARCH'&&l.status==='ACTIVE'):[];
 if(activeResearchLeases.length) throw new Error('MIGRATION_ACTIVE_RESEARCH_LEASES:'+activeResearchLeases.map(x=>x.leaseId).join(','));
 return {batchId,ok:true,machineCount:machines.length,machines};
}

if(process.argv[1]?.endsWith('migration-preflight.ts')){
 const batchId=process.argv[2];
 if(!batchId) throw new Error('USAGE: migration-preflight <batch-id>');
 console.log(JSON.stringify(migrationPreflight(process.cwd(),batchId),null,2));
}
