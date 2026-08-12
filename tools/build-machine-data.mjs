import fs from "node:fs";
import path from "node:path";

function fail(msg){ throw new Error(msg); }
function readJson(p){ return JSON.parse(fs.readFileSync(p,"utf8")); }
function unique(xs){ return [...new Set(xs)]; }
function sourceClass(t){
  if(t==="official") return "OFFICIAL";
  if(t==="official_derived") return "OFFICIAL_DERIVED";
  return "ANALYSIS";
}
function inputWithDefaults(x){
  const defaultValue=x.defaultValue!==undefined?x.defaultValue:
    x.type==="boolean"?false:x.type==="multi_enum"?[]:x.type==="enum"?"__UNSET__":0;
  const y={...x,defaultValue,minimum:["integer","number","counter"].includes(x.type)?0:undefined};
  for(const k of Object.keys(y)) if(y[k]===undefined) delete y[k];
  return y;
}
function buildFeature(rf,sf,inputIds){
  const role=sf.adoptionCategory;
  if(role==="EXCLUDE") return null;
  const base={
    featureId:sf.featureId,name:rf.name,adoptionCategory:role,
    calculationRole:role==="DISPLAY_ONLY"?"DISPLAY_ONLY":"PROBABILITY",
    probabilityEngineUsage:role!=="DISPLAY_ONLY",
    modelType:rf.candidateModel,
    minimumSample:sf.minimumSample ?? 1,
    sampleRecommendation:sf.sampleRecommendation ?? sf.minimumSample ?? 1
  };
  if(sf.weight!=null) base.weight=sf.weight;
  if(sf.inputTransform!=null) base.inputTransform=sf.inputTransform;
  if(sf.trialCountInputId!=null){
    if(!inputIds.has(sf.trialCountInputId)) fail(`${sf.featureId}: unknown trialCountInputId ${sf.trialCountInputId}`);
    base.trialCountInputId=sf.trialCountInputId;
  }
  if(sf.displayFormat!=null) base.displayFormat=sf.displayFormat;
  if(sf.denominatorAdjustments){
    for(const a of sf.denominatorAdjustments){
      if(!inputIds.has(a.inputId)||!Number.isFinite(a.multiplier)) fail(`${sf.featureId}: invalid denominatorAdjustments`);
    }
    base.denominatorAdjustments=sf.denominatorAdjustments;
  }
  if(rf.candidateModel==="binomial" || rf.candidateModel==="poisson"){
    if(!sf.numeratorInputId||!sf.denominatorInputId) fail(`${sf.featureId}: numeratorInputId/denominatorInputId required`);
    if(!inputIds.has(sf.numeratorInputId)||!inputIds.has(sf.denominatorInputId)) fail(`${sf.featureId}: unknown input mapping`);
    base.numeratorInputId=sf.numeratorInputId; base.denominatorInputId=sf.denominatorInputId;
    if(base.displayFormat==null) base.displayFormat="ratio_1_over_n";
    base.probabilities=Object.fromEntries(Object.entries(rf.settingValues??{}).map(([s,v])=>[s,v.probability]).filter(([,p])=>Number.isFinite(p)));
  } else if(rf.candidateModel==="multinomial"){
    const sourceCats=rf.categories??[];
    if(!sourceCats.length) fail(`${sf.featureId}: categories missing in ResearchData`);
    const excludedCats=new Set(sf.categoryExcludeLabels??[]);
    for(const c of excludedCats) if(!sourceCats.includes(c)) fail(`${sf.featureId}: unknown categoryExcludeLabels ${c}`);
    const cats=sourceCats.filter(c=>!excludedCats.has(c));
    if(cats.length<2) fail(`${sf.featureId}: multinomial requires at least 2 included categories`);
    const orderedInputIds=[...(sf.numeratorInputId?[sf.numeratorInputId]:[]),...(sf.categoryInputIds??[])];
    if(orderedInputIds.length!==cats.length) fail(`${sf.featureId}: numeratorInputId + categoryInputIds must match included categories`);
    if(orderedInputIds.some(id=>!inputIds.has(id))) fail(`${sf.featureId}: unknown multinomial input`);
    if(sf.numeratorInputId) base.numeratorInputId=sf.numeratorInputId;
    if(sf.denominatorInputId){
      if(!inputIds.has(sf.denominatorInputId)) fail(`${sf.featureId}: unknown denominator input`);
      base.denominatorInputId=sf.denominatorInputId;
    }
    base.categoryInputIds=sf.categoryInputIds??[];
    base.probabilities={};
    if(sf.categorySubtractInputIds){
      for(const [target,subs] of Object.entries(sf.categorySubtractInputIds)){
        if(!inputIds.has(target) || subs.some(id=>!inputIds.has(id))) fail(`${sf.featureId}: unknown categorySubtractInputIds mapping`);
      }
      base.categorySubtractInputIds=sf.categorySubtractInputIds;
    }
    base.categoryLabels=cats;
    base.categoryProbabilities=Object.fromEntries(Object.entries(rf.settingDistributions??{}).map(([s,dist])=>{
      const probs=cats.map(c=>Number(dist[c]));
      if(probs.some(p=>!Number.isFinite(p)||p<0)) fail(`${sf.featureId}: invalid category probability for ${s}`);
      const sum=probs.reduce((a,b)=>a+b,0);
      if(sum<=0) fail(`${sf.featureId}: included category probability sum must be > 0 for ${s}`);
      return [s,excludedCats.size?probs.map(p=>p/sum):probs];
    }));
    if(excludedCats.size) base.categoryConditioning={excludedCategories:[...excludedCats],normalization:"RENORMALIZE_INCLUDED"};
  } else fail(`${sf.featureId}: unsupported candidateModel ${rf.candidateModel}`);
  base.sourceEvidenceRefs=rf.sourceRefs??[];
  return base;
}

