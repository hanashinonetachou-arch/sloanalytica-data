import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {buildEvaluation} from '../src/evaluation-builder.ts';import {buildEligibility} from '../src/eligibility-builder.ts';
test('Warau CZ prelude stocks and 119 mode cannot be promoted by relabeling visible outputs as exact draws',()=>{
 const d=JSON.parse(fs.readFileSync('batches/batch-20261008-009/research-evidence-staged/wave-2/S_WARAU4_KH.json','utf8'));
 for(const f of d.findings)if(['bonus-initial','cz'].includes(f.findingId))f.liveObservation.status='DIRECT_EXACT';
 const out=buildEligibility(buildEvaluation(d));
 for(const id of ['bonus-initial','cz']){const row=out.decisions.find((x:any)=>x.findingId===id);assert.equal(row.eligibility,'UNRESOLVED');assert.equal(row.liveInferenceRoute,'NONE');}
 assert.equal(d.findings.find((x:any)=>x.findingId==='bonus-total').observationType,'reference_distribution');
});
