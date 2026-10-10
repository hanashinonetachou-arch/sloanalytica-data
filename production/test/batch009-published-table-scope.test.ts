import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {validateResearchCandidateLedger} from '../src/research-validator.ts';
const read=(id:string,w:number)=>JSON.parse(fs.readFileSync(`batches/batch-20261008-009/research-working/wave-${w}/${id}.json`,'utf8'));
test('SEED time windows retain one episode and the unmodified published total',()=>{
 const d=read('L_GUNDAM_SEED_G',1);validateResearchCandidateLedger(d,new Set(d.sources.map((x:any)=>x.sourceId)));
 const b=d.blockedItems.find((x:any)=>x.blockId==='seed-v21-post-st-100-nonindependent').referenceConditionalDistribution;
 assert.deepEqual(b.windowPercentBySetting['5'],[5.39,30.07,35.45]);assert.equal(b.windowSemantics,'MUTUALLY_EXCLUSIVE_OUTCOMES_WITHIN_ONE_EPISODE');assert.equal(b.runtimeSettingLikelihood,'DISABLED');
 const f=d.blockedItems.find((x:any)=>x.blockId==='seed-v47-100g-user-exclusion').referenceFinding;assert.equal(f.settingDistribution['5'],.3545);assert.equal(f.dependencyGroupId,'seed-cz-at');assert.equal(f.liveObservation.status,'UNRESOLVED');
});
test('Shimauta retains invalid source mass without silently producing a normalized model',()=>{
 const d=read('S_BIG_SHIMAUTA_E2_30',2);validateResearchCandidateLedger(d,new Set(d.sources.map((x:any)=>x.sourceId)));
 const r=d.blockedItems.find((x:any)=>x.blockId==='shimauta-v23-mode-counter-scope').referenceConditionalDistribution;
 assert.equal(r.rawRowTotalPercent,125);assert.equal(r.vectorAudit,'INVALID_EXCLUSIVE_OUTCOME_MASS');assert.equal(r.runtimeSettingLikelihood,'DISABLED');assert.equal(r.modeTransitionExcludedBonus,'STOCKED_BONUS');assert.equal(r.chainCounterIncludes,'ONE_GAME_STOCK_CHAIN_BELOW_HEAVEN');
});
test('DenO does not equate visible MAX or CZ appearances with hidden threshold draws',()=>{
 const d=read('L_KAMEN_RIDER_DEN_O_UD',2);validateResearchCandidateLedger(d,new Set(d.sources.map((x:any)=>x.sourceId)));
 const f=d.findings.find((x:any)=>x.findingId==='possession-100-cz');assert.equal(f.liveObservation.status,'UNRESOLVED');assert.match(f.liveObservation.reason,/朝一/);assert.match(f.liveObservation.reason,/複数CZストック/);assert.match(f.liveObservation.reason,/一対一/);
});

test('invalid exclusive source vectors cannot be enabled as setting likelihood',()=>{
 const d=read('S_BIG_SHIMAUTA_E2_30',2);
 d.blockedItems.find((x:any)=>x.blockId==='shimauta-v23-mode-counter-scope').referenceConditionalDistribution.runtimeSettingLikelihood='ENABLED';
 assert.throws(()=>validateResearchCandidateLedger(d,new Set(d.sources.map((x:any)=>x.sourceId))),/INVALID_REFERENCE_LIKELIHOOD/);
});
