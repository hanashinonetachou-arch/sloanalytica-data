import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {auditBatch009Staging} from '../src/batch009-staging-integrity.ts';
import {validateResearchCandidateLedger} from '../src/research-validator.ts';

const root=path.resolve('batches','batch-20261008-009');
const read=(...s:string[])=>JSON.parse(fs.readFileSync(path.join(root,...s),'utf8'));
test('緑ドンREVIVAL bonus, AT, CZ and aftercare mechanics are checked, not independent setting rates',()=>{
 for(const folder of ['research-working','research-evidence-staged']){
  const d=read(folder,'wave-1','L_MIDORIDON_VIVA_REVIVAL_FY.json');
  const domains=d.researchCompleteness.domains;
  for(const domain of ['BONUS','BONUS_TYPE_CONDITIONAL','CZ','AT','POST_EVENT_TRANSITION','SUCCESS_RATE']){
   assert.equal(domains.find((x:any)=>x.domain===domain)?.status,'CHECKED',domain);
  }
  assert.equal(domains.find((x:any)=>x.domain==='INITIAL_HIT')?.status,'PARTIAL');
  for(const slug of ['pseudo-bonus','bonus-conditional','billy-cz','amazon-at','xr-aftercare','billy-success']){
   const id='green-v20-'+slug+'-not-independent';
   const block=d.blockedItems.find((x:any)=>x.blockId===id);
   const ledger=d.researchCompleteness.candidateLedger.find((x:any)=>x.disposition?.refId===id);
   assert.ok(block?.sourceIds.length===2&&block.reason.length>15,id);
   assert.equal(ledger?.disposition.type,'BLOCKED');
   assert.equal(ledger.sourceClaims.length,2);
  }
  validateResearchCandidateLedger(d,new Set(d.sources.map((x:any)=>x.sourceId)));
  const at=d.findings.find((x:any)=>x.findingId==='at-initial');
  assert.equal(at?.liveObservation?.status,'UNRESOLVED');
  assert.equal(d.researchCompleteness.status,'INCOMPLETE');
 }
});
test('Green Don Research and Evidence staging preserve all source claims and reviewed categories',()=>{
 const w=read('research-working','wave-1','L_MIDORIDON_VIVA_REVIVAL_FY.json');
 const review=read('research-evidence-reviewed','L_MIDORIDON_VIVA_REVIVAL_FY.json');
 const stage=read('research-evidence-staged','wave-1','L_MIDORIDON_VIVA_REVIVAL_FY.json');
 assert.deepEqual(auditBatch009Staging(w,review,stage),[]);
});
test('Conditional BIG/REG select rates and 4G comeback do not become standalone numeric findings',()=>{
 const d=read('research-evidence-staged','wave-1','L_MIDORIDON_VIVA_REVIVAL_FY.json');
 for(const id of ['green-v20-bonus-conditional-not-independent','green-v20-xr-aftercare-not-independent']){
  assert.ok(d.blockedItems.some((x:any)=>x.blockId===id));
  assert.ok(!d.findings.some((x:any)=>x.findingId===id));
 }
});
