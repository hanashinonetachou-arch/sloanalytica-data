import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateResearchProcessContract} from '../src/research-process-contract.ts';
import {validateResearchCandidateLedger,validateResearchPromotionReadiness} from '../src/research-validator.ts';
import {buildEvaluation} from '../src/evaluation-builder.ts';
import {buildEligibility} from '../src/eligibility-builder.ts';
import {validateEligibilityDocument} from '../src/eligibility-validator.ts';
import {buildCandidateContract} from '../src/candidate-contract-builder.ts';
import {buildResearchWorkQueue} from '../src/research-work-queue.ts';
const root='batches/batch-20261008-009';
const spec=JSON.parse(fs.readFileSync(root+'/batch.json','utf8'));
const drafts=spec.waves.flatMap((w:any)=>w.machineIds.map((id:string)=>JSON.parse(fs.readFileSync(`${root}/research-drafts/${w.waveId}/${id}.json`,'utf8'))));
test('current Batch009 advances known overlap through real Evaluation Eligibility Candidate builders',()=>{
 let routed=0;
 for(const d of drafts){
  validateResearchCandidateLedger(d,new Set(d.sources.map((s:any)=>s.sourceId)));
  validateResearchPromotionReadiness(d);
  const e=buildEvaluation(d),g=buildEligibility(e),c=buildCandidateContract(e,g,{},{});
  validateEligibilityDocument(g,e,d);
  for(const f of d.findings.filter((f:any)=>f.dependencyScopeAudit?.status==='KNOWN_DEPENDENCY_DEFERRED_TO_CONTRACT')){
   const decision=g.decisions.find((x:any)=>x.findingId===f.findingId);
   assert.equal(decision.eligibility,'ELIGIBLE',d.machineId+':'+f.findingId);
   const candidate=c.candidates.find((x:any)=>x.findingId===f.findingId);
   assert.ok(candidate.runtimeInferenceAllowed||candidate.dependencyResolution==='RESOLVED_BY_SINGLE_MEMBER');
   assert.ok(['PREFERRED_MEMBER','FALLBACK_MEMBER','SINGLE_MEMBER_SELECTED','RESOLVED_BY_SINGLE_MEMBER'].includes(candidate.dependencyResolution));
   routed++;
  }
  assert.ok(!c.dependencyGroups.some((x:any)=>x.resolution==='HELD_NO_JOINT_MODEL'));
 }
 assert.equal(routed,16);
 assert.equal(buildResearchWorkQueue(drafts,'current').remainingDomains,0);
});
test('five unguaranteed numeric observations retain source values in exclusions and never enter Evaluation',()=>{
 let closed=0;
 for(const d of drafts){
  const e=buildEvaluation(d);
  for(const b of d.blockedItems.filter((b:any)=>b.resolution==='OBSERVATION_NOT_GUARANTEED_EXCLUDED')){
   assert.equal(b.runtimeSettingLikelihood,'DISABLED');assert.ok(b.referenceFinding.settingDistribution);assert.ok(b.sourceIds.length);
   assert.ok(!e.evaluations.some((x:any)=>x.findingId===b.referenceFinding.findingId));closed++;
  }
 }
 assert.equal(closed,5);
});
test('new Research stops require authority owner and release; implementation and publisher-equivalence cannot become source gates',()=>{
 assert.throws(()=>validateResearchProcessContract({researchStops:[{}]}),/STOP_AUTHORITY_REQUIRED/);
 assert.throws(()=>validateResearchProcessContract({researchStops:[{basis:'implementation',ownerStage:'CANONICAL_UI',releaseCondition:'build UI'}]}),/NOT_RESEARCH_STOP/);
 assert.throws(()=>validateResearchProcessContract({findings:[{findingId:'initial',operationalCounting:{publishedDenominatorEquivalence:'NOT_ASSERTED'},requiresPublishedDenominatorEquivalence:true}]}),/NOT_ADOPTION_GATE/);
});
test('accepted Candidate Contracts remain reproducible from their saved Evaluation and Eligibility',()=>{
 for(const d of drafts){
  const read=(stage:string)=>JSON.parse(fs.readFileSync(`${root}/artifacts/${d.machineId}/${stage}/result.json`,'utf8'));
  const c=read('candidate_contract');
  assert.deepEqual(JSON.parse(JSON.stringify(buildCandidateContract(read('evaluation'),read('eligibility'),c.evaluationArtifact,c.eligibilityArtifact))),c);
 }
});
