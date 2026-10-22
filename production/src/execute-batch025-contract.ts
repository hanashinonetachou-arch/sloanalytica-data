import fs from 'node:fs';
import crypto from 'node:crypto';
import {RepoStore,Orchestrator} from './core.ts';
import {initializeBatch,productionRequest,acceptAndRecord,promoteDependencies} from './runtime.ts';
import {buildEvaluation} from './evaluation-builder.ts';
import {buildEligibility} from './eligibility-builder.ts';
import {buildCandidateContract} from './candidate-contract-builder.ts';
// Sequential research adapter; no changes to validators or statistical policy.
const s=new RepoStore(process.cwd()),o=new Orchestrator(s),id='batch-20261022-025';
const selection=s.read<any>('next-machine-selection-20261022-batch025.json');
const ids=selection.selected.map((x:any)=>x.machineId),action=process.argv[2],machine=process.argv[3];
if(action==='init'){
 if(s.exists('batches',id))throw Error('BATCH_ALREADY_EXISTS');
 const spec={batchId:id,manifestVersion:'8.5',waves:[{waveId:'wave-1',machineIds:ids.slice(0,5)},{waveId:'wave-2',machineIds:ids.slice(5)}]};
 initializeBatch(s,spec);s.write(spec,'specs',id+'.json');
 s.write(s.read('config','runtime-policy-v8.5.json'),'batches',id,'runtime-policy-config.json');
 s.write({authority:'USER_EXPLICIT_INSTRUCTION',productionHead:'e6c5b1a8cc872ca804f2b857bdacc518cea1a1e4',distributionHead:'d711c44083bcce806058abbeab36b697357940c8',existingBatchCount:24,through:'CANDIDATE_CONTRACT',researchSequential:true,allResearchBeforeEvaluation:true,implementation:false,distribution:false,apk:false,qa:false,actionsRuns:0},'batches',id,'scope-authorization.json');
}else{
 const cfg=s.read<any>('config','orchestrator.json');
 const read=(r:any)=>s.read(...r.path.replace(/^production\//,'').split('/'));
 const execute=(m:string,stage:string)=>{
  let x=o.stage(id,m,stage);if(x.state==='COMPLETE')return;
  if(x.state!=='READY'&&x.state!=='RUNNING')throw Error('NOT_READY:'+m+':'+stage+':'+x.state);
  let q:any;
  if(x.state==='RUNNING'){
   q=fs.readdirSync(s.p('batches',id,'work-requests')).map(f=>s.read<any>('batches',id,'work-requests',f)).find(q=>q.machineId===m&&q.stage===stage&&q.attemptId===x.activeAttemptId);
   if(!q)throw Error('ACTIVE_REQUEST_NOT_FOUND');
  }else{
   const a=o.createAttempt(x),l=o.acquire(x,a,300000);
   x=o.transition(o.stage(id,m,stage),'LEASED','DISPATCH',a.workId);x=o.transition(x,'RUNNING','WORKER_START',a.workId);
   q=productionRequest(o,x,a,l,cfg.manifestVersion);s.write(q,'batches',id,'work-requests',q.workId+'.json');
  }
  const research=stage==='RESEARCH'?s.read<any>('research-inbox','batch025','reviewed',m+'.json'):s.read<any>('batches',id,'artifacts',m,'research','result.json');
  let doc:any;
  if(stage==='RESEARCH')doc={...research,workId:q.workId,researchStage:'SOURCE_REVIEW_COMPLETE'};
  else if(stage==='EVALUATION')doc=buildEvaluation(research);
  else if(stage==='ELIGIBILITY')doc=buildEligibility(read(q.inputArtifacts.find((r:any)=>r.kind==='evaluation')));
  else{
   const er=q.inputArtifacts.find((r:any)=>r.kind==='evaluation'),gr=q.inputArtifacts.find((r:any)=>r.kind==='eligibility');
   doc=buildCandidateContract(read(er),read(gr),er,gr);
   doc.observationPrerequisites=research.findings.filter((f:any)=>f.settingDistribution&&f.observationType!=='reference_distribution').map((f:any)=>({findingId:f.findingId,trialUniverse:f.trialUniverse,denominatorSemantics:f.denominatorSemantics,liveObservation:f.liveObservation,observationContext:f.observationContext??null,sourceIds:f.sourceIds,unknownRequiredInput:'DISABLE_THIS_FINDING_ONLY',zeroVsUnobserved:'PRESERVE'}));
   doc.machineSettings=research.settings;doc.uiRequirements=research.uiRequirements;doc.originalCandidateReconciliation=research.originalCandidateReconciliation;
   doc.scopeBoundary={through:'CANDIDATE_CONTRACT',implementation:false,distribution:false,apk:false,qa:false};
  }
  const rel=['batches',id,'artifacts',m,stage.toLowerCase(),'result.json'];s.write(doc,...rel);
  const ref={artifactId:q.expectedOutputs[0].kind+'-'+m,kind:q.expectedOutputs[0].kind,path:'production/'+rel.join('/'),sha256:crypto.createHash('sha256').update(fs.readFileSync(s.p(...rel))).digest('hex'),producerWorkId:q.workId};
  const result:any={workId:q.workId,attemptId:q.attemptId,leaseId:q.leaseId,leaseGeneration:q.leaseGeneration,status:'SUCCESS',observedInputFingerprint:q.authoritativeInputFingerprint,producedArtifacts:[ref],validationEvidence:[],requestedActions:[],proposedNextState:'COMPLETE',provenance:{inputArtifacts:q.inputArtifacts,worker:'batch025-sequential-bounded-adapter'}};
  const accepted=acceptAndRecord(o,s,result,'batch025-sequential-bounded-adapter','existing-production-validators');
  if(accepted.kind!=='COMMITTED')throw Error('NOT_COMMITTED:'+JSON.stringify(accepted));
  promoteDependencies(o,id,m);
  s.write({machineId:m,stage,artifact:ref,validation:result.validationEvidence,completedAt:new Date().toISOString()},'batches',id,'validation',m+'-'+stage+'.json');
  console.log(JSON.stringify({machineId:m,stage,status:'COMPLETE',validation:result.validationEvidence}));
 };
 if(action==='research'){
  const i=ids.indexOf(machine);if(i<0||ids.slice(0,i).some((m:string)=>o.stage(id,m,'RESEARCH').state!=='COMPLETE'))throw Error('SEQUENTIAL_RESEARCH_GATE');execute(machine,'RESEARCH');
 }else if(action==='downstream'){
  if(ids.some((m:string)=>o.stage(id,m,'RESEARCH').state!=='COMPLETE'))throw Error('ALL_TEN_RESEARCH_REQUIRED');
  if(machine&&!ids.includes(machine))throw Error('UNKNOWN_MACHINE');
  for(const m of (machine?[machine]:ids))for(const stage of ['EVALUATION','ELIGIBILITY','CANDIDATE_CONTRACT'])execute(m,stage);
 }else throw Error('USAGE: init | research MACHINE_ID | downstream');
}
