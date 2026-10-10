import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {validateResearchCandidateLedger} from '../src/research-validator.ts';
const root='batches/batch-20261008-009/';
for(const [id,wave,blockId] of [['L_BIOHAZARD5_ZE',1,'bio5-v19-mode-promotion-not-setting'],['L_SISTER_QUEST_CA',1,'sister-mode-unusable-for-setting'],['S_WARAU4_KH',2,'warau4-293-cz-conditional-mode']])test(`${id} mode scope remains reference only`,()=>{
 const d=JSON.parse(fs.readFileSync(`${root}research-working/wave-${wave}/${id}.json`,'utf8'));const s=JSON.parse(fs.readFileSync(`${root}research-evidence-staged/wave-${wave}/${id}.json`,'utf8'));
 validateResearchCandidateLedger(d,new Set(d.sources.map((x:any)=>x.sourceId)));
 const b=d.blockedItems.find((x:any)=>x.blockId===blockId),r=b.referenceConditionalDistribution;
 assert.equal(r.runtimeSettingLikelihood,'DISABLED');assert.equal(b.observationScopeAudit.status,'UNRESOLVED_OBSERVATION_SCOPE');for(const src of d.sources.filter((x:any)=>x.sourceId.includes("v36")))assert.deepEqual(s.sources.find((x:any)=>x.sourceId===src.sourceId),src);assert.deepEqual(s.blockedItems,d.blockedItems);
 const mode=d.researchCompleteness.domains.find((x:any)=>x.domain==='MODE_TRANSITION');
 if(id==='L_BIOHAZARD5_ZE')assert.equal(mode.status,'PARTIAL');
 else {assert.equal(mode.status,'CHECKED');assert.equal(mode.publicSearchClosure.runtimeUse,'DISABLED');assert.equal(mode.publicSearchClosure.reopenPolicy,'NEW_CONCRETE_SOURCE_ONLY');}
 if(id==='L_BIOHAZARD5_ZE'){assert.equal(r.promotionEligibleEvent,'ESTABLISHED_ROLE_WITHOUT_CZ_OR_AT_WIN');assert.deepEqual(r.initialPercentSetting1,{LOW:32.8,MID:32.8,HI:32.8,SP:1.6});}
 if(id==='L_SISTER_QUEST_CA'){assert.equal(r.roundingPolicy,'PRESERVE_PUBLISHED_NO_RENORMALIZATION');assert.equal(r.upperATEndNextCZ,'AT_HIGH_CONFIDENCE');assert.equal(r.afterATOrUpperATEnd.ATEXPAtEndAtMost100MaxEXPPlusPrelude,700);}
 if(id==='S_WARAU4_KH'){assert.equal(r.usualModeCZAt293GPercent.B,33.59);assert.equal(r.mode119ThirdBonusEnd,'CONTINUATION_DRAW_NOT_FORCED_EXIT');assert.equal(r.mode119ContinuationRate,'UNPUBLISHED');}
});
