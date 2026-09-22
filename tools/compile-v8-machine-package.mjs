const clone=v=>v==null?v:structuredClone(v);
const safe=s=>String(s??'').replace(/[^A-Z0-9_]/gi,'_').toUpperCase();
const researchById=r=>new Map((r.features??[]).map(x=>[x.researchFeatureId,x]));
const observationByFeature=o=>new Map((o.numeric??[]).map(x=>[x.featureId,x]));

function compileInputs(observation,evidence){
  const inputs=new Map();
  for(const feature of observation.numeric??[]) for(const x of feature.inputs??[]){
    if(!x.engineInputId) continue;
    inputs.set(x.engineInputId,{id:x.engineInputId,name:x.label??x.id,type:x.type==='integer'?'integer':'counter',category:'NUMERIC',unit:x.unit??'',inferenceRole:'INCLUDE_PRIMARY',defaultValue:null,minimum:0});
  }
  const runtimeEvidence=clone(evidence??{groups:[]});
  for(const group of runtimeEvidence.groups??[]){
    const opportunity=group.interaction?.opportunityTracking;
    if(opportunity?.type==='SEPARATE_COUNTER'&&opportunity.inputId) inputs.set(opportunity.inputId,{id:opportunity.inputId,name:opportunity.label??group.title,type:'counter',category:'EVIDENCE',unit:'回',inferenceRole:'DISPLAY_ONLY',defaultValue:null,minimum:0});
    for(const option of group.options??[]){
      const inputId=option.engineBinding?.inputId??`INP_V8_${safe(option.sourceEvidenceId??group.groupId+'_'+option.label)}`;
      if(!option.engineBinding) option.engineBinding={mode:'COUNTER_POSITIVE',inputId};
      const role=(option.allowedSettings?.length||option.deniedSettings?.length)?'INCLUDE_SUPPORT':'DISPLAY_ONLY';
      if(option.engineBinding?.mode==='MULTI_ENUM_PRESENCE'){
        const existing=inputs.get(inputId);
        const trigger=option.engineBinding.triggerValue;
        const options=[...(existing?.options??[])];
        if(trigger!=null&&!options.some(x=>(typeof x==='string'?x:x.value)===trigger)) options.push({key:safe(option.sourceEvidenceId??trigger),label:option.label,value:trigger});
        inputs.set(inputId,{...(existing??{}),id:inputId,name:group.title,type:'multi_enum',category:'EVIDENCE',inferenceRole:role,defaultValue:null,options});
      }else{
        inputs.set(inputId,{id:inputId,name:`${group.title}: ${option.label}`,type:'counter',category:'EVIDENCE',unit:'回',inferenceRole:role,defaultValue:null,minimum:0});
      }
    }
  }
  return {inputs:[...inputs.values()],runtimeEvidence};
}

