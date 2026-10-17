import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {RepoStore} from './core.ts';
import {buildEvaluation} from './evaluation-builder.ts';
import {buildEligibility} from './eligibility-builder.ts';
import {buildCandidateContract} from './candidate-contract-builder.ts';
import {validateCandidateContractDocument} from './candidate-contract-validator.ts';
const s=new RepoStore(process.cwd()),b='batch-20261017-021',spec=s.read<any>('batches',b,'batch.json'),ids=spec.waves.flatMap((x:any)=>x.machineIds);
const orig=s.read<any[]>('research-inbox/batch021/imported-handoff/ORIGINAL_135.json');
const seen=new Set<string>(),rows:any[]=[];
let mirrored=0;
for(const id of ids){
 const r=s.read<any>('batches',b,'artifacts',id,'research','result.json'),e=s.read<any>('batches',b,'artifacts',id,'evaluation','result.json'),g=s.read<any>('batches',b,'artifacts',id,'eligibility','result.json'),c=s.read<any>('batches',b,'artifacts',id,'candidate_contract','result.json');
 for(const row of r.researchCompleteness.candidateLedger){assert(!seen.has(row.candidateId));seen.add(row.candidateId);if(row.origin==='MIRROR_SINGLE_INPUT')mirrored++;}
 for(const stage of ['RESEARCH','EVALUATION','ELIGIBILITY','CANDIDATE_CONTRACT']){
  const x=s.read<any>('batches',b,'machines',id,'stages',stage+'.json');assert.equal(x.state,'COMPLETE');
  const ref=x.authoritativeOutputRef,bytes=fs.readFileSync(s.p(ref.path.replace(/^production\//,'')));assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),ref.sha256);
 }
 assert.deepEqual(buildEvaluation(r),e);assert.deepEqual(buildEligibility(e),g);
 validateCandidateContractDocument(c,g,e);
 const rebuilt=buildCandidateContract(e,g,c.evaluationArtifact,c.eligibilityArtifact);for(const k of Object.keys(rebuilt))assert.deepEqual(JSON.parse(JSON.stringify(rebuilt[k])),c[k]);
 for(const group of c.dependencyGroups){if(group.resolution==='SINGLE_MEMBER_SELECTED')assert.equal(c.candidates.filter((x:any)=>x.dependencyGroupId===group.groupId&&x.runtimeInferenceAllowed).length,1);}
 const copyValues=[...r.findings.flatMap((x:any)=>[x.label,...(x.details??[]),x.denominatorSemantics,...(x.semanticCategories??[]).flatMap((c:any)=>[c.label,c.meaning])]),...r.blockedItems.flatMap((x:any)=>[x.reason,x.reevaluationCondition])].filter(x=>typeof x==='string');
 assert(!copyValues.some(x=>/なな徹|DMM|ぱちタウン|ちょんぼりすた|パチ7|一撃|https?:\/\//i.test(x)),'source name in product copy');
 assert(!r.findings.some((x:any)=>x.inferred===true));
 const active=c.candidates.filter((x:any)=>x.runtimeInferenceAllowed&&(x.runtimePolicyBinding.metric==='PER_ELIGIBLE_TRIAL_POWER'?x.runtimePolicyBinding.value>0:x.runtimePolicyBinding.value>=5));
 rows.push({machineId:id,machineName:r.machineName,originalCandidates:r.researchCompleteness.originalCandidateCount,ledgerRows:r.researchCompleteness.candidateCount,numericEvaluations:e.evaluations.length,evidenceFindings:e.evidenceCandidates.length,closedExcluded:r.blockedItems.length,policyEligibleNumericCount:active.length,policyEligibleNumeric:active.map((x:any)=>({findingId:x.findingId,label:x.label,metric:x.runtimePolicyBinding.metric,value:x.runtimePolicyBinding.value})),dependencyGroups:c.dependencyGroups.map((x:any)=>({groupId:x.groupId,resolution:x.resolution,selectedFindingId:x.selectedFindingId})),scope:c.scopeBoundary});
 assert.equal(s.read<any>('batches',b,'machines',id,'stages','OBSERVATION_EVIDENCE.json').state,'READY');
 assert.equal(s.read<any>('batches',b,'machines',id,'stages','DEVICE_QA.json').state,'PENDING');
}
assert.equal(orig.length,135);for(const x of orig)assert(seen.has(x.id));assert.equal(ids.length,10);
const report={batchId:b,status:'PASS',machines:10,formalStagesComplete:40,originalCandidatesPreserved:135,ledgerRows:seen.size,mirroredEvidenceRows:mirrored,externalAudit:'NOT_PERFORMED',fiveSiteFullVerification:'NOT_ASSERTED',implementation:false,distribution:false,apk:false,qa:false,actionsRuns:0,rows};
s.write(report,'batches',b,'validation','intake-contract-integrity.json');console.log(JSON.stringify({status:'PASS',machines:10,formalStages:40,originalCandidates:135,ledgerRows:seen.size,mirroredEvidenceRows:mirrored,policyEligibleNumeric:rows.reduce((n,x)=>n+x.policyEligibleNumericCount,0)}));
