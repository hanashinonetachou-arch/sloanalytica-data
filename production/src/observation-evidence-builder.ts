import {buildHighLowDiscrimination} from './high-low-discrimination.ts';
export const EVIDENCE_SEMANTICS=['EXACT_CONSTRAINT','PROBABILITY_BACKED','PROBABILITY_UNKNOWN','DISPLAY_ONLY','BLOCK'] as const;
export function classifyEvidenceCategory(label:any,evidence:any,blockedItems:any[]=[]){
 const text=String(label??'').trim();
 if(!text)return 'DISPLAY_ONLY';
 if((blockedItems??[]).some((b:any)=>String(b?.label??'').includes(String(evidence?.label??''))&&/出現率|原分布|振り分け/.test(String(b?.label??'')+' '+String(b?.reason??'')))) {
  if(/設定[1-6]以上|設定[1-6]否定|設定[1-6](?:[・,／\\/][1-6])+(?:濃厚)?|(?:^|[:：=]\\s*)設定[1-6](?:濃厚)?\\s*$/.test(text)) return 'EXACT_CONSTRAINT';
  if(/示唆|高設定|低設定|奇数|偶数|期待度|デフォルト|基本/.test(text)) return 'PROBABILITY_UNKNOWN';
 }
 if(/設定[1-6]以上|設定[1-6]否定|設定[1-6](?:[・,／\\/][1-6])+(?:濃厚)?|(?:^|[:：=]\\s*)設定[1-6](?:濃厚)?\\s*$/.test(text))return 'EXACT_CONSTRAINT';
 if(evidence?.settingDistribution&&Object.keys(evidence.settingDistribution).length>0)return 'PROBABILITY_BACKED';
 if(/示唆|高設定|低設定|奇数|偶数|期待度|デフォルト|基本/.test(text))return 'PROBABILITY_UNKNOWN';
 return 'DISPLAY_ONLY';
}
export function buildObservationEvidence(candidate:any,research:any,candidateArtifact:any){
 const observations=(candidate.candidates??[]).map((c:any)=>{
  const status=c.runtimeInferenceAllowed?'READY':c.dependencyResolution==='RESOLVED_IN_JOINT_MODEL'?'RESOLVED_IN_JOINT_MODEL':c.dependencyResolution==='RESOLVED_BY_SINGLE_MEMBER'?'RESOLVED_BY_SINGLE_MEMBER':'HELD_NO_JOINT_MODEL';
  let collectionContract:any=null;
  if(c.runtimeInferenceAllowed){
   if(c.model==='BERNOULLI')collectionContract={type:'SUCCESS_TRIAL_COUNTS',successField:'successCount',trialField:'eligibleTrialCount'};
   else if(c.model==='CATEGORICAL')collectionContract={type:'CATEGORY_COUNTS',countsField:'categoryCounts',trialField:'eligibleTrialCount',categoryCoverage:'NON_EXHAUSTIVE'};
   else throw new Error('OBSERVATION_COLLECTION_UNSUPPORTED:'+c.findingId);
  }
  return {findingId:c.findingId,label:c.label,model:c.model,trialUniverse:c.trialUniverse,liveInferenceRoute:c.liveInferenceRoute,runtimeInferenceAllowed:c.runtimeInferenceAllowed,dependencyResolution:c.dependencyResolution,observationStatus:status,collectionContract,resolvedIntoFindingId:c.resolvedIntoFindingId};
 });
 const evidence=(candidate.evidenceCandidates??[]).map((e:any)=>{const details=Array.isArray(e.details)?e.details:[];const labels=details.length?details:[e.label];return {findingId:e.findingId,label:e.label,sourceIds:e.sourceIds??[],details,categorySemantics:Array.isArray(e.categorySemantics)&&e.categorySemantics.length===labels.length?structuredClone(e.categorySemantics):labels.map((label:any)=>({label,semantic:classifyEvidenceCategory(label,e,candidate.blockedItems??[])})),runtimePolicyControlled:false,status:'SOURCE_REFERENCED'};});
 return {schemaVersion:'observation-evidence-v1',manifestVersion:'8.5',batchId:candidate.batchId,machineId:candidate.machineId,machineName:candidate.machineName,candidateContractArtifact:candidateArtifact,observations,evidence,sourceReferences:research.sources??[],blockedItems:candidate.blockedItems??[],sourceIntegrityIssues:candidate.sourceIntegrityIssues??[],highLowDiscrimination:buildHighLowDiscrimination(candidate)};
}
