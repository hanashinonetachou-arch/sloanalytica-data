import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {buildDependencyReview} from '../src/dependency-gate.ts';
import {validateResearchPromotionReadiness,validateResearchCandidateLedger} from '../src/research-validator.ts';
import {auditBatch009Staging} from '../src/batch009-staging-integrity.ts';

const root=path.resolve('batches','batch-20261008-009');
const read=(folder:string,wave:string,id:string)=>JSON.parse(fs.readFileSync(path.join(root,folder,wave,id+'.json'),'utf8'));
const verified=(d:any,domain:string)=>d.researchCompleteness.domains.find((x:any)=>x.domain===domain)?.status;
const sourceChecked=(d:any)=>{
  validateResearchCandidateLedger(d,new Set(d.sources.map((x:any)=>x.sourceId)));
};
test('BIG島唄 keeps BONUS and bonus-AT in one sample family, 1G stock not an independent initial hit',()=>{
 for(const folder of ['research-working','research-evidence-staged']){
  const d=read(folder,'wave-2','S_BIG_SHIMAUTA_E2_30');
  sourceChecked(d);
  for(const dom of ['BONUS','AT','INTERNAL_CONDITIONAL_DRAW','CARRY_OVER','NAVIGATION','ROLE_CONDITIONAL_DISTRIBUTION'])
    assert.equal(verified(d,dom),'CHECKED',dom);
  assert.equal(verified(d,'CZ'),'NOT_APPLICABLE');
  assert.deepEqual(d.settings.values,['SET_1','SET_2','SET_3','SET_5','SET_6']);
  const ids=['big-initial','bonus-type-other-trigger','bonus-type-watermelon-trigger'];
  const dependency=buildDependencyReview(d.findings);
  const group=dependency.summary.groups.find((x:any)=>x.groupId==='shimauta-initial-stock-bonus-type');
  assert.deepEqual([...group.members].sort(),[...ids].sort());
  for(const id of ids){
   const finding=d.findings.find((x:any)=>x.findingId===id);
   assert.equal(finding?.dependencyScopeAudit?.status,'UNRESOLVED_SHARED_HIT_CHAIN');
   assert.equal(finding.liveObservation.status,'UNRESOLVED');
  }
  assert.equal(d.researchCompleteness.status,'INCOMPLETE');
 }
});
test('Changing stock-family live flags and pending ledger does not silently promote BIG島唄',()=>{
 const d=read('research-evidence-staged','wave-2','S_BIG_SHIMAUTA_E2_30');
 for(const row of d.researchCompleteness.candidateLedger)
   if(row.disposition?.type==='FINDING_PENDING_SCOPE_VALIDATION')row.disposition.type='FINDING';
 for(const x of d.findings)if(x.liveObservation?.status==='UNRESOLVED')x.liveObservation.status='DIRECT_EXACT';
 assert.throws(()=>validateResearchPromotionReadiness(d),/UNRESOLVED_CAUSAL_DEPENDENCY_PROMOTION_FORBIDDEN/);
});
test('BIG島唄 working/staging integrity persists when the seven mechanical domains are checked',()=>{
 const work=read('research-working','wave-2','S_BIG_SHIMAUTA_E2_30');
 const stage=read('research-evidence-staged','wave-2','S_BIG_SHIMAUTA_E2_30');
 const review=JSON.parse(fs.readFileSync(path.join(root,'research-evidence-reviewed','S_BIG_SHIMAUTA_E2_30.json'),'utf8'));
 assert.deepEqual(auditBatch009Staging(work,review,stage),[]);
});
test('ガンダムSEED verifies bonus, conditional type, CZ/ST success, cumulative points, mode displays',()=>{
 for(const folder of ['research-working','research-evidence-staged']){
  const d=read(folder,'wave-1','L_GUNDAM_SEED_G');
  sourceChecked(d);
  for(const dom of ['BONUS','BONUS_TYPE_CONDITIONAL','SUCCESS_RATE','CARRY_OVER','NAVIGATION'])
    assert.equal(verified(d,dom),'CHECKED',dom);
  assert.equal(verified(d,'RESET_BEHAVIOR'),'PARTIAL');
  assert.ok(d.blockedItems.some((x:any)=>x.blockId==='seed-reset-750-scope-not-resolved'));
  assert.equal(d.researchCompleteness.status,'INCOMPLETE');
 }
});
test('ガンダムSEED working/staging source and category mapping remains intact',()=>{
 const work=read('research-working','wave-1','L_GUNDAM_SEED_G');
 const stage=read('research-evidence-staged','wave-1','L_GUNDAM_SEED_G');
 const review=JSON.parse(fs.readFileSync(path.join(root,'research-evidence-reviewed','L_GUNDAM_SEED_G.json'),'utf8'));
 assert.deepEqual(auditBatch009Staging(work,review,stage),[]);
});
