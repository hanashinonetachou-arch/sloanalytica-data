import fs from "node:fs";
import path from "node:path";

function fail(msg){ throw new Error(msg); }
function readJson(p){ return JSON.parse(fs.readFileSync(p,"utf8")); }
function unique(xs){ return [...new Set(xs)]; }

const TRIAL_EPS=1e-12;
function trialClamp(v,a=0,b=1){ return Math.max(a,Math.min(b,Number(v))); }
function trialClampP(p){ return trialClamp(p,TRIAL_EPS,1-TRIAL_EPS); }
function trialBcBernoulli(p,q){ p=trialClampP(p); q=trialClampP(q); return Math.sqrt(p*q)+Math.sqrt((1-p)*(1-q)); }
function trialBcCategorical(p,q){ return p.reduce((sum,v,i)=>sum+Math.sqrt(Math.max(0,v)*Math.max(0,q[i])),0); }
function trialBcPoisson(a,b){ return Math.exp(-0.5*(Math.sqrt(Math.max(0,a))-Math.sqrt(Math.max(0,b)))**2); }
function trialCount80(bc){ bc=trialClamp(bc); if(bc>=1-TRIAL_EPS)return null; if(bc<=TRIAL_EPS)return 1; return Math.max(1,Math.ceil(Math.log(0.4)/Math.log(bc))); }
function researchCategoricalEntries(rf,setting){
  const cats=Array.isArray(rf.categories)?rf.categories:[]; const raw=rf.settingDistributions?.[setting];
  if(!raw||cats.length<2)return null;
  const known=[],missing=[];
  for(const c of cats){ const v=Number(raw[c]); if(Number.isFinite(v)) known.push([c,v]); else missing.push(c); }
  if(known.some(([,v])=>v<0||v>1))return null;
  const knownSum=known.reduce((sum,[,v])=>sum+v,0);
  if((rf.distributionMode??"complete")==="implicit_residual"){
    if(knownSum>1+1e-6||missing.length>1)return null;
    const entries=[];
    for(const c of cats){
      const v=Number(raw[c]);
      entries.push([c,Number.isFinite(v)?v:Math.max(0,1-knownSum)]);
    }
    // No named category is missing: the residual is an unnamed non-event category.
    if(missing.length===0 && knownSum<1-1e-12) entries.push(["__IMPLICIT_RESIDUAL__",Math.max(0,1-knownSum)]);
    return entries;
  }
  if(missing.length||Math.abs(knownSum-1)>1e-6)return null;
  return cats.map(c=>[c,Number(raw[c])]);
}
function selectedCategorical(rf,sf,setting){
  const entries=researchCategoricalEntries(rf,setting); if(!entries)return null;
  const excluded=new Set(sf.categoryExcludeLabels??[]);
  const kept=entries.filter(([c])=>!excluded.has(c));
  if(kept.length<2)return null;
  const probs=kept.map(([,v])=>v),sum=probs.reduce((a,b)=>a+b,0);
  if(sum<=0)return null;
  // categoryExcludeLabels explicitly conditions on the retained event set.
  return excluded.size?probs.map(v=>v/sum):probs;
}
function estimateRequiredTrials80(rf,sf,settings){
  if(!Array.isArray(settings)||settings.length<2)return null; const low=settings[0],high=settings.at(-1);
  if(rf.candidateModel==="multinomial"){ const p=selectedCategorical(rf,sf,low),q=selectedCategorical(rf,sf,high); return p&&q?trialCount80(trialBcCategorical(p,q)):null; }
  const p=Number(rf.settingValues?.[low]?.probability),q=Number(rf.settingValues?.[high]?.probability);
  if(!Number.isFinite(p)||!Number.isFinite(q))return null;
  return trialCount80(rf.candidateModel==="poisson"?trialBcPoisson(p,q):trialBcBernoulli(p,q));
}

