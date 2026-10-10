// Historical v48 input fixture. Current production routes are tested in batch009-process-resumption.test.ts.
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {validateResearchCandidateLedger} from '../src/research-validator.ts';
test('Sister completed role research retains a state-conditioned reference without setting likelihood',()=>{
 const d=JSON.parse(fs.readFileSync('batches/batch-20261008-009/research-history/v48/research-working/wave-1/L_SISTER_QUEST_CA.json','utf8'));
 validateResearchCandidateLedger(d,new Set(d.sources.map((x:any)=>x.sourceId)));
 const b=d.blockedItems.find((x:any)=>x.blockId==='sister-role-conditional-unusable-for-setting');
 assert.equal(d.researchCompleteness.domains.find((x:any)=>x.domain==='ROLE_CONDITIONAL_DISTRIBUTION').status,'CHECKED');
 assert.equal(b.referenceConditionalDistribution.runtimeSettingLikelihood,'DISABLED');
 assert.deepEqual(b.referenceConditionalDistribution.percentByStateAndRole['超高確']['強レア役'],[0,18.36,79.69,1.56,.39]);
 assert.match(b.observationScopeAudit.reason,/告知ゲームの成立役/);
 assert.ok(!d.findings.some((x:any)=>x.findingId===b.blockId));
});
