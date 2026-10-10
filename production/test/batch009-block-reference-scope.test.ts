// Historical v48 input fixture. Current production routes are tested in batch009-process-resumption.test.ts.
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {validateResearchCandidateLedger} from '../src/research-validator.ts';
const read=()=>JSON.parse(fs.readFileSync('batches/batch-20261008-009/research-history/v48/research-working/wave-1/L_MIDORIDON_VIVA_REVIVAL_FY.json','utf8'));
test('reference provenance cannot use unregistered or out-of-scope sources',()=>{
 for(const key of ['observationScopeAudit','referenceConditionalDistribution'])for(const source of ['missing','green-v27-setting-audit']){
  const d=read();const block=d.blockedItems.find((x:any)=>x.blockId==='high-state-transition-observation');block[key].sourceIds=[source];
  assert.throws(()=>validateResearchCandidateLedger(d,new Set(d.sources.map((x:any)=>x.sourceId))),/BLOCK_REFERENCE_PROVENANCE/);
 }
});
test('Green high-state reference keeps normal-state role trials separate from ending transitions',()=>{
 const d=read();validateResearchCandidateLedger(d,new Set(d.sources.map((x:any)=>x.sourceId)));
 const b=d.blockedItems.find((x:any)=>x.blockId==='high-state-transition-observation');
 assert.equal(b.referenceConditionalDistribution.trialUnit,'ELIGIBLE_ROLE_WHILE_INTERNAL_NORMAL');
 assert.equal(b.referenceConditionalDistribution.runtimeSettingLikelihood,'DISABLED');
 assert.ok(b.observationScopeAudit.excludedContexts.includes('ALREADY_HIGH_STATE'));
 assert.ok(b.observationScopeAudit.excludedContexts.includes('REG_END'));
});
