function probability(v:any):number{
 if(typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=1)return v;
 if(typeof v==='string'&&v.startsWith('1/')){const d=Number(v.slice(2));if(Number.isFinite(d)&&d>0)return 1/d}
 throw new Error('CANDIDATE_PROBABILITY_INVALID:'+String(v));
}
function entropy(ps:number[]){return -ps.reduce((a,p)=>a+(p>0?p*Math.log2(p):0),0)}
function jointPower(members:any[]):number{
 const keys=Object.keys(members[0]?.settingDistribution??{});
 const rows=keys.map(setting=>{const xs=members.map(m=>probability(m.settingDistribution[setting]));const sum=xs.reduce((a,b)=>a+b,0);if(sum>1.000000001)throw new Error('CANDIDATE_JOINT_SUM:'+setting);return [...xs,Math.max(0,1-sum)]});
 const k=rows[0].length;if(rows.some(r=>r.length!==k))throw new Error('CANDIDATE_JOINT_SHAPE');
 const mean=Array.from({length:k},(_,i)=>rows.reduce((a,r)=>a+r[i],0)/rows.length);
 const ig=entropy(mean)-rows.reduce((a,r)=>a+entropy(r),0)/rows.length;
 return ig*200;
}
function jointDistribution(members:any[]){
 const keys=Object.keys(members[0]?.settingDistribution??{});const out:any={};
 for(const setting of keys){
  const row:any={};let sum=0;
  for(const m of members){
   const p=probability(m.settingDistribution[setting]);sum+=p;row[m.label]=p;
  }
  if(sum>1.000000001)throw new Error('CANDIDATE_JOINT_SUM:'+setting);
  out[setting]=row;
 }
 return out;
}
function isAggregateCandidate(candidate:any,others:any[]):boolean{
 const keys=Object.keys(candidate?.settingDistribution??{});
 if(!keys.length||others.length<2||others.some(m=>Object.keys(m?.settingDistribution??{}).join('|')!==keys.join('|')))return false;
 return keys.every(setting=>{
  const target=probability(candidate.settingDistribution[setting]);
  const sum=others.reduce((a,m)=>a+probability(m.settingDistribution[setting]),0);
  return Math.abs(target-sum)<=Math.max(2e-5,Math.abs(target)*0.01);
 });
}
function resolveGroup(groupId:string,members:any[],evalBy:Map<string,any>){
 const evals=members.map(c=>evalBy.get(c.findingId)).filter(Boolean);
 const trialUniverses=[...new Set(evals.map((e:any)=>e.trialUniverse))];
 if(trialUniverses.length===members.length){
  return {resolution:'CONDITIONALLY_SEPARATE',members:members.map(c=>c.findingId),runtimeInferenceAllowed:true,reason:'各候補のeligible trial universeが相互に異なり、実戦入力でも分母を別々に観測できるため条件別Featureとして分離する。'};
 }
 const reasons=evals.map((e:any)=>String(e?.dependency?.reason??'')).join(' ');
 let categories:any[]|null=null;
 if(/排他的/.test(reasons)) categories=members;
 if(!categories){
  for(const candidate of members){
   const others=members.filter(x=>x.findingId!==candidate.findingId);
   if(isAggregateCandidate(candidate,others)){categories=others;break}
  }
 }
 if(categories&&categories.length>=2){
  const leader=categories[0];
  return {resolution:'MUTUALLY_EXCLUSIVE_CATEGORICAL',members:members.map(c=>c.findingId),runtimeInferenceAllowed:true,jointFindingId:leader.findingId,jointSourceFindingIds:categories.map(c=>c.findingId),reason:'同一trial universeで排他的な観測カテゴリをjoint multinomialとして評価し、集約値との二重評価を避ける。'};
 }
 return {resolution:'HELD_NO_JOINT_MODEL',members:members.map(c=>c.findingId),runtimeInferenceAllowed:false,reason:'source-supported joint/dependency modelが未確立のため独立性を仮定しない。',reevaluationCondition:'source-supported joint/dependency modelまたは明示的なSelection REVIEW決定が確立すること。'};
}
export function buildCandidateContract(evaluation:any,eligibility:any,evaluationArtifact:any,eligibilityArtifact:any){
 const evalBy=new Map((evaluation.evaluations??[]).map((x:any)=>[x.findingId,x]));
 const eligible=(eligibility.decisions??[]).filter((x:any)=>x.eligibility==='ELIGIBLE');
 const candidates=eligible.map((d:any)=>{const e:any=evalBy.get(d.findingId);if(!e)throw new Error('EVALUATION_MISSING:'+d.findingId);const group=e.dependency?.status==='DEFERRED_TO_CANDIDATE_CONTRACT'?e.dependency.groupId:null;const power=e.metrics?.perEligibleTrialPower;if(typeof power!=='number'||!Number.isFinite(power))throw new Error('POWER_MISSING:'+d.findingId);return {findingId:d.findingId,label:d.label,model:e.model,trialUniverse:e.trialUniverse,liveInferenceRoute:d.liveInferenceRoute,settingDistribution:e.settingDistribution,dependencyGroupId:group,runtimeInferenceAllowed:!group,dependencyResolution:group?'UNRESOLVED':'NONE',runtimePolicyBinding:{metric:'PER_ELIGIBLE_TRIAL_POWER',value:power,thresholdSource:'RUNTIME_POLICY'}}});
 const groups=new Map<string,any[]>();for(const c of candidates)if(c.dependencyGroupId){const a=groups.get(c.dependencyGroupId)??[];a.push(c);groups.set(c.dependencyGroupId,a)}
 const dependencyGroups:any[]=[];
 for(const [groupId,members] of groups){
  const resolution:any=resolveGroup(groupId,members,evalBy);dependencyGroups.push({groupId,...resolution});
  if(resolution.resolution==='CONDITIONALLY_SEPARATE'){
   for(const c of members){c.runtimeInferenceAllowed=true;c.dependencyResolution='CONDITIONALLY_SEPARATE'}
  }else if(resolution.resolution==='MUTUALLY_EXCLUSIVE_CATEGORICAL'){
   const sourceMembers=members.filter(c=>resolution.jointSourceFindingIds.includes(c.findingId));
   const leader=members.find(c=>c.findingId===resolution.jointFindingId);
   if(!leader)throw new Error('CANDIDATE_JOINT_LEADER:'+groupId);
   leader.model='CATEGORICAL';leader.settingDistribution=jointDistribution(sourceMembers);leader.runtimeInferenceAllowed=true;leader.dependencyResolution='MUTUALLY_EXCLUSIVE_CATEGORICAL';leader.jointSourceFindingIds=[...resolution.jointSourceFindingIds];leader.runtimePolicyBinding={metric:'PER_ELIGIBLE_TRIAL_POWER',value:jointPower(sourceMembers),thresholdSource:'RUNTIME_POLICY'};
   for(const c of members)if(c!==leader){c.runtimeInferenceAllowed=false;c.dependencyResolution='RESOLVED_IN_JOINT_MODEL';c.resolvedIntoFindingId=leader.findingId}
  }else{
   for(const c of members){c.runtimeInferenceAllowed=false;c.dependencyResolution='HELD_NO_JOINT_MODEL'}
  }
 }
 return {schemaVersion:'candidate-contract-v1',manifestVersion:'8.5',batchId:eligibility.batchId,machineId:eligibility.machineId,machineName:eligibility.machineName,evaluationArtifact,eligibilityArtifact,candidates,dependencyGroups,excludedDecisions:(eligibility.decisions??[]).filter((x:any)=>x.eligibility!=='ELIGIBLE'),blockedItems:eligibility.blockedItems??[],evidenceCandidates:eligibility.evidenceCandidates??[],sourceIntegrityIssues:eligibility.sourceIntegrityIssues??[]};
}
