export function buildRuntimeProjection(machineData:any,policy:any,machineDataArtifact:any,policyArtifact:any){
  if(machineData?.machineId!==policy?.machineId||machineData?.batchId!==policy?.batchId) throw new Error('RUNTIME_PROJECTION_IDENTITY');
  const decisions=new Map((policy.featureDecisions??[]).map((x:any)=>[x.findingId,x]));
  const features=machineData.features??[];
  if(decisions.size!==features.length) throw new Error('RUNTIME_PROJECTION_DECISION_COVERAGE');
  const activeFeatures:any[]=[]; const inactiveFeatures:any[]=[];
  for(const f of features){
    const d:any=decisions.get(f.findingId);
    if(!d) throw new Error('RUNTIME_PROJECTION_DECISION_MISSING:'+f.findingId);
    if(d.state==='ACTIVE') activeFeatures.push(f);
    else if(d.state==='INACTIVE') inactiveFeatures.push({findingId:f.findingId,name:f.name,metric:d.metric,value:d.value,threshold:d.threshold,reason:'THRESHOLD_NOT_MET'});
    else throw new Error('RUNTIME_PROJECTION_DECISION_STATE:'+f.findingId);
  }
  const activeIds=new Set(activeFeatures.map((x:any)=>x.findingId));
  const runtimeUi=structuredClone(machineData.uiContract);
  runtimeUi.numericSections=(runtimeUi.numericSections??[]).filter((x:any)=>activeIds.has(x.sourceFindingId));
  return {schemaVersion:'runtime-projection-v1',manifestVersion:'8.5',batchId:machineData.batchId,machineId:machineData.machineId,machineName:machineData.machineName,sourceArtifacts:{machineData:machineDataArtifact,runtimePolicy:policyArtifact},activeFeatures,inactiveFeatures,settings:machineData.settings,packagePolicy:machineData.packagePolicy,runtimeUi,evidence:machineData.evidence??[],heldObservations:machineData.heldObservations??[],nonRuntimeCandidates:machineData.nonRuntimeCandidates??[],excludedDecisions:machineData.excludedDecisions??[],blockedItems:machineData.blockedItems??[],highLowDiscrimination:machineData.highLowDiscrimination};
}