function sourceClass(t){
  if(t==="official") return "OFFICIAL";
  if(t==="official_derived") return "OFFICIAL_DERIVED";
  return "ANALYSIS";
}
function inputWithDefaults(x){
  const defaultValue=x.defaultValue!==undefined?x.defaultValue:
    x.type==="boolean"?false:x.type==="multi_enum"?[]:x.type==="enum"?"__UNSET__":0;
  const y={...x,defaultValue,minimum:["integer","number","counter"].includes(x.type)?0:undefined,...(x.category==="PREDECESSOR"&&x.observationScope==null?{observationScope:"PREDECESSOR_SNAPSHOT"}:{})};
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
    modelType:sf.modelTypeOverride??rf.candidateModel,
    minimumSample:sf.minimumSample ?? 1,
    sampleRecommendation:sf.sampleRecommendation ?? sf.minimumSample ?? 1
  };
  if(sf.weight!=null) base.reliabilityProfile={weight:sf.weight};
  if(sf.suppressedByFeatureIds!=null){
    if(!Array.isArray(sf.suppressedByFeatureIds) || sf.suppressedByFeatureIds.length===0 || sf.suppressedByFeatureIds.some(id=>typeof id!=="string"||!id)) fail(`${sf.featureId}: invalid suppressedByFeatureIds`);
    base.suppressedByFeatureIds=[...sf.suppressedByFeatureIds];
  }
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
    const numeratorInputIds=Array.isArray(sf.numeratorInputIds)?sf.numeratorInputIds:[];
    const usesNumeratorSum=sf.inputTransform==="sum_inputs_to_numerator";
    const usesDenominatorSum=sf.inputTransform==="sum_inputs_to_trials";
    if(!sf.numeratorInputId) fail(`${sf.featureId}: numeratorInputId required`);
    if(!inputIds.has(sf.numeratorInputId)) fail(`${sf.featureId}: unknown numerator input`);
    if(usesNumeratorSum){
      if(numeratorInputIds.length<2||numeratorInputIds.some(id=>!inputIds.has(id))) fail(`${sf.featureId}: invalid numeratorInputIds`);
      base.numeratorInputIds=[...numeratorInputIds];
    }
    if(usesDenominatorSum){
      if(!Array.isArray(sf.denominatorInputIds)||sf.denominatorInputIds.length<2||sf.denominatorInputIds.some(id=>!inputIds.has(id))) fail(`${sf.featureId}: invalid denominatorInputIds`);
      base.denominatorInputIds=[...sf.denominatorInputIds];
    } else {
      if(!sf.denominatorInputId||!inputIds.has(sf.denominatorInputId)) fail(`${sf.featureId}: denominatorInputId required/unknown`);
      base.denominatorInputId=sf.denominatorInputId;
    }
    base.numeratorInputId=sf.numeratorInputId;
    if(base.displayFormat==null) base.displayFormat="ratio_1_over_n";
    base.probabilities=Object.fromEntries(Object.entries(rf.settingValues??{}).map(([s,v])=>[s,v.probability]).filter(([,p])=>Number.isFinite(p)));
  } else if(rf.candidateModel==="multinomial"){
    const sourceCats=rf.categories??[];
    if(!sourceCats.length) fail(`${sf.featureId}: categories missing in ResearchData`);
    const excludedCats=new Set(sf.categoryExcludeLabels??[]);
    for(const c of excludedCats) if(!sourceCats.includes(c)) fail(`${sf.featureId}: unknown categoryExcludeLabels ${c}`);
    const includedCats=sourceCats.filter(c=>!excludedCats.has(c));
    if(includedCats.length<2) fail(`${sf.featureId}: multinomial requires at least 2 included categories`);
    const residualCat=sf.residualCategoryLabel??null;
    if(residualCat && !includedCats.includes(residualCat)) fail(`${sf.featureId}: invalid residualCategoryLabel ${residualCat}`);
    const isConditionalPartial=typeof sf.conditionedOnInputId==="string" && sf.conditionedOnInputId.length>0;
    if(isConditionalPartial){
      if(!inputIds.has(sf.conditionedOnInputId)) fail(`${sf.featureId}: unknown conditionedOnInputId ${sf.conditionedOnInputId}`);
      if(!residualCat) fail(`${sf.featureId}: conditional partial multinomial requires residualCategoryLabel`);
      base.modelType="conditional_partial_multinomial";
      base.conditionedOnInputId=sf.conditionedOnInputId;
      base.inputTransform=sf.inputTransform??"sum_inputs_to_trials";
    }
    const cats=residualCat?includedCats.filter(c=>c!==residualCat):includedCats;
    if(cats.length<1) fail(`${sf.featureId}: multinomial requires at least 1 explicit category`);
    const orderedInputIds=[...(sf.numeratorInputId?[sf.numeratorInputId]:[]),...(sf.categoryInputIds??[])];
    if(orderedInputIds.length!==cats.length) fail(`${sf.featureId}: numeratorInputId + categoryInputIds must match explicit categories`);
    if(orderedInputIds.some(id=>!inputIds.has(id))) fail(`${sf.featureId}: unknown multinomial input`);
    if(sf.numeratorInputId) base.numeratorInputId=sf.numeratorInputId;
    if(base.inputTransform==="sum_inputs_to_trials" && !sf.denominatorInputIds){
      base.denominatorInputIds=[...orderedInputIds];
    }
    if(sf.denominatorInputId){
      if(!inputIds.has(sf.denominatorInputId)) fail(`${sf.featureId}: unknown denominator input`);
      base.denominatorInputId=sf.denominatorInputId;
    }
    if(sf.denominatorInputIds){
      if(!Array.isArray(sf.denominatorInputIds) || sf.denominatorInputIds.length<2 || sf.denominatorInputIds.some(id=>!inputIds.has(id))) fail(`${sf.featureId}: invalid denominatorInputIds`);
      base.denominatorInputIds=[...sf.denominatorInputIds];
    }
    base.categoryInputIds=sf.categoryInputIds??[];
    if(sf.optionalCategoryInputIds){
      if(!Array.isArray(sf.optionalCategoryInputIds) || sf.optionalCategoryInputIds.some(id=>id!==base.numeratorInputId && !base.categoryInputIds.includes(id))) fail(`${sf.featureId}: invalid optionalCategoryInputIds`);
      base.optionalCategoryInputIds=[...sf.optionalCategoryInputIds];
    }
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
      if(isConditionalPartial) return [s,probs];
      if(residualCat){
        const residual=Number(dist[residualCat]);
        if(!Number.isFinite(residual)) return [s,probs];
      }
      const includedProbs=includedCats.map(c=>Number(dist[c]));
      if(includedProbs.some(p=>!Number.isFinite(p)||p<0)) fail(`${sf.featureId}: invalid included category probability for ${s}`);
      const includedSum=includedProbs.reduce((a,b)=>a+b,0);
      if(includedSum<=0) fail(`${sf.featureId}: included category probability sum must be > 0 for ${s}`);
      return [s,(excludedCats.size||residualCat)?probs.map(p=>p/includedSum):probs];
    }));
    if(!isConditionalPartial && (excludedCats.size || (residualCat && Object.values(rf.settingDistributions??{}).every(dist=>Number.isFinite(Number(dist?.[residualCat])))))) base.categoryConditioning={excludedCategories:[...excludedCats],normalization:"RENORMALIZE_INCLUDED",...(residualCat?{residualCategory:residualCat}:{})};
  } else fail(`${sf.featureId}: unsupported candidateModel ${rf.candidateModel}`);
  base.sourceEvidenceRefs=rf.sourceRefs??[];
  return base;
}

