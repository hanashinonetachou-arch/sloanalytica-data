export function validateUiPresentation(policy:any,numeric:any[],evidence:any[]){
 if(!policy)return;
 if(!Array.isArray(policy.hiddenDerivedFindingIds)||!Array.isArray(policy.sectionOrder)||!Array.isArray(policy.evidenceSectionMerges))throw Error('UI_PRESENTATION_SHAPE');
 for(const id of policy.hiddenDerivedFindingIds){const s=numeric.find(x=>x.sourceFindingId===id);if(!s||(s.inputs??[]).find((x:any)=>x.role==='success')?.derivedCalculation!=='sum')throw Error('UI_PRESENTATION_HIDE_REQUIRES_DERIVED:'+id);}
 if(new Set(policy.sectionOrder).size!==policy.sectionOrder.length)throw Error('UI_PRESENTATION_ORDER_DUPLICATE');
 for(const g of policy.tabGroups??[]){const ids=g.tabs?.map((t:any)=>t.sectionId);if(!g.id||!g.title||!Array.isArray(ids)||ids.length<2||new Set(ids).size!==ids.length||g.tabs.some((t:any)=>!t.label||![...numeric,...evidence].some((s:any)=>s.id===t.sectionId)))throw Error('UI_PRESENTATION_TABS');}
 const merged=new Set();for(const merge of policy.evidenceSectionMerges){const s=evidence.find(x=>x.sourceFindingId===merge.findingId);if(!s||!numeric.some(x=>x.id===merge.targetSectionId)||merged.has(merge.findingId))throw Error('UI_PRESENTATION_MERGE_TARGET:'+merge.findingId);merged.add(merge.findingId);}
}
export function applyUiPresentation(sections:any[],policy:any){
 if(!policy)return sections;
 const out=structuredClone(sections);
 for(const merge of policy.evidenceSectionMerges){const index=out.findIndex(x=>(x.items??[]).some((n:any)=>n.evidenceId===merge.findingId)),target=out.find(x=>x.id===merge.targetSectionId);if(index<0||!target)throw Error('UI_PRESENTATION_MISSING_SURFACE:'+merge.findingId);const source=out[index];target.items.push(...source.items.map((x:any)=>({...x,description:source.description,descriptionPresentation:source.descriptionPresentation})));out.splice(index,1);}
 for(const g of policy.tabGroups??[])for(const t of g.tabs){const s=out.find(x=>x.id===t.sectionId);if(!s)throw Error('UI_PRESENTATION_TAB_MISSING:'+t.sectionId);s.tabGroup={id:g.id,title:g.title,label:t.label};}
 for(const id of policy.sectionOrder)if(!out.some(x=>x.id===id))throw Error('UI_PRESENTATION_ORDER_MISSING:'+id);
 const ranks=new Map(policy.sectionOrder.map((id:string,i:number)=>[id,i]));return out.map((s:any,i:number)=>({s,i})).sort((a:any,b:any)=>Number(ranks.get(a.s.id)??policy.sectionOrder.length)-Number(ranks.get(b.s.id)??policy.sectionOrder.length)||a.i-b.i).map((x:any)=>x.s);
}
