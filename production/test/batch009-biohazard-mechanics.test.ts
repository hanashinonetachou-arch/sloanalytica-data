import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {auditBatch009Staging} from '../src/batch009-staging-integrity.ts';
import {validateResearchCandidateLedger} from '../src/research-validator.ts';

const root=path.resolve('batches','batch-20261008-009');
const read=(...parts:string[])=>JSON.parse(fs.readFileSync(path.join(root,...parts),'utf8'));
const check=(wave:string,id:string,checked:string[],referenceBlockedIds:string[])=>{
 for(const folder of ['research-working','research-evidence-staged']){
  const d=read(folder,wave,id+'.json');
  validateResearchCandidateLedger(d,new Set(d.sources.map((s:any)=>s.sourceId)));
  for(const domain of checked){
   const x=d.researchCompleteness.domains.find((v:any)=>v.domain===domain);
   assert.ok(x?.status==='CHECKED'||x?.status==='NOT_APPLICABLE',id+':'+domain);
  }
  for(const blockId of referenceBlockedIds){
   const block=d.blockedItems.find((x:any)=>x.blockId===blockId);
   assert.ok(block?.reason?.length>12,id+':'+blockId);
   assert.ok(d.researchCompleteness.candidateLedger.some((x:any)=>x.disposition?.refId===blockId));
  }
  assert.equal(d.researchCompleteness.status,'INCOMPLETE');
 }
 const original=read('research-working',wave,id+'.json');
 const staged=read('research-evidence-staged',wave,id+'.json');
 const reviewed=read('research-evidence-reviewed',id+'.json');
 assert.deepEqual(auditBatch009Staging(original,reviewed,staged),[]);
};
test('Bio5 mode stage, CZ success and non-setting role draws cannot become separate setting values',()=>{
 check('wave-1','L_BIOHAZARD5_ZE',['NAVIGATION','SUCCESS_RATE','ROLE_CONDITIONAL_DISTRIBUTION','BONUS'],[
  'bio5-v19-stage-cues-not-setting','bio5-v19-cz-success-not-setting',
  'bio5-v19-mode-promotion-not-setting','bio5-v19-no-bonus-not-setting']);
 const d=read('research-evidence-staged','wave-1','L_BIOHAZARD5_ZE.json');
 assert.equal(d.researchCompleteness.domains.find((x:any)=>x.domain==='BONUS').status,'NOT_APPLICABLE');
 const reference=d.researchCompleteness.domains.find((x:any)=>x.domain==='ROLE_CONDITIONAL_DISTRIBUTION').conditionalReference;
 assert.equal(reference.status,'NON_SETTING_STRATIFIED_REFERENCE_ONLY');
 assert.equal(reference.settingLikelihoodAllowed,false);
 assert.deepEqual(reference.percent,[0.4,25,66.8,100]);
});
test('RE2 AT bonus and latent AT mode rates remain blocked from independent setting likelihoods',()=>{
 check('wave-2','S_BIOHAZARD_RE2_XB',['BONUS','SUCCESS_RATE','STATE_TRANSITION','MODE_TRANSITION'],[
  're2-v19-bonus-conditional-not-setting','re2-v19-g-battle-success-not-setting',
  're2-v19-at-state-not-setting','re2-v19-at-mode-transition-not-setting']);
 const d=read('research-evidence-staged','wave-2','S_BIOHAZARD_RE2_XB.json');
 assert.equal(d.findings.some((x:any)=>x.findingId==='re2-g-battle-total-success'),false);
 assert.ok(d.findings.some((x:any)=>x.findingId==='reviewed-figurines'));
 assert.ok(d.findings.every((x:any)=>!x.settingDistribution||x.liveObservation?.status==='UNRESOLVED'||x.observationType==='evidence'));
});
