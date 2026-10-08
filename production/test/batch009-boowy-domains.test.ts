import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {auditBatch009Staging} from '../src/batch009-staging-integrity.ts';
const base=path.resolve('batches','batch-20261008-009');
const read=(...parts:string[])=>JSON.parse(fs.readFileSync(path.join(base,...parts),'utf8'));
test('BOØWY follows all twenty research domains without inferring hidden settings',()=>{
 const work=read('research-working','wave-2','S_BOOWY_SV.json');
 const staged=read('research-evidence-staged','wave-2','S_BOOWY_SV.json');
 const reviewed=read('research-evidence-reviewed','S_BOOWY_SV.json');
 assert.deepEqual(auditBatch009Staging(work,reviewed,staged),[]);
 assert.equal(staged.researchCompleteness.status,'INCOMPLETE');
 const d=new Map(staged.researchCompleteness.domains.map((x:any)=>[x.domain,x]));
 const twenty=['INITIAL_HIT','BONUS','SMALL_ROLE','CZ','AT','INTERNAL_CONDITIONAL_DRAW','MODE_TRANSITION','STATE_TRANSITION','SUCCESS_RATE','POINTS_GAME_DISTRIBUTION','CARRY_OVER','THRESHOLD_BEHAVIOR','RESET_BEHAVIOR','POST_EVENT_TRANSITION','NAVIGATION','ROLE_CONDITIONAL_DISTRIBUTION','BONUS_TYPE_CONDITIONAL','EVIDENCE','EXTERNAL_DATA_ONLY','MACHINE_SPECIFIC'];
 for(const name of twenty)assert.ok(d.has(name),name);
 for(const name of ['BONUS','BONUS_TYPE_CONDITIONAL'])assert.equal(d.get(name).status,'NOT_APPLICABLE',name);
 for(const name of ['SMALL_ROLE','CZ','INTERNAL_CONDITIONAL_DRAW','SUCCESS_RATE','POINTS_GAME_DISTRIBUTION','CARRY_OVER','THRESHOLD_BEHAVIOR','RESET_BEHAVIOR','POST_EVENT_TRANSITION','NAVIGATION','ROLE_CONDITIONAL_DISTRIBUTION','EXTERNAL_DATA_ONLY','AT'])
   assert.equal(d.get(name).status,'CHECKED',name);
 const enabled=staged.findings.filter((x:any)=>x.settingDistribution&&x.liveObservation?.status!=='UNRESOLVED');
 assert.equal(enabled.length,0);
});
test('BOØWY verified no-setting-difference decisions are source-traced and plain Japanese',()=>{
 const staged=read('research-evidence-staged','wave-2','S_BOOWY_SV.json');
 const sourceIds=new Set(staged.sources.map((s:any)=>s.sourceId));
 const ledger=staged.researchCompleteness.candidateLedger;
 for(const id of ['lcd-stages-only-mode','replay-streak-not-setting-distribution','beat-revolution-carryover-no-setting','countdown-cz-success-no-setting-table','at-upper-promotion-not-independent','beat-cz-countdown-distribution-not-setting','single-setting-trial-not-probability-distribution']){
   const b=staged.blockedItems.find((x:any)=>x.blockId===id);
   assert.ok(b,id);
   assert.ok(b.reason.length>20 && b.reevaluationCondition.length>10,id);
   for(const sid of b.sourceIds)assert.ok(sourceIds.has(sid),id+':'+sid);
   assert.ok(ledger.some((x:any)=>x.disposition?.type==='BLOCKED'&&x.disposition.refId===id),id+':missing ledger');
 }
 assert.equal(staged.settings.values.includes('SET_L'),false);
});

test('BOØWY ending screen and setting L cannot be confused with independent numeric likelihoods',()=>{
 for(const scope of ['research-working','research-evidence-staged']){
  const d=read(scope,'wave-2','S_BOOWY_SV.json');
  const evidence=d.researchCompleteness.domains.find((x:any)=>x.domain==='EVIDENCE');
  const specific=d.researchCompleteness.domains.find((x:any)=>x.domain==='MACHINE_SPECIFIC');
  assert.equal(evidence?.status,'CHECKED');
  assert.equal(specific?.status,'CHECKED');
  assert.ok(evidence.sourceIds.includes('boowy-at-end-nanapress-20261009'));
  assert.ok(specific.sourceIds.includes('boowy-settingl-nanapress'));
  assert.ok(specific.sourceIds.includes('boowy-settingl-hissho'));
  const rateBlock=d.blockedItems.find((x:any)=>x.blockId==='boowy-screen-setting-rates-unpublished');
  assert.ok(rateBlock?.reason);
  assert.ok(d.researchCompleteness.candidateLedger.some((x:any)=>x.disposition?.refId===rateBlock.blockId));
  assert.deepEqual(d.settings.values,['SET_1','SET_2','SET_4','SET_5','SET_6']);
  assert.equal(d.researchCompleteness.status,'INCOMPLETE');
 }
 const stage=read('research-evidence-staged','wave-2','S_BOOWY_SV.json');
 const hint=stage.findings.find((x:any)=>x.findingId==='reviewed-at-end-screen');
 assert.equal(hint?.observationType,'evidence');
 const categories=hint.semanticCategories;
 assert.equal(categories.find((x:any)=>x.label==='氷室＆高橋')?.semanticType,'PROBABILITY_UNKNOWN');
 assert.equal(categories.find((x:any)=>x.label==='全員集合')?.semanticType,'EXACT_CONSTRAINT');
 assert.equal(categories.find((x:any)=>x.label==='氷室1人（影）')?.meaning,'設定1否定');
});

test('BOØWY AT progression can be source-checked while AT initial-hit denominator remains unresolved',()=>{
 const d=read('research-evidence-staged','wave-2','S_BOOWY_SV.json');
 const at=d.researchCompleteness.domains.find((x:any)=>x.domain==='AT');
 const hit=d.researchCompleteness.domains.find((x:any)=>x.domain==='INITIAL_HIT');
 assert.equal(at?.status,'CHECKED');
 assert.equal(hit?.status,'PARTIAL');
 assert.ok(at.sourceIds.includes('boowy-v19-gigs-nana'));
 assert.ok(at.sourceIds.includes('boowy-v19-gigs-pworld'));
 const initial=d.findings.find((x:any)=>x.findingId==='at-initial');
 assert.equal(initial.liveObservation?.status,'UNRESOLVED');
 const blocked=d.blockedItems.find((x:any)=>x.blockId==='at-upper-promotion-not-independent');
 assert.ok(blocked?.sourceIds.includes('boowy-v19-gigs-nana'));
 assert.ok(d.researchCompleteness.candidateLedger.some((x:any)=>x.disposition?.refId===blocked.blockId));
});
