import {buildHighLowDiscrimination} from './high-low-discrimination.ts';
import {classifyEvidenceCategory,EVIDENCE_SEMANTICS} from './observation-evidence-builder.ts';
export const OBSERVATION_EVIDENCE_VALIDATOR_CONTRACT='observation-evidence-v1';
const canonical=(v:any):string=>Array.isArray(v)?`[${v.map(canonical).join(',')}]`:v&&typeof v==='object'?`{${Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')}}`:JSON.stringify(v);
const fail=(m:string):never=>{throw new Error('OBSERVATION_EVIDENCE_VALIDATION_FAILED:'+m)};
export function validateObservationEvidenceDocument(doc:any,candidate:any,research:any){
 if(doc?.schemaVersion!=='observation-evidence-v1'||doc?.manifestVersion!=='8.5')fail('HEADER');
 if(doc.batchId!==candidate.batchId||doc.machineId!==candidate.machineId||doc.machineId!==research.machineId)fail('IDENTITY');
 if(!Array.isArray(doc.observations)||!Array.isArray(doc.evidence)||!Array.isArray(doc.sourceReferences)||!Array.isArray(doc.blockedItems)||!Array.isArray(doc.sourceIntegrityIssues))fail('ARRAYS');
 if(doc.observations.length!==candidate.candidates.length)fail('OBSERVATION_COVERAGE');
 const byId=new Map(doc.observations.map((x:any)=>[x.findingId,x]));
 for(const c of candidate.candidates){
  const o:any=byId.get(c.findingId);if(!o)fail('MISSING:'+c.findingId);
  if(o.model!==c.model||o.trialUniverse!==c.trialUniverse||o.liveInferenceRoute!==c.liveInferenceRoute||o.runtimeInferenceAllowed!==c.runtimeInferenceAllowed||o.dependencyResolution!==c.dependencyResolution)fail('COPY:'+c.findingId);
  if(c.runtimeInferenceAllowed===false){
   if(c.dependencyResolution==='RESOLVED_IN_JOINT_MODEL'){
    if(o.observationStatus!=='RESOLVED_IN_JOINT_MODEL'||o.collectionContract!==null||o.resolvedIntoFindingId!==c.resolvedIntoFindingId)fail('RESOLVED_MEMBER:'+c.findingId);
   }else if(c.dependencyResolution==='RESOLVED_BY_SINGLE_MEMBER'){
    if(o.observationStatus!=='RESOLVED_BY_SINGLE_MEMBER'||o.collectionContract!==null||o.resolvedIntoFindingId!==c.resolvedIntoFindingId)fail('RESOLVED_SINGLE_MEMBER:'+c.findingId);
   }else if(o.observationStatus!=='HELD_NO_JOINT_MODEL'||o.collectionContract!==null)fail('HELD:'+c.findingId);
  }else{
   if(o.observationStatus!=='READY')fail('READY:'+c.findingId);
   if(c.model==='BERNOULLI'&&o.collectionContract?.type!=='SUCCESS_TRIAL_COUNTS')fail('BERNOULLI:'+c.findingId);
   if(c.model==='CATEGORICAL'&&(o.collectionContract?.type!=='CATEGORY_COUNTS'||!['EXHAUSTIVE','NON_EXHAUSTIVE'].includes(o.collectionContract?.categoryCoverage)||!o.collectionContract?.trialField))fail('CATEGORICAL:'+c.findingId);
   if(!['BERNOULLI','CATEGORICAL'].includes(c.model))fail('UNSUPPORTED_MODEL:'+c.findingId);
  }
 }
 const expectedEvidence=candidate.evidenceCandidates??[];
 if(doc.evidence.length!==expectedEvidence.length)fail('EVIDENCE_COVERAGE');
 const evBy=new Map(doc.evidence.map((x:any)=>[x.findingId,x]));
 for(const e of expectedEvidence){const x:any=evBy.get(e.findingId);if(!x||x.label!==e.label||canonical(x.sourceIds)!==canonical(e.sourceIds??[])||canonical(x.details??[])!==canonical(e.details??[])||x.runtimePolicyControlled!==false||x.status!=='SOURCE_REFERENCED')fail('EVIDENCE:'+e.findingId);const details=Array.isArray(e.details)&&e.details.length?e.details:[e.label];if(!Array.isArray(x.categorySemantics)||x.categorySemantics.length!==details.length)fail('EVIDENCE_SEMANTIC_COVERAGE:'+e.findingId);for(let i=0;i<details.length;i++){const c=x.categorySemantics[i];const expected=Array.isArray(e.categorySemantics)&&e.categorySemantics.length===details.length?e.categorySemantics[i]:{label:details[i],semantic:classifyEvidenceCategory(details[i],e,candidate.blockedItems??[])};if(c?.label!==details[i]||!EVIDENCE_SEMANTICS.includes(c?.semantic)||canonical(c)!==canonical(expected))fail('EVIDENCE_SEMANTIC:'+e.findingId+':'+i)}}
 const sourceIds=new Set((research.sources??[]).map((x:any)=>x.sourceId));
 for(const e of doc.evidence)for(const id of e.sourceIds)if(!sourceIds.has(id))fail('SOURCE_UNRESOLVED:'+id);
 if(canonical(doc.sourceReferences)!==canonical(research.sources??[]))fail('SOURCE_COPY');
 if(canonical(doc.blockedItems)!==canonical(candidate.blockedItems??[])||canonical(doc.sourceIntegrityIssues)!==canonical(candidate.sourceIntegrityIssues??[]))fail('PRESERVATION');
 const expectedHld=buildHighLowDiscrimination(candidate);if(canonical(doc.highLowDiscrimination)!==canonical(expectedHld))fail('HLD');
 return [{validator:OBSERVATION_EVIDENCE_VALIDATOR_CONTRACT,observations:doc.observations.length,evidence:doc.evidence.length,readyObservations:doc.observations.filter((x:any)=>x.observationStatus==='READY').length,heldObservations:doc.observations.filter((x:any)=>x.observationStatus==='HELD_NO_JOINT_MODEL').length,resolvedMembers:doc.observations.filter((x:any)=>x.observationStatus==='RESOLVED_IN_JOINT_MODEL'||x.observationStatus==='RESOLVED_BY_SINGLE_MEMBER').length}];
}
export function validateObservationEvidenceArtifacts(s:any,a:any,r:any){
 const out=r.producedArtifacts??[];if(out.length!==1)fail('OUTPUT_COUNT');const ref=out[0];
 if(ref.kind!=='observation-evidence'||typeof ref.path!=='string'||!ref.path.startsWith(`production/batches/${a.batchId}/artifacts/${a.machineId}/observation_evidence/`))fail('OUTPUT_REF');
 const prefix='production/';const doc=s.read(...ref.path.slice(prefix.length).split('/'));
 const cs=s.read('batches',a.batchId,'machines',a.machineId,'stages','CANDIDATE_CONTRACT.json');if(!cs.authoritativeOutputRef?.path)fail('CANDIDATE_AUTHORITY_MISSING');
 if(canonical(doc.candidateContractArtifact)!==canonical(cs.authoritativeOutputRef))fail('LINKAGE');
 const candidate=s.read(...String(cs.authoritativeOutputRef.path).slice(prefix.length).split('/'));
 const research=s.read('batches',a.batchId,'artifacts',a.machineId,'research','result.json');
 return validateObservationEvidenceDocument(doc,candidate,research);
}
