// Historical v48 input fixture. Current production routes are tested in batch009-process-resumption.test.ts.
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {buildEvaluation} from '../src/evaluation-builder.ts';import {buildEligibility} from '../src/eligibility-builder.ts';
test('Sister four AT monsters remain blocked when visible counts are relabeled exact',()=>{
 const d=JSON.parse(fs.readFileSync('batches/batch-20261008-009/research-history/v48/research-evidence-staged/wave-1/L_SISTER_QUEST_CA.json','utf8'));
 const f=d.findings.find((x:any)=>x.findingId==='at-monster-categorical');f.liveObservation.status='DIRECT_EXACT';
 const row=buildEligibility(buildEvaluation(d)).decisions.find((x:any)=>x.findingId===f.findingId);
 assert.equal(row.eligibility,'UNRESOLVED');assert.equal(row.liveInferenceRoute,'NONE');
 assert.deepEqual(f.dependencyScopeAudit.excludedContexts,['NORMAL_GAME_ITEM_FORCED_MONSTER','DOKIDOGIDORA','NON_TARGET_MONSTER']);
 assert.ok(d.findings.find((x:any)=>x.findingId==='at-initial').dependencyScopeAudit.notDerivable.some((s:string)=>s.includes('全復帰を一律除外しない')));
});
