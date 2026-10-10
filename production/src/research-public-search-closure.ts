/** A closed public search records a bounded survey, never universal absence. */
export function validatePublicSearchClosure(draft:any,row:any){
 for(const aspect of row.publicSearchAspectClosures??[])
  validatePublicSearchClosure(draft,{domain:row.domain,status:'CHECKED',sourceIds:row.sourceIds,publicSearchClosure:aspect});
 const closure=row.publicSearchClosure;
 if(closure===undefined)return;
 if(row.status!=='CHECKED'||closure.disposition!=='PUBLIC_INFORMATION_NOT_FOUND_EXCLUDED'
  ||closure.runtimeUse!=='DISABLED'||closure.reopenPolicy!=='NEW_CONCRETE_SOURCE_ONLY'
  ||typeof closure.missingInformation!=='string'||!closure.missingInformation.trim()
  ||typeof closure.checkedAt!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(closure.checkedAt)
  ||!Array.isArray(closure.checkedSourceIds)||closure.checkedSourceIds.length<2)
  throw new Error('PUBLIC_SEARCH_CLOSURE_INVALID:'+row.domain);
 const sources=new Map<string,any>((draft.sources??[]).map((s:any)=>[s.sourceId,s]));
 const hosts=new Set<string>();
 for(const id of closure.checkedSourceIds){
  const source=sources.get(id);
  if(!source||!row.sourceIds?.includes(id))throw new Error('PUBLIC_SEARCH_CLOSURE_PROVENANCE:'+row.domain);
  hosts.add(new URL(source.url).hostname.replace(/^www\./,''));
 }
 if(hosts.size<2)throw new Error('PUBLIC_SEARCH_CLOSURE_SITE_COVERAGE:'+row.domain);
}
