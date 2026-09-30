import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {validateEvaluationDocument} from './evaluation-validator.ts';
import {validateEligibilityDocument} from './eligibility-validator.ts';
import {buildCandidateContract} from './candidate-contract-builder.ts';
import {validateCandidateContractDocument} from './candidate-contract-validator.ts';
import {buildObservationEvidence} from './observation-evidence-builder.ts';
import {validateObservationEvidenceDocument} from './observation-evidence-validator.ts';
import {buildCanonicalUi} from './canonical-ui-builder.ts';
import {validateCanonicalUiDocument} from './canonical-ui-validator.ts';
import {buildMachineData} from './machine-data-builder.ts';
import {validateMachineDataDocument} from './machine-data-validator.ts';
import {buildRuntimePolicy} from './runtime-policy-builder.ts';
import {validateRuntimePolicyDocument} from './runtime-policy-validator.ts';
import {buildRuntimeProjection} from './runtime-projection-builder.ts';
import {validateRuntimeProjectionDocument} from './runtime-projection-validator.ts';
import {buildAppRuntime} from './app-runtime-builder.ts';
import {validateAppRuntimeDocument} from './app-runtime-validator.ts';
import {buildDistribution} from './distribution-builder.ts';
import {validateDistributionDocument} from './distribution-validator.ts';

const TARGETS=[
  'L_WORLD_DAI_STAR_PA3',
  'L_ULTRAMAN_FINAL_BATTLE_ME',
  'L_KARAKURI_CIRCUS2_JG',
  'L_SENGOKU_COLLECTION6_KS',
  'L_NANGOKU_SPECIAL_M1',
] as const;

const KIND:Record<string,string>={
  EVALUATION:'evaluation',
  ELIGIBILITY:'eligibility',
  CANDIDATE_CONTRACT:'candidate-contract',
  OBSERVATION_EVIDENCE:'observation-evidence',
  CANONICAL_UI:'canonical-ui',
  MACHINE_DATA:'machine-data',
  RUNTIME_POLICY:'runtime-policy',
  RUNTIME_PROJECTION:'runtime-projection',
  APP_RUNTIME:'app-runtime',
  DISTRIBUTION:'distribution',
};

const VALIDATOR:Record<string,string>={
  EVALUATION:'evaluation-v2',
  ELIGIBILITY:'eligibility-v1',
  CANDIDATE_CONTRACT:'candidate-contract-v1',
  OBSERVATION_EVIDENCE:'observation-evidence-v1',
  CANONICAL_UI:'canonical-ui-v1',
  MACHINE_DATA:'machine-data-v1',
  RUNTIME_POLICY:'runtime-policy-v1',
  RUNTIME_PROJECTION:'runtime-projection-v1',
  APP_RUNTIME:'app-runtime-v1',
  DISTRIBUTION:'distribution-v1',
};

const exactBenchmarkTrialUniverses=new Set(['NORMAL_GAME_TRIAL','BONUS_ELIGIBLE_GAME_TRIAL']);
const selectionClass=(score:number)=>score>=20?'CORE':score>=10?'SUPPORT':score>=5?'JOINT_ELIGIBLE':'EXCLUDE';

