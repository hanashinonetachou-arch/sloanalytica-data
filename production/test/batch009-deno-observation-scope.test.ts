// Historical v48 input fixture. Current production routes are tested in batch009-process-resumption.test.ts.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateResearchPromotionReadiness} from '../src/research-validator.ts';
import {buildEvaluation} from '../src/evaluation-builder.ts';
import {buildEligibility} from '../src/eligibility-builder.ts';

const read=(scope:string)=>JSON.parse(fs.readFileSync(`batches/batch-20261008-009/${scope}/wave-2/L_KAMEN_RIDER_DEN_O_UD.json`,'utf8'));
test('DenO point draws, stocks and downstream hits remain blocked even when observation status is toggled',()=>{
 const d=read('research-history/v48/research-evidence-staged');
 for(const row of d.researchCompleteness.candidateLedger)
  if(row.disposition.type==='FINDING_PENDING_SCOPE_VALIDATION')row.disposition.type='FINDING';
 for(const f of d.findings)
  if(f.liveObservation?.status==='UNRESOLVED')f.liveObservation.status='DIRECT_EXACT';
 assert.throws(()=>validateResearchPromotionReadiness(d),/UNRESOLVED_CAUSAL_DEPENDENCY_PROMOTION_FORBIDDEN/);
 const evals=buildEvaluation(d),eligibility=buildEligibility(evals);
 for(const id of ['bonus-initial','at-initial','upper-at','possession-100-cz']){
  const row=eligibility.decisions.find((x:any)=>x.findingId===id);
  assert.equal(row.eligibility,'UNRESOLVED');
  assert.equal(row.liveInferenceRoute,'NONE');
 }
 const point=evals.evaluations.find((x:any)=>x.findingId==='possession-100-cz');
 assert.equal(point.metrics.selectionScore.value,null);
 assert.equal(point.benchmarkExposure.status,'BLOCKED_UNRESOLVED');
});
