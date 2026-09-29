export const CANDIDATE_CONTRACT_VALIDATOR_CONTRACT='candidate-contract-v1';
const canonical=(v:any):string=>Array.isArray(v)?`[${v.map(canonical).join(',')}]`:v&&typeof v==='object'?`{${Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')}}`:JSON.stringify(v);
const fail=(m:string):never=>{throw new Error('CANDIDATE_CONTRACT_VALIDATION_FAILED:'+m)};
const nonEmpty=(x:any)=>typeof x==='string'&&x.trim().length>0;
const near=(a:any,b:any)=>typeof a==='number'&&typeof b==='number'&&Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=1e-10*Math.max(1,Math.abs(a),Math.abs(b));
const expectedBinding=(e:any)=>{const score=e?.metrics?.selectionScore;if(score?.status==='COMPUTED'&&typeof score.value==='number'&&Number.isFinite(score.value))return {metric:'SELECTION_SCORE',value:score.value};return {metric:'PER_ELIGIBLE_TRIAL_POWER',value:e?.metrics?.perEligibleTrialPower}};
const bindingMatches=(c:any,e:any)=>{const x=expectedBinding(e);return c.runtimePolicyBinding?.metric===x.metric&&near(c.runtimePolicyBinding?.value,x.value)&&c.runtimePolicyBinding?.thresholdSource==='RUNTIME_POLICY'};
export function validateCandidateContractDocument(doc:any,eligibility:any,evaluation:any){
 if(doc?.schemaVersion!=='candidate-contract-v1'||doc?.manifestVersion!=='8.5')fail('HEADER');
 if(doc.batchId!==eligibility.batchId||doc.machineId!==eligibility.machineId||doc.machineId!==evaluation.machineId)fail('IDENTITY');
 if(!Array.isArray(doc.candidates)||!Array.isArray(doc.dependencyGroups)||!Array.isArray(doc.excludedDecisions)||!Array.isArray(doc.blockedItems)||!Array.isArray(doc.evidenceCandidates)||!Array.isArray(doc.sourceIntegrityIssues))fail('ARRAYS');
 const eligible=(eligibility.decisions??[]).filter((x:any)=>x.eligibility==='ELIGIBLE'),excluded=(eligibility.decisions??[]).filter((x:any)=>x.eligibility!=='ELIGIBLE');
 if(doc.candidates.length!==eligible.length)fail('CANDIDATE_COVERAGE');
 if(canonical(doc.excludedDecisions)!==canonical(excluded))fail('EXCLUDED_DECISIONS_CHANGED');
 if(canonical(doc.blockedItems)!==canonical(eligibility.blockedItems??[])||canonical(doc.evidenceCandidates)!==canonical(eligibility.evidenceCandidates??[])||canonical(doc.sourceIntegrityIssues)!==canonical(eligibility.sourceIntegrityIssues??[]))fail('UPSTREAM_PRESERVATION');
 const evalBy=new Map((evaluation.evaluations??[]).map((x:any)=>[x.findingId,x])),candBy=new Map(doc.candidates.map((x:any)=>[x.findingId,x])),groupBy=new Map((doc.dependencyGroups??[]).map((g:any)=>[g.groupId,g]));
 for(const d of eligible){
  const c:any=candBy.get(d.findingId),e:any=evalBy.get(d.findingId);if(!c||!e)fail('MISSING:'+d.findingId);
  if(c.label!==d.label||c.liveInferenceRoute!==d.liveInferenceRoute)fail('CANDIDATE_COPY:'+d.findingId);
  const expectedGroup=e.dependency?.status==='DEFERRED_TO_CANDIDATE_CONTRACT'?e.dependency.groupId:null;
  if((c.dependencyGroupId??null)!==(expectedGroup??null))fail('DEPENDENCY_GROUP:'+d.findingId);
  const g:any=expectedGroup?groupBy.get(expectedGroup):null;
  if(!g){
   if(c.runtimeInferenceAllowed!==true||c.dependencyResolution!=='NONE'||c.model!==e.model||c.trialUniverse!==e.trialUniverse||canonical(c.settingDistribution)!==canonical(e.settingDistribution)||!bindingMatches(c,e))fail('UNGROUPED:'+d.findingId);
   continue;
  }
  if(g.resolution==='HELD_NO_JOINT_MODEL'){
   if(c.runtimeInferenceAllowed!==false||c.dependencyResolution!=='HELD_NO_JOINT_MODEL'||c.model!==e.model||c.trialUniverse!==e.trialUniverse||canonical(c.settingDistribution)!==canonical(e.settingDistribution))fail('HELD:'+d.findingId);
  }else if(g.resolution==='CONDITIONALLY_SEPARATE'){
   if(c.runtimeInferenceAllowed!==true||c.dependencyResolution!=='CONDITIONALLY_SEPARATE'||c.model!==e.model||c.trialUniverse!==e.trialUniverse||canonical(c.settingDistribution)!==canonical(e.settingDistribution)||!bindingMatches(c,e))fail('CONDITIONALLY_SEPARATE:'+d.findingId);
  }else if(g.resolution==='SINGLE_MEMBER_SELECTED'){
   if(c.findingId===g.selectedFindingId){
    if(c.runtimeInferenceAllowed!==true||c.dependencyResolution!=='SINGLE_MEMBER_SELECTED'||c.model!==e.model||c.trialUniverse!==e.trialUniverse||canonical(c.settingDistribution)!==canonical(e.settingDistribution)||!bindingMatches(c,e))fail('SINGLE_SELECTED:'+d.findingId);
   }else{
    if(c.runtimeInferenceAllowed!==false||c.dependencyResolution!=='RESOLVED_BY_SINGLE_MEMBER'||c.resolvedIntoFindingId!==g.selectedFindingId||c.model!==e.model||c.trialUniverse!==e.trialUniverse||canonical(c.settingDistribution)!==canonical(e.settingDistribution))fail('SINGLE_MEMBER:'+d.findingId);
   }
  }else if(g.resolution==='MUTUALLY_EXCLUSIVE_CATEGORICAL'){
   if(c.findingId===g.jointFindingId){
    if(c.runtimeInferenceAllowed!==true||c.dependencyResolution!=='MUTUALLY_EXCLUSIVE_CATEGORICAL'||c.model!=='CATEGORICAL'||c.trialUniverse!==e.trialUniverse||!Array.isArray(c.jointSourceFindingIds)||canonical([...c.jointSourceFindingIds].sort())!==canonical([...(g.jointSourceFindingIds??[])].sort())||typeof c.runtimePolicyBinding?.value!=='number'||!Number.isFinite(c.runtimePolicyBinding.value)||c.runtimePolicyBinding.value<=0)fail('JOINT_LEADER:'+d.findingId);
    for(const row of Object.values(c.settingDistribution??{}))if(!row||typeof row!=='object'||Array.isArray(row)||Object.values(row).some((v:any)=>typeof v!=='number'||v<0||v>1))fail('JOINT_DISTRIBUTION:'+d.findingId);
   }else{
    if(c.runtimeInferenceAllowed!==false||c.dependencyResolution!=='RESOLVED_IN_JOINT_MODEL'||c.resolvedIntoFindingId!==g.jointFindingId||c.model!==e.model||c.trialUniverse!==e.trialUniverse||canonical(c.settingDistribution)!==canonical(e.settingDistribution))fail('JOINT_MEMBER:'+d.findingId);
   }
  }else fail('GROUP_RESOLUTION:'+g.resolution);
 }
 const expectedGroups=new Map<string,string[]>();for(const d of eligible){const e:any=evalBy.get(d.findingId);if(e?.dependency?.status==='DEFERRED_TO_CANDIDATE_CONTRACT'){const id=e.dependency.groupId;if(!nonEmpty(id))fail('GROUP_ID:'+d.findingId);const a=expectedGroups.get(id)??[];a.push(d.findingId);expectedGroups.set(id,a)}}
 if(doc.dependencyGroups.length!==expectedGroups.size)fail('GROUP_COVERAGE');
 const seen=new Set<string>();
 for(const g of doc.dependencyGroups){
  if(!nonEmpty(g.groupId)||seen.has(g.groupId)||!['MUTUALLY_EXCLUSIVE_CATEGORICAL','CONDITIONALLY_SEPARATE','SINGLE_MEMBER_SELECTED','HELD_NO_JOINT_MODEL'].includes(g.resolution)||!nonEmpty(g.reason)||!Array.isArray(g.members))fail('GROUP_SHAPE');
  seen.add(g.groupId);const exp=expectedGroups.get(g.groupId);if(!exp||canonical([...g.members].sort())!==canonical([...exp].sort()))fail('GROUP_MEMBERS:'+g.groupId);
  if(g.resolution==='HELD_NO_JOINT_MODEL'&&(g.runtimeInferenceAllowed!==false||!nonEmpty(g.reevaluationCondition)))fail('GROUP_HOLD:'+g.groupId);
  if(g.resolution==='CONDITIONALLY_SEPARATE'&&g.runtimeInferenceAllowed!==true)fail('GROUP_SEPARATE:'+g.groupId);
  if(g.resolution==='SINGLE_MEMBER_SELECTED'&&(!g.runtimeInferenceAllowed||!nonEmpty(g.selectedFindingId)||!g.members.includes(g.selectedFindingId)||!nonEmpty(g.selectionRationale)))fail('GROUP_SINGLE:'+g.groupId);
  if(g.resolution==='MUTUALLY_EXCLUSIVE_CATEGORICAL'&&(!g.runtimeInferenceAllowed||!nonEmpty(g.jointFindingId)||!g.members.includes(g.jointFindingId)||!Array.isArray(g.jointSourceFindingIds)||g.jointSourceFindingIds.length<2))fail('GROUP_JOINT:'+g.groupId);
 }
 return [{validator:CANDIDATE_CONTRACT_VALIDATOR_CONTRACT,candidates:eligible.length,excluded:excluded.length,dependencyGroups:expectedGroups.size,runtimeCandidates:doc.candidates.filter((x:any)=>x.runtimeInferenceAllowed===true).length}];
}
export function validateCandidateContractArtifacts(s:any,a:any,r:any){
 const out=r.producedArtifacts??[];if(out.length!==1)fail('OUTPUT_COUNT');const ref=out[0];
 if(ref.kind!=='candidate-contract'||typeof ref.path!=='string'||!ref.path.startsWith(`production/batches/${a.batchId}/artifacts/${a.machineId}/candidate_contract/`))fail('OUTPUT_REF');
 const prefix='production/';const doc=s.read(...ref.path.slice(prefix.length).split('/'));
 const gs=s.read('batches',a.batchId,'machines',a.machineId,'stages','ELIGIBILITY.json'),es=s.read('batches',a.batchId,'machines',a.machineId,'stages','EVALUATION.json');
 if(!gs.authoritativeOutputRef?.path||!es.authoritativeOutputRef?.path)fail('UPSTREAM_AUTHORITY_MISSING');
 if(canonical(doc.eligibilityArtifact)!==canonical(gs.authoritativeOutputRef)||canonical(doc.evaluationArtifact)!==canonical(es.authoritativeOutputRef))fail('LINKAGE');
 const eligibility=s.read(...String(gs.authoritativeOutputRef.path).slice(prefix.length).split('/')),evaluation=s.read(...String(es.authoritativeOutputRef.path).slice(prefix.length).split('/'));
 return validateCandidateContractDocument(doc,eligibility,evaluation);
}
