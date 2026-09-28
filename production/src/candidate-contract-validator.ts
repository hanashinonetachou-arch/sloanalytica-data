export const CANDIDATE_CONTRACT_VALIDATOR_CONTRACT='candidate-contract-v1';
const canonical=(v:any):string=>Array.isArray(v)?`[${v.map(canonical).join(',')}]`:v&&typeof v==='object'?`{${Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')}}`:JSON.stringify(v);
const fail=(m:string):never=>{throw new Error('CANDIDATE_CONTRACT_VALIDATION_FAILED:'+m)};
const nonEmpty=(x:any)=>typeof x==='string'&&x.trim().length>0;
export function validateCandidateContractDocument(doc:any,eligibility:any,evaluation:any){
 if(doc?.schemaVersion!=='candidate-contract-v1'||doc?.manifestVersion!=='8.5')fail('HEADER');
 if(doc.batchId!==eligibility.batchId||doc.machineId!==eligibility.machineId||doc.machineId!==evaluation.machineId)fail('IDENTITY');
 if(!Array.isArray(doc.candidates)||!Array.isArray(doc.dependencyGroups)||!Array.isArray(doc.excludedDecisions)||!Array.isArray(doc.blockedItems)||!Array.isArray(doc.evidenceCandidates)||!Array.isArray(doc.sourceIntegrityIssues))fail('ARRAYS');
 const eligible=(eligibility.decisions??[]).filter((x:any)=>x.eligibility==='ELIGIBLE');
 const excluded=(eligibility.decisions??[]).filter((x:any)=>x.eligibility!=='ELIGIBLE');
 if(doc.candidates.length!==eligible.length)fail('CANDIDATE_COVERAGE');
 if(canonical(doc.excludedDecisions)!==canonical(excluded))fail('EXCLUDED_DECISIONS_CHANGED');
 if(canonical(doc.blockedItems)!==canonical(eligibility.blockedItems??[])||canonical(doc.evidenceCandidates)!==canonical(eligibility.evidenceCandidates??[])||canonical(doc.sourceIntegrityIssues)!==canonical(eligibility.sourceIntegrityIssues??[]))fail('UPSTREAM_PRESERVATION');
 const evalBy=new Map((evaluation.evaluations??[]).map((x:any)=>[x.findingId,x]));
 const candBy=new Map(doc.candidates.map((x:any)=>[x.findingId,x]));
 for(const d of eligible){
  const c:any=candBy.get(d.findingId),e:any=evalBy.get(d.findingId);if(!c||!e)fail('MISSING:'+d.findingId);
  if(c.label!==d.label||c.liveInferenceRoute!==d.liveInferenceRoute||c.model!==e.model||c.trialUniverse!==e.trialUniverse)fail('CANDIDATE_COPY:'+d.findingId);
  if(c.runtimePolicyBinding?.metric!=='PER_ELIGIBLE_TRIAL_POWER'||typeof c.runtimePolicyBinding?.value!=='number'||!Number.isFinite(c.runtimePolicyBinding.value)||Math.abs(c.runtimePolicyBinding.value-e.metrics.perEligibleTrialPower)>1e-12)fail('RUNTIME_BINDING:'+d.findingId);
  if(c.settingDistribution===undefined||canonical(c.settingDistribution)!==canonical(e.settingDistribution))fail('LIKELIHOOD_COPY:'+d.findingId);
  const expectedGroup=e.dependency?.status==='DEFERRED_TO_CANDIDATE_CONTRACT'?e.dependency.groupId:null;
  if((c.dependencyGroupId??null)!==(expectedGroup??null))fail('DEPENDENCY_GROUP:'+d.findingId);if(expectedGroup?c.runtimeInferenceAllowed!==false:c.runtimeInferenceAllowed!==true)fail('RUNTIME_PERMISSION:'+d.findingId);
 }
 const expectedGroups=new Map<string,string[]>();
 for(const d of eligible){const e:any=evalBy.get(d.findingId);if(e?.dependency?.status==='DEFERRED_TO_CANDIDATE_CONTRACT'){const id=e.dependency.groupId;if(!nonEmpty(id))fail('GROUP_ID:'+d.findingId);const a=expectedGroups.get(id)??[];a.push(d.findingId);expectedGroups.set(id,a)}}
 if(doc.dependencyGroups.length!==expectedGroups.size)fail('GROUP_COVERAGE');
 const seen=new Set<string>();
 for(const g of doc.dependencyGroups){
  if(!nonEmpty(g.groupId)||seen.has(g.groupId)||!['MUTUALLY_EXCLUSIVE_CATEGORICAL','CONDITIONALLY_SEPARATE','SINGLE_MEMBER_SELECTED','HELD_NO_JOINT_MODEL'].includes(g.resolution)||!nonEmpty(g.reason)||!Array.isArray(g.members))fail('GROUP_SHAPE');
  seen.add(g.groupId);const exp=expectedGroups.get(g.groupId);if(!exp||canonical([...g.members].sort())!==canonical([...exp].sort()))fail('GROUP_MEMBERS:'+g.groupId);
  if(g.resolution==='SINGLE_MEMBER_SELECTED'&&(!nonEmpty(g.selectedFindingId)||!g.members.includes(g.selectedFindingId)||!nonEmpty(g.selectionRationale)))fail('GROUP_SELECTION:'+g.groupId);if(g.resolution==='HELD_NO_JOINT_MODEL'&&(g.runtimeInferenceAllowed!==false||!nonEmpty(g.reevaluationCondition)))fail('GROUP_HOLD:'+g.groupId);
 }
 return [{validator:CANDIDATE_CONTRACT_VALIDATOR_CONTRACT,candidates:eligible.length,excluded:excluded.length,dependencyGroups:expectedGroups.size}];
}
export function validateCandidateContractArtifacts(s:any,a:any,r:any){
 const out=r.producedArtifacts??[];if(out.length!==1)fail('OUTPUT_COUNT');const ref=out[0];
 if(ref.kind!=='candidate-contract'||typeof ref.path!=='string'||!ref.path.startsWith(`production/batches/${a.batchId}/artifacts/${a.machineId}/candidate_contract/`))fail('OUTPUT_REF');
 const prefix='production/';const doc=s.read(...ref.path.slice(prefix.length).split('/'));
 const gs=s.read('batches',a.batchId,'machines',a.machineId,'stages','ELIGIBILITY.json'),es=s.read('batches',a.batchId,'machines',a.machineId,'stages','EVALUATION.json');
 if(!gs.authoritativeOutputRef?.path||!es.authoritativeOutputRef?.path)fail('UPSTREAM_AUTHORITY_MISSING');
 const eligibility=s.read(...String(gs.authoritativeOutputRef.path).slice(prefix.length).split('/')),evaluation=s.read(...String(es.authoritativeOutputRef.path).slice(prefix.length).split('/'));
 return validateCandidateContractDocument(doc,eligibility,evaluation);
}
