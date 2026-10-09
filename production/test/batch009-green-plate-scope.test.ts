import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {auditBatch009Staging} from '../src/batch009-staging-integrity.ts';
const root='batches/batch-20261008-009/',id='L_MIDORIDON_VIVA_REVIVAL_FY';
const read=(p:string)=>JSON.parse(fs.readFileSync(root+p+'/'+id+'.json','utf8'));

test('Green plate categories retain exact constraints without appearance likelihood or nonappearance inference',()=>{
 const w=read('research-working/wave-1'),r=read('research-evidence-reviewed'),s=read('research-evidence-staged/wave-1');
 const ev=r.evidenceCandidates.find((x:any)=>x.findingId==='univer-plate');
 assert.deepEqual(ev.semanticCategories.map((x:any)=>[x.label,x.meaning]),
  [['銅','設定2以上'],['銀','設定3以上'],['金','設定4以上'],['花火柄','設定5以上'],['虹','設定6']]);
 assert.ok(ev.semanticCategories.every((x:any)=>x.semanticType==='EXACT_CONSTRAINT'));
 const f=s.findings.find((x:any)=>x.findingId==='reviewed-univer-plate');
 assert.equal(f.settingDistribution,undefined);
 assert.match(ev.observationCondition,/XRチャレンジ終了時/);
 assert.match(ev.observationCondition,/同じ表示につき1回/);
 assert.match(ev.reviewNote,/非出現を設定否定へ使わず/);
 assert.match(ev.reviewNote,/実戦上の示唆/);
 assert.deepEqual(auditBatch009Staging(w,r,s),[]);
 assert.equal(w.researchCompleteness.domains.find((x:any)=>x.domain==='EVIDENCE').status,'PARTIAL');
});

test('Adding a plate source to unrelated existing groups violates scoped provenance',()=>{
 const w=read('research-working/wave-1'),r=read('research-evidence-reviewed'),s=read('research-evidence-staged/wave-1');
 for(const ev of r.evidenceCandidates)assert.ok(ev.sourceUrls?.length);
 const f=s.findings.find((x:any)=>x.findingId==='reviewed-bonus-end');
 assert.ok(!f.sourceIds.includes('green-v44-dmm-body'));
 f.sourceIds.push('green-v44-dmm-body');
 assert.ok(auditBatch009Staging(w,r,s).includes('STAGE_EVIDENCE_SCOPED_SOURCE_DRIFT:reviewed-bonus-end'));
});
