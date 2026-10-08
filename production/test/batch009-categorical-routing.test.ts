import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {buildEvaluation} from '../src/evaluation-builder.ts';
import {buildEligibility} from '../src/eligibility-builder.ts';
import {validateCategoryRates} from '../src/batch009-rate-matrix.ts';
import {validateResearchPromotionReadiness} from '../src/research-validator.ts';

const root=path.resolve('batches','batch-20261008-009');
const read=(...p:string[])=>JSON.parse(fs.readFileSync(path.join(root,...p),'utf8'));

test('Sister Quest AT-end 7-way numeric likelihood is source-identical but not prematurely live',()=>{
  const src=read('research-evidence-reviewed','L_SISTER_QUEST_CA.json');
  const d=read('research-evidence-staged','wave-1','L_SISTER_QUEST_CA.json');
  assert.deepEqual(validateCategoryRates(src.categoryRates),[]);
  const f=d.findings.find((f:any)=>f.findingId==='at-end-categorical');
  assert.ok(f,'known setting-specific screen rates must have a numeric candidate');
  assert.equal(f.observationType,'appearance_distribution');
  assert.equal(f.categoryModel.residualPolicy,'SOURCE_EXHAUSTIVE');
  assert.equal(f.trialUniverse,'SISTER_AT_END_SCREEN');
  assert.equal(f.numericRouteStatus,'PENDING_EVIDENCE_DEDUPLICATION');
  for(const [i,setting] of src.categoryRates.settings.entries()){
    const expected=src.categoryRates.categories.map((cat:string,j:number)=>cat+':'+src.categoryRates.percentRows[i][j].toFixed(1)+'%').join('/');
    assert.equal(f.settingDistribution[setting],expected,'source rate mismatch for setting '+setting);
  }
  const e=buildEvaluation(d);
  const row=e.evaluations.find((x:any)=>x.findingId===f.findingId);
  assert.equal(row.model,'CATEGORICAL');
  assert.ok(row.metrics.perEligibleTrialPower>0);
  const decision=buildEligibility(e).decisions.find((x:any)=>x.findingId===f.findingId);
  assert.equal(decision.eligibility,'UNRESOLVED');
  assert.equal(decision.liveInferenceRoute,'NONE');
  const mirror=d.findings.find((x:any)=>x.findingId==='reviewed-at-end');
  assert.ok(mirror,'do not drop existing exact setting hints before the runtime is deduplicated');
  assert.deepEqual(mirror.semanticCategories,src.evidenceCandidates[0].semanticCategories);
  assert.throws(()=>validateResearchPromotionReadiness(d),/PENDING_SCOPE_PROMOTION_FORBIDDEN|MIRRORED_CATEGORICAL_EVIDENCE_NOT_RECONCILED/);
});
test('Mirrored numeric/hint evidence independently blocks promotion even if ledger is marked complete',()=>{
  const d=read('research-evidence-staged','wave-1','L_SISTER_QUEST_CA.json');
  for(const row of d.researchCompleteness.candidateLedger)
    if(row.disposition?.type==='FINDING_PENDING_SCOPE_VALIDATION')row.disposition.type='FINDING';
  assert.throws(()=>validateResearchPromotionReadiness(d),/MIRRORED_CATEGORICAL_EVIDENCE_NOT_RECONCILED/);
});
