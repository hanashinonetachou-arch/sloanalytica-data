// Historical v48 planning fixture; current completion is checked in batch009-process-resumption.test.ts.
import test from 'node:test';import assert from 'node:assert/strict';
import {classifyPracticalHit,practicalNonChainGames} from '../src/practical-observation-policy.ts';
test('AT hits after a completed return zone are initial hits regardless of elapsed games',()=>{
 assert.equal(classifyPracticalHit('AT','NORMAL'),'INITIAL_HIT');
 assert.equal(classifyPracticalHit('AT','RETURN_ZONE'),'CONTINUATION_EXCLUDED');
 assert.equal(classifyPracticalHit('AT','AT'),'CONTINUATION_EXCLUDED');
});
test('Okislot hits inside the chain zone are continuations and entered excluded games reduce the denominator',()=>{
 assert.equal(classifyPracticalHit('OKISLOT','CHAIN_ZONE'),'CONTINUATION_EXCLUDED');
 assert.equal(classifyPracticalHit('OKISLOT','NORMAL'),'INITIAL_HIT');
 assert.equal(practicalNonChainGames(7000,350),6650);
 assert.equal(practicalNonChainGames(7000,0),7000);
 assert.throws(()=>practicalNonChainGames(100,101),/INVALID/);
 assert.throws(()=>practicalNonChainGames(100,-1),/INVALID/);
 assert.throws(()=>practicalNonChainGames(100,1.5),/INVALID/);
});
test('Unknown or mismatched zones cannot be silently treated as initial hits',()=>{
 assert.throws(()=>classifyPracticalHit('AT','UNKNOWN' as any),/STATE_REQUIRED/);
 assert.throws(()=>classifyPracticalHit('OKISLOT','RETURN_ZONE'),/KIND_MISMATCH/);
});

import fs from 'node:fs';
import {validateResearchCandidateLedger} from '../src/research-validator.ts';
import {derivePlayInfoRequirement} from '../src/canonical-ui-builder.ts';
const readPolicyDraft=(machine:string,wave:string)=>JSON.parse(fs.readFileSync(`batches/batch-20261008-009/research-history/v48/research-working/${wave}/${machine}.json`,'utf8'));
test('User-excluded SEED candidate cannot silently be returned to the active ledger',()=>{
 const d=readPolicyDraft('L_GUNDAM_SEED_G','wave-1');
 d.findings.push(d.blockedItems.find((b:any)=>b.blockId==='seed-v47-100g-user-exclusion').referenceFinding);
 assert.throws(()=>validateResearchCandidateLedger(d,new Set(d.sources.map((s:any)=>s.sourceId))),/USER_EXCLUDED_FINDING_ACTIVE/);
});
test('Both okislot drafts require excluded games and cannot silently switch to a raw total denominator',()=>{
 for(const [machine,wave] of [['L_TIDADONDON_PA5','wave-1'],['S_BIG_SHIMAUTA_E2_30','wave-2']]){
  const d=readPolicyDraft(machine,wave),f=d.findings.find((f:any)=>f.operationalCounting);
  const ui=derivePlayInfoRequirement([f.trialUniverse]);
  assert.equal(ui.needsExcludedGames,true);assert.equal(ui.exclusionGames?.base,'TOTAL');
  assert.equal(ui.exclusionGames?.label,'除外ゲーム数');
  f.trialUniverse='TOTAL_GAME_TRIAL';
  assert.throws(()=>validateResearchCandidateLedger(d,new Set(d.sources.map((s:any)=>s.sourceId))),/PRACTICAL_CHAIN_EXCLUSION_INPUT_MISSING/);
 }
});
