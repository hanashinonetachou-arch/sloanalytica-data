import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {validateResearchCandidateLedger} from '../src/research-validator.ts';
import {auditBatch009Staging} from '../src/batch009-staging-integrity.ts';
const root=path.resolve('batches','batch-20261008-009');
const read=(folder:string,id:string)=>JSON.parse(fs.readFileSync(path.join(root,folder,id+'.json'),'utf8'));

test('笑ゥせぇるすまん4 keeps CZ entry setting difference as source-checked reference only',()=>{
 for(const folder of ['research-working/wave-2','research-evidence-staged/wave-2']){
  const d=read(folder,'S_WARAU4_KH');
  validateResearchCandidateLedger(d,new Set(d.sources.map((s:any)=>s.sourceId)));
  for(const domain of ['BONUS','AT','STATE_TRANSITION','ROLE_CONDITIONAL_DISTRIBUTION','SUCCESS_RATE']){
   const x=d.researchCompleteness.domains.find((y:any)=>y.domain===domain);
   assert.equal(x?.status,'CHECKED',domain);
  }
  const reference=d.researchCompleteness.domains.find((x:any)=>x.domain==='ROLE_CONDITIONAL_DISTRIBUTION').referenceSettingRates;
  assert.deepEqual(reference.settings,['1','2','4','5','6']);
  assert.deepEqual(reference.percentRows,[2.3,3.1,4.7,5.5,6.3]);
  assert.equal(reference.status,'REFERENCE_ONLY_NOT_RUNTIME');
  assert.equal(d.researchCompleteness.status,'INCOMPLETE');
  assert.ok(!d.findings.some((x:any)=>x.findingId==='warau4-cz-entry-role-numeric'));
 }
});
test('Warau4 does not conflate pooled CZ success with setting-specific CZ entry rates',()=>{
 const d=read('research-evidence-staged/wave-2','S_WARAU4_KH');
 for(const slug of ['bonus','at','high-state','cz-entry-role','cz-expectation']){
  const id='warau4-'+slug+'-nonindependent';
  const block=d.blockedItems.find((x:any)=>x.blockId===id);
  assert.ok(block?.reason&&block.sourceIds.length===2,id);
  assert.ok(d.researchCompleteness.candidateLedger.some((x:any)=>x.disposition?.refId===id),id);
 }
});
test('Warau4 source-vs-evidence staging remains non-destructive',()=>{
 const work=read('research-working/wave-2','S_WARAU4_KH');
 const staged=read('research-evidence-staged/wave-2','S_WARAU4_KH');
 const reviewed=read('research-evidence-reviewed','S_WARAU4_KH');
 assert.deepEqual(auditBatch009Staging(work,reviewed,staged),[]);
});
