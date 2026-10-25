import fs from 'node:fs';
import crypto from 'node:crypto';
import {RepoStore,Orchestrator} from '../../../../src/core.ts';
import {productionRequest,acceptAndRecord,promoteDependencies} from '../../../../src/runtime.ts';
import {buildEvaluation} from '../../../../src/evaluation-builder.ts';
import {buildEligibility} from '../../../../src/eligibility-builder.ts';
import {buildCandidateContract} from '../../../../src/candidate-contract-builder.ts';
import {buildObservationEvidence} from '../../../../src/observation-evidence-builder.ts';
import {buildCanonicalUi} from '../../../../src/canonical-ui-builder.ts';
import {buildMachineData} from '../../../../src/machine-data-builder.ts';
import {buildRuntimePolicy} from '../../../../src/runtime-policy-builder.ts';
import {buildRuntimeProjection} from '../../../../src/runtime-projection-builder.ts';
import {buildAppRuntime} from '../../../../src/app-runtime-builder.ts';
import {applyBatch025ObservationLabels} from '../../../../research-inbox/batch025/observation-labels.ts';
import {applyThunderOnlyOverlay,applyThunderPlayInfo} from './overlay.ts';

const s=new RepoStore(process.cwd()),o=new Orchestrator(s);
const batch='batch-20261022-025',machine='LB_THUNDER_V_HA';
const root=['batches',batch,'reconstruction',machine];
const stages=['RESEARCH','EVALUATION','ELIGIBILITY','CANDIDATE_CONTRACT','OBSERVATION_EVIDENCE','CANONICAL_UI','MACHINE_DATA','RUNTIME_POLICY','RUNTIME_PROJECTION','APP_RUNTIME'];
const sha=(file:string)=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
if(process.argv[2]==='invalidate'){
 if(s.exists(...root,'invalidated.json'))throw Error('ALREADY_INVALIDATED');
 const archived:any[]=[];
 for(const stage of [...stages,'DISTRIBUTION']){
  const x=o.stage(batch,machine,stage);
  if(x.state!=='COMPLETE')throw Error('EXPECTED_COMPLETE:'+stage);
  s.write(x,...root,'previous',stage+'.json');
  const art=['batches',batch,'artifacts',machine,stage.toLowerCase(),'result.json'];
  if(s.exists(...art)){s.write(s.read(...art),...root,'previous',stage.toLowerCase()+'.artifact.json');archived.push(stage);}
 }
 // Preserve the prior human QA state; it is not acceptance of this new revision.
 s.write(o.stage(batch,machine,'DEVICE_QA'),...root,'previous','DEVICE_QA.json');
 for(const stage of [...stages,'DISTRIBUTION'])o.transition(o.stage(batch,machine,stage),'READY','AUTHORITATIVE_OUTPUT_INVALIDATED','USER_THUNDER_ONLY_RECONSTRUCTION_20261024');
 s.write({authority:'USER_EXPLICIT_INSTRUCTION',machineId:machine,archived,sharedCodeChanged:false,newDistribution:false,deviceQaUnchanged:true},...root,'invalidated.json');
 console.log('THUNDER_ONLY_INVALIDATED');
}else if(['refresh-observation','refresh-app'].includes(process.argv[2])){
 const appOnly=process.argv[2]==='refresh-app',marker=appOnly?'app-presentation-refresh.json':'observation-refresh.json',archive=appOnly?'before-app-presentation':'before-observation-alias';
 if(s.exists(...root,marker))throw Error('ALREADY_REFRESHED');
 for(const stage of appOnly?stages.slice(-1):stages.slice(4)){
  const x=o.stage(batch,machine,stage);if(x.state!=='COMPLETE')throw Error('EXPECTED_COMPLETE');
  s.write(x,...root,archive,stage+'.json');
  s.write(s.read('batches',batch,'artifacts',machine,stage.toLowerCase(),'result.json'),...root,archive,stage.toLowerCase()+'.artifact.json');
  o.transition(x,'READY','AUTHORITATIVE_OUTPUT_INVALIDATED',appOnly?'THUNDER_PRESENTATION_METADATA':'THUNDER_VERIFIED_NORMAL_INPUT_IDS');
 }
 s.write({reason:appOnly?'Add machine-owned tab metadata for the existing package/render QA scripts. Numeric model unchanged.':'Prevent legacy total-game counters from silently becoming verified normal exposure. Source/evaluation unchanged.'},...root,marker);
}else if(process.argv[2]==='run'){
 if(!s.exists(...root,'invalidated.json'))throw Error('INVALIDATE_FIRST');
 const receipts:any[]=s.exists(...root,'stage-receipts.json')?s.read<any>(...root,'stage-receipts.json').receipts:[];
 for(const stage of stages){
  let x=o.stage(batch,machine,stage);if(x.state==='COMPLETE')continue;
  if(!['READY','RUNNING'].includes(x.state))throw Error('EXPECTED_READY:'+stage+':'+x.state);
  if(x.dependencies.some(dep=>o.stage(batch,machine,dep).state!=='COMPLETE'))throw Error('UPSTREAM_NOT_COMPLETE:'+stage);
  let q:any;
  if(x.state==='RUNNING'){
   q=fs.readdirSync(s.p('batches',batch,'work-requests')).map(f=>s.read<any>('batches',batch,'work-requests',f)).find(q=>q.machineId===machine&&q.stage===stage&&q.attemptId===x.activeAttemptId);
   if(!q)throw Error('ACTIVE_REQUEST_MISSING');
  }else{
   const a=o.createAttempt(x),l=o.acquire(x,a,3600000);
   x=o.transition(o.stage(batch,machine,stage),'LEASED','DISPATCH',a.workId);
   x=o.transition(x,'RUNNING','WORKER_START',a.workId);
   q=productionRequest(o,x,a,l,'8.5');s.write(q,'batches',batch,'work-requests',q.workId+'.json');
  }
  const ref=(kind:string)=>q.inputArtifacts.find((r:any)=>r.kind===kind);
  const read=(kind:string)=>s.read(...ref(kind).path.replace(/^production\//,'').split('/'));
  let doc:any;
  if(stage==='RESEARCH')doc={...s.read<any>('research-inbox','batch025','reviewed',machine+'.json'),workId:q.workId,researchStage:'SOURCE_REVIEW_COMPLETE'};
  else if(stage==='EVALUATION')doc=buildEvaluation(read('research'));
  else if(stage==='ELIGIBILITY')doc=buildEligibility(read('evaluation'));
  else if(stage==='CANDIDATE_CONTRACT'){
   doc=buildCandidateContract(read('evaluation'),read('eligibility'),ref('evaluation'),ref('eligibility'));
   const research=s.read<any>('batches',batch,'artifacts',machine,'research','result.json');
   doc.machineSettings=research.settings;doc.uiRequirements=research.uiRequirements;doc.originalCandidateReconciliation=research.originalCandidateReconciliation;
   doc.observationPrerequisites=research.findings.filter((f:any)=>f.settingDistribution&&f.observationType!=='reference_distribution').map((f:any)=>({findingId:f.findingId,trialUniverse:f.trialUniverse,denominatorSemantics:f.denominatorSemantics,liveObservation:f.liveObservation,sourceIds:f.sourceIds,unknownRequiredInput:'DISABLE_THIS_FINDING_ONLY',zeroVsUnobserved:'PRESERVE'}));
  }else if(stage==='OBSERVATION_EVIDENCE'){
   doc=buildObservationEvidence(read('candidate-contract'),read('research'),ref('candidate-contract'));
   applyBatch025ObservationLabels(doc);
   // Restore machine-owned labels after the legacy trial-universe label adapter.
   for(const observation of doc.observations??[])if(['BIG_BELL_B','BIG_BELL_C','BIG_REACH'].includes(observation.findingId))observation.inputPresentation=structuredClone(read('research').findings.find((f:any)=>f.findingId===observation.findingId).inputPresentation);
   const big=doc.observations.find((o:any)=>o.findingId==='BIG_BELL_B');big.inputIdAliases={'BIG_BELL_B.eligibleTrialCount':'INP_THUNDER_BIG_FIRST_HALF_G'};
   for(const observation of doc.observations??[])if(observation.trialUniverse==='BONUS_ELIGIBLE_GAME_TRIAL')observation.inputIdAliases={[observation.findingId+'.eligibleTrialCount']:'INP_THUNDER_VERIFIED_G_'+observation.findingId};
  }else if(stage==='CANONICAL_UI'){
   doc=buildCanonicalUi(read('candidate-contract'),read('observation-evidence'),read('evaluation'),ref('candidate-contract'),ref('observation-evidence'),ref('evaluation'));
   applyThunderPlayInfo(doc);
  }else if(stage==='MACHINE_DATA')doc=buildMachineData(read('canonical-ui'),read('candidate-contract'),read('observation-evidence'),ref('canonical-ui'),ref('candidate-contract'),ref('observation-evidence'),read('research'),ref('research'));
  else if(stage==='RUNTIME_POLICY')doc=buildRuntimePolicy(read('machine-data'),read('runtime-policy-config'),ref('machine-data'),ref('runtime-policy-config'));
  else if(stage==='RUNTIME_PROJECTION')doc=buildRuntimeProjection(read('machine-data'),read('runtime-policy'),ref('machine-data'),ref('runtime-policy'));
  else {
   const projection=read('runtime-projection');
   // An inactive BIG is below the unchanged score threshold; give its explanation a real label.
   for(const f of projection.inactiveFeatures??[])if(f.findingId==='BIG'&&f.name==='BIG')f.name='BIGの出現率';
   doc=buildAppRuntime(projection,ref('runtime-projection'));
   applyThunderOnlyOverlay(doc.package);
   doc.package.metadata.observationPrerequisites=s.read<any>('batches',batch,'artifacts',machine,'candidate_contract','result.json').observationPrerequisites;
  }
  const path=['batches',batch,'artifacts',machine,stage.toLowerCase(),'result.json'];s.write(doc,...path);
  const artifact={artifactId:q.expectedOutputs[0].kind+'-'+machine,kind:q.expectedOutputs[0].kind,path:'production/'+path.join('/'),sha256:sha(s.p(...path)),producerWorkId:q.workId};
  const result:any={workId:q.workId,attemptId:q.attemptId,leaseId:q.leaseId,leaseGeneration:q.leaseGeneration,status:'SUCCESS',observedInputFingerprint:q.authoritativeInputFingerprint,producedArtifacts:[artifact],validationEvidence:[],requestedActions:[],proposedNextState:'COMPLETE',provenance:{inputArtifacts:q.inputArtifacts,worker:'thunder-only-v85-existing-builders'}};
  const accepted=acceptAndRecord(o,s,result,'thunder-only-v85-existing-builders','unchanged-production-validators');
  if(accepted.kind!=='COMMITTED')throw Error('ACCEPT_FAILED:'+stage+':'+accepted.kind);
  promoteDependencies(o,batch,machine);
  receipts.push({stage,artifact,validation:result.validationEvidence});
  s.write({machineId:machine,receipts},...root,'stage-receipts.json');
  console.log(JSON.stringify({stage,status:'COMPLETE',validation:result.validationEvidence}));
 }
}else throw Error('USAGE: invalidate | run');
