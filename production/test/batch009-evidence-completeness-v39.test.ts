import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {auditBatch009Staging} from '../src/batch009-staging-integrity.ts';
const root='batches/batch-20261008-009/';const read=(p:string)=>JSON.parse(fs.readFileSync(root+p,'utf8'));
test('DenO new mini-character scope preserves original evidence and has no fabricated numeric route',()=>{
 const id='L_KAMEN_RIDER_DEN_O_UD',w=read(`research-working/wave-2/${id}.json`),s=read(`research-evidence-staged/wave-2/${id}.json`),r=read(`research-evidence-reviewed/${id}.json`);
 assert.deepEqual(auditBatch009Staging(w,r,s),[]);const f=s.findings.find((x:any)=>x.findingId==='reviewed-mini-character');assert.equal(f.semanticCategories.length,5);assert.equal(f.semanticCategories.filter((c:any)=>c.semanticType==='EXACT_CONSTRAINT').length,2);assert.equal(f.settingDistribution,undefined);
 assert.equal(f.sourceIds.length,1);assert.match(f.details[0],/押し忘れ/);assert.match(f.details[0],/通常時.*AT中/);assert.equal(r.evidenceCandidates.length,6);
});
test('SEED purple reset screen uses inspected character identity and matching reviewed source scope',()=>{
 const id='L_GUNDAM_SEED_G',w=read(`research-working/wave-1/${id}.json`),s=read(`research-evidence-staged/wave-1/${id}.json`),r=read(`research-evidence-reviewed/${id}.json`);
 assert.deepEqual(auditBatch009Staging(w,r,s),[]);
 assert.equal(w.researchCompleteness.domains.find((x:any)=>x.domain==='EVIDENCE').status,'CHECKED');
 const f=s.findings.find((x:any)=>x.findingId==='reviewed-cz-st-end');
 const reset=f.semanticCategories.find((x:any)=>x.label==='紫枠・アスラン＆カガリ');
 assert.equal(reset.semanticType,'DISPLAY_ONLY');
 assert.equal(f.semanticCategories.length,14);
 assert.equal(f.settingDistribution,undefined);
 assert.match(f.details.join(' '),/画像alt.*誤対応/);
 const audit=read('validation/seed-evidence-image-audit-v39-20261009.json');
 assert.equal(audit.result,'PURPLE_RESET_ALT_MISMATCH_RESOLVED');
 assert.equal(audit.images.filter((x:any)=>x.inspection==='SOURCE_PLACEHOLDER_NOT_ACTUAL_SCREEN').length,2);
 assert.match(audit.textOnlyCategory,/実画像を確認したとは扱わない/);
});
test('completed Bio5 and Warau evidence research leaves numerical trials and promotion unresolved',()=>{
 for(const [id,wave,count] of [['L_BIOHAZARD5_ZE',1,4],['S_WARAU4_KH',2,4]]){
 const w=read(`research-working/wave-${wave}/${id}.json`),s=read(`research-evidence-staged/wave-${wave}/${id}.json`),r=read(`research-evidence-reviewed/${id}.json`);assert.deepEqual(auditBatch009Staging(w,r,s),[]);
 assert.equal(w.researchCompleteness.domains.find((x:any)=>x.domain==='EVIDENCE').status,'CHECKED');assert.equal(s.findings.filter((x:any)=>x.observationType==='evidence').length,count);
 assert.equal(s.researchCompleteness.status,'INCOMPLETE');assert.ok(w.findings.some((x:any)=>x.liveObservation?.status==='UNRESOLVED'));
 }
});
