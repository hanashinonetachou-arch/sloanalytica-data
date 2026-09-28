import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {RepoStore,Orchestrator} from './core.ts';
import {acceptAndRecord,promoteDependencies,scheduleByKind,productionRequest} from './runtime.ts';
import type {WorkRequest,WorkResult,Concurrency} from './core.ts';

export function completeResearch(root:string,batchId:string,machineIds:string[]){
 const s=new RepoStore(root);
 const o=new Orchestrator(s);
 const config=JSON.parse(fs.readFileSync(s.p('config','orchestrator.json'),'utf8')) as {concurrency:Concurrency;manifestVersion:string};
 const completed:any[]=[];
 for(const machineId of machineIds){
  const stage=o.stage(batchId,machineId,'RESEARCH');
  if(stage.state==='COMPLETE'){completed.push({machineId,kind:'ALREADY_COMPLETE'});continue}
  if(stage.state!=='RUNNING'||!stage.activeAttemptId||!stage.activeLeaseId)throw new Error(`RESEARCH_NOT_RUNNING:${machineId}:${stage.state}`);
  const requestDir=s.p('batches',batchId,'work-requests');
  const requestFile=fs.readdirSync(requestDir).find(file=>{
   const q=s.read<WorkRequest>('batches',batchId,'work-requests',file);
   return q.machineId===machineId&&q.stage==='RESEARCH'&&q.attemptId===stage.activeAttemptId&&q.leaseId===stage.activeLeaseId;
  });
  if(!requestFile)throw new Error(`ACTIVE_WORK_REQUEST_NOT_FOUND:${machineId}`);
  const q=s.read<WorkRequest>('batches',batchId,'work-requests',requestFile);
  const rel=`batches/${batchId}/artifacts/${machineId}/research/result.json`;
  const full=s.p(rel);
  if(!fs.existsSync(full))throw new Error(`RESEARCH_ARTIFACT_NOT_FOUND:${machineId}`);
  const bytes=fs.readFileSync(full);
  const artifact={artifactId:`research-${machineId}`,kind:'research',path:`production/${rel.replaceAll(path.sep,'/')}`,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),producerWorkId:q.workId};
  const r:WorkResult={workId:q.workId,attemptId:q.attemptId,leaseId:q.leaseId,leaseGeneration:q.leaseGeneration,status:'SUCCESS',observedInputFingerprint:q.authoritativeInputFingerprint,producedArtifacts:[artifact],validationEvidence:[],requestedActions:[],proposedNextState:'COMPLETE',provenance:{adapter:'complete-research'}};
  const accepted=acceptAndRecord(o,s,r,'semantic-worker','deterministic');
  if(accepted.kind!=='COMMITTED'&&accepted.kind!=='DUPLICATE')throw new Error(`RESEARCH_COMPLETION_NOT_COMMITTED:${machineId}:${accepted.kind}`);
  if(accepted.kind==='COMMITTED')promoteDependencies(o,batchId,machineId);
  completed.push({machineId,kind:accepted.kind,sha256:artifact.sha256});
 }
 const selected=scheduleByKind(o,s,batchId,config.concurrency,'SEMANTIC').filter(x=>x.name==='RESEARCH');
 const dispatched=selected.map(candidate=>{
  let x=o.stage(batchId,candidate.machineId,candidate.name);
  const a=o.createAttempt(x);
  const l=o.acquire(x,a);
  x=o.transition(o.stage(batchId,candidate.machineId,candidate.name),'LEASED','DISPATCH',a.workId);
  x=o.transition(x,'RUNNING','WORKER_START',a.workId);
  const q=productionRequest(o,x,a,l,config.manifestVersion);
  s.write(q,'batches',batchId,'work-requests',q.workId+'.json');
  return {workId:q.workId,machineId:q.machineId,attemptId:q.attemptId,leaseId:q.leaseId};
 });
 return {batchId,completed,dispatched};
}

const direct=process.argv[1]&&path.resolve(process.argv[1])===path.resolve(fileURLToPath(import.meta.url));
if(direct){
 const batchId=process.argv[2],machineIds=process.argv.slice(3);
 if(!batchId||machineIds.length===0)throw new Error('USAGE: complete-research <batch-id> <machine-id> [machine-id...]');
 console.log(JSON.stringify(completeResearch(process.cwd(),batchId,machineIds),null,2));
}