function materializeEvidenceUi(research,selection){
  const generatedInputs=[],generatedEvidence=[];
  let nextOrder=100;
  for(const g of selection.evidenceUi?.groups??[]){
    const inputId=`INP_EVI_${g.groupId}`;
    const isMulti=g.selectionMode==="multi";
    generatedInputs.push({
      id:inputId,name:g.label,type:isMulti?"multi_enum":"enum",category:"EVIDENCE",unit:"",
      displayOrder:g.displayOrder??nextOrder++,inferenceRole:"INCLUDE_SUPPORT",
      options:[
        ...(!isMulti?[{key:"__UNSET__",label:"未選択",value:"__UNSET__"}]:[]),
        ...(g.options??[]).map(o=>({key:o.value,label:o.label,value:o.value}))
      ]
    });
    for(const o of g.options??[]){
      const confirmedSettings=o.allowedSettings??[];
      const deniedSettings=o.excludedSettings??[];
      if(!confirmedSettings.length&&!deniedSettings.length) continue;
      generatedEvidence.push({
        id:`EVI_${g.groupId}_${o.value}`.replace(/[^A-Z0-9_]/gi,"_").toUpperCase(),
        name:o.label,displayName:o.label,inputId,triggerValue:o.value,
        confirmedSettings,deniedSettings,hasImage:false,
        type:deniedSettings.length&&!confirmedSettings.length?"SETTING_DENIAL":"SETTING_CONFIRMATION",
        sourceEvidenceRefs:o.sourceEvidenceIds??[]
      });
    }
  }
  return {generatedInputs,generatedEvidence};
}