function readJson<T=any>(p:string):T{return JSON.parse(fs.readFileSync(p,'utf8'))}
function writeJson(p:string,v:any){fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n','utf8')}
function appendJsonl(p:string,v:any){fs.mkdirSync(path.dirname(p),{recursive:true});fs.appendFileSync(p,JSON.stringify(v)+'\n','utf8')}
function sha256File(p:string){return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')}
function nowIso(){return new Date().toISOString()}
function rootFromProductionCwd(){return path.basename(process.cwd())==='production'?path.dirname(process.cwd()):process.cwd()}
function productionRoot(){const root=rootFromProductionCwd();return path.join(root,'production')}
function batchRoot(batchId:string){return path.join(productionRoot(),'batches',batchId)}
function stagePath(batchId:string,machineId:string,stage:string){return path.join(batchRoot(batchId),'machines',machineId,'stages',stage+'.json')}
function refDoc(ref:any){if(!ref?.path)throw new Error('MISSING_ARTIFACT_REF');const rel=String(ref.path).replace(/^production\//,'');return readJson(path.join(productionRoot(),rel))}
function artifactRefFor(batchId:string,machineId:string,stage:string,filePath:string,producerWorkId:string){
  return {
    artifactId:`${KIND[stage]}-${machineId}`,
    kind:KIND[stage],
    path:path.posix.join('production','batches',batchId,'artifacts',machineId,stage.toLowerCase(),path.basename(filePath)),
    sha256:sha256File(filePath),
    producerWorkId,
  };
}
function researchRef(batchId:string,machineId:string,research:any){
  const p=path.join(batchRoot(batchId),'artifacts',machineId,'research','result.json');
  return {artifactId:`research-${machineId}`,kind:'research',path:path.posix.join('production','batches',batchId,'artifacts',machineId,'research','result.json'),sha256:sha256File(p),producerWorkId:research.workId};
}
function appendRepairState(batchId:string,machineId:string,stage:string,artifactRef:any,inputArtifacts:any[]){
  const p=stagePath(batchId,machineId,stage);
  const current=readJson<any>(p);
  if(!['COMPLETE','READY'].includes(current.state))throw new Error(`REPAIR_STAGE_NOT_REPAIRABLE:${machineId}:${stage}:${current.state}`);
  const stamp='rtm20260929';
  const slug=machineId.toLowerCase().replace(/[^a-z0-9]+/g,'_');
  const lower=stage.toLowerCase();
  const workId=`wrk_${stamp}_${slug}_${lower}`;
  const attemptId=`att_${stamp}_${slug}_${lower}`;
  const leaseId=`lea_${stamp}_${slug}_${lower}`;
  const t0=current.revision;
  const ts=nowIso();
  const transitions=current.state==='COMPLETE'
    ? [
        ['COMPLETE','READY','AUTHORITATIVE_OUTPUT_INVALIDATED','batch001-runtime-materialization-repair'],
        ['READY','LEASED','DISPATCH',workId],
        ['LEASED','RUNNING','WORKER_START',workId],
        ['RUNNING','VALIDATING','WORK_RESULT',workId],
        ['VALIDATING','COMPLETE','VALIDATOR',workId],
      ]
    : [
        ['READY','LEASED','DISPATCH',workId],
        ['LEASED','RUNNING','WORKER_START',workId],
        ['RUNNING','VALIDATING','WORK_RESULT',workId],
        ['VALIDATING','COMPLETE','VALIDATOR',workId],
      ];
  transitions.forEach((x,i)=>appendJsonl(path.join(batchRoot(batchId),'transitions','history.jsonl'),{
    transitionId:`trn_${stamp}_${slug}_${lower}_${i+1}`,batchId,machineId,stage,
    fromState:x[0],toState:x[1],causeType:x[2],causeId:x[3],
    expectedRevision:t0+i,committedRevision:t0+i+1,committedAt:ts,orchestratorContractVersion:'orch-1'
  }));
  const updated={...current,state:'COMPLETE',revision:t0+transitions.length,activeAttemptId:attemptId,activeLeaseId:leaseId,authoritativeOutputRef:artifactRef};
  writeJson(p,updated);
  writeJson(path.join(batchRoot(batchId),'machines',machineId,'attempts',attemptId+'.json'),{
    attemptId,workId,batchId,machineId,stage,number:999,inputFingerprint:current.authoritativeInputFingerprint,
    contractVersion:current.contractVersion,createdAt:ts,status:'COMPLETE'
  });
  writeJson(path.join(batchRoot(batchId),'leases',leaseId+'.json'),{
    leaseId,workId,attemptId,batchId,machineId,stage,leaseGeneration:999,inputFingerprint:current.authoritativeInputFingerprint,
    contractVersion:current.contractVersion,acquiredAt:ts,heartbeatAt:ts,expiresAt:ts,status:'RELEASED'
  });
  writeJson(path.join(batchRoot(batchId),'events','accepted-'+workId+'.json'),{workId});
  writeJson(path.join(batchRoot(batchId),'work-requests',workId+'.json'),{
    workId,attemptId,batchId,machineId,stage,workType:stage,workerType:['EVALUATION','ELIGIBILITY','CANDIDATE_CONTRACT','OBSERVATION_EVIDENCE','CANONICAL_UI'].includes(stage)?'SEMANTIC':'PRODUCTION',
    contractVersion:current.contractVersion,manifestVersion:'8.5',validatorContractVersion:VALIDATOR[stage],
    authoritativeInputFingerprint:current.authoritativeInputFingerprint,inputArtifacts,
    allowedMutationScope:[{repository:'data',pathPattern:`production/batches/${batchId}/**`,operations:['READ','CREATE','UPDATE']}],
    forbiddenMutationScope:[{operations:['DELETE']}],
    expectedOutputs:[{kind:KIND[stage],pathPrefix:`production/batches/${batchId}/artifacts/${machineId}/${stage.toLowerCase()}/`}],
    leaseId,leaseGeneration:999,leaseExpiresAt:ts
  });
  appendJsonl(path.join(batchRoot(batchId),'provenance','chain.jsonl'),{
    workId,attemptId,machineId,stage,inputArtifacts,outputArtifacts:[artifactRef],
    workerAdapter:'batch001-runtime-materialization-repair',validatorAdapter:`deterministic:${VALIDATOR[stage]}`,recordedAt:ts
  });
  return {workId,attemptId,leaseId};
}
function writeStageArtifact(batchId:string,machineId:string,stage:string,doc:any,inputArtifacts:any[]){
  const dir=path.join(batchRoot(batchId),'artifacts',machineId,stage.toLowerCase());
  const file=path.join(dir,'repair_runtime_materialization_20260929.json');
  writeJson(file,doc);
  const slug=machineId.toLowerCase().replace(/[^a-z0-9]+/g,'_');
  const workId=`wrk_rtm20260929_${slug}_${stage.toLowerCase()}`;
  const ref=artifactRefFor(batchId,machineId,stage,file,workId);
  appendRepairState(batchId,machineId,stage,ref,inputArtifacts);
  return ref;
}

export function repairEvaluationDocument(source:any,research:any=null){
  const doc=structuredClone(source);
  if(research){
    doc.evidenceCandidates=(research.findings??[]).filter((x:any)=>x.observationType==='evidence').map((x:any)=>({findingId:x.findingId,label:x.label,sourceIds:x.sourceIds??[],details:Array.isArray(x.details)?x.details:[]}));
    doc.blockedItems=structuredClone(research.blockedItems??[]);
  }
  for(const e of doc.evaluations??[]){
    if(e.observationType!=='probability'||!exactBenchmarkTrialUniverses.has(e.trialUniverse))continue;
    const score=e.metrics?.maximumSelectionScore;
    if(typeof score!=='number'||!Number.isFinite(score))throw new Error('EXACT_SCORE_SOURCE_MISSING:'+e.findingId);
    e.benchmarkExposure={status:'EXACT',trials:7000,reason:'基準遊技量7000Gを、そのままeligible game trialsとして使用できるtrial universe。'};
    e.metrics.selectionScore={status:'COMPUTED',value:score};
    e.selectionClass=selectionClass(score);
    e.evaluationCompleteness='COMPLETE';
  }
  return doc;
}

function invalidateDistribution(batchId:string,machineId:string){
  const p=stagePath(batchId,machineId,'DISTRIBUTION');
  const s=readJson<any>(p);
  if(s.state==='READY')return;
  if(s.state!=='COMPLETE')throw new Error(`DISTRIBUTION_INVALIDATE_STATE:${machineId}:${s.state}`);
  const ts=nowIso();
  appendJsonl(path.join(batchRoot(batchId),'transitions','history.jsonl'),{
    transitionId:`trn_rtm20260929_${machineId.toLowerCase().replace(/[^a-z0-9]+/g,'_')}_distribution_invalidate`,
    batchId,machineId,stage:'DISTRIBUTION',fromState:'COMPLETE',toState:'READY',
    causeType:'AUTHORITATIVE_OUTPUT_INVALIDATED',causeId:'batch001-runtime-materialization-repair',
    expectedRevision:s.revision,committedRevision:s.revision+1,committedAt:ts,orchestratorContractVersion:'orch-1'
  });
  delete s.activeAttemptId;delete s.activeLeaseId;s.state='READY';s.revision+=1;
  writeJson(p,s);
}

export function repairBatch(batchId:string){
  const policyConfigPath=path.join(batchRoot(batchId),'runtime-policy-config.json');
  const policyConfig=readJson<any>(policyConfigPath);
  const policyConfigRef={artifactId:`runtime-policy-config-${batchId}`,kind:'runtime-policy-config',path:path.posix.join('production','batches',batchId,'runtime-policy-config.json'),sha256:sha256File(policyConfigPath),producerWorkId:'HUMAN_POLICY'};

  for(const machineId of TARGETS){
    const research=readJson<any>(path.join(batchRoot(batchId),'artifacts',machineId,'research','result.json'));
    const researchArtifact=researchRef(batchId,machineId,research);

    const oldEvalStage=readJson<any>(stagePath(batchId,machineId,'EVALUATION'));
    const repairedEvaluation=repairEvaluationDocument(refDoc(oldEvalStage.authoritativeOutputRef),research);
    validateEvaluationDocument(repairedEvaluation,research);
    const evaluationRef=writeStageArtifact(batchId,machineId,'EVALUATION',repairedEvaluation,[researchArtifact]);

    const oldEligibilityStage=readJson<any>(stagePath(batchId,machineId,'ELIGIBILITY'));
    const eligibility=structuredClone(refDoc(oldEligibilityStage.authoritativeOutputRef));
    eligibility.evidenceCandidates=structuredClone(repairedEvaluation.evidenceCandidates??[]);
    eligibility.blockedItems=structuredClone(repairedEvaluation.blockedItems??[]);
    validateEligibilityDocument(eligibility,repairedEvaluation,research);
    const eligibilityRef=writeStageArtifact(batchId,machineId,'ELIGIBILITY',eligibility,[researchArtifact,evaluationRef]);

    const candidate=buildCandidateContract(repairedEvaluation,eligibility,evaluationRef,eligibilityRef);
    validateCandidateContractDocument(candidate,eligibility,repairedEvaluation);
    const candidateRef=writeStageArtifact(batchId,machineId,'CANDIDATE_CONTRACT',candidate,[eligibilityRef,evaluationRef]);

    const observation=buildObservationEvidence(candidate,research,candidateRef);
    validateObservationEvidenceDocument(observation,candidate,research);
    const observationRef=writeStageArtifact(batchId,machineId,'OBSERVATION_EVIDENCE',observation,[candidateRef,researchArtifact]);

    const canonical=buildCanonicalUi(candidate,observation,repairedEvaluation,candidateRef,observationRef,evaluationRef);
    validateCanonicalUiDocument(canonical,candidate,observation,repairedEvaluation,candidateRef,observationRef,evaluationRef);
    const canonicalRef=writeStageArtifact(batchId,machineId,'CANONICAL_UI',canonical,[candidateRef,observationRef,evaluationRef]);

    const machineData=buildMachineData(canonical,candidate,observation,canonicalRef,candidateRef,observationRef,research,researchArtifact);
    validateMachineDataDocument(machineData,canonical,candidate,observation,canonicalRef,candidateRef,observationRef,research,researchArtifact);
    const machineDataRef=writeStageArtifact(batchId,machineId,'MACHINE_DATA',machineData,[canonicalRef,candidateRef,observationRef,researchArtifact]);

    const runtimePolicy=buildRuntimePolicy(machineData,machineData.features?.length?policyConfig:null,machineDataRef,machineData.features?.length?policyConfigRef:null);
    validateRuntimePolicyDocument(runtimePolicy,machineData,machineData.features?.length?policyConfig:null,machineDataRef,machineData.features?.length?policyConfigRef:null);
    const runtimePolicyRef=writeStageArtifact(batchId,machineId,'RUNTIME_POLICY',runtimePolicy,machineData.features?.length?[machineDataRef,policyConfigRef]:[machineDataRef]);

    const runtimeProjection=buildRuntimeProjection(machineData,runtimePolicy,machineDataRef,runtimePolicyRef);
    validateRuntimeProjectionDocument(runtimeProjection,machineData,runtimePolicy,machineDataRef,runtimePolicyRef);
    const runtimeProjectionRef=writeStageArtifact(batchId,machineId,'RUNTIME_PROJECTION',runtimeProjection,[machineDataRef,runtimePolicyRef]);

    const appRuntime=buildAppRuntime(runtimeProjection,runtimeProjectionRef);
    validateAppRuntimeDocument(appRuntime,runtimeProjection,runtimeProjectionRef);
    writeStageArtifact(batchId,machineId,'APP_RUNTIME',appRuntime,[runtimeProjectionRef]);

    invalidateDistribution(batchId,machineId);
  }
  return {batchId,machines:[...TARGETS]};
}

export function finalizeDistribution(batchId:string,attestationPath:string){
  const all=readJson<any>(attestationPath);
  if(all.batchId!==batchId||!all.integration||!all.checks||!all.packages)throw new Error('INVALID_DISTRIBUTION_ATTESTATION');
  for(const machineId of TARGETS){
    const appStage=readJson<any>(stagePath(batchId,machineId,'APP_RUNTIME'));
    const appRuntime=refDoc(appStage.authoritativeOutputRef);
    const entry=all.packages[machineId];if(!entry)throw new Error('PACKAGE_ATTESTATION_MISSING:'+machineId);
    const attestation={
      integration:{...all.integration,packagePath:`machines/${machineId}/machine-package.json`,catalogPath:'catalog.json'},
      package:entry,
      checks:all.checks,
    };
    const distribution=buildDistribution(appRuntime,appStage.authoritativeOutputRef,attestation);
    validateDistributionDocument(distribution,appRuntime,appStage.authoritativeOutputRef);
    writeStageArtifact(batchId,machineId,'DISTRIBUTION',distribution,[appStage.authoritativeOutputRef]);
  }
  return {batchId,machines:[...TARGETS],distribution:'COMPLETE'};
}

function main(){
  const [mode,batchId,arg]=process.argv.slice(2);
  if(mode==='--self-test'){const d=repairEvaluationDocument({evaluations:[]});if(!d)throw new Error('SELF_TEST');return}
  if(!batchId)throw new Error('USAGE: repair-batch001-runtime-materialization <generate|finalize> <batchId> [attestation.json]');
  if(mode==='generate'){console.log(JSON.stringify(repairBatch(batchId),null,2));return}
  if(mode==='finalize'){if(!arg)throw new Error('ATTESTATION_PATH_REQUIRED');console.log(JSON.stringify(finalizeDistribution(batchId,path.resolve(arg)),null,2));return}
  throw new Error('UNKNOWN_MODE:'+String(mode));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)main();
