export const ELIGIBILITY_VALIDATOR_CONTRACT='eligibility-v1';
const canonical=(v:any):string=>Array.isArray(v)?`[${v.map(canonical).join(',')}]`:v&&typeof v==='object'?`{${Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')}}`:JSON.stringify(v);
const fail=(m:string):never=>{throw new Error('ELIGIBILITY_VALIDATION_FAILED:'+m)};
const nonEmpty=(x:any)=>typeof x==='string'&&x.trim().length>0;
const exactLive=new Set(['DIRECT_EXACT','EXACT_WITH_SCOPE_TRACKING','EXHAUSTIVE_CATEGORICAL','RETROSPECTIVE_EXACT']);
export function validateEligibilityDocument(doc:any,evaluation:any,research:any){
 if(doc?.schemaVersion!=='eligibility-v1'||doc?.manifestVersion!=='8.5')fail('HEADER');
 if(doc.batchId!==evaluation.batchId||doc.machineId!==evaluation.machineId||doc.machineId!==research.machineId)fail('IDENTITY');
 if(!Array.isArray(doc.decisions)||!Array.isArray(doc.blockedItems)||!Array.isArray(doc.evidenceCandidates)||!Array.isArray(doc.sourceIntegrityIssues))fail('ARRAYS');
 if(doc.decisions.length!==evaluation.evaluations.length)fail('DECISION_COVERAGE');
 const byId=new Map(doc.decisions.map((x:any)=>[x.findingId,x]));
 let eligible=0,ineligible=0,unresolved=0,notApplicable=0;
 for(const e of evaluation.evaluations){
  const d:any=byId.get(e.findingId);if(!d)fail('MISSING:'+e.findingId);
  if(d.label!==e.label||canonical(d.supportingSourceIds)!==canonical(e.sourceIds??[]))fail('SOURCE_COPY:'+e.findingId);
  if(!['ELIGIBLE','INELIGIBLE','UNRESOLVED','NOT_APPLICABLE'].includes(d.eligibility)||!nonEmpty(d.reason)||!Array.isArray(d.ruleRefs)||d.ruleRefs.length===0)fail('DECISION_SHAPE:'+e.findingId);
  if(e.model==='REFERENCE_ONLY'){
   if(d.eligibility!=='NOT_APPLICABLE'||d.liveInferenceRoute!=='NONE')fail('REFERENCE_DECISION:'+e.findingId);notApplicable++;continue;
  }
  if(e.model==='UNAVAILABLE'){
   if(!['INELIGIBLE','UNRESOLVED'].includes(d.eligibility)||d.liveInferenceRoute!=='NONE'||!nonEmpty(d.reevaluationCondition))fail('UNAVAILABLE_DECISION:'+e.findingId);d.eligibility==='INELIGIBLE'?ineligible++:unresolved++;continue;
  }
  const p=e.metrics?.igPerEligibleTrial;
  if(typeof p!=='number'||!Number.isFinite(p))fail('MISSING_INFORMATION:'+e.findingId);
  if(p<=1e-15){
   if(d.eligibility!=='INELIGIBLE'||d.liveInferenceRoute!=='NONE')fail('ZERO_INFORMATION:'+e.findingId);ineligible++;continue;
  }
  if(exactLive.has(e.liveObservation?.status)&&e.dependency?.status!=='UNRESOLVED'){
   if(d.eligibility!=='ELIGIBLE'||d.liveInferenceRoute!=='LIVE_CONDITIONAL')fail('ELIGIBLE_ROUTE:'+e.findingId);eligible++;
  }else{
   if(!['INELIGIBLE','UNRESOLVED'].includes(d.eligibility)||d.liveInferenceRoute!=='NONE'||!nonEmpty(d.reevaluationCondition))fail('UNRESOLVED_ROUTE:'+e.findingId);d.eligibility==='INELIGIBLE'?ineligible++:unresolved++;
  }
 }
 if(canonical(doc.blockedItems)!==canonical(evaluation.blockedItems??[])||canonical(doc.evidenceCandidates)!==canonical(evaluation.evidenceCandidates??[]))fail('UPSTREAM_PRESERVATION');
 for(const x of doc.sourceIntegrityIssues)if(!nonEmpty(x.issueId)||!nonEmpty(x.reason)||!nonEmpty(x.impact))fail('SOURCE_INTEGRITY_SHAPE');
 return [{validator:ELIGIBILITY_VALIDATOR_CONTRACT,eligible,ineligible,unresolved,notApplicable,sourceIntegrityIssues:doc.sourceIntegrityIssues.length}];
}
export function validateEligibilityArtifacts(s:any,a:any,r:any){const out=r.producedArtifacts??[];if(out.length!==1)fail('OUTPUT_COUNT');const ref=out[0];if(ref.kind!=='eligibility'||typeof ref.path!=='string'||!ref.path.startsWith(`production/batches/${a.batchId}/artifacts/${a.machineId}/eligibility/`))fail('OUTPUT_REF');const prefix='production/';const doc=s.read(...ref.path.slice(prefix.length).split('/'));const es=s.read('batches',a.batchId,'machines',a.machineId,'stages','EVALUATION.json');const er=es.authoritativeOutputRef;if(!er?.path)fail('EVALUATION_AUTHORITY_MISSING');const evaluation=s.read(...String(er.path).slice(prefix.length).split('/'));const research=s.read('batches',a.batchId,'artifacts',a.machineId,'research','result.json');return validateEligibilityDocument(doc,evaluation,research)}
