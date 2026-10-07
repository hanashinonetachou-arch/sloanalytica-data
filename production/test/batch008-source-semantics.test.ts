import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {buildEvaluation} from '../src/evaluation-builder.ts';import {buildEligibility} from '../src/eligibility-builder.ts';import {buildCandidateContract} from '../src/candidate-contract-builder.ts';import {deriveObservationInputLabels} from '../src/canonical-ui-builder.ts';
const read=(wave:string,mid:string)=>JSON.parse(fs.readFileSync(`batches/batch-20261007-008/research-drafts/${wave}/${mid}.json`,'utf8'));
test('Batch008 never promotes predecessor guesses into exact setting constraints',()=>{
 for(const [mid,blocks] of [['L_MAHJONG_MONOGATARI_S2',['count','nagi']],['L_IDOLMASTER_MILLION_LIVE_HC',['trophy','roles']]] as const){
  const r=read('wave-2',mid);for(const id of blocks){assert(r.blockedItems.some((b:any)=>b.blockId===id));assert(!r.findings.some((f:any)=>f.findingId===id&&f.observationType==='evidence'))}
 }
 const kaiji=read('wave-1','L_SMASLO_KAIJI_KYOEN_FJ');const end=kaiji.findings.find((f:any)=>f.findingId==='end');assert.equal(end.semanticCategories.find((c:any)=>c.label==='トネガワ').meaning,'設定2・3否定');
});
test('Amazing has no setting 3 and dependent bonus rates have one ordered live route',()=>{
 const r=read('wave-2','L_AMAZING_LIVE_PD');assert.deepEqual(r.settings.values,['SET_1','SET_2','SET_4','SET_5','SET_6']);for(const f of r.findings)assert(!Object.hasOwn(f.settingDistribution??{},'3'));
 const e=buildEvaluation(r),c=buildCandidateContract(e,buildEligibility(e),{},{});assert.equal(c.dependencyGroups[0].resolution,'PREFERRED_WITH_FALLBACK');assert.deepEqual(c.dependencyGroups[0].fallbackOrder,['initial','big-total','reg-total']);
});
test('condition-specific game and event inputs keep scopes without abstract counter labels',()=>{
 assert.equal(deriveObservationInputLabels({label:'スイカ3回：変更・AT後のCZ当選',trialUniverse:'GOBLIN_WATER3_RESET_TRIAL',denominatorSemantics:'対象の抽選だけを確認。',model:'BERNOULLI'}).successLabel,'CZ当選回数');
 assert.equal(deriveObservationInputLabels({label:'通常時のリーチ目',trialUniverse:'YOSHIMUNE_NON_PREMONITION_GAME_TRIAL',model:'BERNOULLI'}).trialLabel,'対象の通常ゲーム数');
});
