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
 for(const name of ['SMALL_ROLE','CZ','INTERNAL_CONDITIONAL_DRAW','SUCCESS_RATE','POINTS_GAME_DISTRIBUTION','CARRY_OVER','THRESHOLD_BEHAVIOR','RESET_BEHAVIOR','POST_EVENT_TRANSITION','NAVIGATION','ROLE_CONDITIONAL_DISTRIBUTION','EXTERNAL_DATA_ONLY'])
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
