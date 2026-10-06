import fs from 'node:fs';
import crypto from 'node:crypto';
import {RepoStore,Orchestrator} from './core.ts';
import {productionRequest,acceptAndRecord,promoteDependencies,reconcileBatch} from './runtime.ts';
import {buildAppRuntime} from './app-runtime-builder.ts';

const b='batch-20261005-006',s=new RepoStore(process.cwd()),o=new Orchestrator(s);
const checkpoint=s.read<any>('batches',b,'integration-checkpoints','checkpoint.json');
const ids=s.read<any>('batches',b,'batch.json').waves.flatMap((w:any)=>w.machineIds);
// Verify deterministic reproduction for every target before changing any stage.
for(const m of ids){
 const pr=o.stage(b,m,'RUNTIME_PROJECTION').authoritativeOutputRef;
 const proj=s.read<any>(...pr.path.replace(/^production\//,'').split('/'));
 const bytes=Buffer.from(JSON.stringify(buildAppRuntime(proj,pr),null,2)+'\n');
 if(crypto.createHash('sha256').update(bytes).digest('hex')!==checkpoint.distribution.packages[m].sourceArtifact.sha256)throw new Error('CHECKPOINT_HASH_MISMATCH:'+m);
}
for(const m of ids){
 let x=o.stage(b,m,'APP_RUNTIME');
 if(x.state==='COMPLETE'&&x.authoritativeOutputRef.sha256===checkpoint.distribution.packages[m].sourceArtifact.sha256)continue;
 if(x.state!=='COMPLETE')throw new Error('UNEXPECTED_APP_RUNTIME_STATE:'+m);
 o.reconcile(b,m,'APP_RUNTIME');
 x=o.transition(o.stage(b,m,'APP_RUNTIME'),'READY','AUTHORITATIVE_OUTPUT_INVALIDATED','batch006-shared-evidence-r2-recovery');
 const a=o.createAttempt(x),l=o.acquire(x,a,300000);
 x=o.transition(o.stage(b,m,'APP_RUNTIME'),'LEASED','DISPATCH',a.workId);
 x=o.transition(x,'RUNNING','WORKER_START',a.workId);
 const q=productionRequest(o,x,a,l);s.write(q,'batches',b,'work-requests',q.workId+'.json');
 const pr=q.inputArtifacts[0],proj=s.read<any>(...pr.path.replace(/^production\//,'').split('/'));
 const doc=buildAppRuntime(proj,pr),rel='batches/'+b+'/artifacts/'+m+'/app_runtime/result.json';
 s.write(doc,...rel.split('/'));
 const ref={artifactId:'app-runtime-'+m,kind:'app-runtime',path:'production/'+rel,sha256:crypto.createHash('sha256').update(fs.readFileSync(s.p(rel))).digest('hex'),producerWorkId:q.workId};
 const result=acceptAndRecord(o,s,{workId:q.workId,attemptId:q.attemptId,leaseId:q.leaseId,leaseGeneration:q.leaseGeneration,status:'SUCCESS',observedInputFingerprint:q.authoritativeInputFingerprint,producedArtifacts:[ref],validationEvidence:[],requestedActions:[],proposedNextState:'COMPLETE',provenance:{inputArtifacts:q.inputArtifacts}},'batch006-r2-runtime-recovery','app-runtime-v1');
 if(result.kind!=='COMMITTED')throw new Error('APP_RUNTIME_NOT_COMMITTED:'+m);
 let d=o.reconcile(b,m,'DISTRIBUTION');
 if(d.state==='WAIT_EXTERNAL')o.transition(d,'READY','EXTERNAL_RESULT_AVAILABLE','batch006-r2-integration-success');
 else if(d.state==='COMPLETE')o.transition(d,'READY','AUTHORITATIVE_OUTPUT_INVALIDATED','batch006-shared-evidence-r2-recovery');
 else if(d.state!=='READY')throw new Error('UNEXPECTED_DISTRIBUTION_STATE:'+m);
 promoteDependencies(o,b,m);
 console.log(m,ref.sha256);
}
console.log(JSON.stringify(reconcileBatch(o,s,b)));
