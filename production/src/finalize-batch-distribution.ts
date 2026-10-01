import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {RepoStore,Orchestrator} from './core.ts';
import {productionRequest,acceptAndRecord,promoteDependencies,reconcileBatch} from './runtime.ts';
import {buildDistribution} from './distribution-builder.ts';

const batchId=process.argv[2];
const attestationPath=process.argv[3];
const waveId=process.argv[4]??'wave-1';
if(!batchId||!attestationPath)throw new Error('USAGE: finalize-batch-distribution <batch-id> <attestation.json> [wave-id]');
const s=new RepoStore(process.cwd());
const o=new Orchestrator(s);
const spec=s.read<any>('batches',batchId,'batch.json');
const wave=spec.waves?.find((w:any)=>w.waveId===waveId);
if(!wave)throw new Error('UNKNOWN_WAVE:'+waveId);
const targets=wave.machineIds??[];
const all=JSON.parse(fs.readFileSync(path.resolve(attestationPath),'utf8'));
if(all.batchId!==batchId||!all.integration||!all.checks||!all.packages)throw new Error('INVALID_DISTRIBUTION_ATTESTATION');
const sha=(p:string)=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');

reconcileBatch(o,s,batchId);
for(const machineId of targets){
  let x=o.stage(batchId,machineId,'DISTRIBUTION');
  if(x.state==='COMPLETE')continue;
  if(x.state!=='READY')throw new Error('DISTRIBUTION_NOT_READY:'+machineId+':'+x.state);
  const a=o.createAttempt(x),l=o.acquire(x,a,300000);
  x=o.transition(o.stage(batchId,machineId,'DISTRIBUTION'),'LEASED','DISPATCH',a.workId);
  x=o.transition(x,'RUNNING','WORKER_START',a.workId);
  const q=productionRequest(o,x,a,l);
  const ar=q.inputArtifacts.find((z:any)=>z.kind==='app-runtime');
  if(!ar?.path)throw new Error('APP_RUNTIME_REF_MISSING:'+machineId);
  const app=s.read<any>(...String(ar.path).replace(/^production\//,'').split('/'));
  const pkg=all.packages[machineId];
  if(!pkg)throw new Error('PACKAGE_ATTESTATION_MISSING:'+machineId);
  const doc=buildDistribution(app,ar,{
    integration:{...all.integration,packagePath:'machines/'+machineId+'/machine-package.json',catalogPath:'catalog.json'},
    package:pkg,
    checks:all.checks,
  });
  const rel='batches/'+batchId+'/artifacts/'+machineId+'/distribution/result.json';
  const full=s.p(rel);
  fs.mkdirSync(path.dirname(full),{recursive:true});
  fs.writeFileSync(full,JSON.stringify(doc,null,2)+'\n');
  const ref={artifactId:'distribution-'+machineId,kind:'distribution',path:'production/'+rel,sha256:sha(full),producerWorkId:q.workId};
  const r:any={workId:q.workId,attemptId:q.attemptId,leaseId:q.leaseId,leaseGeneration:q.leaseGeneration,status:'SUCCESS',observedInputFingerprint:q.authoritativeInputFingerprint,producedArtifacts:[ref],validationEvidence:[],requestedActions:[],proposedNextState:'COMPLETE',provenance:{inputArtifacts:q.inputArtifacts,worker:'batch-distribution-integration-v1'}};
  const accepted=acceptAndRecord(o,s,r,'batch-distribution-integration-v1','distribution-v1');
  if(accepted.kind!=='COMMITTED')throw new Error('DISTRIBUTION_NOT_COMMITTED:'+machineId+':'+accepted.kind);
  promoteDependencies(o,batchId,machineId);
}
console.log(JSON.stringify(reconcileBatch(o,s,batchId),null,2));
