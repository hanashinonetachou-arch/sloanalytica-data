// Historical v48 input fixture. Current production routes are tested in batch009-process-resumption.test.ts.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {auditBatch009Staging} from '../src/batch009-staging-integrity.ts';
import {validateResearchCandidateLedger,validateResearchPromotionReadiness} from '../src/research-validator.ts';
import {buildEvaluation} from '../src/evaluation-builder.ts';
import {buildEligibility} from '../src/eligibility-builder.ts';

const root=path.resolve('batches','batch-20261008-009');
const read=(...parts:string[])=>JSON.parse(fs.readFileSync(path.join(root,...parts),'utf8'));
const id='L_TIDADONDON_PA5';

test('Tida v22 mechanics and BIG-entry hint are source-checked, not independent numeric features',()=>{
 for(const scope of ['research-history/v48/research-working','research-history/v48/research-evidence-staged']){
  const d=read(scope,'wave-1',id+'.json');
  const checked=['CZ','AT','STATE_TRANSITION','INTERNAL_CONDITIONAL_DRAW','CARRY_OVER','ROLE_CONDITIONAL_DISTRIBUTION','POINTS_GAME_DISTRIBUTION','EVIDENCE'];
  for(const domain of checked){
   const row=d.researchCompleteness.domains.find((x:any)=>x.domain===domain);
   assert.equal(row?.status,domain==='CZ'?'NOT_APPLICABLE':'CHECKED',domain);
  }
  assert.equal(d.researchCompleteness.domains.find((x:any)=>x.domain==='INITIAL_HIT').status,'PARTIAL');
  assert.equal(d.researchCompleteness.status,'INCOMPLETE');
  validateResearchCandidateLedger(d,new Set(d.sources.map((x:any)=>x.sourceId)));
 }
 const d=read('research-history/v48/research-evidence-staged','wave-1',id+'.json');
 const hint=d.findings.find((x:any)=>x.findingId==='reviewed-big-seven-seg');
 assert.deepEqual(hint.semanticCategories.map((x:any)=>x.label),['白（白7）','赤（赤7）','黄','緑','緑＆赤']);
 assert.deepEqual(hint.semanticCategories.map((x:any)=>x.semanticType),[
  'DISPLAY_ONLY','DISPLAY_ONLY','EXACT_CONSTRAINT','EXACT_CONSTRAINT','EXACT_CONSTRAINT'
 ]);
});

test('34-78G can include a new initial hit, so game-clock thresholds cannot auto-classify a Tida bonus',()=>{
 const d=read('research-history/v48/research-evidence-staged','wave-1',id+'.json');
 const hit=d.findings.find((x:any)=>x.findingId==='bonus-initial');
 assert.ok(hit);
 assert.equal(hit.trialUniverse,'NON_CHAIN_BONUS_INITIAL_GAME_TRIAL');
 assert.equal(hit.liveObservation.status,'DIRECT_EXACT');
 assert.equal(hit.dependencyScopeAudit.status,'USER_DEFINED_PRACTICAL_SCOPE');
 assert.match(hit.historicalObservationScopeAudit.forbiddenSimplification,/34～78G/);
 assert.match(hit.denominatorSemantics,/除外/);
 assert.equal(hit.dependencyScopeAudit.publishedDenominatorEquivalence,'NOT_ASSERTED');
 assert.ok(hit.sourceIds.includes('tida-v22-heaven-initial-scope'));
});

test('User-defined Tida counting resolves observation scope without claiming publisher equivalence',()=>{
 const d=read('research-history/v48/research-evidence-staged','wave-1',id+'.json');
 const hit=d.findings.find((x:any)=>x.findingId==='bonus-initial');
 assert.equal(hit.liveObservation.status,'DIRECT_EXACT');
 assert.equal(hit.dependencyScopeAudit.status,'USER_DEFINED_PRACTICAL_SCOPE');
 assert.equal(hit.operationalCounting.publishedDenominatorEquivalence,'NOT_ASSERTED');
 const evaluation=buildEvaluation(d);
 assert.equal(evaluation.evaluations.find((x:any)=>x.findingId==='bonus-initial').dependencyScopeAudit.status,'USER_DEFINED_PRACTICAL_SCOPE');
});

test('Tida working data, reviewed Evidence and staging remain aligned',()=>{
 const w=read('research-history/v48/research-working','wave-1',id+'.json');
 const stage=read('research-history/v48/research-evidence-staged','wave-1',id+'.json');
 const review=read('research-history/v48/research-evidence-reviewed',id+'.json');
 assert.deepEqual(auditBatch009Staging(w,review,stage),[]);
});

test('an unresolved scope cannot cite a missing source or a source outside the finding',()=>{
 const d=read('research-history/v48/research-evidence-staged','wave-1',id+'.json');
 const sources=new Set(d.sources.map((x:any)=>x.sourceId));
 const hit=d.findings.find((x:any)=>x.findingId==='bonus-initial');
 hit.dependencyScopeAudit.evidenceSourceIds=['unregistered-source'];
 assert.throws(()=>validateResearchCandidateLedger(d,sources),/DEPENDENCY_SCOPE_PROVENANCE/);
 hit.dependencyScopeAudit.evidenceSourceIds=['tida-v25-noisy-state-emission-1'];
 hit.sourceIds=hit.sourceIds.filter((x:string)=>x!=='tida-v25-noisy-state-emission-1');
 assert.throws(()=>validateResearchCandidateLedger(d,sources),/DEPENDENCY_SCOPE_PROVENANCE/);
});
