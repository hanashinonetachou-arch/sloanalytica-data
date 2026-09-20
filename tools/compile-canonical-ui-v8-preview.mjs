// Manifest v8 Canonical UI validator/preview compiler.
// It deliberately fails closed and never invents layout or observation semantics.
export function validateCanonicalUiV8(ui){
  const errors=[];
  if(!ui||!String(ui.schemaVersion??"").startsWith("canonical-ui-v8")) errors.push("schemaVersion must be canonical-ui-v8*");
  if(ui?.accordion?.enabled!==true||ui?.accordion?.singleOpen!==true) errors.push("accordion.enabled/singleOpen must be true");
  const ids=new Set();
  for(const s of ui?.sections??[]){
    if(!s.id||ids.has(s.id)) errors.push("section id missing/duplicate"); else ids.add(s.id);
    if(!s.title) errors.push(`${s.id}: title required`);
    if(typeof s.collapsible!=="boolean") errors.push(`${s.id}: collapsible required`);
    if(typeof s.defaultExpanded!=="boolean") errors.push(`${s.id}: defaultExpanded required`);
    if(s.description && s.description.length>80 && s.descriptionPresentation?.collapsible!==true) errors.push(`${s.id}: long description must be independently collapsible`);
    const nodes=[...(s.groups??[]),...(s.items??[])];
    const checkRepeated=(n)=>{if(n.observationMultiplicity==="REPEATED_CATEGORICAL_EVENT"){const t=n.interaction?.type;if(!["CATEGORY_COUNTERS","ADD_OBSERVATION"].includes(t)||n.interaction?.preservePriorObservations!==true||n.interaction?.showAccumulatedCounts!==true) errors.push(`${s.id}/${n.id??n.evidenceId}: repeated categorical event needs an explicit accumulating interaction`);if(t==="CATEGORY_COUNTERS"){if(n.interaction?.totalOpportunities!=="DERIVE_FROM_CATEGORY_COUNTS") errors.push(`${s.id}/${n.id??n.evidenceId}: category counters must derive total opportunities when mutually exclusive`);const cats=n.interaction?.categories;if(!Array.isArray(cats)||cats.length===0) errors.push(`${s.id}/${n.id??n.evidenceId}: category counters require canonical categories`);else {const catIds=new Set();for(const cat of cats){if(!cat?.id||!cat?.label||!cat?.meaning||catIds.has(cat.id)) errors.push(`${s.id}/${n.id??n.evidenceId}: category id/label/meaning missing or duplicate`);catIds.add(cat.id);}}}}};
    for(const n of nodes){
      for(const i of n.inputs??[]){
        if(![6,12].includes(i.gridSpan)) errors.push(`${s.id}/${n.id}: gridSpan must be explicit 6 or 12`);
        if(i.input==="denominator" && (!i.trialUniverse||i.gridSpan!==12)) errors.push(`${s.id}/${n.id}: denominator needs trialUniverse and full width`);
      }
      checkRepeated(n);
    }
    for(const i of s.items??[]){
      checkRepeated(i);
    }
  }
  if((ui?.previewCheckpoint?.repeatedEntryDemonstrationRequired)!==true) errors.push("preview must require repeated-entry demonstration");
  return {ok:errors.length===0,errors};
}
export function compilePreviewModel(ui){
  const v=validateCanonicalUiV8(ui); if(!v.ok) throw new Error(v.errors.join("\n"));
  return {
    schemaVersion:"canonical-ui-preview-v8",
    machineId:ui.machineId,
    accordion:structuredClone(ui.accordion),
    quickInput:structuredClone(ui.quickInput??{enabled:false}),
    sections:(ui.sections??[]).map(s=>({
      id:s.id,title:s.title,description:s.description,
      descriptionPresentation:s.descriptionPresentation,
      collapsible:s.collapsible,defaultExpanded:s.defaultExpanded,
      observationContext:s.observationContext,observationAction:s.observationAction,
      groups:structuredClone(s.groups??[]),items:structuredClone(s.items??[]),content:structuredClone(s.content??null)
    }))
  };
}
