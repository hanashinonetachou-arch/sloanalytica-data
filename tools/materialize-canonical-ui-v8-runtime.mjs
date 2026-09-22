// Manifest v8 runtime UI materializer.
// Canonical UI is authoritative. Observation/Evidence contracts provide engine wiring only;
// this translator must not redesign labels, grouping, order, or interaction.
import { validateCanonicalUiV8 } from "./compile-canonical-ui-v8-preview.mjs";

const clone = value => value == null ? value : structuredClone(value);

function buildNumericBindings(observationContract){
 const bindings=new Map();
 const features=observationContract?.numeric??[];
 for(const feature of features){
  for(const input of feature.inputs??[]){
   if(!input?.id || input.shared) continue;
   const targets=[];
   if(input.engineInputId) targets.push(input.engineInputId);
   for(const peerId of feature.sharedDenominatorWith??[]){
    const peer=features.find(x=>x.featureId===peerId);
    const shared=(peer?.inputs??[]).find(x=>x.id===input.id && x.shared===true);
    if(shared?.engineInputId) targets.push(shared.engineInputId);
   }
   const unique=[...new Set(targets)];
   if(unique.length===1) bindings.set(input.id,{inputId:unique[0]});
   else if(unique.length>1) bindings.set(input.id,{inputIds:unique});
  }
 }
 return bindings;
}
function buildEvidenceBindings(evidenceContract){
 return new Map((evidenceContract?.groups??[]).map(g=>[g.groupId,g]));
}
function bindEvidenceNode(node,groups){
 const group=groups.get(node.id); if(!group || node.interaction?.type!=="CATEGORY_COUNTERS") return node;
 const options=group.options??[];
 const categories=(node.interaction.categories??[]).map((cat,index)=>{
  const source=options[index]; if(!source || source.label!==cat.label) throw new Error(`Evidence category/order mismatch for ${node.id}: ${cat.label}`);
  return source.engineBinding?{...cat,engineBinding:clone(source.engineBinding)}:cat;
 });
 const opportunity=group.interaction?.opportunityTracking;
 const interaction={...node.interaction,categories};
 if(opportunity?.type==="NONE"){ interaction.totalOpportunities="NONE"; delete interaction.opportunityTracking; }
 else if(opportunity?.type==="SEPARATE_COUNTER"){ interaction.totalOpportunities="SEPARATE_COUNTER"; interaction.opportunityTracking=clone(opportunity); }
 return {...node,interaction};
}
export function materializeCanonicalUiV8(canonicalUi,{observationContract=null,evidenceContract=null,machinePackage=null}={}){
 const v=validateCanonicalUiV8(canonicalUi); if(!v.ok) throw new Error(v.errors.join("\n"));
 const numericBindings=buildNumericBindings(observationContract);
 const evidenceCtx=buildEvidenceBindings(evidenceContract);
 const mapNode=n=>{
  let out=clone(n);
  if(numericBindings.has(out.id)) out.engineBinding=clone(numericBindings.get(out.id));
  out=bindEvidenceNode(out,evidenceCtx);
  return out;
 };
 return {
  contractVersion:"runtime-ui-v8",source:"CANONICAL_UI",sourceSchemaVersion:canonicalUi.schemaVersion,
  manifestRevision:canonicalUi.manifestRevision,accordion:clone(canonicalUi.accordion),quickInput:clone(canonicalUi.quickInput??{enabled:false}),
  sections:(canonicalUi.sections??[]).map(s=>({
   id:s.id,title:s.title,description:s.description,descriptionPresentation:clone(s.descriptionPresentation??null),
   collapsible:s.collapsible,defaultExpanded:s.defaultExpanded,headerToggle:s.headerToggle===true,genericEditButton:s.genericEditButton===true,
   ...(s.observationContext?{observationContext:s.observationContext}:{}),...(s.observationAction?{observationAction:s.observationAction}:{}),
   groups:(s.groups??[]).map(g=>({...mapNode(g),inputs:(g.inputs??[]).map(mapNode)})),
   items:(s.items??[]).map(n=>{
    const out=mapNode(n);
    if(Array.isArray(out.inputs)) out.inputs=out.inputs.map(mapNode);
    return out;
   }),...(s.content?{content:clone(s.content)}:{})
  }))
 };
}
export function assertCanonicalRuntimeUiEquality(canonicalUi,runtimeUi,contracts={}){
 const expected=materializeCanonicalUiV8(canonicalUi,contracts);
 if(JSON.stringify(expected)!==JSON.stringify(runtimeUi)) throw new Error("Canonical UI semantic equality failed");
 return true;
}
