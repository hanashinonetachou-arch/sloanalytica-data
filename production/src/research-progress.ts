import {validatePublicSearchClosure} from './research-public-search-closure.ts';
import {RESEARCH_COMPLETENESS_DOMAINS} from './research-validator.ts';

/** Count recorded Research coverage; never infer approval from coverage. */
export function summarizeResearchProgress(drafts:any[]){
 const ids=new Set<string>();
 const machineRows=drafts.map(d=>{
  if(!d.machineId||ids.has(d.machineId))throw new Error('PROGRESS_MACHINE_ID');
  ids.add(d.machineId);
  const rows=new Map<string,any>();
  const sources=new Set<string>((d.sources??[]).map((s:any)=>s.sourceId));
  for(const row of d.researchCompleteness?.domains??[]){
   if(rows.has(row.domain)||!(RESEARCH_COMPLETENESS_DOMAINS as readonly string[]).includes(row.domain))
    throw new Error('PROGRESS_DOMAIN_ID:'+d.machineId+':'+row.domain);
   validatePublicSearchClosure(d,row);
   rows.set(row.domain,row);
  }
  const verifiedDomains:string[]=[],remainingDomains:any[]=[];
  for(const domain of RESEARCH_COMPLETENESS_DOMAINS){
   const row=rows.get(domain);
   if(row&&['CHECKED','NOT_APPLICABLE'].includes(row.status)){
    if(!row.note||(row.status==='CHECKED'&&(!row.sourceIds?.length||row.sourceIds.some((s:string)=>!sources.has(s)))))
     throw new Error('PROGRESS_DOMAIN_PROVENANCE:'+d.machineId+':'+domain);
    verifiedDomains.push(domain);
   }else remainingDomains.push({domain,status:row?.status??'MISSING',note:row?.note??'Research領域の記録なし',sourceIds:row?.sourceIds??[],
    ...(row?.publicSearchAspectClosures?{publicSearchAspectClosures:row.publicSearchAspectClosures}:{}),
    ...(row?.nextWorkDisposition?{nextWorkDisposition:row.nextWorkDisposition}:{})});
  }
  const unresolvedNumericCandidates=(d.findings??[]).filter((f:any)=>f.settingDistribution&&
   ['probability','conditional_probability','appearance_distribution'].includes(f.observationType)&&
   (f.liveObservation?.status==='UNRESOLVED'||String(f.dependencyScopeAudit?.status??'').startsWith('UNRESOLVED_')))
   .map((f:any)=>({findingId:f.findingId,trialUniverse:f.trialUniverse,observationStatus:f.liveObservation?.status,
    reason:f.liveObservation?.reason,dependencyScopeStatus:f.dependencyScopeAudit?.status}));
  return {machineId:d.machineId,verifiedDomains:verifiedDomains.length,verifiedDomainNames:verifiedDomains,
   publicInformationUnavailableDomains:verifiedDomains.filter(domain=>rows.get(domain)?.publicSearchClosure).length,
   remainingDomains,unresolvedNumericCandidates,researchStage:d.researchStage,
   researchCompletenessStatus:d.researchCompleteness?.status};
 });
 const verifiedDomains=machineRows.reduce((n,m)=>n+m.verifiedDomains,0);
 const requiredDomains=drafts.length*RESEARCH_COMPLETENESS_DOMAINS.length;
 return {requiredDomains,verifiedDomains,unverifiedDomains:requiredDomains-verifiedDomains,
  publicInformationUnavailableDomains:machineRows.reduce((n,m)=>n+m.publicInformationUnavailableDomains,0),
  numericCandidateObservationScopePending:machineRows.reduce((n,m)=>n+m.unresolvedNumericCandidates.length,0),machineRows};
}
