import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {auditBatch009Staging} from '../src/batch009-staging-integrity.ts';
import {buildEvaluation} from '../src/evaluation-builder.ts';
import {buildEligibility} from '../src/eligibility-builder.ts';
const root='batches/batch-20261008-009/',id='L_MIDORIDON_VIVA_REVIVAL_FY';
const read=(p:string)=>JSON.parse(fs.readFileSync(root+p,'utf8'));
test('Green trick review preserves concrete categories and exact constraints without invented appearance rates',()=>{
 const r=read(`research-evidence-reviewed/${id}.json`),w=read(`research-working/wave-1/${id}.json`),s=read(`research-evidence-staged/wave-1/${id}.json`);
 assert.deepEqual(auditBatch009Staging(w,r,s),[]);
 const f=r.evidenceCandidates.find((x:any)=>x.findingId==='ending-trick');
 assert.equal(f.semanticCategories.length,18);
 const cat=(label:string)=>f.semanticCategories.find((x:any)=>x.label===label);
 assert.deepEqual(cat('グウカワ'),{label:'グウカワ',meaning:'設定2以上',semanticType:'EXACT_CONSTRAINT'});
 assert.equal(cat('ハヅキ').meaning,'高設定示唆（強）');
 assert.equal(cat('ジッシャ').meaning,'設定6');
 assert.ok(f.semanticCategories.every((x:any)=>!x.label.includes('等')&&!x.label.includes('・')));
 assert.equal(s.findings.find((x:any)=>x.findingId==='reviewed-ending-trick').settingDistribution,undefined);
 s.findings.find((x:any)=>x.findingId==='reviewed-ending-trick').semanticCategories.find((x:any)=>x.label==='グウカワ').semanticType='PROBABILITY_UNKNOWN';
 assert.ok(auditBatch009Staging(w,r,s).includes('STAGE_EVIDENCE_CATEGORY_DRIFT:reviewed-ending-trick'));
});
test('Green bonus and AT marginals cannot become independent likelihoods by changing observation labels',()=>{
 const d=read(`research-evidence-staged/wave-1/${id}.json`);
 for(const f of d.findings)if(['bonus-initial','at-initial'].includes(f.findingId))f.liveObservation.status='DIRECT_EXACT';
 const out=buildEligibility(buildEvaluation(d));
 for(const id of ['bonus-initial','at-initial']){
  const row=out.decisions.find((x:any)=>x.findingId===id);
  assert.equal(row.eligibility,'UNRESOLVED');assert.equal(row.liveInferenceRoute,'NONE');
 }
});