function compileFeatures(research,selection,observation){
  const rb=researchById(research), ob=observationByFeature(observation), out=[];
  for(const selected of selection.features??[]){
    if(!String(selected.adoptionCategory??'').startsWith('INCLUDE_')) continue;
    const obs=ob.get(selected.featureId); if(!obs) throw new Error(`${selected.featureId} observation contract missing`);
    const sources=(selected.sourceResearchFeatureIds?.length?selected.sourceResearchFeatureIds:[selected.researchFeatureId]).map(id=>rb.get(id));
    if(sources.some(x=>!x)) throw new Error(`${selected.featureId} research source missing`);
    const engineInputs=(obs.inputs??[]).filter(x=>x.engineInputId);
    const denominator=engineInputs.find(x=>x.type==='integer'||/GAMES/.test(x.engineInputId));
    const counters=engineInputs.filter(x=>x!==denominator&&x.shared!==true);
    const model=selected.dependencyContract?.combinationPolicy==='JOINT_MULTINOMIAL'?'multinomial':sources[0].candidateModel;
    if(model==='multinomial'){
      if(counters.length!==sources.length) throw new Error(`${selected.featureId} multinomial category/input mismatch`);
      const categoryProbabilities={};
      for(const setting of research.machine?.settings??[]) categoryProbabilities[setting]=sources.map(x=>x.settingValues?.[setting]?.probability);
      if(Object.values(categoryProbabilities).some(a=>a.some(p=>!Number.isFinite(p)))) throw new Error(`${selected.featureId} incomplete multinomial probabilities`);
      out.push({featureId:selected.featureId,name:selected.userReason?selected.featureId:(sources[0].name??selected.featureId),adoptionCategory:selected.adoptionCategory,calculationRole:'PROBABILITY',probabilityEngineUsage:true,modelType:'multinomial',numeratorInputId:counters[0].engineInputId,categoryInputIds:counters.slice(1).map(x=>x.engineInputId),denominatorInputId:denominator?.engineInputId,probabilities:{},categoryLabels:sources.map(x=>x.researchFeatureId),categoryProbabilities,categoryConditioning:{excludedCategories:[],normalization:'RENORMALIZE_INCLUDED',residualCategory:selected.dependencyContract?.residualCategory??'OTHER'},sourceResearchFeatureIds:selected.sourceResearchFeatureIds??[selected.researchFeatureId]});
    }else{
      const source=sources[0], probabilities=Object.fromEntries((research.machine?.settings??[]).map(s=>[s,source.settingValues?.[s]?.probability]));
      if(Object.values(probabilities).some(p=>!Number.isFinite(p))) throw new Error(`${selected.featureId} incomplete probabilities`);
      const primary=selected.dependencyContract?.preferredPrimary;
      out.push({featureId:selected.featureId,name:source.name??selected.featureId,adoptionCategory:selected.adoptionCategory,calculationRole:'PROBABILITY',probabilityEngineUsage:true,modelType:model,numeratorInputId:counters[0]?.engineInputId,denominatorInputId:denominator?.engineInputId,displayFormat:'ratio_1_over_n',probabilities,...(primary&&primary!==selected.featureId?{suppressedByFeatureIds:[primary]}:{}),sourceResearchFeatureIds:[selected.researchFeatureId]});
    }
  }
  return out;
}

function compileEvidence(runtimeEvidence){
  const evidences=[];
  for(const group of runtimeEvidence?.groups??[]) for(const option of group.options??[]){
    const hard=(option.allowedSettings?.length??0)>0||(option.deniedSettings?.length??0)>0;
    evidences.push({id:option.sourceEvidenceId,name:option.label,displayName:option.label,inputId:option.engineBinding?.inputId,triggerValue:option.engineBinding?.triggerValue,confirmedSettings:clone(option.allowedSettings??[]),deniedSettings:clone(option.deniedSettings??[]),hasImage:false,type:hard?((option.allowedSettings?.length??0)>0?'SETTING_CONFIRMATION':'SETTING_DENIAL'):'DISPLAY_ONLY',sourceEvidenceRefs:[option.sourceEvidenceId]});
  }
  return {version:'v8-runtime',evidences};
}

export function compileV8MachinePackage({research,selection,observation,evidence,highLow,summary,canonical,materializeUi}){
  const id=research.machine?.machineId;
  if(!id||selection.machineId!==id||observation.machineId!==id||canonical.machineId!==id) throw new Error('v8 machineId mismatch');
  const {inputs,runtimeEvidence}=compileInputs(observation,evidence);
  const features=compileFeatures(research,selection,observation);
  const runtimeEvidenceSection=compileEvidence(runtimeEvidence);
  const ui=materializeUi(canonical,{observationContract:observation,evidenceContract:runtimeEvidence});
  return {schemaVersion:1,machine:{schemaVersion:'2.0.0',machineId:id,machineDataVersion:selection.machineDataVersion??'repro-v8',displayName:research.machine.displayName,modelName:research.machine.modelName??research.machine.displayName,manufacturer:research.machine.manufacturer,settings:clone(research.machine.settings),packagePolicy:{offlineCapable:true,containsImages:false,containsExecutableCode:false}},inputs:{schemaVersion:'2.0.0',inputs},features:{schemaVersion:'2.0.0',features},evidence:runtimeEvidenceSection,ui,manifestRevision:canonical.manifestRevision,v8:{source:'REPRO_V8_UPSTREAM_ONLY',researchSchemaVersion:research.schemaVersion,selection:clone(selection),observation:clone(observation),evidence:clone(evidence),highLowDiscrimination:clone(highLow),machineResearchSummary:clone(summary)}};
}
