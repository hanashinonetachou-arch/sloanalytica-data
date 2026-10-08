import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {auditBatch009Staging} from '../src/batch009-staging-integrity.ts';
const root=path.resolve('batches','batch-20261008-009');
const read=(...s:string[])=>JSON.parse(fs.readFileSync(path.join(root,...s),'utf8'));
function stage(id:string){
  const a=read('research-working','wave-2',id+'.json');
  const b=read('research-evidence-reviewed',id+'.json');
  const c=read('research-evidence-staged','wave-2',id+'.json');
  assert.deepEqual(auditBatch009Staging(a,b,c),[],id+':staging drift');
  assert.equal(c.researchCompleteness.status,'INCOMPLETE');
  return c;
}
const domain=(d:any,key:string)=>d.researchCompleteness.domains.find((x:any)=>x.domain===key);
const block=(d:any,key:string)=>{
  const item=d.blockedItems.find((x:any)=>x.blockId===key);
  assert.ok(item?.reason&&item.reevaluationCondition,key+':no plain user-facing reason');
  assert.ok(d.researchCompleteness.candidateLedger.some((x:any)=>x.disposition?.type==='BLOCKED'&&x.disposition.refId===key),key+':untraced decision');
  return item;
};
test('RE2 common small roles, two ceilings, and reset behavior are sourced, not numerical clues',()=>{
 const d=stage('S_BIOHAZARD_RE2_XB');
 for(const name of ['SMALL_ROLE','THRESHOLD_BEHAVIOR','RESET_BEHAVIOR','NAVIGATION','ROLE_CONDITIONAL_DISTRIBUTION'])
  assert.equal(domain(d,name)?.status,'CHECKED',name);
 for(const id of ['re2-small-roles-common','re2-dual-ceiling-not-setting','re2-reset-weapon-high-no-settings','re2-stage-voice-is-cz-ceiling','re2-rare-role-cz-shared'])
  block(d,id);
 assert.equal(domain(d,'EVIDENCE')?.status,'PARTIAL');
 assert.equal(d.findings.filter((x:any)=>x.observationType==='evidence').length,1);
});
test('RE2 Tyant high and 4-way AT level rates remain source verified but latent and never fake live observation',()=>{
 const d=stage('S_BIOHAZARD_RE2_XB');
 block(d,'re2-tyrant-high-latent');block(d,'re2-at-level-latent');
 const ref=read('research-quantitative-addenda','S_BIOHAZARD_RE2_XB.json');
 const tyrant=ref.findings.find((x:any)=>x.findingId==='tyrant-high-200g-setting-rate');
 const level=ref.findings.find((x:any)=>x.findingId==='at-level-four-way-conditional');
 assert.ok(tyrant&&level);
 assert.deepEqual(Object.values(tyrant.settingPercentRows),[12.5,13.3,14.8,17.2,19.1,20.3]);
 assert.deepEqual(level.settingPercentRows['6'],[69.9,25.0,4.7,0.4]);
 assert.match(tyrant.status,/REFERENCE_ONLY/);
 assert.match(level.status,/REFERENCE_ONLY/);
 assert.equal(d.findings.some((x:any)=>x.findingId==='tyrant-high-200g-setting-rate'),false);
 assert.equal(d.findings.some((x:any)=>x.findingId==='at-level-four-way-conditional'),false);
});
test('Warausalesman4 all-setting-common mode C is not mistaken for a high-setting confirmation',()=>{
 const d=stage('S_WARAU4_KH');
 for(const name of ['SMALL_ROLE','RESET_BEHAVIOR','THRESHOLD_BEHAVIOR','NAVIGATION'])
  assert.equal(domain(d,name)?.status,'CHECKED',name);
 for(const id of ['warau4-timing-ceiling-mode-specific','warau4-setting-change-mode-c','warau4-293-cz-conditional-mode','warau4-post-big-revival-overlap','warau4-mode-stage-not-setting','warau4-role-draws-state-common'])block(d,id);
 assert.equal(d.findings.find((x:any)=>x.findingId==='bonus-total').observationType,'reference_distribution');
 assert.equal(domain(d,'EVIDENCE')?.status,'PARTIAL');
 assert.equal(d.findings.filter((x:any)=>x.observationType==='evidence').length,4);
});
test('Den-O source only gives setting-1 small-role odds; refrain from inferring they are common across settings',()=>{
 const d=stage('L_KAMEN_RIDER_DEN_O_UD');
 assert.equal(domain(d,'THRESHOLD_BEHAVIOR')?.status,'CHECKED');
 assert.equal(domain(d,'RESET_BEHAVIOR')?.status,'CHECKED');
 assert.equal(domain(d,'SMALL_ROLE')?.status,'PARTIAL');
 block(d,'deno-small-role-only-setting1-reference');
 for(const id of ['deno-normal-modes-ceilings','deno-sixth-bonus-at-ceiling','deno-setting-change-reset','deno-100pt-cz-ceiling-independent'])block(d,id);
 assert.deepEqual(d.settings.values,['SET_1','SET_2','SET_4','SET_5','SET_6']);
 assert.equal(domain(d,'EVIDENCE')?.status,'PARTIAL');
 assert.equal(d.findings.filter((x:any)=>x.observationType==='evidence').length,5);
});
