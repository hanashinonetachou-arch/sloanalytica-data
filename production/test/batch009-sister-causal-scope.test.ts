// Historical v48 input fixture. Current production routes are tested in batch009-process-resumption.test.ts.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {buildDependencyReview} from '../src/dependency-gate.ts';
import {buildEvaluation} from '../src/evaluation-builder.ts';
import {buildEligibility} from '../src/eligibility-builder.ts';
import {validateResearchPromotionReadiness,validateResearchCandidateLedger} from '../src/research-validator.ts';

const root=path.resolve('batches','batch-20261008-009');
const sample=(folder:string)=>JSON.parse(fs.readFileSync(path.join(root,folder,'wave-1','L_SISTER_QUEST_CA.json'),'utf8'));

test('Sister Quest CZ/AT share one unresolved causal group rather than independent likelihoods',()=>{
  for(const folder of ['research-history/v48/research-working','research-history/v48/research-evidence-staged']){
    const d=sample(folder);
    const ids=['at-initial','cz-quest-battle'];
    const review=buildDependencyReview(d.findings);
    const group=review.summary.groups.find((x:any)=>x.groupId==='sister-cz-at');
    assert.ok(group,folder);
    assert.deepEqual([...group.members].sort(),ids.sort());
    for(const id of ids){
      const f=d.findings.find((x:any)=>x.findingId===id);
      assert.equal(f.dependencyScopeAudit?.status,'UNRESOLVED_CAUSAL_OVERLAP');
      assert.equal(f.liveObservation.status,'UNRESOLVED');
      assert.equal(review.decisions.get(id).status,'DEFERRED_TO_CANDIDATE_CONTRACT');
    }
    validateResearchCandidateLedger(d,new Set(d.sources.map((x:any)=>x.sourceId)));
  }
});

test('Changing ledger and live status alone never promotes a causal overlap whose audit remains unresolved',()=>{
  const d=sample('research-history/v48/research-evidence-staged');
  for(const x of d.researchCompleteness.candidateLedger)
    if(x.disposition?.type==='FINDING_PENDING_SCOPE_VALIDATION')
      x.disposition.type='FINDING';
  for(const f of d.findings)
    if(f.liveObservation?.status==='UNRESOLVED')f.liveObservation.status='DIRECT_EXACT';
  assert.throws(()=>validateResearchPromotionReadiness(d),/UNRESOLVED_CAUSAL_DEPENDENCY_PROMOTION_FORBIDDEN/);
});

test('CZ and AT published rates are both evaluated but not independently eligible',()=>{
  const d=sample('research-history/v48/research-evidence-staged');
  const evalResult=buildEvaluation(d);
  const eligibility=buildEligibility(evalResult);
  for(const id of ['at-initial','cz-quest-battle']){
    const e=evalResult.evaluations.find((x:any)=>x.findingId===id);
    const dec=eligibility.decisions.find((x:any)=>x.findingId===id);
    assert.ok(e&&dec,id);
    assert.equal(e.dependency.status,'DEFERRED_TO_CANDIDATE_CONTRACT');
    assert.equal(dec.eligibility,'UNRESOLVED');
    assert.equal(dec.liveInferenceRoute,'NONE');
  }
});
