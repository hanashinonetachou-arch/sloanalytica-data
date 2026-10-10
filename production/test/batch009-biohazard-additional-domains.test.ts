// Historical v48 input fixture. Current production routes are tested in batch009-process-resumption.test.ts.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {auditBatch009Staging} from '../src/batch009-staging-integrity.ts';
import {validateResearchCandidateLedger} from '../src/research-validator.ts';

const root=path.resolve('batches','batch-20261008-009');
const read=(...parts:string[])=>JSON.parse(fs.readFileSync(path.join(root,...parts),'utf8'));
const checked=(d:any,domain:string)=>d.researchCompleteness.domains.find((x:any)=>x.domain===domain);

test('Biohazard5 keeps 4G small-role history and CZ / icon stocks separate',()=>{
 for(const dir of ['research-history/v48/research-working','research-history/v48/research-evidence-staged']){
  const d=read(dir,'wave-1','L_BIOHAZARD5_ZE.json');
  for(const domain of ['CARRY_OVER','POINTS_GAME_DISTRIBUTION','BONUS_TYPE_CONDITIONAL','STATE_TRANSITION','MACHINE_SPECIFIC']){
   const dom=checked(d,domain);
   assert.ok(dom,['MISSING',domain].join(':'));
   assert.equal(dom.status,domain==='BONUS_TYPE_CONDITIONAL'?'NOT_APPLICABLE':'CHECKED');
   assert.equal(dom.sourceIds.length,2);
  }
  for(const slug of ['cz-icon-stock','four-game-window','no-bonus-type','low-mid-hi-sp','first-middle-7']){
   const id='bio5-v21-'+slug+'-not-new-likelihood';
   assert.ok(d.blockedItems.find((x:any)=>x.blockId===id)?.reason);
   assert.equal(d.researchCompleteness.candidateLedger.find((x:any)=>x.disposition?.refId===id)?.disposition.type,'BLOCKED');
  }
  assert.equal(checked(d,'INTERNAL_CONDITIONAL_DRAW').status,'PARTIAL');
  assert.equal(d.findings.find((x:any)=>x.findingId==='infection-midline-first-seven')?.liveObservation?.status,'UNRESOLVED');
  validateResearchCandidateLedger(d,new Set(d.sources.map((x:any)=>x.sourceId)));
  assert.equal(d.researchCompleteness.status,'INCOMPLETE');
 }
});

test('RE2 4th-reel selection is explicitly conditional on the successful challenge and has no per-setting rate',()=>{
 for(const dir of ['research-history/v48/research-working','research-history/v48/research-evidence-staged']){
  const d=read(dir,'wave-2','S_BIOHAZARD_RE2_XB.json');
  for(const domain of ['BONUS_TYPE_CONDITIONAL','CARRY_OVER','POINTS_GAME_DISTRIBUTION','MACHINE_SPECIFIC'])
   assert.equal(checked(d,domain)?.status,'CHECKED',domain);
  const model=checked(d,'BONUS_TYPE_CONDITIONAL').referenceConditionalDistribution;
  assert.equal(model.trialUnit,'4TH_REEL_CHALLENGE_SUCCEEDED');
  assert.equal(model.challengeSuccessPercent,10.2);
  assert.deepEqual(model.outcomes.map((x:any)=>x.percent),[88.5,7.7,3.8]);
  assert.equal(model.runtimeSettingLikelihood,'DISABLED');
  for(const slug of ['fourth-reel-types','one-g-stock','even-game-tyrant','at-level-prologue']){
   const id='re2-v21-'+slug+'-not-independent';
   assert.ok(d.blockedItems.find((x:any)=>x.blockId===id)?.reason);
   assert.equal(d.researchCompleteness.candidateLedger.find((x:any)=>x.disposition?.refId===id)?.disposition.type,'BLOCKED');
  }
  assert.equal(checked(d,'INTERNAL_CONDITIONAL_DRAW').status,'PARTIAL');
  validateResearchCandidateLedger(d,new Set(d.sources.map((x:any)=>x.sourceId)));
  assert.equal(d.researchCompleteness.status,'INCOMPLETE');
 }
});

test('both biohazard machines retain reviewed Evidence exactly after new Research additions',()=>{
 for(const [wave,id] of [['wave-1','L_BIOHAZARD5_ZE'],['wave-2','S_BIOHAZARD_RE2_XB']]){
  const w=read('research-history/v48/research-working',wave,id+'.json'),s=read('research-history/v48/research-evidence-staged',wave,id+'.json');
  const review=read('research-history/v48/research-evidence-reviewed',id+'.json');
  assert.deepEqual(auditBatch009Staging(w,review,s),[],id);
 }
});
