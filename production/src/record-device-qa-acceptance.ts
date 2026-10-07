import fs from 'node:fs';
import crypto from 'node:crypto';
import {RepoStore,Orchestrator} from './core.ts';
import {productionRequest,acceptAndRecord} from './runtime.ts';
const batchId=process.argv[2],s=new RepoStore(process.cwd()),o=new Orchestrator(s);
if(!batchId)throw Error('BATCH_ID_REQUIRED');
const ids=s.read<any>('batches',batchId,'batch.json').waves.flatMap((w:any)=>w.machineIds);
const decision={schemaVersion:'device-qa-acceptance-v1',batchId,status:'PASS',acceptedBy:'USER',acceptedAt:'2026-10-07',statement:'今回の機種調査は問題ありませんでした。',source:'User-authorized attached handoff 20261007-125207',appCommit:'3bef2eadbc17dca47de7a60a698c6b65aea543bb',distributionCommit:'c3728e85d36517898fe25c7ae6cf039f83a58e06',qaRunId:'37548381546',versionCode:2002787132,machineIds:ids};
s.write(decision,'batches',batchId,'device-qa','acceptance.json');
for(const machineId of ids){
 if(o.stage(batchId,machineId,'DISTRIBUTION').state!=='COMPLETE')throw Error('DISTRIBUTION_REQUIRED:'+machineId);
 let x=o.stage(batchId,machineId,'DEVICE_QA'); if(x.state==='COMPLETE')continue;
 if(x.state==='PENDING')x=o.transition(x,'READY','DEPENDENCY_COMPLETE','DISTRIBUTION');
 if(x.state==='HUMAN_REQUIRED'){x.humanResolved=true;o.saveStage(x);x=o.reconcile(batchId,machineId,'DEVICE_QA');}
 if(x.state!=='READY')throw Error('UNEXPECTED_QA_STATE:'+x.state);
 const a=o.createAttempt(x),l=o.acquire(x,a,300000);
 x=o.transition(o.stage(batchId,machineId,'DEVICE_QA'),'LEASED','DISPATCH',a.workId);
 x=o.transition(x,'RUNNING','WORKER_START',a.workId);
 const q=productionRequest(o,x,a,l);s.write(q,'batches',batchId,'work-requests',q.workId+'.json');
 const p=`batches/${batchId}/artifacts/${machineId}/device_qa/result.json`;
 s.write({...decision,machineId,workId:q.workId},p);
 const ref={artifactId:'device-qa-'+machineId,kind:'device-qa',path:'production/'+p,sha256:crypto.createHash('sha256').update(fs.readFileSync(s.p(p))).digest('hex'),producerWorkId:q.workId};
 const r=acceptAndRecord(o,s,{workId:q.workId,attemptId:q.attemptId,leaseId:q.leaseId,leaseGeneration:q.leaseGeneration,status:'SUCCESS',observedInputFingerprint:q.authoritativeInputFingerprint,producedArtifacts:[ref],validationEvidence:[{validator:'human-device-qa',ok:true,decisionPath:`production/batches/${batchId}/device-qa/acceptance.json`}],requestedActions:[],proposedNextState:'COMPLETE',provenance:{userDecision:decision.statement}},'user-device-qa-acceptance','human-device-qa');
 if(r.kind!=='COMMITTED')throw Error('QA_NOT_COMMITTED:'+machineId);
}
console.log(JSON.stringify({batchId,status:'DEVICE_QA_PASS',count:ids.length}));
