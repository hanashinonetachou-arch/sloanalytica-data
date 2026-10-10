// Historical v48 input fixture. Current production routes are tested in batch009-process-resumption.test.ts.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {auditBatch009Staging} from '../src/batch009-staging-integrity.ts';
const root='batches/batch-20261008-009/';
const read=(p:string)=>JSON.parse(fs.readFileSync(root+p,'utf8'));
test('Shimauta mode lamps cannot become stronger mode or setting constraints',()=>{
 const id='S_BIG_SHIMAUTA_E2_30';
 const w=read(`research-history/v48/research-working/wave-2/${id}.json`),s=read(`research-history/v48/research-evidence-staged/wave-2/${id}.json`),r=read(`research-history/v48/research-evidence-reviewed/${id}.json`);
 assert.deepEqual(auditBatch009Staging(w,r,s),[]);
 assert.equal(r.evidenceCandidates.length,0);
 assert.equal(r.noSettingEvidenceAttestation,undefined);
 assert.match(r.notSettingEvidence.find((x:any)=>x.label==='音符ランプ（虹）').reason,/ドンドンモード以上の示唆/);
 assert.match(r.notSettingEvidence.find((x:any)=>x.label==='告知時の下パネル消灯').reason,/設定Lの常時消灯と区別/);
 for(const d of [w,s]){
  assert.deepEqual(d.settings.values,['SET_1','SET_2','SET_3','SET_5','SET_6']);
  const domain=d.researchCompleteness.domains.find((x:any)=>x.domain==='EVIDENCE');
  assert.equal(domain.status,'CHECKED');assert.equal(domain.publicSearchClosure.disposition,'PUBLIC_INFORMATION_NOT_FOUND_EXCLUDED');assert.equal(domain.publicSearchClosure.runtimeUse,'DISABLED');
  assert.match(d.blockedItems.find((x:any)=>x.blockId==='mode-lamps-not-setting').reason,/設定番号の確定制約として使いません/);
  assert.equal(d.findings.find((x:any)=>x.findingId==='big-initial').liveObservation.status,'UNRESOLVED');
 }
});
