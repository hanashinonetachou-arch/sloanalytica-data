// Historical v48 input fixture. Current production routes are tested in batch009-process-resumption.test.ts.
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {auditBatch009Staging} from '../src/batch009-staging-integrity.ts';
test('RE2 figure timing uncertainty does not create likelihoods or enlarge reviewed source scope',()=>{
 const b='batches/batch-20261008-009/',read=(p:string)=>JSON.parse(fs.readFileSync(b+p,'utf8'));
 const w=read('research-history/v48/research-working/wave-2/S_BIOHAZARD_RE2_XB.json'),s=read('research-history/v48/research-evidence-staged/wave-2/S_BIOHAZARD_RE2_XB.json'),r=read('research-history/v48/research-evidence-reviewed/S_BIOHAZARD_RE2_XB.json');
 assert.deepEqual(auditBatch009Staging(w,r,s),[]);
 const f=s.findings.find((x:any)=>x.findingId==='reviewed-figurines');assert.equal(f.settingDistribution,undefined);assert.equal(f.semanticCategories.length,24);
 assert.ok(!f.sourceIds.includes('re2-v33-figurine-timing-nana'));
 const x=w.blockedItems.find((x:any)=>x.blockId==='re2-v33-figurine-timing-conflict');
 assert.equal(x.observationScopeAudit.runtimeSettingLikelihood,'DISABLED');assert.deepEqual(x.observationScopeAudit.excludedContexts,['AT_END_SCREEN','ENDING_END_SCREEN','COLLECTION_REVIEW']);
 assert.match(x.reason,/100%として補完しません/);
});
