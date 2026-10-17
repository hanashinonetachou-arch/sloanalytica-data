import fs from 'node:fs';
import {RepoStore,Orchestrator} from './core.ts';
import {productionRequest} from './runtime.ts';
import {completeResearch} from './complete-research.ts';
// User explicitly authorized all ten through Contract only. The ordinary wave
// scheduler releases wave2 after Distribution, outside this request. Dispatch
// already-reviewed READY Research through existing stage/lease/CAS operations,
// sequentially, without changing scheduling rules or inventing a wait state.
const s=new RepoStore(process.cwd()),o=new Orchestrator(s),batchId='batch-20261017-019';
const spec=s.read<any>('batches',batchId,'batch.json'),cfg=s.read<any>('config','orchestrator.json');
const machines=spec.waves.flatMap((w:any)=>w.machineIds),reports:any[]=[];
for(const machineId of machines){
 let x=o.stage(batchId,machineId,'RESEARCH');
 if(x.state==='COMPLETE')continue;
 if(x.state!=='READY')throw Error('RESEARCH_NOT_READY:'+machineId+':'+x.state);
 const a=o.createAttempt(x),l=o.acquire(x,a,300000);
 x=o.transition(o.stage(batchId,machineId,'RESEARCH'),'LEASED','DISPATCH',a.workId);x=o.transition(x,'RUNNING','WORKER_START',a.workId);
 const q=productionRequest(o,x,a,l,cfg.manifestVersion);s.write(q,'batches',batchId,'work-requests',q.workId+'.json');
 const d=s.read<any>('research-inbox/batch019/reviewed',machineId+'.json');
 d.workId=q.workId;d.researchStage='SOURCE_REVIEW_COMPLETE';
 s.write(d,'batches',batchId,'artifacts',machineId,'research','result.json');
 reports.push(completeResearch(process.cwd(),batchId,[machineId]));
}
const statuses=machines.map((machineId:string)=>({machineId,state:o.stage(batchId,machineId,'RESEARCH').state,artifact:o.stage(batchId,machineId,'RESEARCH').authoritativeOutputRef}));
s.write({batchId,executionScope:'EXPLICIT_USER_ALL_TEN_THROUGH_CONTRACT',reports,statuses},'batches',batchId,'validation','research-formal-acceptance.json');
console.log(JSON.stringify({batchId,statuses},null,2));
if(statuses.some((x:any)=>x.state!=='COMPLETE'))throw Error('RESEARCH_NOT_COMPLETE');
