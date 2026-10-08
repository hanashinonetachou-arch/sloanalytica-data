import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {auditBatch009Staging} from '../src/batch009-staging-integrity.ts';

const root=path.resolve('batches','batch-20261008-009');
const read=(...parts:string[])=>JSON.parse(fs.readFileSync(path.join(root,...parts),'utf8'));
const names=read('batch.json').waves.flatMap((w:any)=>w.machineIds) as string[];
function readTriplet(id:string,i:number){
 const wave=i<5?'wave-1':'wave-2';
 return {
  original:read('research-working',wave,id+'.json'),
  reviewed:read('research-evidence-reviewed',id+'.json'),
  staged:read('research-evidence-staged',wave,id+'.json')
 };
}
test('all ten current staged machine drafts preserve source/ledger and every reviewed evidence category',()=>{
 assert.equal(names.length,10);
 for(const [index,id] of names.entries()){
  const {original,reviewed,staged}=readTriplet(id,index);
  assert.deepEqual(auditBatch009Staging(original,reviewed,staged),[],id);
 }
});
test('rebuilding a machine must not lose a working candidate or change a published-rate evidence category',()=>{
 const {original,reviewed,staged}=readTriplet('L_SISTER_QUEST_CA',4);
 const draft=structuredClone(staged);
 draft.findings=draft.findings.filter((x:any)=>x.findingId!=='at-end-categorical');
 assert.ok(auditBatch009Staging(original,reviewed,draft).some(x=>x.startsWith('STAGE_WORKING_FINDING_DRIFT:at-end-categorical')));
 const categoryDrift=structuredClone(staged);
 categoryDrift.findings.find((x:any)=>x.findingId==='reviewed-at-end').semanticCategories[0].label='誤表示';
 assert.ok(auditBatch009Staging(original,reviewed,categoryDrift).some(x=>x.startsWith('STAGE_EVIDENCE_CATEGORY_DRIFT:reviewed-at-end')));
 const sourceDrift=structuredClone(staged);
 sourceDrift.findings.find((x:any)=>x.findingId==='reviewed-smart-talk').sourceIds=['evidence-source-1'];
 assert.ok(auditBatch009Staging(original,reviewed,sourceDrift).some(x=>x.startsWith('STAGE_EVIDENCE_SCOPED_SOURCE_DRIFT:reviewed-smart-talk')));
});
test('Wave2 review metadata and remaining evidence open checks cannot be silently dropped',()=>{
 const {original,reviewed,staged}=readTriplet('L_KAMEN_RIDER_DEN_O_UD',5);
 const drift=structuredClone(staged);
 drift.researchCompleteness.evidenceSourceReview.candidateCount=0;
 assert.ok(auditBatch009Staging(original,reviewed,drift).includes('STAGE_REVIEW_STATUS_DRIFT'));
});
