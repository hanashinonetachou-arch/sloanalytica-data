export function validateUiPresentation(policy:any,numeric:any[],evidence:any[]){
 if(!policy)return;
 if(!Array.isArray(policy.hiddenDerivedFindingIds)||!Array.isArray(policy.sectionOrder)||!Array.isArray(policy.evidenceSectionMerges))throw Error('UI_PRESENTATION_SHAPE');
 for(const id of policy.hiddenDerivedFindingIds){const s=numeric.find(x=>x.sourceFindingId===id);if(!s||(s.inputs??[]).find((x:any)=>x.role==='success')?.derivedCalculation!=='sum')throw Error('UI_PRESENTATION_HIDE_REQUIRES_DERIVED:'+id);}
 if(new Set(policy.sectionOrder).size!==policy.sectionOrder.length)throw Error('UI_PRESENTATION_ORDER_DUPLICATE');
 // A section may be presented in one tab group only.  These checks protect
 // distinct input/evidence identities; grouping is strictly a view operation.
 const groupIds=new Set<string>(),tabbedSections=new Set<string>();
 const sourceSections=[...numeric,...evidence];
 if(new Set(sourceSections.map((s:any)=>s.id)).size!==sourceSections.length)throw Error('UI_PRESENTATION_SECTION_ID_DUPLICATE');
 for(const g of policy.tabGroups??[]){
  const tabs=g.tabs,ids=Array.isArray(tabs)?tabs.map((t:any)=>t.sectionId):[];
  if(!g.id||!g.title||!Array.isArray(tabs)||ids.length<2||new Set(ids).size!==ids.length||tabs.some((t:any)=>!t.label||!sourceSections.some((s:any)=>s.id===t.sectionId)))throw Error('UI_PRESENTATION_TABS');
  if(groupIds.has(g.id))throw Error('UI_PRESENTATION_GROUP_ID_DUPLICATE:'+g.id);
  groupIds.add(g.id);
  if(new Set(tabs.map((t:any)=>t.label)).size!==tabs.length)throw Error('UI_PRESENTATION_TAB_LABEL_DUPLICATE:'+g.id);
  for(const id of ids){if(tabbedSections.has(id))throw Error('UI_PRESENTATION_SECTION_IN_MULTIPLE_GROUPS:'+id);tabbedSections.add(id);}
 }
 const merged=new Set();for(const merge of policy.evidenceSectionMerges){const s=evidence.find(x=>x.sourceFindingId===merge.findingId);if(!s||!numeric.some(x=>x.id===merge.targetSectionId)||merged.has(merge.findingId))throw Error('UI_PRESENTATION_MERGE_TARGET:'+merge.findingId);merged.add(merge.findingId);}
}
/**
 * Generate presentation-only tabs from explicitly audited observation context.
 * Never guess an opportunity from a title or trialUniverse. A group requires
 * matching opportunityId and distinct conditionId values. Legacy documents
 * without metadata keep their authored tabGroups unchanged.
 */
export function completeOpportunityTabGroups(policy:any,sections:any[]){
 if(!policy)return policy;
 const out=structuredClone(policy);
 const assigned=new Set((out.tabGroups??[]).flatMap((g:any)=>(g.tabs??[]).map((t:any)=>t.sectionId)));
 const candidates=new Map<string,any[]>();
 for(const section of sections){
  const context=section.observationContext;
  if(!context||context.groupingApproved!==true||!context.opportunityId||!context.conditionId||!context.groupTitle||!context.conditionLabel||assigned.has(section.id))continue;
  const arr=candidates.get(context.opportunityId)??[];arr.push(section);candidates.set(context.opportunityId,arr);
 }
 out.tabGroups??=[];
 const usedIds=new Set(out.tabGroups.map((g:any)=>g.id));
 for(const [opportunityId,members] of candidates){
  if(members.length<2)continue;
  const contexts=members.map((s:any)=>s.observationContext);
  if(new Set(contexts.map((c:any)=>c.conditionId)).size!==contexts.length)continue;
  if(new Set(contexts.map((c:any)=>c.conditionLabel)).size!==contexts.length)continue;
  if(new Set(contexts.map((c:any)=>c.groupTitle)).size!==1)continue;
  const id='OPPORTUNITY_'+opportunityId;
  if(usedIds.has(id))throw Error('UI_PRESENTATION_GENERATED_ID_COLLISION:'+id);
  out.tabGroups.push({id,title:contexts[0].groupTitle,tabs:members.map((s:any)=>({sectionId:s.id,label:s.observationContext.conditionLabel}))});
  usedIds.add(id);
 }
 return out;
}
export function applyUiPresentation(sections:any[],policy:any){
 if(!policy)return sections;
 const out=structuredClone(sections);
 for(const merge of policy.evidenceSectionMerges){const index=out.findIndex(x=>(x.items??[]).some((n:any)=>n.evidenceId===merge.findingId)),target=out.find(x=>x.id===merge.targetSectionId);if(index<0||!target)throw Error('UI_PRESENTATION_MISSING_SURFACE:'+merge.findingId);const source=out[index];target.items.push(...source.items.map((x:any)=>({...x,description:source.description,descriptionPresentation:source.descriptionPresentation})));out.splice(index,1);}
 for(const g of policy.tabGroups??[])for(const t of g.tabs){const s=out.find(x=>x.id===t.sectionId);if(!s)throw Error('UI_PRESENTATION_TAB_MISSING:'+t.sectionId);s.tabGroup={id:g.id,title:g.title,label:t.label};}
 for(const id of policy.sectionOrder)if(!out.some(x=>x.id===id))throw Error('UI_PRESENTATION_ORDER_MISSING:'+id);
 const ranks=new Map(policy.sectionOrder.map((id:string,i:number)=>[id,i]));return out.map((s:any,i:number)=>({s,i})).sort((a:any,b:any)=>Number(ranks.get(a.s.id)??policy.sectionOrder.length)-Number(ranks.get(b.s.id)??policy.sectionOrder.length)||a.i-b.i).map((x:any)=>x.s);
}
