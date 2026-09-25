import fs from 'node:fs';

export function normalizeSelectionRuntimeContract(selection,summary){
 const importanceById=new Map([
  ...(summary?.selection?.primary??[]),
  ...(summary?.selection?.liveConditional??[])
 ].filter(x=>x?.featureId).map(x=>[x.featureId,x.importance]));
 const features=(selection.features??[]).map(source=>{
  const x=structuredClone(source);
  const blocked=String(x.adoptionCategory??'').startsWith('BLOCKED_');
  x.eligibility=blocked?'INELIGIBLE':'ELIGIBLE';
  const importance=importanceById.get(x.featureId);
  if(importance)x.importance=importance;

  if(Number.isFinite(x.selectionScore)){
   x.evaluation={metric:'SELECTION_SCORE',value:x.selectionScore,status:'FORMAL'};
   x.runtimePolicyBinding={mode:'THRESHOLD',metric:'SELECTION_SCORE'};
  }else if(Number.isFinite(x.guaranteedMinimumSelectionScore)){
   x.evaluation={metric:'SELECTION_SCORE',value:x.guaranteedMinimumSelectionScore,status:'GUARANTEED_MINIMUM'};
   x.runtimePolicyBinding={mode:'THRESHOLD',metric:'SELECTION_SCORE'};
  }else if(x.benchmarkScoreStatus==='UPPER_BOUND_ONLY'&&Number.isFinite(x.maximumSelectionScore)){
   x.evaluation={metric:'MAXIMUM_SELECTION_SCORE',value:x.maximumSelectionScore,status:'UPPER_BOUND_ONLY',userLabel:'設定判別スコア上限'};
   x.runtimePolicyBinding={mode:'NOT_THRESHOLD_CONTROLLED'};
  }else if(Number.isFinite(x.perOpportunityInformationBits)){
   x.evaluation={metric:'PER_ELIGIBLE_TRIAL_POWER',value:x.perOpportunityInformationBits*200,status:'FORMAL'};
   x.runtimePolicyBinding={mode:'NOT_THRESHOLD_CONTROLLED'};
  }else if(Number.isFinite(x.perEligibleTrialPower)){
   x.evaluation={metric:'PER_ELIGIBLE_TRIAL_POWER',value:x.perEligibleTrialPower,status:'FORMAL'};
   x.runtimePolicyBinding={mode:'NOT_THRESHOLD_CONTROLLED'};
  }else{
   x.evaluation={metric:'UNAVAILABLE',value:null,status:'UNRESOLVED'};
   x.runtimePolicyBinding={mode:'NOT_THRESHOLD_CONTROLLED'};
  }
  return x;
 });
 return {...structuredClone(selection),features};
}

if(import.meta.url===new URL('file://'+process.argv[1]).href){
 const [selectionPath,summaryPath,outputPath=selectionPath]=process.argv.slice(2);
 if(!selectionPath||!summaryPath)throw new Error('usage: normalize-selection-runtime-contract <selection-data.json> <machine-research-summary.json> [output]');
 const selection=JSON.parse(fs.readFileSync(selectionPath,'utf8'));
 const summary=JSON.parse(fs.readFileSync(summaryPath,'utf8'));
 const normalized=normalizeSelectionRuntimeContract(selection,summary);
 fs.writeFileSync(outputPath,JSON.stringify(normalized,null,2)+'\n');
 console.log(JSON.stringify({machineId:normalized.machineId,features:normalized.features.length,eligible:normalized.features.filter(x=>x.eligibility==='ELIGIBLE').length,ineligible:normalized.features.filter(x=>x.eligibility==='INELIGIBLE').length},null,2));
}
