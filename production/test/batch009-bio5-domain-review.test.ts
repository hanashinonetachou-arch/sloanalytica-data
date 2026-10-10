// Historical v48 input fixture. Current production routes are tested in batch009-process-resumption.test.ts.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {auditBatch009Staging} from '../src/batch009-staging-integrity.ts';
const root=path.resolve('batches','batch-20261008-009');
const read=(...parts:string[])=>JSON.parse(fs.readFileSync(path.join(root,...parts),'utf8'));
const machine='L_BIOHAZARD5_ZE';
test('Bio5 stages preserve source claims, numeric infection finding and four reviewed evidence groups',()=>{
 const original=read('research-history/v48/research-working','wave-1',machine+'.json');
 const review=read('research-history/v48/research-evidence-reviewed',machine+'.json');
 const staged=read('research-history/v48/research-evidence-staged','wave-1',machine+'.json');
 assert.deepEqual(auditBatch009Staging(original,review,staged),[]);
 assert.equal(staged.findings.filter((f:any)=>f.observationType==='evidence').length,4);
 assert.equal(staged.researchCompleteness.status,'INCOMPLETE');
 const inf=staged.findings.find((f:any)=>f.findingId==='infection-midline-first-seven');
 assert.equal(inf.settingDistribution['4'],0.198);
 assert.equal(inf.liveObservation.status,'UNRESOLVED');
});
test('Bio5 shared rare roles and three ceilings are excluded; setting1-only mode split is not inferred for other settings',()=>{
 const staged=read('research-history/v48/research-evidence-staged','wave-1',machine+'.json');
 const check=new Map(staged.researchCompleteness.domains.map((d:any)=>[d.domain,d]));
 for(const name of ['SMALL_ROLE','THRESHOLD_BEHAVIOR','RESET_BEHAVIOR'])
  assert.equal(check.get(name)?.status,'CHECKED',name);
 for(const name of ['MODE_TRANSITION','POST_EVENT_TRANSITION'])
  assert.equal(check.get(name)?.status,'PARTIAL',name);
 assert.equal(check.get('EVIDENCE')?.status,'CHECKED');
 const sources=new Map(staged.sources.map((s:any)=>[s.sourceId,s]));
 for(const id of ['bio5-small-role-shared','bio5-ceiling-999-666-99','bio5-mode-stage-not-setting','bio5-mode-initial-setting1-only']){
  const b=staged.blockedItems.find((x:any)=>x.blockId===id);
  assert.ok(b?.reason&&b.reevaluationCondition,id);
  for(const sid of b.sourceIds)assert.ok(sources.has(sid),id+':'+sid);
  assert.ok(staged.researchCompleteness.candidateLedger.some((l:any)=>l.disposition?.type==='BLOCKED'&&l.disposition?.refId===id),id+':ledger');
 }
 assert.match(staged.blockedItems.find((x:any)=>x.blockId==='bio5-mode-initial-setting1-only').reason,/設定1/);
 assert.match(staged.blockedItems.find((x:any)=>x.blockId==='bio5-mode-initial-setting1-only').reason,/設定2～6/);
 assert.equal(staged.settings.values.includes('SET_L'),false);
});
