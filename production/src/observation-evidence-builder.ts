export function buildObservationEvidence(candidate:any,research:any,candidateArtifact:any){
 const observations=(candidate.candidates??[]).map((c:any)=>{
  const status=c.runtimeInferenceAllowed?'READY':c.dependencyResolution==='RESOLVED_IN_JOINT_MODEL'?'RESOLVED_IN_JOINT_MODEL':'HELD_NO_JOINT_MODEL';
  let collectionContract:any=null;
  if(c.runtimeInferenceAllowed){
   if(c.model==='BERNOULLI')collectionContract={type:'SUCCESS_TRIAL_COUNTS',successField:'successCount',trialField:'eligibleTrialCount'};
   else if(c.model==='CATEGORICAL')collectionContract={type:'CATEGORY_COUNTS',countsField:'categoryCounts',trialField:'eligibleTrialCount',categoryCoverage:'NON_EXHAUSTIVE'};
   else throw new Error('OBSERVATION_COLLECTION_UNSUPPORTED:'+c.findingId);
  }
  return {findingId:c.findingId,label:c.label,model:c.model,trialUniverse:c.trialUniverse,liveInferenceRoute:c.liveInferenceRoute,runtimeInferenceAllowed:c.runtimeInferenceAllowed,dependencyResolution:c.dependencyResolution,observationStatus:status,collectionContract,resolvedIntoFindingId:c.resolvedIntoFindingId};
 });
 const evidence=(candidate.evidenceCandidates??[]).map((e:any)=>({findingId:e.findingId,label:e.label,sourceIds:e.sourceIds??[],runtimePolicyControlled:false,status:'SOURCE_REFERENCED'}));
 return {schemaVersion:'observation-evidence-v1',manifestVersion:'8.5',batchId:candidate.batchId,machineId:candidate.machineId,machineName:candidate.machineName,candidateContractArtifact:candidateArtifact,observations,evidence,sourceReferences:research.sources??[],blockedItems:candidate.blockedItems??[],sourceIntegrityIssues:candidate.sourceIntegrityIssues??[],highLowDiscrimination:{status:'NOT_COMPUTED',reason:'targetGamesへ対応するexact exposure modelまたはdependency/joint modelが未確立の候補を含むため、独立近似や任意換算でHighLowDiscriminationを生成しない。'}};
}