export function buildMachineData(research,selection){
  if(selection.machineId!==research.machine?.machineId) fail("machineId mismatch");
  const rfs=new Map((research.features??[]).map(f=>[f.researchFeatureId,f]));
  const {generatedInputs,generatedEvidence}=materializeEvidenceUi(research,selection);
  const allInputs=[...(selection.inputs??[]),...generatedInputs];
  const inputIds=new Set(allInputs.map(x=>x.id));
  if(inputIds.size!==allInputs.length) fail("duplicate input id");
  const features=[];
  for(const sf of selection.features??[]){
    const rf=rfs.get(sf.researchFeatureId);
    if(!rf) fail(`unknown researchFeatureId: ${sf.researchFeatureId}`);
    const built=buildFeature(rf,sf,inputIds); if(built) features.push(built);
  }
  const sources=(research.sources??[]).map(s=>({
    id:s.sourceId,classification:sourceClass(s.sourceType),pageName:s.title,url:s.url,checkedAt:s.checkedAt
  }));
  const machine={
    schemaVersion:"2.0.0",machineId:research.machine.machineId,machineDataVersion:selection.machineDataVersion,
    displayName:research.machine.displayName,modelName:research.machine.modelNumber,manufacturer:research.machine.manufacturer,
    settings:research.machine.settings,
    packagePolicy:{offlineCapable:true,containsImages:false,containsExecutableCode:false}
  };
  const sections=[];
  const byCat=new Map();
  for(const i of allInputs){
    if(!byCat.has(i.category)) byCat.set(i.category,[]);
    byCat.get(i.category).push(i);
  }
  let order=1;
  for(const [cat,items] of byCat){
    sections.push({
      id:`AUTO_${cat}`.replace(/[^A-Z0-9_]/gi,"_").toUpperCase(),
      ...(cat==="PRIMARY"||cat==="EVIDENCE"?{}:{title:(selection.uiCategoryLabels?.[cat]??({CZ:"CZ",ZONE:"100G以内のゲーム数解除",AT_RETURN:"AT引き戻し"}[cat]??cat))}),
      displayOrder:order++,
      items:items.sort((a,b)=>a.displayOrder-b.displayOrder).map(i=>({
        type:"input",inputId:i.id,label:i.name,
        widget:i.type==="counter"?"counter":i.type==="boolean"?"boolean":i.type==="enum"?"select":i.type==="multi_enum"?"multi_select":"number"
      }))
    });
  }
  const evidences=[];
  const researchEvidence=new Map((research.evidenceCandidates??[]).map(e=>[e.researchEvidenceId,e]));
  for(const e of selection.evidence??[]){
    const re=researchEvidence.get(e.researchEvidenceId);
    if(!re) fail(`unknown researchEvidenceId: ${e.researchEvidenceId}`);
    if(!inputIds.has(e.inputId)) fail(`unknown evidence inputId: ${e.inputId}`);
    evidences.push({id:e.evidenceId,name:re.name,displayName:e.displayName??re.name,inputId:e.inputId,triggerValue:e.triggerValue,
      confirmedSettings:re.allowedSettings??re.confirmedSettings??[],deniedSettings:re.deniedSettings??[],hasImage:false,
      type:(re.deniedSettings?.length??0)>0 && !(re.confirmedSettings?.length??0)?"SETTING_DENIAL":"SETTING_CONFIRMATION"});
  }
  evidences.push(...generatedEvidence);
  return {
    schemaVersion:1,machine,
    inputs:{schemaVersion:"2.0.0",inputs:allInputs.map(inputWithDefaults)},
    features:{schemaVersion:"2.0.0",features},
    evidence:{version:"1.0.0",evidences,sources},
    ui:{sections},reliability:{},
    metadata:{machineId:machine.machineId,displayName:machine.displayName,settings:machine.settings},
    validation:{cases:[]},statistics:{}
  };
}
if(import.meta.url===`file://${process.argv[1]}`){
  const [researchPath,selectionPath,outPath]=process.argv.slice(2);
  if(!researchPath||!selectionPath||!outPath){
    console.error("Usage: node tools/build-machine-data.mjs <research-data.json> <selection-data.json> <output-machine-package.json>");
    process.exit(2);
  }
  try{
    const pkg=buildMachineData(readJson(researchPath),readJson(selectionPath));
    fs.mkdirSync(path.dirname(outPath),{recursive:true});
    fs.writeFileSync(outPath,JSON.stringify(pkg,null,2)+"\n");
    console.log(`MachineData draft: ${outPath}`);
  }catch(e){ console.error(`ERROR: ${e.message}`); process.exit(1); }
}
