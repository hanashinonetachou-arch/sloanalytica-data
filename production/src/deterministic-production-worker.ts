import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {RepoStore,Orchestrator} from './core.ts';
import {productionRequest,acceptAndRecord,promoteDependencies,reconcileBatch,scheduleByKind} from './runtime.ts';
import {buildEvaluation} from './evaluation-builder.ts';
import {buildEligibility} from './eligibility-builder.ts';
import {buildCandidateContract} from './candidate-contract-builder.ts';
import {buildObservationEvidence} from './observation-evidence-builder.ts';
import {buildCanonicalUi} from './canonical-ui-builder.ts';
import {buildMachineData} from './machine-data-builder.ts';
import {buildRuntimePolicy} from './runtime-policy-builder.ts';
import {buildRuntimeProjection} from './runtime-projection-builder.ts';
import {buildDistribution} from './distribution-builder.ts';
import {buildAppRuntime} from './app-runtime-builder.ts';
import type {WorkRequest,WorkResult} from './core.ts';

const batchId=process.argv[2];
const throughFlag=process.argv[3]==='--through'?process.argv[4]:undefined;
const stageOrder=['RESEARCH','EVALUATION','ELIGIBILITY','CANDIDATE_CONTRACT','OBSERVATION_EVIDENCE','CANONICAL_UI','MACHINE_DATA','RUNTIME_POLICY','RUNTIME_PROJECTION','APP_RUNTIME','DISTRIBUTION','DEVICE_QA'];
if(!batchId) throw new Error('USAGE: deterministic-production-worker <batch-id> [--through <stage>]');
if(throughFlag&&!stageOrder.includes(throughFlag)) throw new Error('INVALID_THROUGH_STAGE:'+throughFlag);
const withinThrough=(stage:string)=>!throughFlag||stageOrder.indexOf(stage)<=stageOrder.indexOf(throughFlag);
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
 if(q.stage==='EVALUATION'){const rRef=q.inputArtifacts.find((x:any)=>x.kind==='research');doc=buildEvaluation(readRef(rRef));
 } else if(q.stage==='ELIGIBILITY'){const eRef=q.inputArtifacts.find((x:any)=>x.kind==='evaluation');doc=buildEligibility(readRef(eRef));
 } else if(q.stage==='CANDIDATE_CONTRACT'){const eRef=q.inputArtifacts.find((x:any)=>x.kind==='evaluation'),gRef=q.inputArtifacts.find((x:any)=>x.kind==='eligibility');doc=buildCandidateContract(readRef(eRef),readRef(gRef),eRef,gRef);
 } else if(q.stage==='OBSERVATION_EVIDENCE'){
   const cRef=q.inputArtifacts.find((x:any)=>x.kind==='candidate-contract'); const rRef=q.inputArtifacts.find((x:any)=>x.kind==='research');
   doc=buildObservationEvidence(readRef(cRef),readRef(rRef),cRef);
 } else if(q.stage==='CANONICAL_UI'){
   const cRef=q.inputArtifacts.find((x:any)=>x.kind==='candidate-contract'); const oRef=q.inputArtifacts.find((x:any)=>x.kind==='observation-evidence'); const eRef=q.inputArtifacts.find((x:any)=>x.kind==='evaluation');
   doc=buildCanonicalUi(readRef(cRef),readRef(oRef),readRef(eRef),cRef,oRef,eRef);
 } else if(q.stage==='MACHINE_DATA'){
   const uRef=q.inputArtifacts.find((x:any)=>x.kind==='canonical-ui'); const cRef=q.inputArtifacts.find((x:any)=>x.kind==='candidate-contract'); const oRef=q.inputArtifacts.find((x:any)=>x.kind==='observation-evidence'); const rRef=q.inputArtifacts.find((x:any)=>x.kind==='research');
   doc=buildMachineData(readRef(uRef),readRef(cRef),readRef(oRef),uRef,cRef,oRef,readRef(rRef),rRef);
 } else if(q.stage==='RUNTIME_POLICY'){
   const mdRef=q.inputArtifacts.find((x:any)=>x.kind==='machine-data'); const md=readRef(mdRef);
   const cfgRef=q.inputArtifacts.find((x:any)=>x.kind==='runtime-policy-config'); const policy=cfgRef?readRef(cfgRef):null;
   doc=buildRuntimePolicy(md,policy,mdRef,cfgRef??null);
 } else if(q.stage==='RUNTIME_PROJECTION'){
   const mdRef=q.inputArtifacts.find((x:any)=>x.kind==='machine-data'); const rpRef=q.inputArtifacts.find((x:any)=>x.kind==='runtime-policy');
   doc=buildRuntimeProjection(readRef(mdRef),readRef(rpRef),mdRef,rpRef);
 } else if(q.stage==='APP_RUNTIME'){
   const rpRef=q.inputArtifacts.find((x:any)=>x.kind==='runtime-projection'); doc=buildAppRuntime(readRef(rpRef),rpRef);
 } else if(q.stage==='DISTRIBUTION'){
   const arRef=q.inputArtifacts.find((x:any)=>x.kind==='app-runtime'); const att=JSON.parse(fs.readFileSync(s.p('batches',batchId,'distribution-repair-attestation.json'),'utf8')); const pkg=att.packages?.[q.machineId]; if(!pkg)throw new Error('DISTRIBUTION_ATTESTATION_PACKAGE_REQUIRED:'+q.machineId); doc=buildDistribution(readRef(arRef),arRef,{integration:att.integration,package:pkg,checks:att.checks});
 } else throw new Error(`UNSUPPORTED_PRODUCTION_STAGE:${q.stage}`);
 const ref=writeArtifact(q,doc);
 return {workId:q.workId,attemptId:q.attemptId,leaseId:q.leaseId,leaseGeneration:q.leaseGeneration,status:'SUCCESS',observedInputFingerprint:q.authoritativeInputFingerprint,producedArtifacts:[ref],validationEvidence:[],requestedActions:[],proposedNextState:'COMPLETE',provenance:{inputArtifacts:q.inputArtifacts,worker:'deterministic-production-worker-v1'}};
}
const completed:any[]=[];
for(let guard=0;guard<100;guard++){
 reconcileBatch(o,s,batchId);
 const semantic=scheduleByKind(o,s,batchId,cfg.concurrency,'SEMANTIC').filter((x:any)=>['EVALUATION','ELIGIBILITY','CANDIDATE_CONTRACT','OBSERVATION_EVIDENCE','CANONICAL_UI'].includes(x.name));
 const production=scheduleByKind(o,s,batchId,cfg.concurrency,'PRODUCTION');
 const selected=[...semantic,...production].filter((candidate:any)=>withinThrough(candidate.name));
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
console.log(JSON.stringify({batchId,through:throughFlag??'DISTRIBUTION',completed},null,2));