function buildSelectionSummary(research,selection,statistics=null){
  const rfs=new Map((research.features??[]).map(f=>[f.researchFeatureId,f]));
  const statsById=new Map((statistics?.features??[]).map(f=>[f.researchFeatureId,f]));
  const selected=[],rejected=[];
  const selectedResearchIds=new Set((selection.features??[]).map(sf=>sf.researchFeatureId).filter(Boolean));
  for(const sf of selection.features??[]){
    if(sf.adoptionCategory==="DISPLAY_ONLY") continue;
    const rf=rfs.get(sf.researchFeatureId);
    if(!rf) continue;
    const item={
      featureId:sf.featureId,
      name:rf.name,
      reason:sf.userReason ?? sf.rejectionReason ?? (sf.adoptionCategory==="EXCLUDE"?"推測計算には使用していません。":"推測計算に採用しています。")
    };
    if(sf.requiredTrials?.value!=null){
      item.requiredTrials={value:sf.requiredTrials.value,unit:sf.requiredTrials.unit??rf.trialUnit??"回"};
    } else {
      const estimate=estimateRequiredTrials80(rf,sf,research.machine?.settings??[]);
      const statsEstimate=statsById.get(sf.researchFeatureId)?.extremePair80?.requiredTrials80;
      const value=Number.isFinite(estimate)?estimate:statsEstimate;
      if(Number.isFinite(value)) item.requiredTrials={value,unit:rf.trialUnit??"回"};
    }
    if(item.requiredTrials && /既存MachineData定義|existing machine data/i.test(String(item.requiredTrials.unit))) fail(`${sf.featureId}: requiredTrials.unit must be user-facing`);
    if(sf.adoptionCategory==="EXCLUDE") rejected.push(item);
    else if(sf.adoptionCategory==="INCLUDE_PRIMARY" || sf.adoptionCategory==="INCLUDE_SUPPORT") selected.push(item);
  }

  for(const rf of research.features??[]){
    if(!rf?.researchFeatureId || selectedResearchIds.has(rf.researchFeatureId) || rf.factStatus!=="verified") continue;
    const fact=String(rf.notes??"").trim();
    const reason=fact
      ? `${fact} 現行Selectionでは採用条件が確定していないため、推測計算には使用していません。`
      : "調査済みの設定差候補ですが、現行Selectionでは採用条件が確定していないため、推測計算には使用していません。";
    rejected.push({featureId:`REJECTED_${rf.researchFeatureId}`,name:rf.name,reason});
  }

  for(const extra of selection.rejectedElements??[]){
    if(!extra?.id || !extra?.name || !extra?.reason) fail("rejectedElements requires id, name and reason");
    if(rejected.some(item=>item.featureId===extra.id)) fail(`duplicate rejected element id: ${extra.id}`);
    const item={featureId:extra.id,name:extra.name,reason:extra.reason};
    if(extra.requiredTrials?.value!=null){
      if(!Number.isFinite(Number(extra.requiredTrials.value)) || Number(extra.requiredTrials.value)<0) fail(`${extra.id}: invalid requiredTrials.value`);
      item.requiredTrials={value:Number(extra.requiredTrials.value),unit:extra.requiredTrials.unit??"回"};
    }
    rejected.push(item);
  }

  return {
    schemaVersion:"selection-summary-v1",
    evaluatedCount:selected.length+rejected.length,
    selectedCount:selected.length,
    rejectedCount:rejected.length,
    selected,rejected
  };
}

