import fs from 'node:fs';
import crypto from 'node:crypto';
import {RepoStore,Orchestrator} from './core.ts';
import {productionRequest,acceptAndRecord,promoteDependencies} from './runtime.ts';
import {buildAppRuntime} from './app-runtime-builder.ts';

// Bounded integration adapter: preserve the accepted statistical models and add
// the record path for observations whose day-history condition is unknown.
const s=new RepoStore(process.cwd()),o=new Orchestrator(s),batchId='batch-20261017-020';
const spec=s.read<any>('batches',batchId,'batch.json'),cfg=s.read<any>('config','orchestrator.json');
const machines=spec.waves.flatMap((w:any)=>w.machineIds),log:any[]=[];
for(const machineId of machines){
 let x=o.stage(batchId,machineId,'APP_RUNTIME');
 if(x.state==='COMPLETE'){
  s.append({machineId,stage:x.name,oldArtifact:x.authoritativeOutputRef,reason:'Preserve unknown-history exact/record path and game-rate presentation'},'batches',batchId,'runtime-integration-repairs.jsonl');
  x=o.transition(x,'READY','AUTHORITATIVE_OUTPUT_INVALIDATED','batch020-runtime-integration');
  delete x.authoritativeOutputRef;delete x.activeAttemptId;delete x.activeLeaseId;o.saveStage(x);
 }
 if(x.state==='RUNNING'){const lease=s.read<any>('batches',batchId,'leases',x.activeLeaseId+'.json');lease.status='REVOKED';s.write(lease,'batches',batchId,'leases',lease.leaseId+'.json');x=o.transition(x,'RETRY_WAIT','INTEGRATION_VALIDATION_FIX','batch020-runtime-integration');x=o.transition(x,'READY','RECONCILE','batch020-runtime-integration');delete x.activeAttemptId;delete x.activeLeaseId;o.saveStage(x);}
 if(x.state!=='READY')throw Error('RUNTIME_NOT_READY:'+machineId);
 const a=o.createAttempt(x),l=o.acquire(x,a,300000);
 x=o.transition(o.stage(batchId,machineId,x.name),'LEASED','DISPATCH',a.workId);x=o.transition(x,'RUNNING','WORKER_START',a.workId);
 const q=productionRequest(o,x,a,l,cfg.manifestVersion);s.write(q,'batches',batchId,'work-requests',q.workId+'.json');
 const ref=q.inputArtifacts.find((r:any)=>r.kind==='runtime-projection');
 const projection=s.read<any>(...ref.path.replace(/^production\//,'').split('/'));
 const doc=buildAppRuntime(projection,ref),pkg=doc.package;
 const contract=s.read<any>('batches',batchId,'artifacts',machineId,'candidate_contract','result.json');
 const prerequisites=contract.observationPrerequisites??[];
 (pkg.metadata as any).observationPrerequisites=structuredClone(prerequisites);
 for(const f of pkg.features.features)f.displayFormat=f.modelType==='binomial'&&String(f.trialUniverse).includes('GAME_TRIAL')?'ratio_1_over_n':'percentage';
 if(machineId==='L_SHINOBIDAMASHII3_A3')for(const sec of pkg.ui.v8Sections){if(/^OBS_M06-N(?:1[5-9]|20)$/.test(sec.id))sec.tabGroup={id:'SHINOBI_ROLE_BONUS',title:'AT中の役別ボーナス当選',label:sec.title.replace('からボーナス','')};}
 const rel=['batches',batchId,'artifacts',machineId,'app_runtime','result.json'];s.write(doc,...rel);
 const artifact={artifactId:'app-runtime-'+machineId,kind:'app-runtime',path:'production/'+rel.join('/'),sha256:crypto.createHash('sha256').update(fs.readFileSync(s.p(...rel))).digest('hex'),producerWorkId:q.workId};
 const result:any={workId:q.workId,attemptId:q.attemptId,leaseId:q.leaseId,leaseGeneration:q.leaseGeneration,status:'SUCCESS',observedInputFingerprint:q.authoritativeInputFingerprint,producedArtifacts:[artifact],validationEvidence:[],requestedActions:[],proposedNextState:'COMPLETE',provenance:{inputArtifacts:q.inputArtifacts,worker:'batch020-runtime-integration'}};
 const accepted=acceptAndRecord(o,s,result,'batch020-runtime-integration','existing-production-validators');if(accepted.kind!=='COMMITTED')throw Error('RUNTIME_NOT_COMMITTED:'+machineId+':'+accepted.kind);
 promoteDependencies(o,batchId,machineId);log.push({machineId,status:'COMPLETE',artifact,validation:result.validationEvidence});
}
s.write({batchId,entries:log},'batches',batchId,'validation','runtime-completion.json');console.log(JSON.stringify({status:'PASS',machines:log.length}));
