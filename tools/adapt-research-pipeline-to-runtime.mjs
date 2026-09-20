// Adapter from the 2026-09 Machine Research pipeline to runtime builder contracts.
// This module deliberately fails closed. It never re-runs Selection.
export function parseRate(rate) {
  if (typeof rate !== "string") return null;
  const m = /^1\/(\d+(?:\.\d+)?)$/.exec(rate.trim());
  return m ? 1 / Number(m[1]) : null;
}
export function outcomeSettings(tag, settings) {
  const n=s=>Number(String(s).replace("SET_",""));
  if(/^SET_[2-6]_PLUS$/.test(tag)){const floor=n(tag.replace("_PLUS",""));return settings.filter(s=>n(s)>=floor);}
  if(/^SET_[1-6]$/.test(tag)) return [tag];
  if(tag==="SET_2_4_6") return ["SET_2","SET_4","SET_6"].filter(s=>settings.includes(s));
  if(tag==="SET_3_5_6") return ["SET_3","SET_5","SET_6"].filter(s=>settings.includes(s));
  return [];
}
function deniedSettings(tag, settings) { const m=String(tag).match(/^NOT_SET_([2-6](?:_[2-6])*)/); return m ? m[1].split("_").map(x=>`SET_${x}`).filter(x=>settings.includes(x)) : []; }
export function adaptResearch(research) {
  const settings=research.machine.settings;
  const features=(research.features??[]).map(f=>{
    if(f.candidateModel==="binomial" && Array.isArray(f.rates)){
      const ps=f.rates.map(parseRate); if(ps.some(x=>!Number.isFinite(x))) throw new Error(`${f.researchFeatureId}: invalid rate`);
      return {...f,settingValues:Object.fromEntries(settings.map((s,i)=>[s,{probability:ps[i]}]))};
    }
    if(f.candidateModel==="binomial" && Array.isArray(f.probabilities)){
      return {...f,settingValues:Object.fromEntries(settings.map((s,i)=>[s,{probability:Number(f.probabilities[i])}]))};
    }
    if(f.candidateModel==="multinomial" && f.categories && !Array.isArray(f.categories)){
      const labels=Object.keys(f.categories).filter(x=>x!=="OTHER"), rows={};
      for(let i=0;i<settings.length;i++){const d={};let sum=0;for(const c of labels){const p=parseRate(f.categories[c][i]);if(!Number.isFinite(p))throw new Error(`${f.researchFeatureId}: invalid ${c}`);d[c]=p;sum+=p;}d.OTHER=1-sum;rows[settings[i]]=d;}
      return {...f,categories:[...labels,"OTHER"],settingDistributions:rows};
    }
    return f;
  });
  return {...research,features};
}
export function compileEvidenceContract(research, canonicalUi) {
  const settings=research.machine.settings, byId=new Map((research.evidenceCandidates??[]).map(e=>[e.evidenceId,e]));
  const inputs=[],items=[];
  for(const section of canonicalUi.sections??[]){
    if(section.kind!=="EVIDENCE") continue;
    for(const eid of section.items??[]){
      const e=byId.get(eid); if(!e) throw new Error(`${eid}: missing evidence candidate`);
      const inputId=`INP_${eid}`;
      inputs.push({id:inputId,name:e.name,type:"multi_enum",category:section.id,unit:"",displayOrder:inputs.length+100,inferenceRole:"INCLUDE_SUPPORT",options:e.outcomes.map(([label])=>({key:label,label,value:label}))});
      for(const [outcomeIndex,[label,tag]] of e.outcomes.entries()){const confirmed=outcomeSettings(tag,settings),denied=deniedSettings(tag,settings);items.push({evidenceId:`${eid}_OPT_${String(outcomeIndex+1).padStart(2,"0")}`.toUpperCase(),displayName:label,inputId,triggerValue:label,confirmedSettings:confirmed,deniedSettings:denied,runtimeType:confirmed.length?"SETTING_CONFIRMATION":denied.length?"SETTING_DENIAL":"DISPLAY_ONLY",sourceResearchEvidenceIds:[eid],sharedFeatureIds:[]});}
    }
  }
  return {contractVersion:"selection-evidence-v2",inputs,items};
}
export function adaptSelection(research, selection, observation, canonicalUi) {
  const obs=new Map((observation.numeric??[]).map(o=>[o.featureId,o]));
  const rfById=new Map((research.features??[]).map(f=>[f.researchFeatureId,f]));
  const featureResearch=new Map();
  // explicit links where the pilot Selection omitted researchFeatureId
  for(const sf of selection.features??[]){
    if(sf.researchFeatureId) featureResearch.set(sf.featureId,sf.researchFeatureId);
    else {
      const aliases={FEAT_COMMON_BELL:"RF_COMMON_BELL",FEAT_CZ_AGG:"RF_CZ_AGG",FEAT_AT_INITIAL:"RF_AT",FEAT_CZ_INITIAL:"RF_CZ",FEAT_BONUS_INITIAL:"RF_BONUS",FEAT_RARE_ROLE_MULTI:"RF_RARE_ROLE"};
      if(aliases[sf.featureId]) featureResearch.set(sf.featureId,aliases[sf.featureId]);
    }
  }
  const inputs=[],features=[];let order=1;
  for(const sf of selection.features??[]){
    if(!String(sf.disposition).startsWith("ADOPT")) continue;
    const rid=featureResearch.get(sf.featureId),rf=rfById.get(rid),o=obs.get(sf.featureId);
    if(!rf||!o||o.feasibility!=="PASS") throw new Error(`${sf.featureId}: adopted feature lacks research/observation`);
    const role=sf.disposition==="ADOPT_PRIMARY"?"INCLUDE_PRIMARY":"INCLUDE_FALLBACK"; const alternativeSuppressors={L_GOBLIN_SLAYER_RD:{FEAT_AT_INITIAL:["FEAT_CZ_AGG"]},L_LOVEJOU3_M4:{FEAT_AT_INITIAL:["FEAT_LOVE_ZONE"]},L_SMASLO_KAIJI_KYOEN_FJ:{FEAT_BONUS_INITIAL:["FEAT_CZ_INITIAL"]}}; const suppressedByFeatureIds=alternativeSuppressors[research.machine.machineId]?.[sf.featureId];
    if(rf.candidateModel==="multinomial"){
      const cats=rf.categories; const catIds=cats.filter(c=>c!=="OTHER").map(c=>`INP_${sf.featureId}_${c}`); const totalId=`INP_${sf.featureId}_GAMES`;
      catIds.forEach((id,i)=>inputs.push({id,name:(o.categories??[])[i]??cats[i],type:"counter",category:"NUMERIC",unit:"回",displayOrder:order++,inferenceRole:role})); inputs.push({id:totalId,name:o.denominator??"観測総ゲーム",type:"counter",category:"NUMERIC",unit:"G",displayOrder:order++,inferenceRole:role});
      features.push({...sf,researchFeatureId:rid,adoptionCategory:role,modelTypeOverride:"multinomial",numeratorInputId:catIds[0],categoryInputIds:catIds.slice(1),residualCategoryLabel:"OTHER",denominatorInputId:totalId,...(suppressedByFeatureIds?{suppressedByFeatureIds}:{})});
    } else {
      const num=`INP_${sf.featureId}_COUNT`,den=`INP_${sf.featureId}_GAMES`;
      inputs.push({id:num,name:rf.name,type:"counter",category:"NUMERIC",unit:"回",displayOrder:order++,inferenceRole:role},{id:den,name:o.denominator??rf.denominator?.target??"対象ゲーム",type:"counter",category:"NUMERIC",unit:"G",displayOrder:order++,inferenceRole:role});
      features.push({...sf,researchFeatureId:rid,adoptionCategory:role,numeratorInputId:num,denominatorInputId:den,...(suppressedByFeatureIds?{suppressedByFeatureIds}:{})});
    }
  }
  return {...selection,inputs,features,evidenceContract:compileEvidenceContract(research,canonicalUi),uiCategoryLabels:{NUMERIC:(canonicalUi.sections??[]).find(s=>s.kind==="NUMERIC")?.title??"実戦データ",...Object.fromEntries((canonicalUi.sections??[]).filter(s=>s.kind==="EVIDENCE").map(s=>[s.id,s.title]))}};
}
