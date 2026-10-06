import {RepoStore,Orchestrator} from './core.ts';
import {productionRequest,acceptAndRecord,reconcileBatch} from './runtime.ts';
const b='batch-20261005-006',s=new RepoStore(process.cwd()),o=new Orchestrator(s);
const qa=s.read<any>('batches',b,'device-qa','handoff.json');
if(qa.status!=='AWAITING_USER_DEVICE_QA'||qa.renderedUiPassed!==10||qa.fleetPassed!==60||qa.fleetFailed!==0||!qa.apk.libraryFileId)throw new Error('QA_HANDOFF_NOT_READY');
for(const m of s.read<any>('batches',b,'batch.json').waves.flatMap((w:any)=>w.machineIds)){
 const dist=o.stage(b,m,'DISTRIBUTION');if(dist.state!=='COMPLETE')throw new Error('DISTRIBUTION_NOT_COMPLETE:'+m);
 let x=o.reconcile(b,m,'DEVICE_QA');if(x.state==='HUMAN_REQUIRED')continue;
 if(x.state!=='READY')throw new Error('DEVICE_QA_NOT_READY:'+m);
 const a=o.createAttempt(x),l=o.acquire(x,a,300000);
 x=o.transition(o.stage(b,m,'DEVICE_QA'),'LEASED','DISPATCH',a.workId);
 x=o.transition(x,'RUNNING','WORKER_START',a.workId);
 const q=productionRequest(o,x,a,l);q.inputArtifacts=[dist.authoritativeOutputRef];s.write(q,'batches',b,'work-requests',q.workId+'.json');
 const r=acceptAndRecord(o,s,{workId:q.workId,attemptId:q.attemptId,leaseId:q.leaseId,leaseGeneration:q.leaseGeneration,status:'HUMAN_REQUIRED',observedInputFingerprint:q.authoritativeInputFingerprint,producedArtifacts:[],validationEvidence:[],requestedActions:[{actionId:'device-qa-'+b+'-'+m,type:'DEVICE_QA',question:'実機で表示・入力・設定推測・更新を確認してください。',handoffPath:'production/batches/'+b+'/device-qa/handoff.json',apkLibraryFileId:qa.apk.libraryFileId}],proposedNextState:'HUMAN_REQUIRED',provenance:{inputArtifacts:q.inputArtifacts,appCommit:qa.appCommit,qaRunId:qa.qaRunId}},'batch006-device-qa-handoff','human-device-qa');
 if(r.kind!=='HUMAN_REQUIRED')throw new Error('DEVICE_QA_REQUEST_NOT_REGISTERED:'+m);
}
console.log(JSON.stringify(reconcileBatch(o,s,b)));
