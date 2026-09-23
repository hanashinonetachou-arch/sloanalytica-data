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
    if(s.collapsible===true && s.headerToggle!==true) errors.push(`${s.id}: collapsible section must use headerToggle`);
    if(s.genericEditButton===true) errors.push(`${s.id}: generic edit button prohibited`);
    if(s.descriptionPresentation && s.descriptionPresentation.collapsible===true && !s.descriptionPresentation.label) errors.push(`${s.id}: collapsible description label required`);
    if(s.description && s.description.length>80 && s.descriptionPresentation?.collapsible!==true) errors.push(`${s.id}: long description must be independently collapsible`);
    const nodes=[...(s.groups??[]),...(s.items??[])];
    const checkRepeated=(n)=>{if(n.observationMultiplicity==="REPEATED_CATEGORICAL_EVENT"){const t=n.interaction?.type;if(!["CATEGORY_COUNTERS","ADD_OBSERVATION"].includes(t)||n.interaction?.preservePriorObservations!==true||n.interaction?.showAccumulatedCounts!==true) errors.push(`${s.id}/${n.id??n.evidenceId}: repeated categorical event needs an explicit accumulating interaction`);if(t==="CATEGORY_COUNTERS"){const coverage=n.interaction?.categoryCoverage;if(!["EXHAUSTIVE","NON_EXHAUSTIVE"].includes(coverage)) errors.push(`${s.id}/${n.id??n.evidenceId}: categoryCoverage required`);if(coverage==="EXHAUSTIVE"&&n.interaction?.totalOpportunities!=="DERIVE_FROM_CATEGORY_COUNTS") errors.push(`${s.id}/${n.id??n.evidenceId}: exhaustive category counters must derive total opportunities`);if(coverage==="NON_EXHAUSTIVE"){const ot=n.interaction?.opportunityTracking;const hardEvidenceNoNegativeAbsence=ot?.type==="NONE"&&n.interaction?.absenceIsNegativeEvidence===false&&typeof ot?.reason==="string"&&ot.reason.length>0;if(!hardEvidenceNoNegativeAbsence&&(n.interaction?.totalOpportunities!=="SEPARATE_COUNTER"||ot?.type!=="SEPARATE_COUNTER"||!ot?.inputId||!ot?.label)) errors.push(`${s.id}/${n.id??n.evidenceId}: non-exhaustive category counters require separate opportunity tracking unless absence is explicitly non-evidence`);}const cats=n.interaction?.categories;if(!Array.isArray(cats)||cats.length===0) errors.push(`${s.id}/${n.id??n.evidenceId}: category counters require canonical categories`);else {const catIds=new Set();for(const cat of cats){if(!cat?.id||!cat?.label||!cat?.meaning||catIds.has(cat.id)) errors.push(`${s.id}/${n.id??n.evidenceId}: category id/label/meaning missing or duplicate`);catIds.add(cat.id);}}}}};
    for(const n of nodes){
      for(const i of n.inputs??[]){
        if(i.input==="denominator" && i.directNumeric!==true) errors.push(`${s.id}/${n.id}: denominator must support direct numeric input`);
        if(i.unobservedDisplay && i.unobservedDisplay!=="—") errors.push(`${s.id}/${n.id}: unobserved display must be concise dash`);
        if(![6,12].includes(i.gridSpan)) errors.push(`${s.id}/${n.id}: gridSpan must be explicit 6 or 12`);
        if(i.input==="denominator" && (!i.trialUniverse||i.gridSpan!==12)) errors.push(`${s.id}/${n.id}: denominator needs trialUniverse and full width`);
      }
      checkRepeated(n);
    }
    for(const i of s.items??[]){
      checkRepeated(i);
    }
  }
  const summary=(ui?.sections??[]).find(s=>s.title==="この機種の設定推測について");
  if(!summary) errors.push("machine research summary section required");
  else {
    const order=summary.content?.displayOrder;
    if(JSON.stringify(order)!==JSON.stringify(["HIGH_LOW","ADOPTED","REJECTED","UNRESOLVED"])) errors.push("summary display order invalid");
    if(!summary.content?.summaryRef) errors.push("summary payload/reference required");
  }
  if((ui?.previewCheckpoint?.repeatedEntryDemonstrationRequired)!==true) errors.push("preview must require repeated-entry demonstration");
  if((ui?.previewCheckpoint?.unobservedVsZeroDemonstrationRequired)!==true) errors.push("preview must require UNOBSERVED vs OBSERVED_ZERO demonstration");
  if((ui?.previewCheckpoint?.directDenominatorEntryDemonstrationRequired)!==true) errors.push("preview must require direct denominator entry demonstration");
  if((ui?.previewCheckpoint?.summaryRenderingRequired)!==true) errors.push("preview must require summary rendering");
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
