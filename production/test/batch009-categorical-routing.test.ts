// Historical v48 input fixture. Current production routes are tested in batch009-process-resumption.test.ts.
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

test('Sister Quest AT-end rates remain source-identical after canonical input reconciliation',()=>{
  const src=read('research-history/v48/research-evidence-reviewed','L_SISTER_QUEST_CA.json');
  const d=read('research-history/v48/research-evidence-staged','wave-1','L_SISTER_QUEST_CA.json');
  assert.deepEqual(validateCategoryRates(src.categoryRates),[]);
  const f=d.findings.find((f:any)=>f.findingId==='at-end-categorical');
  assert.ok(f,'known setting-specific screen rates must have a numeric candidate');
  assert.equal(f.observationType,'appearance_distribution');
  assert.equal(f.categoryModel.residualPolicy,'SOURCE_EXHAUSTIVE');
  assert.equal(f.trialUniverse,'SISTER_AT_END_SCREEN');
  assert.equal(f.numericRouteStatus,'CANONICAL_CATEGORY_INPUT_LINKED');
  for(const [i,setting] of src.categoryRates.settings.entries()){
    const expected=src.categoryRates.categories.map((cat:string,j:number)=>cat+':'+src.categoryRates.percentRows[i][j].toFixed(1)+'%').join('/');
    assert.equal(f.settingDistribution[setting],expected,'source rate mismatch for setting '+setting);
  }
  const e=buildEvaluation(d);
  const row=e.evaluations.find((x:any)=>x.findingId===f.findingId);
  assert.equal(row.model,'CATEGORICAL');
  assert.ok(row.metrics.perEligibleTrialPower>0);
  const decision=buildEligibility(e).decisions.find((x:any)=>x.findingId===f.findingId);
  assert.equal(decision.eligibility,'ELIGIBLE');
  assert.equal(decision.liveInferenceRoute,'LIVE_CONDITIONAL');
  const mirror=d.findings.find((x:any)=>x.findingId==='reviewed-at-end');
  assert.ok(mirror,'do not drop existing exact setting hints before the runtime is deduplicated');
  assert.deepEqual(mirror.semanticCategories,src.evidenceCandidates[0].semanticCategories);
  assert.equal(mirror.semanticCategories.filter((x:any)=>x.semanticType==='PROBABILITY_BACKED').length,4);
  assert.equal(mirror.semanticCategories.filter((x:any)=>x.semanticType==='EXACT_CONSTRAINT').length,3);
  assert.equal(mirror.semanticCategories.some((x:any)=>x.semanticType==='PROBABILITY_UNKNOWN'),false);
  assert.throws(()=>validateResearchPromotionReadiness(d),/PENDING_SCOPE_PROMOTION_FORBIDDEN|MIRRORED_CATEGORICAL_EVIDENCE_NOT_RECONCILED/);
});
test('Mirrored numeric/hint evidence independently blocks promotion even if ledger is marked complete',()=>{
  const d=read('research-history/v48/research-evidence-staged','wave-1','L_SISTER_QUEST_CA.json');
  for(const row of d.researchCompleteness.candidateLedger)
    if(row.disposition?.type==='FINDING_PENDING_SCOPE_VALIDATION')row.disposition.type='FINDING';
  // Isolate mirror guard from separate pending-status and observation-scope guards.
  for(const f of d.findings)
    if(f.settingDistribution&&f.liveObservation?.status==='UNRESOLVED')f.liveObservation.status='EXACT_WITH_SCOPE_TRACKING';
  assert.throws(()=>validateResearchPromotionReadiness(d),/MIRRORED_CATEGORICAL_EVIDENCE_NOT_RECONCILED|UNRESOLVED_CAUSAL_DEPENDENCY_PROMOTION_FORBIDDEN/);
});

test('Sister Quest rare monster four-way rate is conditional on observing a rare monster, not all enemies',()=>{
  const src=read('research-quantitative-addenda','L_SISTER_QUEST_CA.json');
  const table=src.findings.find((x:any)=>x.findingId==='at-monster-setting-distribution');
  const d=read('research-history/v48/research-evidence-staged','wave-1','L_SISTER_QUEST_CA.json');
  const f=d.findings.find((x:any)=>x.findingId==='at-monster-categorical');
  assert.equal(f?.mirrorsEvidenceFindingId,'reviewed-at-monster');
  const mirror=d.findings.find((x:any)=>x.findingId==='reviewed-at-monster');
  assert.ok(mirror);
  assert.deepEqual(mirror.semanticCategories.map((x:any)=>x.label),table.categories);
  assert.ok(mirror.semanticCategories.every((x:any)=>x.semanticType==='PROBABILITY_BACKED'));
  assert.ok(f);
  assert.equal(f.trialUniverse,'SISTER_RARE_MONSTER_APPEARANCE');
  assert.equal(f.categoryModel.residualPolicy,'SOURCE_EXHAUSTIVE');
  assert.match(f.denominatorSemantics,/その他の敵モンスターは対象回数に含めません/);
  assert.equal(f.liveObservation.status,'UNRESOLVED');
  const settings=Object.keys(table.settingPercentRows);
  for(const setting of settings){
    const expected=table.categories.map((cat:string,i:number)=>cat+':'+table.settingPercentRows[setting][i].toFixed(1)+'%').join('/');
    assert.equal(f.settingDistribution[setting],expected);
  }
  const evaluated=buildEvaluation(d);
  const n=evaluated.evaluations.find((e:any)=>e.findingId===f.findingId);
  assert.equal(n.model,'CATEGORICAL');
  assert.ok(n.metrics.perEligibleTrialPower>0);
  assert.equal(buildEligibility(evaluated).decisions.find((e:any)=>e.findingId===f.findingId).eligibility,'UNRESOLVED');
});
