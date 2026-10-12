/**
 * Manifest v8.5 global Research source-conflict policy.
 *
 * Conflict resolution is candidate-scoped, never a reason to restart an entire
 * batch. Exactly one additional corroboration round is permitted. An unresolved
 * conflict closes as a documented BLOCKED candidate. Reopening requires a new,
 * concrete source not in the closed survey.
 */
export const SOURCE_CONFLICT_POLICY_VERSION='source-conflict-v1';
export const SOURCE_CONFLICT_CLOSED='SOURCE_CONFLICT_UNRESOLVED';
type Source={sourceId:string;url:string;claims?:string[]};
const filled=(s:any)=>typeof s==='string'&&s.trim().length>0;
export function decideSourceConflict(input:{
 candidateId:string; initialSourceIds:string[]; additionalCheckSourceIds:string[];
 resolvedBySourceId?:string; newConcreteSourceIds?:string[];
}){
 if(!filled(input.candidateId)||!Array.isArray(input.initialSourceIds)||input.initialSourceIds.length<2||
 !input.initialSourceIds.every(filled)||new Set(input.initialSourceIds).size<2)
  throw Error('SOURCE_CONFLICT_INITIAL_SOURCES_REQUIRED');
 if(!Array.isArray(input.additionalCheckSourceIds)||input.additionalCheckSourceIds.length>1||
 !input.additionalCheckSourceIds.every(filled))
  throw Error('SOURCE_CONFLICT_ADDITIONAL_CHECK_LIMIT');
 if(input.resolvedBySourceId){
  if(![...input.initialSourceIds,...input.additionalCheckSourceIds].includes(input.resolvedBySourceId))
   throw Error('SOURCE_CONFLICT_RESOLUTION_SOURCE_UNKNOWN');
  return {status:'RESOLVED',candidateId:input.candidateId,resolvedBySourceId:input.resolvedBySourceId,
   additionalChecksUsed:input.additionalCheckSourceIds.length};
 }
 return {status:SOURCE_CONFLICT_CLOSED,candidateId:input.candidateId,
  additionalChecksUsed:input.additionalCheckSourceIds.length,runtimeUse:'DISABLED',
  reopenPolicy:'NEW_CONCRETE_SOURCE_ONLY'};
}
export function validateSourceConflictStandard(research:any){
 const sources=new Map<string,Source>((research.sources??[]).map((s:Source)=>[s.sourceId,s]));
 const findings=new Set<string>((research.findings??[]).map((f:any)=>f.findingId));
 const ledger=research.researchCompleteness?.candidateLedger??[];
 for(const block of research.blockedItems??[]){
  const c=block.sourceConflictResolution;
  if(block.disposition!==SOURCE_CONFLICT_CLOSED && c===undefined)continue;
  if(block.disposition!==SOURCE_CONFLICT_CLOSED||!c||c.schemaVersion!==SOURCE_CONFLICT_POLICY_VERSION||
  c.status!==SOURCE_CONFLICT_CLOSED||c.runtimeUse!=='DISABLED'||
  c.reopenPolicy!=='NEW_CONCRETE_SOURCE_ONLY')
   throw Error('SOURCE_CONFLICT_CLOSURE_INVALID:'+block.blockId);
  if(!filled(block.reason)||!filled(block.reevaluationCondition)||!filled(c.candidateId)||
  !filled(c.conflictingClaim)||!filled(c.checkedAt)||!/^\\d{4}-\\d{2}-\\d{2}$/.test(c.checkedAt))
   throw Error('SOURCE_CONFLICT_PROVENANCE_REQUIRED:'+block.blockId);
  const initial=c.initialSourceIds,extra=c.additionalCheckSourceIds;
  const all=[...(Array.isArray(initial)?initial:[]),...(Array.isArray(extra)?extra:[])];
  if(!Array.isArray(initial)||initial.length<2||new Set(initial).size<2||
  !Array.isArray(extra)||extra.length!==1||
  !all.every((id:string)=>filled(id)&&sources.has(id)&&block.sourceIds?.includes(id)))
   throw Error('SOURCE_CONFLICT_ONE_CHECK_AND_SOURCES_REQUIRED:'+block.blockId);
  const distinctSites=new Set(initial.map((id:string)=>new URL(sources.get(id)!.url).hostname.replace(/^www\\./,'')));
  if(distinctSites.size<2)throw Error('SOURCE_CONFLICT_INDEPENDENT_SITES_REQUIRED:'+block.blockId);
  if(findings.has(c.candidateId))throw Error('SOURCE_CONFLICT_ACTIVE_FINDING_FORBIDDEN:'+c.candidateId);
  if(!ledger.some((row:any)=>row.disposition?.type==='BLOCKED'&&row.disposition.refId===block.blockId))
   throw Error('SOURCE_CONFLICT_LEDGER_BLOCK_REQUIRED:'+block.blockId);
  if(c.repeatPublicSearch===true||c.additionalChecksUsed!==1)
   throw Error('SOURCE_CONFLICT_RESEARCH_LOOP_FORBIDDEN:'+block.blockId);
  if(c.reopenedBy!==undefined){
   if(!filled(c.reopenedBy)||all.includes(c.reopenedBy)||!sources.has(c.reopenedBy))
    throw Error('SOURCE_CONFLICT_REOPEN_NEW_SOURCE_REQUIRED:'+block.blockId);
   throw Error('SOURCE_CONFLICT_REOPEN_REQUIRES_NEW_REVIEW:'+block.blockId);
  }
 }
}
