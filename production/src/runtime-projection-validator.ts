export const RUNTIME_PROJECTION_VALIDATOR_CONTRACT='runtime-projection-v1';
const canonical=(v:any):string=>Array.isArray(v)?'['+v.map(canonical).join(',')+']':v&&typeof v==='object'?'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}':JSON.stringify(v);
const fail=(m:string):never=>{throw new Error('RUNTIME_PROJECTION_VALIDATION_FAILED:'+m)};
export function validateRuntimeProjectionDocument(doc:any,machineData:any,policy:any,machineDataArtifact:any,policyArtifact:any){
  if(doc?.schemaVersion!=='runtime-projection-v1'||doc?.manifestVersion!=='8.5') fail('HEADER');
  if(doc.batchId!==machineData.batchId||doc.machineId!==machineData.machineId||doc.machineId!==policy.machineId||doc.machineName!==machineData.machineName) fail('IDENTITY');
  if(canonical(doc.sourceArtifacts?.machineData)!==canonical(machineDataArtifact)||canonical(doc.sourceArtifacts?.runtimePolicy)!==canonical(policyArtifact)) fail('LINKAGE');
  const features=machineData.features??[];
  const decisions=new Map((policy.featureDecisions??[]).map((x:any)=>[x.findingId,x]));
  if(decisions.size!==features.length) fail('DECISION_COVERAGE');
  const expectedActive:any[]=[]; const expectedInactive:any[]=[];
  for(const f of features){
    const d:any=decisions.get(f.findingId);
    if(!d) fail('DECISION:'+f.findingId);
    if(d.state==='ACTIVE') expectedActive.push(f);
    else if(d.state==='INACTIVE') expectedInactive.push({findingId:f.findingId,name:f.name,metric:d.metric,value:d.value,threshold:d.threshold,reason:'THRESHOLD_NOT_MET'});
    else fail('DECISION_STATE:'+f.findingId);
  }
  if(canonical(doc.activeFeatures)!==canonical(expectedActive)||canonical(doc.inactiveFeatures)!==canonical(expectedInactive)) fail('FEATURE_PROJECTION');
  const activeIds=new Set(expectedActive.map((x:any)=>x.findingId));
  const expectedUi=structuredClone(machineData.uiContract);
  expectedUi.numericSections=(expectedUi.numericSections??[]).filter((x:any)=>activeIds.has(x.sourceFindingId));
  if(canonical(doc.runtimeUi)!==canonical(expectedUi)) fail('UI_PROJECTION');
  if(canonical(doc.evidence)!==canonical(machineData.evidence??[])||(doc.evidence??[]).some((x:any)=>x.runtimePolicyControlled!==false)) fail('EVIDENCE_COPY');
  if(canonical(doc.heldObservations)!==canonical(machineData.heldObservations??[])) fail('HELD_COPY');
  if(canonical(doc.nonRuntimeCandidates??[])!==canonical(machineData.nonRuntimeCandidates??[])) fail('NON_RUNTIME_COPY');
  if(canonical(doc.excludedDecisions??[])!==canonical(machineData.excludedDecisions??[])) fail('EXCLUDED_COPY');
  if(canonical(doc.blockedItems??[])!==canonical(machineData.blockedItems??[])) fail('BLOCKED_COPY');
  if(canonical(doc.settings)!==canonical(machineData.settings)||canonical(doc.packagePolicy)!==canonical(machineData.packagePolicy)||canonical(doc.highLowDiscrimination)!==canonical(machineData.highLowDiscrimination)) fail('MACHINE_COPY');
  return [{validator:RUNTIME_PROJECTION_VALIDATOR_CONTRACT,active:expectedActive.length,inactive:expectedInactive.length,evidence:(doc.evidence??[]).length}];
}
export function validateRuntimeProjectionArtifacts(s:any,a:any,r:any){
  const out=r.producedArtifacts??[]; if(out.length!==1) fail('OUTPUT_COUNT');
  const ref=out[0];
  if(ref.kind!=='runtime-projection'||typeof ref.path!=='string'||!ref.path.startsWith('production/batches/'+a.batchId+'/artifacts/'+a.machineId+'/runtime_projection/')) fail('OUTPUT_REF');
  const prefix='production/';
  const doc=s.read(...ref.path.slice(prefix.length).split('/'));
  const ms=s.read('batches',a.batchId,'machines',a.machineId,'stages','MACHINE_DATA.json');
  const ps=s.read('batches',a.batchId,'machines',a.machineId,'stages','RUNTIME_POLICY.json');
  if(!ms.authoritativeOutputRef?.path||!ps.authoritativeOutputRef?.path) fail('UPSTREAM_AUTHORITY_MISSING');
  const machineData=s.read(...String(ms.authoritativeOutputRef.path).slice(prefix.length).split('/'));
  const policy=s.read(...String(ps.authoritativeOutputRef.path).slice(prefix.length).split('/'));
  return validateRuntimeProjectionDocument(doc,machineData,policy,ms.authoritativeOutputRef,ps.authoritativeOutputRef);
}
