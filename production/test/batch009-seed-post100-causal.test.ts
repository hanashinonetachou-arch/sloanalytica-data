import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {buildDependencyReview} from '../src/dependency-gate.ts';
import {buildEvaluation} from '../src/evaluation-builder.ts';
import {buildEligibility} from '../src/eligibility-builder.ts';
import {validateResearchCandidateLedger,validateResearchPromotionReadiness} from '../src/research-validator.ts';
import {auditBatch009Staging} from '../src/batch009-staging-integrity.ts';

const root=path.resolve('batches','batch-20261008-009');
const get=(...paths:string[])=>JSON.parse(fs.readFileSync(path.join(root,...paths),'utf8'));
const id='L_GUNDAM_SEED_G',wave='wave-1';
const target='post-st-reset-100g-first-cz-or-bonus';

test('Gundam SEED retains source-supported 100G rates as user-excluded reference',()=>{
 for(const folder of ['research-working','research-evidence-staged']){
  const d=get(folder,wave,id+'.json');
  validateResearchCandidateLedger(d,new Set(d.sources.map((x:any)=>x.sourceId)));
  for(const domain of ['AT','STATE_TRANSITION','POINTS_GAME_DISTRIBUTION','ROLE_CONDITIONAL_DISTRIBUTION','MACHINE_SPECIFIC'])
   assert.equal(d.researchCompleteness.domains.find((x:any)=>x.domain===domain)?.status,'CHECKED',folder+':'+domain);
  const blocked=d.blockedItems.find((f:any)=>f.blockId==='seed-v47-100g-user-exclusion');
  assert.equal(blocked.runtimeUse,'DISABLED');assert.ok(!d.findings.some((f:any)=>f.findingId===target));
  const hit=blocked.referenceFinding;
  assert.ok(hit);
  assert.deepEqual(Object.values(hit.settingDistribution),[0.3186,0.3204,0.3261,0.348,0.3545,0.3899]);
  assert.equal(hit.trialUniverse,'SEED_POST_RESET_OR_ST_END_FIRST_100_GAME_EPISODE');
  assert.equal(hit.liveObservation.status,'UNRESOLVED');
  assert.equal(hit.dependencyScopeAudit.status,'UNRESOLVED_SHARED_POST_EVENT_INITIAL');
  assert.equal(hit.dependencyScopeAudit.sourceProvenance,'ONE_EDITORIAL_ROOT_NANAPRESS');
  const review=buildDependencyReview(d.findings);
  const group=review.summary.groups.find((g:any)=>g.groupId==='seed-cz-at');
  assert.deepEqual([...group.members].sort(),['at-initial','cz-strike-attack'].sort());
  assert.equal(d.researchCompleteness.domains.find((x:any)=>x.domain==='POST_EVENT_TRANSITION').status,'PARTIAL');
  assert.equal(d.researchCompleteness.status,'INCOMPLETE');
 }
});

test('Gundam SEED user-excluded 100G rate does not reach Evaluation or Eligibility',()=>{
 const d=get('research-evidence-staged',wave,id+'.json');
 const evaluation=buildEvaluation(d);
 assert.ok(!evaluation.evaluations.some((x:any)=>x.findingId===target));
 assert.ok(!buildEligibility(evaluation).decisions.some((x:any)=>x.findingId===target));
});

test('Gundam SEED unresolved shared-event audit forbids promotion even after clearing pending ledgers',()=>{
 const d=get('research-evidence-staged',wave,id+'.json');
 d.findings.push(structuredClone(d.blockedItems.find((b:any)=>b.blockId==='seed-v47-100g-user-exclusion').referenceFinding));
 for(const l of d.researchCompleteness.candidateLedger)
  if(l.disposition?.type==='FINDING_PENDING_SCOPE_VALIDATION')l.disposition.type='FINDING';
 for(const f of d.findings)
  if(f.liveObservation?.status==='UNRESOLVED')f.liveObservation.status='DIRECT_EXACT';
 assert.throws(()=>validateResearchPromotionReadiness(d),/UNRESOLVED_CAUSAL_DEPENDENCY_PROMOTION_FORBIDDEN/);
});

test('Gundam SEED new research is a non-destructive staging extension',()=>{
 const w=get('research-working',wave,id+'.json'),s=get('research-evidence-staged',wave,id+'.json');
 const reviewed=get('research-evidence-reviewed',id+'.json');
 assert.deepEqual(auditBatch009Staging(w,reviewed,s),[]);
});
