import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import assert from 'node:assert/strict';
import {RepoStore,Orchestrator,fingerprint} from '../../../../production/src/core.ts';
import {buildEvaluation} from '../../../../production/src/evaluation-builder.ts';import {validateEvaluationDocument} from '../../../../production/src/evaluation-validator.ts';
import {buildEligibility} from '../../../../production/src/eligibility-builder.ts';import {validateEligibilityDocument} from '../../../../production/src/eligibility-validator.ts';
import {buildCandidateContract} from '../../../../production/src/candidate-contract-builder.ts';import {validateCandidateContractDocument} from '../../../../production/src/candidate-contract-validator.ts';
import {validateResearchArtifacts} from '../../../../production/src/research-validator.ts';
const batchId='batch-20261026-026',rev='grape-correction-20261028',root=path.resolve('data/production'),baseline=path.resolve('correction-baseline/production/batches',batchId),work=path.resolve('data/research/2026-10-26',rev,'work');
const ids=['S_NEO_IM_JUGGLER_EX_KK','S_ULTRA_MIRACLE_JUGGLER_KT','S_MR_JUGGLER_KK','S_JUGGLER_GIRLS_SS_KH','S_GOGO_JUGGLER_3_KA'];
const s=new RepoStore(root),o=new Orchestrator(s);const read=(p:string)=>JSON.parse(fs.readFileSync(p,'utf8'));const sha=(p:string)=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');const write=(p:string,x:any)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,JSON.stringify(x,null,2)+'\n')};
const snapshot=(mid:string,stage:string)=>read(path.join(baseline,'artifacts',mid,stage,'result.json'));
function output(mid:string,stage:string,doc:any,producer:string,file='result.json'){
 const rel=`batches/${batchId}/artifacts/${mid}/${stage}/${file}`;write(s.p(rel),doc);return {artifactId:stage+'-'+mid,kind:stage.replaceAll('_','-'),path:'production/'+rel,sha256:sha(s.p(rel)),producerWorkId:producer};
}
function evaluation(r:any){
 const raw=buildEvaluation(r);const validation=validateEvaluationDocument(raw,r),old=snapshot(r.machineId,'evaluation');
 const e=structuredClone(raw),grape=r.findings.find((f:any)=>f.findingId.includes('GRAPE_CANDIDATE'));
 for(let i=0;i<e.evaluations.length;i++){const x=e.evaluations[i];if(x.findingId===grape.findingId)continue;const before=old.evaluations.find((v:any)=>v.findingId===x.findingId);assert(before);assert.deepEqual(before.settingDistribution,x.settingDistribution);e.evaluations[i]={...structuredClone(before),dependency:x.dependency,...(x.dependencyFallbackRank?{dependencyFallbackRank:x.dependencyFallbackRank}:{})};}
 e.correctionReview={correctionId:rev,legacyFullValidatorScope:'Raw new builder output, before retaining approved existing multinomial supplements.',rawValidation:validation,finalGrapeValidation:'Shared exact finite-7000 Bernoulli evaluator and validator. No score thresholds changed.',existingBonusMetrics:'Retained exactly from authoritative pre-correction Evaluation; shared categorical benchmark limitation is the same documented prior artifact supplement, not a new exception.',baselineEvaluationSha256:sha(path.join(baseline,'artifacts',r.machineId,'evaluation/result.json'))};
 const gr={...r,findings:[grape],blockedItems:[]};const ge=buildEvaluation(gr);validateEvaluationDocument(ge,gr);assert.deepEqual(e.evaluations.find((x:any)=>x.findingId===grape.findingId).metrics,ge.evaluations[0].metrics);
 return {raw,e,validation:[...validation,{validator:'batch026-grape-correction-preservation-v1',baselineBonusMetricsPreserved:true,newGrapeUsesUnchangedCommonEvaluator:true}]};
}
function candidate(r:any,e:any,el:any,er:any,lr:any){const c:any=buildCandidateContract(e,el,er,lr);c.observationContract=structuredClone(r.observationContract);c.correctionId=rev;c.correctionBaseline='b2953be8ac7dce4666edaf6ed22ff83d7518c136';c.selectionAudit=e.evaluations.map((x:any)=>({findingId:x.findingId,selectionClass:x.selectionClass,selectionScore:x.metrics.selectionScore,benchmarkExposure:x.benchmarkExposure}));if(r.userDecision)c.userDecision=structuredClone(r.userDecision);return c;}
const publishPaths=new Set<string>(),validationRows:any[]=[];
function audit(mid:string,r:any,e:any,el:any,c:any,rows:any[]){
 const beforeR=snapshot(mid,'research'),beforeC=snapshot(mid,'candidate_contract');
 assert.equal(o.stage(batchId,mid,'DEVICE_QA').state,'PENDING');
 // Preserve every candidate and all preexisting bonus vectors and policy metrics.
 assert.deepEqual(r.researchCompleteness.candidateLedger.map((x:any)=>x.candidateId),beforeR.researchCompleteness.candidateLedger.map((x:any)=>x.candidateId));
 for(const old of beforeC.candidates){const now=c.candidates.find((x:any)=>x.findingId===old.findingId);assert(now);assert.deepEqual(now.settingDistribution,old.settingDistribution);assert.deepEqual(now.runtimePolicyBinding,old.runtimePolicyBinding);if(old.trialUniverse==='PREDECESSOR_NORMAL_GAME_TRIAL')assert.deepEqual(JSON.parse(JSON.stringify(now)),old);}
 const grape=e.evaluations.find((x:any)=>x.findingId.includes('GRAPE_CANDIDATE'));const grc=c.candidates.find((x:any)=>x.findingId===grape.findingId);const row={machineId:mid,status:'COMPLETE_THROUGH_CANDIDATE_CONTRACT',grapeFindingId:grape.findingId,selectionScore:grape.metrics.selectionScore,selectionClass:grape.selectionClass,eligibility:el.decisions.find((x:any)=>x.findingId===grape.findingId),dependency:grc?.dependencyResolution??'USER_EXCLUDED_NO_INPUT',suppressedBy:grc?.suppressedByFeatureIds??[],originalCandidateIdsPreserved:true,bonusProbabilitiesAndPolicyMetricsPreserved:true,newBatchCreated:false,deviceQaChanged:false,downstream:'READY_REBUILD_REQUIRED_NOT_EXECUTED',rows};write(path.join(work,mid,'stage-result.json'),row);validationRows.push(row);
}
// Preflight all documents before reopening the authoritative state machine.
for(const mid of ids){const r=read(path.join(work,mid,'research-prepared.json'));r.workId='preflight-'+rev+'-'+mid;const ref=output(mid,'research',r,r.workId,'preflight-'+rev+'.json');validateResearchArtifacts(s,{stage:'RESEARCH',batchId,machineId:mid} as any,{status:'SUCCESS',workId:r.workId,producedArtifacts:[ref]} as any);const {e}=evaluation(r),el=buildEligibility(e);validateEligibilityDocument(el,e,r);const c=candidate(r,e,el,{},{});validateCandidateContractDocument(c,el,e);console.log(mid+' PREFLIGHT PASS');}
for(const mid of ids){
 const dir=s.p('batches',batchId,'artifacts',mid),beforeR=snapshot(mid,'research'),beforeC=snapshot(mid,'candidate_contract');
 const r=read(path.join(work,mid,'research-prepared.json'));let e:any,el:any,c:any;const refs:any={};const rows:any[]=[];
 const completed=o.stage(batchId,mid,'CANDIDATE_CONTRACT');
 if(completed.state==='COMPLETE'&&completed.authoritativeOutputRef){
  const savedC=read(s.p(String(completed.authoritativeOutputRef.path).replace(/^production\//,'')));
  if(savedC.correctionId===rev){
   const docs:any={};
   for(const name of ['RESEARCH','EVALUATION','ELIGIBILITY','CANDIDATE_CONTRACT']){
    const st=o.stage(batchId,mid,name),ref=st.authoritativeOutputRef;assert.equal(st.state,'COMPLETE');assert(ref);
    const file=s.p(String(ref.path).replace(/^production\//,''));assert.equal(sha(file),ref.sha256);docs[name.toLowerCase()]=read(file);
    const a=read(s.p('batches',batchId,'machines',mid,'attempts',st.activeAttemptId+'.json'));
    const wr=read(s.p('batches',batchId,'work-results',a.workId+'.json'));
    rows.push({stage:name,status:'COMPLETE',artifact:ref,validation:wr.validationEvidence});
    publishPaths.add(ref.path);publishPaths.add(path.relative(path.resolve('data'),path.join(dir,name.toLowerCase(),'before-'+rev+'.json')));
   }
   validateEligibilityDocument(docs.eligibility,docs.evaluation,docs.research);validateCandidateContractDocument(savedC,docs.eligibility,docs.evaluation);
   evaluation(docs.research);
   publishPaths.add(path.relative(path.resolve('data'),path.join(dir,'evaluation','builder-output-'+rev+'.json')));
   for(const name of ['OBSERVATION_EVIDENCE','CANONICAL_UI','MACHINE_DATA','RUNTIME_POLICY','RUNTIME_PROJECTION','APP_RUNTIME','DISTRIBUTION'])assert.equal(o.stage(batchId,mid,name).state,'READY');
   audit(mid,docs.research,docs.evaluation,docs.eligibility,savedC,rows);console.log(mid+' EXISTING_CORRECTION_REVALIDATED_WITHOUT_NEW_ATTEMPT');continue;
  }
 }

 for(const name of ['RESEARCH','EVALUATION','ELIGIBILITY','CANDIDATE_CONTRACT']){
  const lower=name.toLowerCase();let st:any=o.stage(batchId,mid,name);const oldRef=st.authoritativeOutputRef;
  if(st.state==='COMPLETE'&&oldRef?.sha256&&read(s.p(String(oldRef.path).replace(/^production\//,'')))?.correctionId===rev)throw Error('ALREADY_ACCEPTED_USE_AUDIT_NOT_RERUN');
  assert.equal(st.state,'COMPLETE','Only authoritative completed baseline can be corrected');
  st.activeAttemptId=undefined;st.activeLeaseId=undefined;st.authoritativeInputFingerprint=fingerprint({correctionId:rev,machineId:mid,stage:name,source:sha(path.join(work,mid,'research-prepared.json')),upstream:refs});st.supersededOutputRef=oldRef;st.authoritativeOutputRef=undefined;o.saveStage(st);st=o.transition(st,'READY','AUTHORITATIVE_OUTPUT_INVALIDATED',rev);
  const a=o.createAttempt(st),l=o.acquire(st,a,300000);st=o.transition(o.stage(batchId,mid,name),'LEASED','CORRECTION_DISPATCH',a.workId);st=o.transition(st,'RUNNING','CORRECTION_WORKER_START',a.workId);const q=o.request(st,a,l);q.workerType='SEMANTIC';q.validatorContractVersion=name==='EVALUATION'?'batch026-grape-correction-preservation-v1':'existing-production-document-validator';q.inputArtifacts=Object.values(refs);q.expectedOutputs=[{kind:lower.replaceAll('_','-'),pathPrefix:'production/batches/'+batchId+'/artifacts/'+mid+'/'+lower+'/'}];
  const backup=path.join(dir,lower,'before-'+rev+'.json');if(!fs.existsSync(backup))write(backup,snapshot(mid,lower));publishPaths.add(path.relative(path.resolve('data'),backup));
  let doc:any,v:any;
  if(name==='RESEARCH'){r.workId=q.workId;r.correctionId=rev;doc=r;}
  else if(name==='EVALUATION'){const built=evaluation(r);e=built.e;e.correctionId=rev;doc=e;v=built.validation;const rawfile=path.join(dir,'evaluation','builder-output-'+rev+'.json');write(rawfile,built.raw);publishPaths.add(path.relative(path.resolve('data'),rawfile));}
  else if(name==='ELIGIBILITY'){el=buildEligibility(e);el.correctionId=rev;doc=el;v=validateEligibilityDocument(el,e,r);}
  else{c=candidate(r,e,el,refs.evaluation,refs.eligibility);doc=c;v=validateCandidateContractDocument(c,el,e);}
  const ref=output(mid,lower,doc,q.workId);refs[lower]=ref;if(name==='RESEARCH')v=validateResearchArtifacts(s,a,{status:'SUCCESS',workId:q.workId,producedArtifacts:[ref]} as any);
  const result:any={workId:q.workId,attemptId:q.attemptId,leaseId:q.leaseId,leaseGeneration:q.leaseGeneration,status:'SUCCESS',observedInputFingerprint:q.authoritativeInputFingerprint,producedArtifacts:[ref],validationEvidence:v,requestedActions:[],proposedNextState:'COMPLETE',provenance:{inputArtifacts:q.inputArtifacts,worker:'batch026-grape-correction-v1',operation:'BOUNDED_RESEARCH_CORRECTION',supersededOutputRef:oldRef}};
  s.write(q,'batches',batchId,'work-requests',q.workId+'.json');s.write(result,'batches',batchId,'work-results',q.workId+'.json');const accepted=o.accept(result);assert.equal(accepted.kind,'COMMITTED');s.append({workId:q.workId,attemptId:q.attemptId,machineId:mid,stage:name,inputArtifacts:q.inputArtifacts,outputArtifacts:[ref],workerAdapter:'batch026-grape-correction-v1',validatorAdapter:q.validatorContractVersion,recordedAt:o.now().toISOString()},'batches',batchId,'provenance','grape-correction-20261028.jsonl');
  publishPaths.add(ref.path);rows.push({stage:name,status:'COMPLETE',artifact:ref,validation:v});console.log(mid+' '+name+' COMPLETE');
 }
 // Old release artifacts stay intact. Their state must not claim new contracts are implemented.
 for(const name of ['OBSERVATION_EVIDENCE','CANONICAL_UI','MACHINE_DATA','RUNTIME_POLICY','RUNTIME_PROJECTION','APP_RUNTIME','DISTRIBUTION']){
  let st:any=o.stage(batchId,mid,name);assert.equal(st.state,'COMPLETE');st.supersededOutputRef=st.authoritativeOutputRef;st.authoritativeOutputRef=undefined;st.activeAttemptId=undefined;st.activeLeaseId=undefined;st.authoritativeInputFingerprint=fingerprint({correctionId:rev,candidateContract:refs.candidate_contract,stage:name});st.executionScope='NOT_AUTHORIZED_IN_THIS_CORRECTION';o.saveStage(st);o.transition(st,'READY','AUTHORITATIVE_OUTPUT_INVALIDATED',rev);
 }
 audit(mid,r,e,el,c,rows);
}
const doc={batchId,correctionId:rev,status:'COMPLETE_THROUGH_CANDIDATE_CONTRACT',machines:validationRows,sharedThresholdsChanged:false,sharedEvaluatorChanged:false,sourceCriteria:'User-approved per-setting equal source probabilities; no denominator or sample-size weighting.',distributionApkDeviceQaChanged:false};write(path.join(work,'result.json'),doc);write(path.join(work,'publish-artifact-paths.json'),[...publishPaths]);console.log(JSON.stringify({status:doc.status,machines:validationRows.map(x=>({id:x.machineId,score:x.selectionScore,eligibility:x.eligibility.eligibility}))}));
