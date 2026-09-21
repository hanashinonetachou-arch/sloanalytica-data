// Manifest v8 runtime UI materializer.
// Canonical UI is authoritative. Observation/Evidence contracts provide engine wiring only;
// this translator must not redesign labels, grouping, order, or interaction.
import { validateCanonicalUiV8 } from "./compile-canonical-ui-v8-preview.mjs";

const clone = value => value == null ? value : structuredClone(value);

function buildNumericBindings(observationContract){
 const bindings=new Map();
 for(const feature of observationContract?.numeric??[]){
  for(const input of feature.inputs??[]){
   if(!input?.id || input.shared) continue;
   const target = feature.featureId==="FEAT_CZ_INITIAL"
    ? (input.id==="INP_NORMAL_GAMES"?"INP_FEAT_CZ_INITIAL_GAMES":input.id==="INP_CZ_INITIAL"?"INP_FEAT_CZ_INITIAL_COUNT":null)
    : feature.featureId==="FEAT_BONUS_INITIAL"
      ? (input.id==="INP_BONUS_INITIAL"?"INP_FEAT_BONUS_INITIAL_COUNT":null)
      : feature.featureId==="FEAT_SMALL_ROLE_JOINT"
        ? ({INP_ROLE_GAMES:"INP_FEAT_RARE_ROLE_MULTI_GAMES",INP_WATERMELON:"INP_FEAT_RARE_ROLE_MULTI_WATERMELON",INP_WEAK_CHANCE:"INP_FEAT_RARE_ROLE_MULTI_WEAK_CHANCE",INP_WEAK_CHERRY:"INP_FEAT_RARE_ROLE_MULTI_WEAK_CHERRY",INP_STRONG_CHERRY:"INP_FEAT_RARE_ROLE_MULTI_STRONG_CHERRY"}[input.id]??null)
        : null;
   if(target) bindings.set(input.id,{inputId:target});
  }
 }
 // Shared denominator is explicitly declared by Observation and maps to both runtime features.
 if((observationContract?.numeric??[]).some(x=>x.featureId==="FEAT_CZ_INITIAL" && x.sharedDenominatorWith?.includes("FEAT_BONUS_INITIAL"))){
  bindings.set("INP_NORMAL_GAMES",{inputIds:["INP_FEAT_CZ_INITIAL_GAMES","INP_FEAT_BONUS_INITIAL_GAMES"]});
 }
 return bindings;
}

function buildEvidenceBindings(evidenceContract,machinePackage){
 const groups=new Map((evidenceContract?.groups??[]).map(g=>[g.groupId,g]));
 const evidenceBySource=new Map();
 for(const e of machinePackage?.evidence?.evidences??[]){
  for(const ref of e.sourceEvidenceRefs??[]) evidenceBySource.set(ref,e);
 }
 const inputByEvidence=new Map();
 for(const input of machinePackage?.inputs?.inputs??[]){
  if(input.type!=="multi_enum") continue;
  for(const option of input.options??[]) inputByEvidence.set(`${input.id}\0${option.value}`,{inputId:input.id,triggerValue:option.value});
 }
 return {groups,evidenceBySource,inputByEvidence};
}

function bindEvidenceNode(node,evidenceCtx){
 const group=evidenceCtx.groups.get(node.id); if(!group || node.interaction?.type!=="CATEGORY_COUNTERS") return node;
 const options=group.options??[];
 const categories=(node.interaction.categories??[]).map((cat,index)=>{
  const source=options[index]; if(!source || source.label!==cat.label) throw new Error(`Evidence category/order mismatch for ${node.id}: ${cat.label}`);
  const engineEvidence=evidenceCtx.evidenceBySource.get(source.sourceEvidenceId);
  if(!engineEvidence) return cat; // suggestion-only evidence may intentionally have no engine constraint.
  for(const [key,binding] of evidenceCtx.inputByEvidence){
   const [inputId,value]=key.split("\0");
   if((engineEvidence.inputId===inputId && engineEvidence.triggerValue===value) || engineEvidence.value===value) return {...cat,engineBinding:{mode:"MULTI_ENUM_PRESENCE",...binding}};
  }
  return cat;
 });
 const opportunity=group.interaction?.opportunityTracking;
 const interaction={...node.interaction,categories};
 if(opportunity?.type==="NONE"){
  interaction.totalOpportunities="NONE";
  delete interaction.opportunityTracking;
 } else if(opportunity?.type==="SEPARATE_COUNTER"){
  interaction.totalOpportunities="SEPARATE_COUNTER";
  interaction.opportunityTracking=clone(opportunity);
 }
 return {...node,interaction};
}

export function materializeCanonicalUiV8(canonicalUi,{observationContract=null,evidenceContract=null,machinePackage=null}={}){
 const v=validateCanonicalUiV8(canonicalUi); if(!v.ok) throw new Error(v.errors.join("\n"));
 const numericBindings=buildNumericBindings(observationContract);
 const evidenceCtx=buildEvidenceBindings(evidenceContract,machinePackage);
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
