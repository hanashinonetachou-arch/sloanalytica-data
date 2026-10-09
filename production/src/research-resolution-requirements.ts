import {summarizeResearchProgress} from './research-progress.ts';

export const RESEARCH_BLOCKER_KINDS = [
 'SOURCE_SCOPE_UNRESOLVED', 'SOURCE_VALUES_NOT_FOUND', 'SOURCE_CONFLICT',
 'LATENT_STATE_NOT_IDENTIFIABLE', 'OBSERVATION_RECONCILIATION_NOT_IMPLEMENTED',
 'LIVE_RECORDING_NOT_VERIFIED', 'SOURCE_RETRIEVAL_INCOMPLETE', 'ABSENCE_ATTESTATION_MISSING'
] as const;

/** Research planning only: classification is supplied by a reviewer, never inferred
 * from keywords and never changes coverage, promotion or numerical eligibility. */
export function buildResearchResolutionRequirements(drafts:any[], requirements:any[], basisAudit:string){
 const progress=summarizeResearchProgress(drafts);
 const expected=new Map<string,any>();
 for(const machine of progress.machineRows){
  const draft=drafts.find(d=>d.machineId===machine.machineId);
  for(const row of machine.remainingDomains)
   expected.set(machine.machineId+':domain:'+row.domain,{draft,kind:'DOMAIN',refId:row.domain,row});
  for(const row of machine.unresolvedNumericCandidates){
   const finding=draft.findings.find((f:any)=>f.findingId===row.findingId);
   expected.set(machine.machineId+':finding:'+row.findingId,{draft,kind:'NUMERIC_CANDIDATE',refId:row.findingId,row,finding});
  }
 }
 const seen=new Set<string>();
 const rows=requirements.map(r=>{
  const key=r.machineId+':'+(r.kind==='DOMAIN'?'domain':'finding')+':'+r.refId;
  const match=expected.get(key);
  if(!match||r.kind!==match.kind)throw new Error('RESOLUTION_UNKNOWN_TARGET:'+key);
  if(seen.has(key))throw new Error('RESOLUTION_DUPLICATE_TARGET:'+key);
  seen.add(key);
  if(!Array.isArray(r.blockerKinds)||!r.blockerKinds.length||new Set(r.blockerKinds).size!==r.blockerKinds.length
   ||r.blockerKinds.some((k:any)=>!(RESEARCH_BLOCKER_KINDS as readonly string[]).includes(k)))
   throw new Error('RESOLUTION_BLOCKER_KIND:'+key);
  if(!Array.isArray(r.requiredProof)||!r.requiredProof.length||r.requiredProof.some((s:any)=>typeof s!=='string'||!s.trim()))
   throw new Error('RESOLUTION_REQUIRED_PROOF:'+key);
  const sourceIds=match.kind==='DOMAIN'?match.row.sourceIds:match.finding.sourceIds;
  const sources=new Map<string,any>(match.draft.sources.map((s:any)=>[s.sourceId,s]));
  if(!sourceIds?.length||sourceIds.some((id:string)=>!sources.has(id)))throw new Error('RESOLUTION_SOURCE_PROVENANCE:'+key);
  return {machineId:r.machineId,kind:r.kind,refId:r.refId,blockerKinds:r.blockerKinds,
   requiredProof:r.requiredProof,sourceIds:[...sourceIds],
   sourceUrls:[...new Set(sourceIds.map((id:string)=>sources.get(id).url))],
   recordedStatus:match.kind==='DOMAIN'?match.row.status:match.row.observationStatus,
   recordedReason:match.kind==='DOMAIN'?match.row.note:match.row.reason,
   ...(match.kind==='NUMERIC_CANDIDATE'?{trialUniverse:match.finding.trialUniverse,
    dependencyGroupId:match.finding.dependencyGroupId}:{}),
   resolutionStatus:'OPEN',approvalRequired:false};
 });
 const missing=[...expected.keys()].filter(k=>!seen.has(k));
 if(missing.length)throw new Error('RESOLUTION_MISSING_TARGET:'+missing.join(','));
 // Keep the production machine order even when the supplied review is reordered.
 const rank=new Map(drafts.map((d,i)=>[d.machineId,i]));
 rows.sort((a,b)=>rank.get(a.machineId)!-rank.get(b.machineId)!);
 return {schemaVersion:'research-resolution-requirements-v1',basisAudit,
  scope:'調査再開用の必要証拠。CHECKED・承認・Runtime採用・実機QA完了を意味しない。',
  machineOrder:drafts.map(d=>d.machineId),remainingDomains:progress.unverifiedDomains,
  unresolvedNumericCandidates:progress.numericCandidateObservationScopePending,
  blockerKindCounts:Object.fromEntries(RESEARCH_BLOCKER_KINDS.map(k=>[k,rows.filter(r=>r.blockerKinds.includes(k)).length])),rows};
}
