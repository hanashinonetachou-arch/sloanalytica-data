// Manifest v8 runtime UI materializer.
// Canonical UI is authoritative. This translator may copy/normalize shape only; it must not design.
import { validateCanonicalUiV8 } from "./compile-canonical-ui-v8-preview.mjs";
export function materializeCanonicalUiV8(canonicalUi){
 const v=validateCanonicalUiV8(canonicalUi); if(!v.ok) throw new Error(v.errors.join("\n"));
 const mapNode=n=>structuredClone(n);
 return {
  contractVersion:"runtime-ui-v8",
  source:"CANONICAL_UI",
  sourceSchemaVersion:canonicalUi.schemaVersion,
  manifestRevision:canonicalUi.manifestRevision,
  accordion:structuredClone(canonicalUi.accordion),
  quickInput:structuredClone(canonicalUi.quickInput??{enabled:false}),
  sections:(canonicalUi.sections??[]).map(s=>({
   id:s.id,title:s.title,description:s.description,
   descriptionPresentation:structuredClone(s.descriptionPresentation??null),
   collapsible:s.collapsible,defaultExpanded:s.defaultExpanded,
   ...(s.observationContext?{observationContext:s.observationContext}:{}),
   ...(s.observationAction?{observationAction:s.observationAction}:{}),
   groups:(s.groups??[]).map(mapNode),items:(s.items??[]).map(mapNode),
   ...(s.content?{content:structuredClone(s.content)}:{})
  }))
 };
}
export function assertCanonicalRuntimeUiEquality(canonicalUi,runtimeUi){
 const expected=materializeCanonicalUiV8(canonicalUi);
 const a=JSON.stringify(expected),b=JSON.stringify(runtimeUi);
 if(a!==b) throw new Error("Canonical UI semantic equality failed");
 return true;
}
