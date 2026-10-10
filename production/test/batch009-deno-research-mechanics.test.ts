// Historical v48 input fixture. Current production routes are tested in batch009-process-resumption.test.ts.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {auditBatch009Staging} from '../src/batch009-staging-integrity.ts';
import {validateResearchCandidateLedger} from '../src/research-validator.ts';

const root=path.resolve('batches','batch-20261008-009');
const read=(file:string)=>JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));

test('仮面ライダー電王 separates after-AT restoration from ordinary initial hit',()=>{
 for(const folder of ['research-history/v48/research-working','research-history/v48/research-evidence-staged']){
  const d=read(folder+'/wave-2/L_KAMEN_RIDER_DEN_O_UD.json');
  const map=new Map(d.researchCompleteness.domains.map((x:any)=>[x.domain,x]));
  for(const domain of ['THRESHOLD_BEHAVIOR','RESET_BEHAVIOR','NAVIGATION','POST_EVENT_TRANSITION','AT','SUCCESS_RATE','CARRY_OVER'])
    assert.equal(map.get(domain)?.status,'CHECKED',folder+':'+domain);
  for(const slug of ['navigation','at-aftercare','at-mechanics','cz-success','counter-carry']){
   const id='deno-'+slug+'-not-setting-rate';
   const block=d.blockedItems.find((x:any)=>x.blockId===id);
   const trace=d.researchCompleteness.candidateLedger.find((x:any)=>x.disposition?.refId===id);
   assert.ok(block?.reason&&block?.sourceIds.length===2,id);
   assert.equal(trace?.disposition.type,'BLOCKED',id);
   assert.equal(trace.sourceClaims.length,2,id);
  }
  assert.deepEqual(d.settings.values,['SET_1','SET_2','SET_4','SET_5','SET_6']);
  validateResearchCandidateLedger(d,new Set(d.sources.map((x:any)=>x.sourceId)));
  assert.equal(d.researchCompleteness.status,'INCOMPLETE');
 }
});

test('Den-O review categories cannot drift while mechanics are extended',()=>{
 const working=read('research-history/v48/research-working/wave-2/L_KAMEN_RIDER_DEN_O_UD.json');
 const reviewed=read('research-history/v48/research-evidence-reviewed/L_KAMEN_RIDER_DEN_O_UD.json');
 const staged=read('research-history/v48/research-evidence-staged/wave-2/L_KAMEN_RIDER_DEN_O_UD.json');
 assert.deepEqual(auditBatch009Staging(working,reviewed,staged),[]);
});

test('Den-O published success percentages are not setting-likelihood candidates',()=>{
 const d=read('research-history/v48/research-evidence-staged/wave-2/L_KAMEN_RIDER_DEN_O_UD.json');
 assert.ok(d.blockedItems.some((x:any)=>x.blockId==='deno-cz-success-not-setting-rate'));
 assert.ok(d.blockedItems.some((x:any)=>x.blockId==='deno-at-aftercare-not-setting-rate'));
 assert.ok(!d.findings.some((x:any)=>['deno-cz-success','deno-at-aftercare'].includes(x.findingId)));
 for(const key of ['bonus-initial','at-initial','upper-at','possession-100-cz']){
  const f=d.findings.find((x:any)=>x.findingId===key);
  assert.equal(f?.liveObservation?.status,'UNRESOLVED',key);
 }
});
