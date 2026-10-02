import {classifyEvidenceLabel,classifyEvidenceSemantic} from './evidence-semantics.ts';
import {buildHighLowDiscrimination} from './high-low-discrimination.ts';
export function buildObservationEvidence(candidate:any,research:any,candidateArtifact:any){
 const observations=(candidate.candidates??[]).map((c:any)=>{
  const status=c.runtimeInferenceAllowed?'READY':c.dependencyResolution==='RESOLVED_IN_JOINT_MODEL'?'RESOLVED_IN_JOINT_MODEL':c.dependencyResolution==='RESOLVED_BY_SINGLE_MEMBER'?'RESOLVED_BY_SINGLE_MEMBER':'HELD_NO_JOINT_MODEL';
  let collectionContract:any=null;
  if(c.runtimeInferenceAllowed){
   if(c.model==='BERNOULLI')collectionContract={type:'SUCCESS_TRIAL_COUNTS',successField:'successCount',trialField:'eligibleTrialCount'};
   else if(c.model==='CATEGORICAL')collectionContract={type:'CATEGORY_COUNTS',countsField:'categoryCounts',trialField:'eligibleTrialCount',categoryCoverage:'NON_EXHAUSTIVE'};
   else throw new Error('OBSERVATION_COLLECTION_UNSUPPORTED:'+c.findingId);
  }
  return {findingId:c.findingId,label:c.label,model:c.model,trialUniverse:c.trialUniverse,liveInferenceRoute:c.liveInferenceRoute,runtimeInferenceAllowed:c.runtimeInferenceAllowed,dependencyResolution:c.dependencyResolution,observationStatus:status,collectionContract,details:Array.isArray(c.details)?structuredClone(c.details):[],resolvedIntoFindingId:c.resolvedIntoFindingId};
 });
 const evidence=(candidate.evidenceCandidates??[]).map((e:any)=>{const sourceCategories=Array.isArray(e.semanticCategories)?e.semanticCategories.filter((x:any)=>x&&typeof x==='object'&&typeof x.label==='string'&&x.label.trim()).map((x:any)=>structuredClone(x)):[];const details=Array.isArray(e.details)?e.details.filter((x:any)=>typeof x==='string'&&x.trim()):[];const semanticCategories=sourceCategories.length?sourceCategories:(details.length?details:[e.label]).filter((x:any)=>typeof x==='string'&&x.trim()).map((label:string)=>({label,semanticType:e.settingDistribution?'PROBABILITY_BACKED':classifyEvidenceLabel(label)}));return {findingId:e.findingId,label:e.label,sourceIds:e.sourceIds??[],details,semanticType:classifyEvidenceSemantic({...e,semanticCategories}),semanticCategories,settingDistribution:e.settingDistribution,runtimePolicyControlled:false,status:'SOURCE_REFERENCED'};});
 return {schemaVersion:'observation-evidence-v1',manifestVersion:'8.5',batchId:candidate.batchId,machineId:candidate.machineId,machineName:candidate.machineName,candidateContractArtifact:candidateArtifact,observations,evidence,sourceReferences:research.sources??[],blockedItems:candidate.blockedItems??[],sourceIntegrityIssues:candidate.sourceIntegrityIssues??[],highLowDiscrimination:buildHighLowDiscrimination(candidate)};
}
