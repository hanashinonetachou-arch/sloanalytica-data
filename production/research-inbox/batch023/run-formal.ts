import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
import {RepoStore,Orchestrator} from '../../src/core.ts';import {initializeBatch,productionRequest,acceptAndRecord,promoteDependencies} from '../../src/runtime.ts';
import {buildEvaluation} from '../../src/evaluation-builder.ts';import {buildEligibility} from '../../src/eligibility-builder.ts';import {buildCandidateContract} from '../../src/candidate-contract-builder.ts';
const s=new RepoStore(process.cwd()),o=new Orchestrator(s),batchId='batch-20261018-023';
const selected=JSON.parse(fs.readFileSync(s.p('next-machine-selection-20261018-batch023.json'),'utf8')).selected;
const spec={batchId,manifestVersion:'8.5',waves:[{waveId:'wave-1',machineIds:selected.slice(0,5).map((m:any)=>m.machineId)},{waveId:'wave-2',machineIds:selected.slice(5).map((m:any)=>m.machineId)}]};
if(!s.exists('batches',batchId)){initializeBatch(s,spec);s.write(spec,'specs',batchId+'.json');s.write(s.read('config','runtime-policy-v8.5.json'),'batches',batchId,'runtime-policy-config.json');}
const sha=(p:string)=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const results:any[]=[];
for(const m of selected){
 const machineId=m.machineId;

 for(const stage of ['RESEARCH','EVALUATION','ELIGIBILITY','CANDIDATE_CONTRACT']){
  promoteDependencies(o,batchId,machineId);let x=o.stage(batchId,machineId,stage);if(x.state==='COMPLETE')continue;
  let q:any;
  if(x.state==='RUNNING'&&x.activeAttemptId&&x.activeLeaseId){
   const files=fs.readdirSync(s.p('batches',batchId,'work-requests'));
   q=files.map(name=>s.read<any>('batches',batchId,'work-requests',name)).find(v=>v.machineId===machineId&&v.stage===stage&&v.attemptId===x.activeAttemptId);
   if(!q)throw Error('ACTIVE_REQUEST_MISSING');
  }else{
   if(x.state!=='READY')throw Error('NOT_READY:'+machineId+':'+stage+':'+x.state);
   const a=o.createAttempt(x),l=o.acquire(x,a,3600000);
   x=o.transition(o.stage(batchId,machineId,stage),'LEASED','DISPATCH',a.workId);x=o.transition(x,'RUNNING','WORKER_START',a.workId);
   q=productionRequest(o,x,a,l,'8.5');s.write(q,'batches',batchId,'work-requests',q.workId+'.json');
  }
  const read=(kind:string)=>{const ref=q.inputArtifacts.find((r:any)=>r.kind===kind);if(!ref)throw Error('MISSING_INPUT:'+kind);return {ref,doc:JSON.parse(fs.readFileSync(s.p(ref.path.replace(/^production\//,'')),'utf8'))};};
  let doc:any;
  if(stage==='RESEARCH'){doc=s.read('research-inbox','batch023','reviewed',machineId+'.json');doc.workId=q.workId;}
  else if(stage==='EVALUATION')doc=buildEvaluation(read('research').doc);
  else if(stage==='ELIGIBILITY')doc=buildEligibility(read('evaluation').doc);
  else{const e=read('evaluation'),g=read('eligibility');doc=buildCandidateContract(e.doc,g.doc,e.ref,g.ref);}
  const rel=['batches',batchId,'artifacts',machineId,stage.toLowerCase(),'result.json'];s.write(doc,...rel);
  const kind=q.expectedOutputs[0].kind,ref={artifactId:kind+'-'+machineId,kind,path:'production/'+rel.join('/'),sha256:sha(s.p(...rel)),producerWorkId:q.workId};
  const r={workId:q.workId,attemptId:q.attemptId,leaseId:q.leaseId,leaseGeneration:q.leaseGeneration,status:'SUCCESS',observedInputFingerprint:q.authoritativeInputFingerprint,producedArtifacts:[ref],validationEvidence:[],requestedActions:[],proposedNextState:'COMPLETE',provenance:{adapter:'batch023-sequential-formal-v1',scope:'through CANDIDATE_CONTRACT; no runtime or distribution'}};
  const accepted=acceptAndRecord(o,s,r as any,'batch023-sequential-formal-v1','deterministic');if(accepted.kind!=='COMMITTED')throw Error('REJECTED:'+machineId+':'+stage+':'+accepted.kind);
  promoteDependencies(o,batchId,machineId);console.log(JSON.stringify({machineId,stage,result:accepted.kind}));
 }
 const c=s.read<any>('batches',batchId,'artifacts',machineId,'candidate_contract','result.json');
 results.push({machineId,machineName:m.displayName,status:'CANDIDATE_CONTRACT_COMPLETE',candidates:c.candidates.length,numericalRoutes:c.candidates.filter((x:any)=>x.runtimeInferenceAllowed).map((x:any)=>({findingId:x.findingId,label:x.label,metric:x.runtimePolicyBinding})),evidenceGroups:c.evidenceCandidates.length,closedBlocks:c.blockedItems.length,QA:'NOT_PERFORMED'});
 s.write(results,'research-inbox','batch023','formal-summary.json');
}
