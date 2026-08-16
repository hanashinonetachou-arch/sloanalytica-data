import fs from "node:fs";

function read(p){ return JSON.parse(fs.readFileSync(p,"utf8")); }
export function validateSelectionData(s,research=null){
 const errors=[],warnings=[];
 if(s.schemaVersion!=="selection-data-v1") errors.push("schemaVersion must be selection-data-v1");
 if(!s.machineId) errors.push("machineId is required");
 if(!s.machineDataVersion) errors.push("machineDataVersion is required");
 const inputs=s.inputs??[], features=s.features??[];
 const uiCategoryLabels=s.uiCategoryLabels??{};
 if(uiCategoryLabels===null||Array.isArray(uiCategoryLabels)||typeof uiCategoryLabels!=="object") errors.push("uiCategoryLabels must be an object");
 else for(const [k,v] of Object.entries(uiCategoryLabels)) if(!k||typeof v!=="string"||!v.trim()) errors.push(`invalid uiCategoryLabels entry: ${k}`);
 const ids=inputs.map(x=>x.id), idset=new Set(ids);
 if(idset.size!==ids.length) errors.push("duplicate input id");
 for(const i of inputs){
   if(!/^INP_[A-Z0-9_]+$/.test(i.id??"")) errors.push(`invalid input id: ${i.id}`);
   if(!i.name||!i.type||!i.category||!Number.isInteger(i.displayOrder)) errors.push(`incomplete input: ${i.id}`);
   if(i.parentInputId && !idset.has(i.parentInputId)) errors.push(`${i.id}: unknown parentInputId ${i.parentInputId}`);
 }
 const featIds=features.map(x=>x.featureId), featSet=new Set(featIds);
 if(featSet.size!==featIds.length) errors.push("duplicate featureId");
 for(const f of features){
   if(f.suppressedByFeatureIds!==undefined){
     if(!Array.isArray(f.suppressedByFeatureIds) || f.suppressedByFeatureIds.length===0) errors.push(`${f.featureId}: suppressedByFeatureIds must be a non-empty array`);
     else {
       const unique=new Set(f.suppressedByFeatureIds);
       if(unique.size!==f.suppressedByFeatureIds.length) errors.push(`${f.featureId}: duplicate suppressedByFeatureIds`);
       for(const id of f.suppressedByFeatureIds){
         if(!featSet.has(id)) errors.push(`${f.featureId}: unknown suppressedByFeatureId ${id}`);
         if(id===f.featureId) errors.push(`${f.featureId}: cannot suppress itself`);
       }
     }
   }
 }
 const researchIds=new Set((research?.features??[]).map(x=>x.researchFeatureId));
 if(research && s.machineId!==research.machine?.machineId) errors.push("machineId mismatch with ResearchData");
 for(const f of features){
   if(!/^FEAT_[A-Z0-9_]+$/.test(f.featureId??"")) errors.push(`invalid featureId: ${f.featureId}`);
   if(research && !researchIds.has(f.researchFeatureId)) errors.push(`${f.featureId}: unknown researchFeatureId ${f.researchFeatureId}`);
   for(const k of ["numeratorInputId","denominatorInputId"]){
     if(f[k] && !idset.has(f[k])) errors.push(`${f.featureId}: unknown ${k} ${f[k]}`);
   }
   if(f.trialCountInputId && !idset.has(f.trialCountInputId)) errors.push(`${f.featureId}: unknown trialCountInputId ${f.trialCountInputId}`);
   for(const id of f.categoryInputIds??[]) if(!idset.has(id)) errors.push(`${f.featureId}: unknown category input ${id}`);
   if(f.denominatorInputIds){
     if(!Array.isArray(f.denominatorInputIds) || f.denominatorInputIds.length<2) errors.push(`${f.featureId}: denominatorInputIds must contain at least 2 input ids`);
     else for(const id of f.denominatorInputIds) if(!idset.has(id)) errors.push(`${f.featureId}: unknown denominator input ${id}`);
   }
   if(f.categoryExcludeLabels?.length && research){
     const rf=(research.features??[]).find(x=>x.researchFeatureId===f.researchFeatureId);
     if(rf?.candidateModel!=="multinomial") errors.push(`${f.featureId}: categoryExcludeLabels requires multinomial ResearchData`);
     else {
       for(const label of f.categoryExcludeLabels) if(!(rf.categories??[]).includes(label)) errors.push(`${f.featureId}: unknown categoryExcludeLabels ${label}`);
       const remain=(rf.categories??[]).filter(label=>!f.categoryExcludeLabels.includes(label));
       if(remain.length<2) errors.push(`${f.featureId}: categoryExcludeLabels leaves fewer than 2 categories`);
     }
   }
   if(f.residualCategoryLabel && research){
     const rf=(research.features??[]).find(x=>x.researchFeatureId===f.researchFeatureId);
     if(rf?.candidateModel!=="multinomial") errors.push(`${f.featureId}: residualCategoryLabel requires multinomial ResearchData`);
     else {
       if(!(rf.categories??[]).includes(f.residualCategoryLabel)) errors.push(`${f.featureId}: unknown residualCategoryLabel ${f.residualCategoryLabel}`);
       if((f.categoryExcludeLabels??[]).includes(f.residualCategoryLabel)) errors.push(`${f.featureId}: residualCategoryLabel cannot also be excluded`);
       const included=(rf.categories??[]).filter(label=>!(f.categoryExcludeLabels??[]).includes(label));
       const explicit=included.filter(label=>label!==f.residualCategoryLabel);
       const mapped=(f.numeratorInputId?1:0)+(f.categoryInputIds?.length??0);
       if(mapped!==explicit.length) errors.push(`${f.featureId}: numeratorInputId + categoryInputIds must match non-residual categories`);
     }
   }
   for(const [target,subs] of Object.entries(f.categorySubtractInputIds??{})){
     if(!idset.has(target)) errors.push(`${f.featureId}: unknown subtract target ${target}`);
     for(const id of subs??[]) if(!idset.has(id)) errors.push(`${f.featureId}: unknown subtract input ${id}`);
   }
   const dx=f.difficultyExposure;
   if(dx){
     if(!["per_game","fixed_rate","setting_rate","derived_event_rate"].includes(dx.mode)) errors.push(`${f.featureId}: invalid difficultyExposure.mode ${dx.mode}`);
     if(dx.mode==="per_game" && dx.factor!=null && (!Number.isFinite(Number(dx.factor))||Number(dx.factor)<0)) errors.push(`${f.featureId}: invalid difficultyExposure.factor`);
     if(dx.mode==="fixed_rate" && (!Number.isFinite(Number(dx.trialsPerGame))||Number(dx.trialsPerGame)<0)) errors.push(`${f.featureId}: fixed_rate requires nonnegative trialsPerGame`);
     if(dx.mode==="setting_rate"){
       const rates=dx.trialsPerGameBySetting??{};
       for(const setting of research?.machine?.settings??[]){
         if(!Number.isFinite(Number(rates[setting]))||Number(rates[setting])<0) errors.push(`${f.featureId}: setting_rate missing/invalid ${setting}`);
       }
     }
     if(dx.quality && !["EXACT","DERIVED","ESTIMATED","PROVISIONAL"].includes(dx.quality)) errors.push(`${f.featureId}: invalid difficultyExposure.quality ${dx.quality}`);
     if(dx.mode==="derived_event_rate"){
       if(!dx.sourceFeatureId) errors.push(`${f.featureId}: derived_event_rate requires sourceFeatureId`);
       const source=(s.features??[]).find(x=>x.featureId===dx.sourceFeatureId);
       if(dx.sourceFeatureId && !source) errors.push(`${f.featureId}: unknown difficultyExposure.sourceFeatureId ${dx.sourceFeatureId}`);
       if(dx.sourceFeatureId===f.featureId) errors.push(`${f.featureId}: derived_event_rate cannot reference itself`);
       if(dx.eventMultiplier!=null && (!Number.isFinite(Number(dx.eventMultiplier))||Number(dx.eventMultiplier)<0)) errors.push(`${f.featureId}: invalid difficultyExposure.eventMultiplier`);
       if(dx.sourceCategoryId && source && research){
         const rf=(research.features??[]).find(x=>x.researchFeatureId===source.researchFeatureId);
         if(rf?.candidateModel!=="multinomial") errors.push(`${f.featureId}: sourceCategoryId requires multinomial source feature`);
         else if(!(rf.categories??[]).includes(dx.sourceCategoryId)) errors.push(`${f.featureId}: unknown sourceCategoryId ${dx.sourceCategoryId}`);
       }
     }
   }
   if(f.adoptionCategory==="EXCLUDE" && (f.numeratorInputId||f.denominatorInputId||(f.categoryInputIds?.length))) warnings.push(`${f.featureId}: EXCLUDE has unused input mapping`);
 }
 const da=s.difficultyAnalysis;
 if(da?.targetGameBasis){
   const b=da.targetGameBasis;
   if(!b.basisId||!b.label) errors.push(`difficultyAnalysis.targetGameBasis requires basisId and label`);
   if(!["EXACT","DERIVED","ESTIMATED","PROVISIONAL","UNRESOLVED"].includes(b.quality)) errors.push(`difficultyAnalysis.targetGameBasis invalid quality ${b.quality}`);
 }
 for(const q of da?.calibrationAllowedExposureQualities??[]) if(!["EXACT","DERIVED","ESTIMATED","PROVISIONAL"].includes(q)) errors.push(`difficultyAnalysis invalid calibration exposure quality ${q}`);
 const machineSettings=new Set(research?.machine?.settings??[]);
 const researchEvidenceIds=new Set((research?.evidenceCandidates??[]).map(e=>e.researchEvidenceId));
 const evidenceGroupIds=new Set();
 for(const g of s.evidenceUi?.groups??[]){
   if(evidenceGroupIds.has(g.groupId)) errors.push(`duplicate evidenceUi groupId ${g.groupId}`);
   evidenceGroupIds.add(g.groupId);
   const optionValues=new Set();
   for(const o of g.options??[]){
     if(optionValues.has(o.value)) errors.push(`${g.groupId}: duplicate evidenceUi option ${o.value}`);
     optionValues.add(o.value);
     if(o.value==="NONE") errors.push(`${g.groupId}: explicit NONE option is not allowed`);
     for(const setting of [...(o.allowedSettings??[]),...(o.excludedSettings??[])])
       if(research && !machineSettings.has(setting)) errors.push(`${g.groupId}/${o.value}: unknown setting ${setting}`);
     for(const evidenceId of o.sourceEvidenceIds??[])
       if(research && !researchEvidenceIds.has(evidenceId)) errors.push(`${g.groupId}/${o.value}: unknown research evidence ${evidenceId}`);
   }
 }
 return {ok:errors.length===0,errors,warnings};
}
if(import.meta.url===`file://${process.argv[1]}`){
 const [selPath,researchPath]=process.argv.slice(2);
 if(!selPath){ console.error("Usage: node tools/validate-selection-data.mjs <selection-data.json> [research-data.json]"); process.exit(2); }
 try{
  const r=validateSelectionData(read(selPath),researchPath?read(researchPath):null);
  for(const w of r.warnings) console.warn(`WARNING: ${w}`);
  if(!r.ok){ for(const e of r.errors) console.error(`ERROR: ${e}`); process.exit(1); }
  console.log(`OK: SelectionDataを検証しました（警告 ${r.warnings.length}件）`);
 }catch(e){ console.error(`ERROR: ${e.message}`); process.exit(1); }
}