function materializeEvidenceUi(research,selection){
  const generatedInputs=[],generatedEvidence=[];
  let nextOrder=100;
  for(const g of selection.evidenceUi?.groups??[]){
    const inputId=`INP_EVI_${g.groupId}`;
    const isMulti=g.selectionMode==="multi";
    generatedInputs.push({
      id:inputId,name:g.label,type:isMulti?"multi_enum":"enum",category:g.category??"EVIDENCE",unit:"",
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

export function buildMachineData(research,selection,statistics=null){
  if(selection.machineId!==research.machine?.machineId) fail("machineId mismatch");
  const rfs=new Map((research.features??[]).map(f=>[f.researchFeatureId,f]));
  const {generatedInputs,generatedEvidence}=materializeEvidenceUi(research,selection);
  const selectionSummary=buildSelectionSummary(research,selection,statistics);
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
  const orderedCategories=[...byCat.entries()].sort(([a],[b])=>a==="PREDECESSOR"?-1:b==="PREDECESSOR"?1:0);
  for(const [cat,items] of orderedCategories){
    const defaultCategoryLabels={CZ:"CZ",ZONE:"100G以内のゲーム数解除",AT_RETURN:"AT引き戻し",EVIDENCE:"設定確定・否定情報"};
    const categoryTitle=selection.uiCategoryLabels?.[cat]??defaultCategoryLabels[cat]??(cat==="PRIMARY"?null:cat);
    const sectionOptions=selection.uiSectionOptions?.[cat]??{};
    if(categoryTitle && /^(?:AUTO_|PRIMARY(?:_|$)|PREDECESSOR$|SELF_PLAY$|DISPLAY_ONLY(?:_|$)|REFERENCE_TOTAL$)/.test(categoryTitle)) fail(`ui category title must be user-facing: ${cat}`);
    sections.push({
      id:`AUTO_${cat}`.replace(/[^A-Z0-9_]/gi,"_").toUpperCase(),
      ...(categoryTitle?{title:categoryTitle}:{}),
      displayOrder:order++,
      ...(selection.uiCategoryDescriptions?.[cat]?{description:selection.uiCategoryDescriptions[cat]}:{}),
      ...(typeof sectionOptions.description==="string"&&sectionOptions.description?{description:sectionOptions.description}:{}),
      ...(typeof sectionOptions.collapsible==="boolean"?{collapsible:sectionOptions.collapsible}:{}),
      ...(typeof sectionOptions.defaultExpanded==="boolean"?{defaultExpanded:sectionOptions.defaultExpanded}:{}),
      ...(Array.isArray(sectionOptions.summaryInputIds)?{summaryInputIds:sectionOptions.summaryInputIds}:{}),
      items:items.sort((a,b)=>a.displayOrder-b.displayOrder).map(i=>({
        type:"input",inputId:i.id,label:i.name,
        ...(i.uiGridSpan?{gridSpan:i.uiGridSpan}:{}),
        ...((i.uiDirectInput===false||i.uiCompactCounter===true||i.uiQuickAdd!==undefined)?{config:{...(i.uiDirectInput===false?{directInput:false}:{}),...(i.uiCompactCounter===true?{compact:true}:{}),...(i.uiQuickAdd!==undefined?{quickAdd:i.uiQuickAdd}:{})}}:{}),
        widget:i.type==="counter"?"counter":i.type==="boolean"?"boolean":i.type==="enum"?"select":i.type==="multi_enum"?"multi_select":"number"
      }))
    });
  }
  const evidences=[];
  const researchEvidence=new Map((research.evidenceCandidates??[]).map(e=>[e.researchEvidenceId,e]));
  for(const e of selection.evidence??[]){
    if(!inputIds.has(e.inputId)) fail(`unknown evidence inputId: ${e.inputId}`);
    const re=e.researchEvidenceId?researchEvidence.get(e.researchEvidenceId):null;
    if(e.researchEvidenceId && !re) fail(`unknown researchEvidenceId: ${e.researchEvidenceId}`);
    const directContract=!e.researchEvidenceId && e.legacyContractSource==="published_machine_data";
    if(!re && !directContract) fail(`evidence ${e.evidenceId}: researchEvidenceId or approved legacy contract required`);
    const confirmed=re?(re.allowedSettings??re.confirmedSettings??[]):(e.confirmedSettings??[]);
    const denied=re?(re.deniedSettings??[]):(e.deniedSettings??[]);
    const name=re?.name??e.name??e.displayName??e.evidenceId;
    evidences.push({id:e.evidenceId,name,displayName:e.displayName??name,inputId:e.inputId,triggerValue:e.triggerValue,
      confirmedSettings:confirmed,deniedSettings:denied,hasImage:false,
      type:(denied.length>0 && confirmed.length===0)?"SETTING_DENIAL":"SETTING_CONFIRMATION"});
  }
  evidences.push(...generatedEvidence);
  return {
    schemaVersion:1,machine,
    inputs:{schemaVersion:"2.0.0",inputs:allInputs.map(inputWithDefaults)},
    features:{schemaVersion:"2.0.0",features},
    evidence:{version:"1.0.0",evidences,sources},
    ui:{sections},selectionSummary,reliability:{},
    metadata:{machineId:machine.machineId,displayName:machine.displayName,settings:machine.settings},
    validation:{cases:[]},statistics:{}
  };
}
if(import.meta.url===`file://${process.argv[1]}`){
  const [researchPath,selectionPath,outPath]=process.argv.slice(2);
  if(!researchPath||!selectionPath||!outPath){
    console.error("Usage: node tools/build-machine-data.mjs <research-data.json> <selection-data.json> <output-machine-package.json> [statistics-report.json]");
    process.exit(2);
  }
  try{
    const statisticsPath=process.argv[5];
    const pkg=buildMachineData(readJson(researchPath),readJson(selectionPath),statisticsPath?readJson(statisticsPath):null);
    fs.mkdirSync(path.dirname(outPath),{recursive:true});
    fs.writeFileSync(outPath,JSON.stringify(pkg,null,2)+"\n");
    console.log(`MachineData draft: ${outPath}`);
  }catch(e){ console.error(`ERROR: ${e.message}`); process.exit(1); }
}
