/** Non-destructive contract for materialized Batch009 Research staging. */
export function auditBatch009Staging(working:any,reviewed:any,staged:any):string[]{
  const errors:string[]=[];
  const id=working?.machineId;
  if(!id||reviewed?.machineId!==id||staged?.machineId!==id)
    return ['STAGE_MACHINE_IDENTITY'];
  if(working.batchId!==staged.batchId||working.batchId!==reviewed.batchId)
    errors.push('STAGE_BATCH_IDENTITY');
  if(staged.researchStage!=='EVIDENCE_STAGED_NOT_APPROVED'||staged.researchCompleteness?.status!=='INCOMPLETE')
    errors.push('STAGE_PREMATURE_APPROVAL');
  const byId=(items:any[],key:string)=>new Map((items??[]).map(x=>[x[key],x]));
  const workingFindings=byId(working.findings,'findingId');
  const stagedFindings=byId(staged.findings,'findingId');
  const workingBlocks=byId(working.blockedItems,'blockId');
  const stagedBlocks=byId(staged.blockedItems,'blockId');
  const workingSources=byId(working.sources,'sourceId');
  const stagedSources=byId(staged.sources,'sourceId');
  const workingLedger=byId(working.researchCompleteness?.candidateLedger,'candidateId');
  const stagedLedger=byId(staged.researchCompleteness?.candidateLedger,'candidateId');
  const stagedDomains=byId(staged.researchCompleteness?.domains,'domain');
  for(const domain of staged.researchCompleteness?.domains??[]){
    if(domain.status==='CHECKED'&&(!domain.sourceIds?.length||domain.sourceIds.some((id:string)=>!stagedSources.has(id))))
      errors.push('STAGE_DOMAIN_SOURCE_MISSING:'+domain.domain);
  }
  for(const domain of working.researchCompleteness?.domains??[]){
    if(JSON.stringify(stagedDomains.get(domain.domain))!==JSON.stringify(domain))
      errors.push('STAGE_WORKING_DOMAIN_DRIFT:'+domain.domain);
  }
  if(stagedSources.size!==(staged.sources??[]).length)errors.push('STAGE_DUPLICATE_SOURCE_ID');
  if(stagedFindings.size!==(staged.findings??[]).length)errors.push('STAGE_DUPLICATE_FINDING_ID');
  if(stagedLedger.size!==(staged.researchCompleteness?.candidateLedger??[]).length)errors.push('STAGE_DUPLICATE_LEDGER_ID');
  for(const [findingId,f] of workingFindings){
    if(JSON.stringify(stagedFindings.get(findingId))!==JSON.stringify(f))
      errors.push('STAGE_WORKING_FINDING_DRIFT:'+findingId);
  }
  for(const [blockId,block] of workingBlocks){
    if(JSON.stringify(stagedBlocks.get(blockId))!==JSON.stringify(block))
      errors.push('STAGE_WORKING_BLOCK_DRIFT:'+blockId);
  }
  for(const [sourceId,source] of workingSources){
    const s=stagedSources.get(sourceId);
    if(!s||source.url!==s.url)errors.push('STAGE_WORKING_SOURCE_DRIFT:'+sourceId);
    else for(const claim of source.claims??[]){
      if(!s.claims?.includes(claim))errors.push('STAGE_WORKING_SOURCE_CLAIM_LOST:'+sourceId+':'+claim);
    }
  }
  for(const [candidateId,row] of workingLedger){
    if(JSON.stringify(stagedLedger.get(candidateId))!==JSON.stringify(row))
      errors.push('STAGE_WORKING_LEDGER_DRIFT:'+candidateId);
  }
  const qs=working.researchCompleteness?.machineSpecificQueries??[];
  if(JSON.stringify(staged.researchCompleteness?.machineSpecificQueries??[])!==JSON.stringify(qs))
    errors.push('STAGE_WORKING_DISCOVERY_QUERY_DRIFT');
  const reviewSourceUrls=new Set((reviewed.sources??reviewed.sourceUrls??[]).map((s:any)=>typeof s==='string'?s:s.url));
  const allUrls=new Map((staged.sources??[]).map((s:any)=>[s.sourceId,s.url]));
  for(const sourceUrl of reviewSourceUrls){
    if(!(staged.sources??[]).some((s:any)=>s.url===sourceUrl))
      errors.push('STAGE_REVIEW_SOURCE_MISSING:'+sourceUrl);
  }
  for(const ev of reviewed.evidenceCandidates??[]){
    const ref='reviewed-'+ev.findingId,f=stagedFindings.get(ref);
    if(!f||f.observationType!=='evidence'){
      errors.push('STAGE_EVIDENCE_MISSING:'+ref);continue;
    }
    if(JSON.stringify(f.semanticCategories)!==JSON.stringify(ev.semanticCategories))
      errors.push('STAGE_EVIDENCE_CATEGORY_DRIFT:'+ref);
    // A correct category must still retain the reviewed event/operation scope.
    if(typeof ev.observationCondition==='string'&&ev.observationCondition&&
       !(f.details??[]).includes(ev.observationCondition))
      errors.push('STAGE_EVIDENCE_OBSERVATION_CONDITION_DRIFT:'+ref);
    const urls=(f.sourceIds??[]).map((s:string)=>allUrls.get(s));
    if(urls.some((u:string|undefined)=>!u||!reviewSourceUrls.has(u)))
      errors.push('STAGE_EVIDENCE_UNREVIEWED_SOURCE:'+ref);
    if(Array.isArray(ev.sourceUrls)){
      if(JSON.stringify([...new Set(urls)].sort())!==JSON.stringify([...new Set(ev.sourceUrls)].sort()))
        errors.push('STAGE_EVIDENCE_SCOPED_SOURCE_DRIFT:'+ref);
    }
    if(!stagedLedger.has('finding:'+ref))
      errors.push('STAGE_EVIDENCE_LEDGER_MISSING:'+ref);
  }
  const reviewedIds=new Set((reviewed.evidenceCandidates??[]).map((x:any)=>'reviewed-'+x.findingId));
  for(const f of staged.findings??[]){
    if(!workingFindings.has(f.findingId)&&!reviewedIds.has(f.findingId))
      errors.push('STAGE_UNSUPPORTED_FINDING:'+f.findingId);
  }
  for(const id of stagedLedger.keys()){
    if(!workingLedger.has(id)&&!reviewedIds.has(String(id).replace(/^finding:/,'')))
      errors.push('STAGE_UNSUPPORTED_LEDGER:'+id);
  }
  const review=staged.researchCompleteness?.evidenceSourceReview;
  if(!review||review.candidateCount!==((reviewed.evidenceCandidates??[]).length)||
     JSON.stringify(review.openChecks??[])!==JSON.stringify(reviewed.openChecks??reviewed.unresolved??[]))
    errors.push('STAGE_REVIEW_STATUS_DRIFT');
  return errors;
}
