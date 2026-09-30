import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {RepoStore,Orchestrator} from './core.ts';
import {productionRequest,acceptAndRecord,promoteDependencies,reconcileBatch,scheduleByKind} from './runtime.ts';
import {buildRuntimePolicy} from './runtime-policy-builder.ts';
import {buildRuntimeProjection} from './runtime-projection-builder.ts';
import {buildAppRuntime} from './app-runtime-builder.ts';
import type {WorkRequest,WorkResult} from './core.ts';

const batchId=process.argv[2];
if(!batchId) throw new Error('USAGE: deterministic-production-worker <batch-id>');
const s=new RepoStore(process.cwd());
const o=new Orchestrator(s);
const cfg=JSON.parse(fs.readFileSync(s.p('config','orchestrator.json'),'utf8'));
const readRef=(r:any)=>JSON.parse(fs.readFileSync(s.p(String(r.path).replace(/^production\//,'')),'utf8'));
const sha=(p:string)=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
function writeArtifact(q:WorkRequest,doc:any){
 const kind=q.expectedOutputs[0].kind; const rel=`batches/${batchId}/artifacts/${q.machineId}/${q.stage.toLowerCase()}/result.json`; const full=s.p(rel);
 fs.mkdirSync(path.dirname(full),{recursive:true}); fs.writeFileSync(full,JSON.stringify(doc,null,2)+'\n');
 return {artifactId:`${kind}-${q.machineId}`,kind,path:`production/${rel}`,sha256:sha(full),producerWorkId:q.workId};
}
function execute(q:WorkRequest):WorkResult{
 let doc:any;
 if(q.stage==='RUNTIME_POLICY'){
   const mdRef=q.inputArtifacts.find((x:any)=>x.kind==='machine-data'); const md=readRef(mdRef);
   const cfgRef=q.inputArtifacts.find((x:any)=>x.kind==='runtime-policy-config'); const policy=cfgRef?readRef(cfgRef):null;
   doc=buildRuntimePolicy(md,policy,mdRef,cfgRef??null);
 } else if(q.stage==='RUNTIME_PROJECTION'){
   const mdRef=q.inputArtifacts.find((x:any)=>x.kind==='machine-data'); const rpRef=q.inputArtifacts.find((x:any)=>x.kind==='runtime-policy');
   doc=buildRuntimeProjection(readRef(mdRef),readRef(rpRef),mdRef,rpRef);
 } else if(q.stage==='APP_RUNTIME'){
   const rpRef=q.inputArtifacts.find((x:any)=>x.kind==='runtime-projection'); doc=buildAppRuntime(readRef(rpRef),rpRef);
 } else throw new Error(`UNSUPPORTED_PRODUCTION_STAGE:${q.stage}`);
 const ref=writeArtifact(q,doc);
 return {workId:q.workId,attemptId:q.attemptId,leaseId:q.leaseId,leaseGeneration:q.leaseGeneration,status:'SUCCESS',observedInputFingerprint:q.authoritativeInputFingerprint,producedArtifacts:[ref],validationEvidence:[],requestedActions:[],proposedNextState:'COMPLETE',provenance:{inputArtifacts:q.inputArtifacts,worker:'deterministic-production-worker-v1'}};
}
const completed:any[]=[];
for(let guard=0;guard<100;guard++){
 reconcileBatch(o,s,batchId);
 const selected=scheduleByKind(o,s,batchId,cfg.concurrency,'PRODUCTION');
 if(selected.length===0) break;
 for(const candidate of selected){
   let x=o.stage(batchId,candidate.machineId,candidate.name); const a=o.createAttempt(x); const l=o.acquire(x,a,300000);
   x=o.transition(o.stage(batchId,candidate.machineId,candidate.name),'LEASED','DISPATCH',a.workId); x=o.transition(x,'RUNNING','WORKER_START',a.workId);
   const q=productionRequest(o,x,a,l,cfg.manifestVersion); s.write(q,'batches',batchId,'work-requests',q.workId+'.json');
   const accepted=acceptAndRecord(o,s,execute(q),'deterministic-production-worker-v1','deterministic');
   if(accepted.kind!=='COMMITTED') throw new Error(`PRODUCTION_NOT_COMMITTED:${candidate.machineId}:${candidate.name}:${accepted.kind}`);
   promoteDependencies(o,batchId,candidate.machineId); completed.push({machineId:candidate.machineId,stage:candidate.name,workId:q.workId});
 }
}
reconcileBatch(o,s,batchId);
console.log(JSON.stringify({batchId,completed},null,2));
