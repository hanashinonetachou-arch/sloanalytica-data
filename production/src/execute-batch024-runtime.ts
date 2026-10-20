import fs from 'node:fs';
import {applyBatch024Presentation} from '../research-inbox/batch024/runtime-presentation.ts';
import crypto from 'node:crypto';
import {RepoStore,Orchestrator} from './core.ts';
import {productionRequest,acceptAndRecord,promoteDependencies} from './runtime.ts';
import {buildObservationEvidence} from './observation-evidence-builder.ts';
import {buildCanonicalUi} from './canonical-ui-builder.ts';
import {buildMachineData} from './machine-data-builder.ts';
import {buildRuntimePolicy} from './runtime-policy-builder.ts';
import {buildRuntimeProjection} from './runtime-projection-builder.ts';
import {buildAppRuntime} from './app-runtime-builder.ts';
// Bounded batch adapter. User continuation authorizes ten machines through
// runtime and distribution; build each wave before the shared integration check.
// Existing lease/CAS, validators, evaluators and thresholds remain unchanged.
const s=new RepoStore(process.cwd()),o=new Orchestrator(s),batchId='batch-20261019-024';
const spec=s.read<any>('batches',batchId,'batch.json'),cfg=s.read<any>('config','orchestrator.json');
const machines=spec.waves.flatMap((w:any)=>w.machineIds);
const readRef=(r:any)=>s.read(...String(r.path).replace(/^production\//,'').split('/'));
const log:any[]=s.exists('batches',batchId,'validation','runtime-completion.json')?s.read<any>('batches',batchId,'validation','runtime-completion.json').entries:[];
const index=Number(process.argv[2]);if(!Number.isInteger(index)||index<1||index>machines.length)throw Error('MACHINE_INDEX_REQUIRED');
for(const prior of machines.slice(0,index-1))if(o.stage(batchId,prior,'APP_RUNTIME').state!=='COMPLETE')throw Error('PREVIOUS_MACHINE_NOT_COMPLETE:'+prior);
for(const machineId of machines.slice(index-1,index)){
 for(const stage of ['OBSERVATION_EVIDENCE','CANONICAL_UI','MACHINE_DATA','RUNTIME_POLICY','RUNTIME_PROJECTION','APP_RUNTIME']){
  let x=o.stage(batchId,machineId,stage);
  if(x.state==='COMPLETE'){log.push({machineId,stage,result:'ALREADY_COMPLETE'});continue;}
  let q:any;
  if(x.state==='RUNNING'&&x.activeAttemptId){
   q=fs.readdirSync(s.p('batches',batchId,'work-requests')).map(f=>s.read<any>('batches',batchId,'work-requests',f)).find(z=>z.machineId===machineId&&z.stage===stage&&z.attemptId===x.activeAttemptId);
   if(!q)throw Error('ACTIVE_REQUEST_MISSING');
  }else{
   if(x.state!=='READY')throw Error('NOT_READY:'+machineId+':'+stage+':'+x.state);
   const a=o.createAttempt(x),l=o.acquire(x,a,3600000);
   x=o.transition(o.stage(batchId,machineId,stage),'LEASED','DISPATCH',a.workId);x=o.transition(x,'RUNNING','WORKER_START',a.workId);
   q=productionRequest(o,x,a,l,cfg.manifestVersion);s.write(q,'batches',batchId,'work-requests',q.workId+'.json');
  }
  const inputRef=(kind:string)=>q.inputArtifacts.find((x:any)=>x.kind===kind);
  const docRef=(kind:string)=>readRef(inputRef(kind));
  let doc:any;
  if(stage==='OBSERVATION_EVIDENCE')doc=buildObservationEvidence(docRef('candidate-contract'),docRef('research'),inputRef('candidate-contract'));
  else if(stage==='CANONICAL_UI')doc=buildCanonicalUi(docRef('candidate-contract'),docRef('observation-evidence'),docRef('evaluation'),inputRef('candidate-contract'),inputRef('observation-evidence'),inputRef('evaluation'));
  else if(stage==='MACHINE_DATA')doc=buildMachineData(docRef('canonical-ui'),docRef('candidate-contract'),docRef('observation-evidence'),inputRef('canonical-ui'),inputRef('candidate-contract'),inputRef('observation-evidence'),docRef('research'),inputRef('research'));
  else if(stage==='RUNTIME_POLICY')doc=buildRuntimePolicy(docRef('machine-data'),docRef('runtime-policy-config'),inputRef('machine-data'),inputRef('runtime-policy-config'));
  else if(stage==='RUNTIME_PROJECTION')doc=buildRuntimeProjection(docRef('machine-data'),docRef('runtime-policy'),inputRef('machine-data'),inputRef('runtime-policy'));
  else {
   doc=buildAppRuntime(docRef('runtime-projection'),inputRef('runtime-projection'));
   const contract=s.read<any>('batches',batchId,'artifacts',machineId,'candidate_contract','result.json');
   doc.package.metadata.observationPrerequisites=structuredClone(contract.observationPrerequisites??[]);
   applyBatch024Presentation(doc.package,index);
   for(const f of doc.package.features.features)f.displayFormat=f.modelType==='binomial'&&String(f.trialUniverse).includes('GAME_TRIAL')?'ratio_1_over_n':'percentage';
  }
  const rel=['batches',batchId,'artifacts',machineId,stage.toLowerCase(),'result.json'];
  s.write(doc,...rel);
  const ref={artifactId:q.expectedOutputs[0].kind+'-'+machineId,kind:q.expectedOutputs[0].kind,path:'production/'+rel.join('/'),sha256:crypto.createHash('sha256').update(fs.readFileSync(s.p(...rel))).digest('hex'),producerWorkId:q.workId};
  const result:any={workId:q.workId,attemptId:q.attemptId,leaseId:q.leaseId,leaseGeneration:q.leaseGeneration,status:'SUCCESS',observedInputFingerprint:q.authoritativeInputFingerprint,producedArtifacts:[ref],validationEvidence:[],requestedActions:[],proposedNextState:'COMPLETE',provenance:{inputArtifacts:q.inputArtifacts,worker:'batch024-bounded-runtime-adapter'}};
  const accepted=acceptAndRecord(o,s,result,'batch024-bounded-runtime-adapter','existing-production-validators');
  if(accepted.kind!=='COMMITTED')throw Error('NOT_COMMITTED:'+stage+':'+accepted.kind);
  promoteDependencies(o,batchId,machineId);
  log.push({machineId,stage,result:accepted.kind,artifact:ref,validation:result.validationEvidence});
  console.log(JSON.stringify({machineId,stage,status:'COMPLETE'}));
 }
}
s.write({batchId,through:'APP_RUNTIME',entries:log},'batches',batchId,'validation','runtime-completion.json');
