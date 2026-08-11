import fs from "node:fs";

function read(p){ return JSON.parse(fs.readFileSync(p,"utf8")); }
export function validateSelectionData(s,research=null){
 const errors=[],warnings=[];
 if(s.schemaVersion!=="selection-data-v1") errors.push("schemaVersion must be selection-data-v1");
 if(!s.machineId) errors.push("machineId is required");
 if(!s.machineDataVersion) errors.push("machineDataVersion is required");
 const inputs=s.inputs??[], features=s.features??[];
 const ids=inputs.map(x=>x.id), idset=new Set(ids);
 if(idset.size!==ids.length) errors.push("duplicate input id");
 for(const i of inputs){
   if(!/^INP_[A-Z0-9_]+$/.test(i.id??"")) errors.push(`invalid input id: ${i.id}`);
   if(!i.name||!i.type||!i.category||!Number.isInteger(i.displayOrder)) errors.push(`incomplete input: ${i.id}`);
   if(i.parentInputId && !idset.has(i.parentInputId)) errors.push(`${i.id}: unknown parentInputId ${i.parentInputId}`);
 }
 const featIds=features.map(x=>x.featureId), featSet=new Set(featIds);
 if(featSet.size!==featIds.length) errors.push("duplicate featureId");
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
   for(const [target,subs] of Object.entries(f.categorySubtractInputIds??{})){
     if(!idset.has(target)) errors.push(`${f.featureId}: unknown subtract target ${target}`);
     for(const id of subs??[]) if(!idset.has(id)) errors.push(`${f.featureId}: unknown subtract input ${id}`);
   }
   const dx=f.difficultyExposure;
   if(dx){
     if(!["per_game","fixed_rate","setting_rate"].includes(dx.mode)) errors.push(`${f.featureId}: invalid difficultyExposure.mode ${dx.mode}`);
     if(dx.mode==="per_game" && dx.factor!=null && (!Number.isFinite(Number(dx.factor))||Number(dx.factor)<0)) errors.push(`${f.featureId}: invalid difficultyExposure.factor`);
     if(dx.mode==="fixed_rate" && (!Number.isFinite(Number(dx.trialsPerGame))||Number(dx.trialsPerGame)<0)) errors.push(`${f.featureId}: fixed_rate requires nonnegative trialsPerGame`);
     if(dx.mode==="setting_rate"){
       const rates=dx.trialsPerGameBySetting??{};
       for(const setting of research?.machine?.settings??[]){
         if(!Number.isFinite(Number(rates[setting]))||Number(rates[setting])<0) errors.push(`${f.featureId}: setting_rate missing/invalid ${setting}`);
       }
     }
   }
   if(f.adoptionCategory==="EXCLUDE" && (f.numeratorInputId||f.denominatorInputId||(f.categoryInputIds?.length))) warnings.push(`${f.featureId}: EXCLUDE has unused input mapping`);
 }
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
