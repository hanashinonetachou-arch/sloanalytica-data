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
 for(const scope of ['research-working','research-evidence-staged']){
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
 const d=read('research-evidence-staged','wave-1',id+'.json');
 const hint=d.findings.find((x:any)=>x.findingId==='reviewed-big-seven-seg');
 assert.deepEqual(hint.semanticCategories.map((x:any)=>x.label),['白（白7）','赤（赤7）','黄','緑','緑＆赤']);
 assert.deepEqual(hint.semanticCategories.map((x:any)=>x.semanticType),[
  'DISPLAY_ONLY','DISPLAY_ONLY','EXACT_CONSTRAINT','EXACT_CONSTRAINT','EXACT_CONSTRAINT'
 ]);
});

test('34-78G can include a new initial hit, so game-clock thresholds cannot auto-classify a Tida bonus',()=>{
 const d=read('research-evidence-staged','wave-1',id+'.json');
 const hit=d.findings.find((x:any)=>x.findingId==='bonus-initial');
 assert.ok(hit);
 assert.equal(hit.trialUniverse,'NON_CHAIN_BONUS_INITIAL_GAME_TRIAL');
 assert.equal(hit.liveObservation.status,'UNRESOLVED');
 assert.equal(hit.dependencyScopeAudit.status,'UNRESOLVED_OBSERVATION_SCOPE');
 assert.match(hit.dependencyScopeAudit.forbiddenSimplification,/34～78G/);
 assert.match(hit.denominatorSemantics,/34～78G/);
 assert.ok(hit.sourceIds.includes('tida-v22-heaven-initial-scope'));
});

test('even a manually toggled exact observation does not allow unresolved Tida first-hit promotion',()=>{
 const d=read('research-evidence-staged','wave-1',id+'.json');
 for(const row of d.researchCompleteness.candidateLedger)
  if(row.disposition?.type==='FINDING_PENDING_SCOPE_VALIDATION')row.disposition.type='FINDING';
 const hit=d.findings.find((x:any)=>x.findingId==='bonus-initial');
 hit.liveObservation.status='DIRECT_EXACT';
 assert.throws(()=>validateResearchPromotionReadiness(d),/UNRESOLVED_CAUSAL_DEPENDENCY_PROMOTION_FORBIDDEN/);
 const e=buildEvaluation(d);
 assert.equal(e.evaluations.find((x:any)=>x.findingId==='bonus-initial').dependencyScopeAudit.status,'UNRESOLVED_OBSERVATION_SCOPE');
 const decisions=buildEligibility(e);
 const decision=decisions.decisions.find((x:any)=>x.findingId==='bonus-initial');
 assert.equal(decision?.eligibility,'UNRESOLVED');
 assert.equal(decision?.liveInferenceRoute,'NONE');
});

test('Tida working data, reviewed Evidence and staging remain aligned',()=>{
 const w=read('research-working','wave-1',id+'.json');
 const stage=read('research-evidence-staged','wave-1',id+'.json');
 const review=read('research-evidence-reviewed',id+'.json');
 assert.deepEqual(auditBatch009Staging(w,review,stage),[]);
});
