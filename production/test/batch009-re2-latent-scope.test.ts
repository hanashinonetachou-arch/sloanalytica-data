import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildEvaluation} from '../src/evaluation-builder.ts';
import {buildEligibility} from '../src/eligibility-builder.ts';
test('RE2 displayed heartbeat and positive-only footsteps cannot bypass observation scope',()=>{
 const d=JSON.parse(fs.readFileSync('batches/batch-20261008-009/research-evidence-staged/wave-2/S_BIOHAZARD_RE2_XB.json','utf8'));
 const f=d.findings.find((x:any)=>x.findingId==='at-initial');
 f.liveObservation.status='DIRECT_EXACT';
 const row=buildEligibility(buildEvaluation(d)).decisions.find((x:any)=>x.findingId==='at-initial');
 assert.equal(row.eligibility,'UNRESOLVED');assert.equal(row.liveInferenceRoute,'NONE');
 const state=d.blockedItems.find((x:any)=>x.blockId==='internal-state');
 assert.equal(state.referenceConditionalDistribution.runtimeSettingLikelihood,'DISABLED');
 assert.match(state.observationScopeAudit.reason,/表示色別リプレイ回数/);
 const tyrant=d.blockedItems.find((x:any)=>x.blockId==='re2-tyrant-high-latent');
 assert.match(tyrant.observationScopeAudit.reason,/非移行と判定しない/);
});
