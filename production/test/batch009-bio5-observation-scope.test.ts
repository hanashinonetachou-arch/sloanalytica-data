// Historical v48 input fixture. Current production routes are tested in batch009-process-resumption.test.ts.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateResearchPromotionReadiness} from '../src/research-validator.ts';
import {buildEvaluation} from '../src/evaluation-builder.ts';
import {buildEligibility} from '../src/eligibility-builder.ts';

const read=(scope:string)=>JSON.parse(fs.readFileSync(`batches/batch-20261008-009/${scope}/wave-1/L_BIOHAZARD5_ZE.json`,'utf8'));

test('Bio5 CZ loop, stock and delayed carry-over cannot be promoted by toggling observation status',()=>{
 const d=read('research-history/v48/research-evidence-staged');
 for(const row of d.researchCompleteness.candidateLedger)
  if(row.disposition.type==='FINDING_PENDING_SCOPE_VALIDATION')row.disposition.type='FINDING';
 for(const f of d.findings)
  if(f.liveObservation?.status==='UNRESOLVED')f.liveObservation.status='DIRECT_EXACT';
 assert.throws(()=>validateResearchPromotionReadiness(d),/UNRESOLVED_CAUSAL_DEPENDENCY_PROMOTION_FORBIDDEN/);
 const eligibility=buildEligibility(buildEvaluation(d));
 for(const id of ['at-initial','panic-zone','cz-combined']){
  const row=eligibility.decisions.find((x:any)=>x.findingId===id);
  assert.equal(row.eligibility,'UNRESOLVED');
  assert.equal(row.liveInferenceRoute,'NONE');
 }
});

test('Bio5 personal trial reports remain blocked without fabricated per-setting probabilities',()=>{
 for(const scope of ['research-history/v48/research-working','research-history/v48/research-evidence-staged']){
  const d=read(scope);
  assert.equal(d.researchCompleteness.domains.find((x:any)=>x.domain==='EXTERNAL_DATA_ONLY').status,'CHECKED');
  const row=d.researchCompleteness.candidateLedger.find((x:any)=>x.candidateId==='block:bio5-v24-external-trial');
  assert.equal(row.disposition.type,'BLOCKED');
  assert.ok(!d.findings.some((x:any)=>x.sourceIds?.includes('bio5-v24-external-trial-1')));
  for(const domain of ['CZ','MODE_TRANSITION','POST_EVENT_TRANSITION'])
   assert.equal(d.researchCompleteness.domains.find((x:any)=>x.domain===domain).status,'PARTIAL');
 }
});
