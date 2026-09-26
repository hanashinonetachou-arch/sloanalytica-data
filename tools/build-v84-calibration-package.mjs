import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const clone=x=>structuredClone(x);
const safe=x=>String(x).replace(/[^A-Z0-9_]/gi,"_").toUpperCase();

export function compileV84CalibrationPackage({machineData,runtimeBinding}){
 const id=machineData.machineId;
 if(!id||runtimeBinding.machineId!==id) throw new Error("v8.4 calibration machineId mismatch");
 if(machineData.provenance?.legacyOracleUsed!==false||runtimeBinding.rules?.noLegacyOracle!==true) throw new Error("legacy oracle boundary violated");
 const activeBindings=new Map(runtimeBinding.featureBindings.map(x=>[x.featureId,x]));
 const candidates=clone(machineData.candidateContracts);
 const inputs=[];
 const inputSeen=new Set();
 const addInput=(id,label,role)=>{if(inputSeen.has(id))return;inputSeen.add(id);inputs.push({id,name:label??id,type:role==="DENOMINATOR"?"integer":"counter",category:"NUMERIC",unit:role==="DENOMINATOR"?"G":"回",inferenceRole:"INCLUDE_PRIMARY",defaultValue:null,minimum:0});};
 const featureName=new Map((machineData.summary?.adopted??[]).map(x=>[x.featureId,x.name]));
 const labelByObs=new Map();
 for(const s of machineData.canonicalUi.sections??[]) for(const x of s.inputs??[]) labelByObs.set(x.observationId,x.label);
 for(const o of machineData.observationContracts??[]) for(const x of o.inputs??[]) addInput(x.id,labelByObs.get(x.id),x.role);
 const features=[];
 for(const c of candidates){
  if(c.eligibility!=="ELIGIBLE") continue;
  const bind=activeBindings.get(c.featureId); if(!bind) throw new Error(c.featureId+" explicit runtime binding missing");
  const obs=machineData.observationContracts.find(x=>x.featureId===c.featureId); if(!obs) throw new Error(c.featureId+" observation missing");
  const model=machineData.inferenceModels[c.featureId]; if(!model) throw new Error(c.featureId+" inference model missing");
  const denominator=obs.inputs.find(x=>x.role==="DENOMINATOR");
  const numerator=obs.inputs.find(x=>x.role==="NUMERATOR");
  const categories=obs.inputs.filter(x=>x.role==="CATEGORY_COUNT");
  if(model.model==="BINOMIAL"){
   if(!denominator||!numerator) throw new Error(c.featureId+" binomial input binding incomplete");
   features.push({featureId:c.featureId,name:featureName.get(c.featureId)??c.featureId,adoptionCategory:c.adoptionCategory,calculationRole:"PROBABILITY",probabilityEngineUsage:true,modelType:"binomial",numeratorInputId:numerator.id,denominatorInputId:denominator.id,displayFormat:"ratio_1_over_n",probabilities:clone(model.probabilities),sourceResearchFeatureIds:clone(bind.researchFeatureIds)});
  }else if(model.model==="MULTINOMIAL"){
   if(categories.length<2) throw new Error(c.featureId+" multinomial categories missing");
   const derivedDen=obs.derived?.find(x=>x.role==="DENOMINATOR");
   const residual=obs.derived?.find(x=>x.role==="RESIDUAL_CATEGORY");
   const explicitLabels=categories.map(x=>x.category);
   const allLabels=model.categories??[];
   if(residual&&!allLabels.includes("OTHER")) throw new Error(c.featureId+" residual OTHER model missing");
   const probs={};
   for(const [setting,p] of Object.entries(model.probabilities??{})){
    if(Array.isArray(p)){
     const keep=allLabels.map((label,i)=>({label,value:p[i]})).filter(x=>explicitLabels.includes(x.label)).map(x=>x.value);
     probs[setting]=keep;
    }else probs[setting]=explicitLabels.map(label=>p[label]);
   }
   const denId=denominator?.id??categories[0].id;
   features.push({featureId:c.featureId,name:featureName.get(c.featureId)??c.featureId,adoptionCategory:c.adoptionCategory,calculationRole:"PROBABILITY",probabilityEngineUsage:true,modelType:"multinomial",numeratorInputId:categories[0].id,categoryInputIds:categories.slice(1).map(x=>x.id),denominatorInputId:denId,denominatorRule:derivedDen?"SUM_CATEGORY_COUNTS":undefined,categoryLabels:explicitLabels,categoryProbabilities:probs,probabilities:{},sourceResearchFeatureIds:clone(bind.researchFeatureIds),derivedResidualCategory:residual?{id:residual.id,label:"OTHER",formula:residual.formula}:undefined});
  }else throw new Error(c.featureId+" unsupported model "+model.model);
 }
 const evidenceInputs=[],evidences=[];
 for(const g of machineData.evidence.groups??[]) for(const o of g.items??[]){
  const inputId="INP_"+safe(o.evidenceId); evidenceInputs.push({id:inputId,name:o.name,type:"counter",category:"EVIDENCE",unit:"回",inferenceRole:o.type==="HARD_SETTING_CONSTRAINT"?"INCLUDE_SUPPORT":"DISPLAY_ONLY",defaultValue:null,minimum:0});
  evidences.push({id:o.evidenceId,name:o.name,displayName:o.name,inputId,confirmedSettings:clone(o.allowedSettings??[]),deniedSettings:clone(o.deniedSettings??[]),hasImage:false,type:o.type==="HARD_SETTING_CONSTRAINT"?"SETTING_CONSTRAINT":"DISPLAY_ONLY",sourceEvidenceRefs:[o.evidenceId]});
 }
 const runtimeUi={...clone(machineData.canonicalUi),source:"CANONICAL_UI",sections:(machineData.canonicalUi.sections??[]).map(s=>{
   if(s.inputs) return {...clone(s),items:[{id:"GRP_"+safe(s.id),title:s.title,inputs:s.inputs.map(x=>({id:x.observationId,label:x.label,input:x.role==="DENOMINATOR"?"denominator":"counter",gridSpan:x.role==="DENOMINATOR"?12:6}))}]};
   if(s.evidenceGroupId){const g=machineData.evidence.groups.find(x=>x.groupId===s.evidenceGroupId);return {...clone(s),items:[{id:s.evidenceGroupId,interaction:{type:"CATEGORY_COUNTERS",preservePriorObservations:true,showAccumulatedCounts:true,categoryCoverage:"NON_EXHAUSTIVE",totalOpportunities:"NOT_REQUIRED",opportunityTracking:{type:"NONE"},categories:(g?.items??[]).map(o=>({id:o.evidenceId,label:o.name,meaning:"観測した回数"}))}}]};}
   return clone(s);
 })};
 const projection=clone(machineData.runtimeProjection).map(x=>({...x,importance:candidates.find(c=>c.featureId===x.featureId)?.importance}));
 const provenance={manifestVersion:"8.4",generationPath:"V8_RESEARCH_PIPELINE",researchOrigin:"ZERO_BASE_PUBLIC_RESEARCH",legacyOracleUsed:false};
 const linkedPlay={service:machineData.linkedPlay?.service,status:machineData.linkedPlay?.supportStatus==="CONFIRMED"?"AVAILABLE":"UNRESOLVED",availableFieldsStatus:machineData.linkedPlay?.availableFieldsStatus??"UNRESOLVED",automaticImportCapability:"UNRESOLVED"};
 return {schemaVersion:1,provenance,linkedPlay,machine:{schemaVersion:"2.0.0",machineId:id,machineDataVersion:"8.4.0-calibration.1",displayName:machineData.machine.displayName,modelName:machineData.machine.displayName,manufacturer:machineData.machine.manufacturer,settings:clone(machineData.machine.settings),packagePolicy:{offlineCapable:true,containsImages:false,containsExecutableCode:false}},inputs:{schemaVersion:"2.0.0",inputs:[...inputs,...evidenceInputs]},features:{schemaVersion:"2.0.0",candidates,runtimeProjection:projection,features},evidence:{version:"v8.4-runtime",evidences},ui:runtimeUi,v8:{source:"REPRO_V8_UPSTREAM_ONLY",provenance:clone(provenance),linkedPlay:clone(linkedPlay),productionCalibration:true,runtimeBinding:clone(runtimeBinding),machineResearchSummary:clone(machineData.summary),highLowDiscrimination:clone(machineData.highLowDiscrimination),observation:clone(machineData.observationContracts),evidenceContract:clone(machineData.evidence)}};
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===path.resolve(process.argv[1])){
 const id=process.argv[2];if(!id)throw new Error("Usage: node tools/build-v84-calibration-package.mjs MACHINE_ID");
 const d=path.join(ROOT,"repro-v8",id);
 const md=JSON.parse(fs.readFileSync(path.join(d,"phase6-machine-data-runtime-v84-production-calibration.json"),"utf8"));
 const binding=JSON.parse(fs.readFileSync(path.join(d,"phase6-runtime-binding-v84-production-calibration.json"),"utf8"));
 const pkg=compileV84CalibrationPackage({machineData:md,runtimeBinding:binding});
 const out=path.join(d,"machine-package.generated.json");fs.writeFileSync(out,JSON.stringify(pkg,null,2)+"
");console.log(out);
}
