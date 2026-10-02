const settingKeys=(candidate:any)=>{const out=new Set<string>();for(const c of candidate?.candidates??[])for(const k of Object.keys(c?.settingDistribution??{}))out.add(k);return [...out].sort((a,b)=>Number(a)-Number(b))}
const researchSettingKeys=(research:any)=>{const out=new Set<string>();for(const f of research?.findings??[])for(const k of Object.keys(f?.settingDistribution??{}))out.add(k);return [...out].sort((a,b)=>Number(a)-Number(b))}

function assertResearchLifecycle(research:any,candidate:any){
 if(!research)return;
 const terminal=new Set<string>();
 for(const x of candidate?.candidates??[])if(x?.findingId)terminal.add(x.findingId);
 for(const x of candidate?.excludedDecisions??[])if(x?.findingId)terminal.add(x.findingId);
 for(const x of candidate?.evidenceCandidates??[])if(x?.findingId)terminal.add(x.findingId);
 for(const x of candidate?.blockedItems??[])for(const id of x?.blockedFindingIds??[])if(id)terminal.add(id);
 const missing=(research?.findings??[]).map((x:any)=>x?.findingId).filter((id:any)=>typeof id==='string'&&!terminal.has(id));
 if(missing.length)throw new Error('RESEARCH_CANDIDATE_DISAPPEARED:'+missing.join(','));
}
export function buildMachineData(canonicalUi:any,candidate:any,observation:any,canonicalArtifact:any,candidateArtifact:any,observationArtifact:any,research:any=null,researchArtifact:any=null){
 if(canonicalUi?.machineId!==candidate?.machineId||canonicalUi?.machineId!==observation?.machineId)throw new Error('MACHINE_DATA_BUILD_IDENTITY');
 assertResearchLifecycle(research,candidate);
 const cBy=new Map((candidate.candidates??[]).map((x:any)=>[x.findingId,x]));
 const features=(canonicalUi.numericSections??[]).map((s:any)=>{const c:any=cBy.get(s.sourceFindingId);if(!c||c.runtimeInferenceAllowed!==true)throw new Error('MACHINE_DATA_FEATURE_SOURCE:'+s.sourceFindingId);return {findingId:s.sourceFindingId,name:s.title,model:c.model,trialUniverse:c.trialUniverse,settingDistribution:c.settingDistribution,categoryModel:c.categoryModel,details:Array.isArray(c.details)?structuredClone(c.details):[],runtimeInferenceAllowed:true,runtimePolicyBinding:c.runtimePolicyBinding,inputIds:(s.inputs??[]).map((x:any)=>x.id),score:s.score,perEligibleTrialPower:s.perEligibleTrialPower}});
 const candidateKeys=settingKeys(candidate); const keys=candidateKeys.length?candidateKeys:researchSettingKeys(research);
 const nonRuntimeCandidates=(candidate.candidates??[]).filter((x:any)=>x.runtimeInferenceAllowed!==true).map((x:any)=>({findingId:x.findingId,label:x.label,dependencyResolution:x.dependencyResolution,resolvedIntoFindingId:x.resolvedIntoFindingId}));
 return {schemaVersion:'machine-data-v1',manifestVersion:'8.5',batchId:canonicalUi.batchId,machineId:canonicalUi.machineId,machineName:canonicalUi.machineName,provenance:{generationPath:'V8_5_PRODUCTION_PIPELINE',legacyOracleUsed:false},sourceArtifacts:{canonicalUi:canonicalArtifact,candidateContract:candidateArtifact,observationEvidence:observationArtifact,research:researchArtifact},settings:{status:keys.length?'SOURCE_DERIVED':'UNRESOLVED',values:keys.map(k=>'SET_'+k)},packagePolicy:{offlineCapable:true,containsImages:false,containsExecutableCode:false},features,evidence:structuredClone(canonicalUi.evidenceSections??[]),heldObservations:structuredClone(canonicalUi.heldObservations??[]),nonRuntimeCandidates,excludedDecisions:structuredClone(candidate.excludedDecisions??[]),uiContract:structuredClone(canonicalUi),highLowDiscrimination:structuredClone(canonicalUi.machineInferenceSummary?.highLowDiscrimination),blockedItems:structuredClone(observation.blockedItems??[]),sourceReferences:structuredClone(observation.sourceReferences??[])};
}
