import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {validateResearchCandidateLedger,validateResearchPromotionReadiness} from '../src/research-validator.ts';
const root=path.resolve(import.meta.dirname,'../batches/batch-20261013-014');
const read=(id:string,stage:string)=>JSON.parse(fs.readFileSync(path.join(root,'artifacts',id,stage,'result.json'),'utf8'));
const spec=JSON.parse(fs.readFileSync(path.join(root,'batch.json'),'utf8'));
const ids:string[]=spec.waves.flatMap((w:any)=>w.machineIds);
test('Batch014 retains all 46 preliminary candidates and source-traced discoveries',()=>{
 let candidates=0,old=0;
 for(const id of ids){const r=read(id,'research');validateResearchCandidateLedger(r,new Set(r.sources.map((s:any)=>s.sourceId)));validateResearchPromotionReadiness(r);candidates+=r.researchCompleteness.candidateLedger.length;old+=r.preliminaryHistory.length;
  assert.equal(r.selfAudit.independentExternalAudit,'NOT_PERFORMED');
  assert.equal(r.researchCompleteness.domains.length,20);
  const settings=new Set(r.settings.values.map((s:string)=>s.replace('SET_','')));
  for(const f of r.findings)if(f.settingDistribution)assert.deepEqual(new Set(Object.keys(f.settingDistribution)),settings);
 }
 assert.equal(old,46);assert.equal(candidates,138);
});
test('Batch014 dependency contracts prevent independent inclusion of nested hits',()=>{
 for(const id of ids){const c=read(id,'candidate_contract');for(const g of c.dependencyGroups){
  const members=c.candidates.filter((f:any)=>g.members.includes(f.findingId));
  if(g.resolution==='SINGLE_MEMBER_SELECTED')assert.equal(members.filter((m:any)=>m.runtimeInferenceAllowed).length,1);
  if(g.resolution==='PREFERRED_WITH_FALLBACK'){
   assert.equal(new Set(g.fallbackOrder).size,members.length);
   for(const m of members){const rank=g.fallbackOrder.indexOf(m.findingId);assert.deepEqual(m.suppressedByFeatureIds,g.fallbackOrder.slice(0,rank))}
  }
  assert.notEqual(g.resolution,'HELD_NO_JOINT_MODEL');
 }
 }
 const k=read('S_KACHO_KUMADA_GZA','candidate_contract');assert.equal(k.dependencyGroups[0].preferredFindingId,'big-reg-joint');
 const f=read('S_MY_FLOWER_II_EE_30','candidate_contract');assert.equal(f.dependencyGroups[0].preferredFindingId,'cherry-bonus-joint');
 const z=read('L_REZERO_SEASON2_PA5','candidate_contract');assert.equal(z.dependencyGroups[0].resolution,'CONDITIONALLY_SEPARATE');
});
test('known no-difference mechanics and unavailable parameters survive the summary route',()=>{
 let noDifference=0;
 for(const id of ids){const r=read(id,'research'),p=read(id,'runtime_projection');
  for(const b of r.blockedItems){assert.ok(p.blockedItems.some((x:any)=>x.blockId===b.blockId&&x.reason===b.reason));if(b.researchSurveyResult==='NO_CONFIRMED_SETTING_DIFFERENCE')noDifference++}
  const numeric=r.findings.filter((f:any)=>f.settingDistribution);
  const contract=read(id,'candidate_contract');assert.equal(numeric.length,contract.candidates.length+contract.excludedDecisions.length);
 }
 assert.equal(noDifference,12);
});
test('confirmed screen inputs are shared and unconfirmed hints never gain weights',()=>{
 for(const id of ids){const r=read(id,'research'),p=read(id,'app_runtime');
  for(const f of r.findings){
   if(f.observationType==='evidence')assert.equal(f.settingDistribution,undefined);
   if(f.mirrorsEvidenceFindingId){const e=r.findings.find((x:any)=>x.findingId===f.mirrorsEvidenceFindingId);assert.ok(e);assert.ok(e.semanticCategories.every((c:any)=>c.linkedFindingId===f.findingId));}
  }
  assert.equal(p.manifestVersion,'8.5');
 }
 const r=read('L_REZERO_SEASON2_PA5','research');assert.ok(r.findings.find((f:any)=>f.findingId==='clock').semanticCategories.some((c:any)=>c.label==='5時6分'));assert.ok(!r.findings.find((f:any)=>f.findingId==='clock').semanticCategories.some((c:any)=>c.label==='5時56分'));
 const c=read('S_CHABUDAI_EB6','research').findings.find((f:any)=>f.findingId==='reg-colors');assert.ok(c.semanticCategories.every((c:any)=>c.semanticType==='PROBABILITY_UNKNOWN'));
});

test('Batch014 concise input labels survive Research to UI without changing trial universes',()=>{
 for(const id of ids){const r=read(id,'research'),u=read(id,'canonical_ui');for(const section of u.numericSections){const f=r.findings.find((f:any)=>f.findingId===section.sourceFindingId);assert.ok(f);assert.equal(section.inputs[0].label,f.inputPresentation.trialLabel);assert.ok(section.inputs.every((x:any)=>x.label.length<=30));assert.deepEqual(section.inputs[0].quickAdd,String(f.trialUniverse).includes('GAME_TRIAL')?[50]:[]);}}
 const f=read('S_MY_FLOWER_II_EE_30','canonical_ui').numericSections.find((x:any)=>x.sourceFindingId==='cherry-bonus-joint');assert.deepEqual(f.inputs[0].quickAdd,[50]);
 const k=read('S_KACHO_KUMADA_GZA','canonical_ui').numericSections.find((x:any)=>x.sourceFindingId==='big-reg-joint');assert.equal(k.inputs[0].label,'データカウンターゲーム数');
});
