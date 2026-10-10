// Historical v48 input fixture. Current production routes are tested in batch009-process-resumption.test.ts.
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {validateResearchCandidateLedger} from '../src/research-validator.ts';
test('SEED researched state tables stay reference-only and distinguish Lacus context',()=>{
 const d=JSON.parse(fs.readFileSync('batches/batch-20261008-009/research-history/v48/research-working/wave-1/L_GUNDAM_SEED_G.json','utf8'));
 validateResearchCandidateLedger(d,new Set(d.sources.map((x:any)=>x.sourceId)));
 const b=d.blockedItems.find((x:any)=>x.blockId==='gundam-cz-state-conditioned');const r=b.referenceConditionalDistribution;
 assert.deepEqual(r.percentOutsideLacus['弱スイカ'],[.4,10.5,40.1]);assert.deepEqual(r.percentInsideLacus['弱スイカ'],[39.8,100,100]);
 assert.equal(r.runtimeSettingLikelihood,'DISABLED');assert.match(b.observationScopeAudit.reason,/独立加点しない/);
 assert.equal(d.researchCompleteness.domains.find((x:any)=>x.domain==='INTERNAL_CONDITIONAL_DRAW').status,'CHECKED');
});
