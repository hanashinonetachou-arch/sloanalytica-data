import fs from 'node:fs';
import path from 'node:path';
import {RepoStore,Orchestrator} from './core.ts';
import {productionRequest,scheduleByKind} from './runtime.ts';
import {completeResearch} from './complete-research.ts';
const s=new RepoStore(process.cwd()),o=new Orchestrator(s),batchId='batch-20261016-018';
const cfg=s.read<any>('config','orchestrator.json');
const spec=s.read<any>('batches',batchId,'batch.json');
const machines=spec.waves.flatMap((w:any)=>w.machineIds),reports:any[]=[];
for(let n=0;n<20;n++){
 let active=machines.filter((m:string)=>o.stage(batchId,m,'RESEARCH').state==='RUNNING');
 if(!active.length){
  for(const candidate of scheduleByKind(o,s,batchId,cfg.concurrency,'SEMANTIC',new Set(['RESEARCH']))){
   let x=o.stage(batchId,candidate.machineId,'RESEARCH');const a=o.createAttempt(x),l=o.acquire(x,a,300000);
   x=o.transition(o.stage(batchId,candidate.machineId,'RESEARCH'),'LEASED','DISPATCH',a.workId);x=o.transition(x,'RUNNING','WORKER_START',a.workId);
   const q=productionRequest(o,x,a,l,cfg.manifestVersion);s.write(q,'batches',batchId,'work-requests',q.workId+'.json');
  }
  active=machines.filter((m:string)=>o.stage(batchId,m,'RESEARCH').state==='RUNNING');
 }
 if(!active.length)break;
 for(const machineId of active){
  const stage=o.stage(batchId,machineId,'RESEARCH');
  const requestFile=fs.readdirSync(s.p('batches',batchId,'work-requests')).find(p=>{const q=s.read<any>('batches',batchId,'work-requests',p);return q.machineId===machineId&&q.attemptId===stage.activeAttemptId});
  if(!requestFile)throw Error('WORK_REQUEST_MISSING:'+machineId);
  const q=s.read<any>('batches',batchId,'work-requests',requestFile);
  const d=s.read<any>('research-inbox/batch018/reviewed',machineId+'.json');
  d.workId=q.workId;d.researchStage='SOURCE_REVIEW_COMPLETE';
  s.write(d,'batches',batchId,'artifacts',machineId,'research','result.json');
 }
 reports.push(completeResearch(process.cwd(),batchId,active));
}
const statuses=machines.map((machineId:string)=>({machineId,state:o.stage(batchId,machineId,'RESEARCH').state,artifact:o.stage(batchId,machineId,'RESEARCH').authoritativeOutputRef}));
s.write({batchId,reports,statuses},'batches',batchId,'validation','research-formal-acceptance.json');
console.log(JSON.stringify({batchId,statuses},null,2));
if(statuses.some((x:any)=>x.state!=='COMPLETE'))throw Error('RESEARCH_NOT_COMPLETE');
