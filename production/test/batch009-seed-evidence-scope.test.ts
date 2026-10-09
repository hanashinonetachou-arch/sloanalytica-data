import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {auditBatch009Staging} from '../src/batch009-staging-integrity.ts';
const root='batches/batch-20261008-009/',id='L_GUNDAM_SEED_G',read=(p:string)=>JSON.parse(fs.readFileSync(root+p,'utf8'));
test('Seed ending evidence has its own reviewed source and cannot inherit CZ/ST sources or observation scope',()=>{
 const r=read(`research-evidence-reviewed/${id}.json`),w=read(`research-working/wave-1/${id}.json`),s=read(`research-evidence-staged/wave-1/${id}.json`);
 assert.deepEqual(auditBatch009Staging(w,r,s),[]);
 const cz=s.findings.find((x:any)=>x.findingId==='reviewed-cz-st-end'),end=s.findings.find((x:any)=>x.findingId==='reviewed-ending-end');
 assert.equal(cz.semanticCategories.length,14);assert.equal(end.semanticCategories.length,2);
 assert.ok(cz.semanticCategories.some((x:any)=>x.label==='枠色なし・ストライクガンダム（ST）'));
 assert.equal(end.semanticCategories.find((x:any)=>x.label.startsWith('金枠')).semanticType,'EXACT_CONSTRAINT');
 assert.equal(end.settingDistribution,undefined);
 const badSource=structuredClone(s);badSource.findings.find((x:any)=>x.findingId==='reviewed-ending-end').sourceIds=[...cz.sourceIds];
 assert.ok(auditBatch009Staging(w,r,badSource).includes('STAGE_EVIDENCE_SCOPED_SOURCE_DRIFT:reviewed-ending-end'));
 const condition=r.evidenceCandidates.find((x:any)=>x.findingId==='ending-end').observationCondition;
 end.details=end.details.filter((x:string)=>x!==condition);
 assert.ok(auditBatch009Staging(w,r,s).includes('STAGE_EVIDENCE_OBSERVATION_CONDITION_DRIFT:reviewed-ending-end'));
});
