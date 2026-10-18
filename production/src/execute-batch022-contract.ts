import fs from 'node:fs';
import crypto from 'node:crypto';
import {RepoStore,Orchestrator} from './core.ts';
import {productionRequest,acceptAndRecord,promoteDependencies} from './runtime.ts';
import {buildEvaluation} from './evaluation-builder.ts';
import {buildEligibility} from './eligibility-builder.ts';
import {buildCandidateContract} from './candidate-contract-builder.ts';
// Bounded batch adapter. The user authorizes all ten through Contract; no
// Distribution-based wave barrier is required for this research-only request.
// Existing lease/CAS, validators, evaluators and thresholds remain unchanged.
const s=new RepoStore(process.cwd()),o=new Orchestrator(s),batchId='batch-20261018-022';
const spec=s.read<any>('batches',batchId,'batch.json'),cfg=s.read<any>('config','orchestrator.json');
const machines=spec.waves.flatMap((w:any)=>w.machineIds);
const readRef=(r:any)=>s.read(...String(r.path).replace(/^production\//,'').split('/'));
const log:any[]=[];
for(const machineId of machines){
 for(const stage of ['RESEARCH','EVALUATION','ELIGIBILITY','CANDIDATE_CONTRACT']){
  let x=o.stage(batchId,machineId,stage);
  if(x.state==='COMPLETE'){log.push({machineId,stage,result:'ALREADY_COMPLETE'});continue;}
  if(x.state!=='READY')throw Error('NOT_READY:'+machineId+':'+stage+':'+x.state);
  const a=o.createAttempt(x),l=o.acquire(x,a,300000);
  x=o.transition(o.stage(batchId,machineId,stage),'LEASED','DISPATCH',a.workId);
  x=o.transition(x,'RUNNING','WORKER_START',a.workId);
  const q=productionRequest(o,x,a,l,cfg.manifestVersion);
  s.write(q,'batches',batchId,'work-requests',q.workId+'.json');
  const research=stage==='RESEARCH'?s.read<any>('research-inbox/batch022/reviewed',machineId+'.json'):s.read<any>('batches',batchId,'artifacts',machineId,'research','result.json');
  let doc:any;
  if(stage==='RESEARCH')doc={...research,workId:q.workId,researchStage:'SOURCE_REVIEW_COMPLETE'};
  else if(stage==='EVALUATION')doc=buildEvaluation(research);
  else if(stage==='ELIGIBILITY')doc=buildEligibility(readRef(q.inputArtifacts.find((r:any)=>r.kind==='evaluation')));
  else{
   const eRef=q.inputArtifacts.find((r:any)=>r.kind==='evaluation'),gRef=q.inputArtifacts.find((r:any)=>r.kind==='eligibility');
   doc=buildCandidateContract(readRef(eRef),readRef(gRef),eRef,gRef);
   // Selection owns these machine-readable prerequisites. Carry them into the
   // contract now; no UI/runtime implementation is claimed by this adapter.
   doc.observationPrerequisites=(research.findings??[]).filter((f:any)=>f.settingDistribution&&f.observationType!=='reference_distribution').map((f:any)=>({findingId:f.findingId,trialUniverse:f.trialUniverse,denominatorSemantics:f.denominatorSemantics,liveObservation:f.liveObservation,observationContext:f.observationContext??null,conditionalStateModel:f.conditionalStateModel??null,operationalCounting:f.operationalCounting??null,mirrorsEvidenceFindingId:f.mirrorsEvidenceFindingId??null,categoricalEvidenceReconciliation:f.categoricalEvidenceReconciliation??null,sourceIds:f.sourceIds,unknownRequiredInput:'DISABLE_THIS_FINDING_ONLY',zeroVsUnobserved:'PRESERVE'}));
   doc.scopeBoundary={through:'CANDIDATE_CONTRACT',observationEvidenceGenerated:false,implementation:false,distribution:false,apk:false,qa:false};
  }
  const rel=['batches',batchId,'artifacts',machineId,stage.toLowerCase(),'result.json'];
  s.write(doc,...rel);
  const ref={artifactId:q.expectedOutputs[0].kind+'-'+machineId,kind:q.expectedOutputs[0].kind,path:'production/'+rel.join('/'),sha256:crypto.createHash('sha256').update(fs.readFileSync(s.p(...rel))).digest('hex'),producerWorkId:q.workId};
  const result:any={workId:q.workId,attemptId:q.attemptId,leaseId:q.leaseId,leaseGeneration:q.leaseGeneration,status:'SUCCESS',observedInputFingerprint:q.authoritativeInputFingerprint,producedArtifacts:[ref],validationEvidence:[],requestedActions:[],proposedNextState:'COMPLETE',provenance:{inputArtifacts:q.inputArtifacts,worker:'batch022-bounded-contract-adapter'}};
  const accepted=acceptAndRecord(o,s,result,'batch022-bounded-contract-adapter','existing-production-validators');
  if(accepted.kind!=='COMMITTED')throw Error('NOT_COMMITTED:'+stage+':'+accepted.kind);
  promoteDependencies(o,batchId,machineId);
  log.push({machineId,stage,result:accepted.kind,artifact:ref,validation:result.validationEvidence});
  console.log(JSON.stringify({machineId,stage,status:'COMPLETE'}));
 }
}
s.write({batchId,through:'CANDIDATE_CONTRACT',entries:log},'batches',batchId,'validation','formal-completion.json');
