/** Research verifies public facts; downstream contracts resolve implementation. */
export const RESEARCH_PROCESS_CONTRACT='research-process-v1';
export function validateResearchProcessContract(d:any){
 for(const stop of d.researchStops??[]){
  if(!stop.basis||!stop.ownerStage||!stop.releaseCondition)throw new Error('RESEARCH_STOP_AUTHORITY_REQUIRED');
  if(['CANDIDATE_CONTRACT','OBSERVATION_EVIDENCE','CANONICAL_UI','RUNTIME'].includes(stop.ownerStage))
   throw new Error('DOWNSTREAM_IMPLEMENTATION_IS_NOT_RESEARCH_STOP');
 }
 for(const f of d.findings??[]){
  if(f.operationalCounting?.publishedDenominatorEquivalence==='NOT_ASSERTED' && f.requiresPublishedDenominatorEquivalence===true)
   throw new Error('PUBLISHED_DENOMINATOR_EQUIVALENCE_NOT_ADOPTION_GATE:'+f.findingId);
  if(f.dependencyScopeAudit?.status==='KNOWN_DEPENDENCY_DEFERRED_TO_CONTRACT'){
   if(!f.dependencyGroupId||!['CAUSAL_PATH_OVERLAP','AGGREGATE_COMPONENT','NESTED_OUTCOME','DEPENDENT'].includes(f.dependencyKind))
    throw new Error('KNOWN_DEPENDENCY_ROUTE_REQUIRED:'+f.findingId);
   if(f.dependencyReview?.status==='UNRESOLVED')throw new Error('STALE_DEPENDENCY_REVIEW:'+f.findingId);
  }
 }
 for(const domain of d.researchCompleteness?.domains??[]){
  const plan=domain.nextWorkDisposition;
  if(plan?.repeatPublicSearch===true && ['IMPLEMENTATION','CANDIDATE_CONTRACT','CANONICAL_UI','RUNTIME'].includes(plan.owner))
   throw new Error('IMPLEMENTATION_CANNOT_REQUIRE_REPEAT_PUBLIC_SEARCH:'+domain.domain);
 }
}
