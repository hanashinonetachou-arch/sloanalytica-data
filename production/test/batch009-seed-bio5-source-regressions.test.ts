import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {buildEvaluation} from '../src/evaluation-builder.ts';
import {buildEligibility} from '../src/eligibility-builder.ts';
import {classifyEvidenceCategory} from '../src/evidence-semantics.ts';

const base=path.resolve('batches','batch-20261008-009');
const read=(id:string)=>JSON.parse(fs.readFileSync(path.join(base,'research-evidence-staged','wave-1',id+'.json'),'utf8'));
test('Gundam SEED records full CZ/ST hints including setting-neutral and suggestive frames',()=>{
 const d=read('L_GUNDAM_SEED_G');
 const f=d.findings.find((x:any)=>x.findingId==='reviewed-cz-st-end');
 assert.ok(f);
 assert.equal(f.semanticCategories.length,14);
 const rows=new Map<string,any>(f.semanticCategories.map((x:any)=>[x.label,x]));
 for(const label of ['枠色なし・キャラなし（CZ）','白枠・アークエンジェル船員','白枠・ザフト軍パイロット','赤枠・ストライク＆味方集合','赤枠・アスラン＆キラ','紫枠・アスラン＆カガリ','紫枠・キラ＆ラクス'])
   assert.ok(rows.has(label),'missing '+label);
 assert.equal(rows.get('紫枠・アスラン＆カガリ').semanticType,'DISPLAY_ONLY');
 assert.equal(rows.get('紫枠・キラ＆ラクス').semanticType,'EXACT_CONSTRAINT');
 assert.equal(classifyEvidenceCategory(rows.get('紫枠・キラ＆ラクス')),'EXACT_CONSTRAINT');
 assert.equal(rows.get('白枠・アークエンジェル船員').semanticType,'PROBABILITY_UNKNOWN');
 for(const x of f.semanticCategories)assert.ok(x.label&&x.meaning&&x.semanticType);
});
test('Gundam SEED common roles and ceiling variants never become invented setting odds',()=>{
 const d=read('L_GUNDAM_SEED_G');
 for(const domain of ['SMALL_ROLE','THRESHOLD_BEHAVIOR'])
   assert.equal(d.researchCompleteness.domains.find((x:any)=>x.domain===domain)?.status,'CHECKED');
 for(const id of ['small-role-settings-common','mode-stage-is-not-setting','gundam-mode-ceiling-not-setting','gundam-cz-state-conditioned'])
   assert.ok(d.blockedItems.some((x:any)=>x.blockId===id),'missing '+id);
 assert.deepEqual(d.findings.filter((x:any)=>x.settingDistribution).map((x:any)=>x.findingId).sort(),
   ['at-initial','cz-strike-attack','post-st-reset-100g-first-cz-or-bonus'].sort());
 for(const f of d.findings.filter((x:any)=>x.settingDistribution))assert.equal(f.liveObservation.status,'UNRESOLVED');
 assert.equal(d.researchCompleteness.status,'INCOMPLETE');
});
test('Biohazard5 middle-seven infection 19.8% is a conditional draw with first-cutin eligibility only',()=>{
 const d=read('L_BIOHAZARD5_ZE');
 const f=d.findings.find((x:any)=>x.findingId==='infection-midline-first-seven');
 assert.ok(f);
 assert.equal(f.observationType,'conditional_probability');
 assert.deepEqual(f.settingDistribution,{'1':.167,'2':.167,'3':.175,'4':.198,'5':.202,'6':.218});
 assert.equal(f.trialUniverse,'AT_ENTRY_FIRST_7_NAV_MIDDLE_7_TRIAL');
 assert.match(f.denominatorSemantics,/最初/);
 assert.match(f.denominatorSemantics,/斜め揃い/);
 assert.match(f.liveObservation.reason,/揃えられなかった/);
 assert.equal(f.liveObservation.status,'UNRESOLVED');
 assert.ok(f.sourceIds.length>=3);
 assert.equal(d.blockedItems.some((x:any)=>x.blockId==='infection-middle7-conflict'),false);
 assert.ok(d.blockedItems.some((x:any)=>x.blockId==='infection-first-navi-scope'));
 const ev=buildEvaluation(d),row=ev.evaluations.find((x:any)=>x.findingId===f.findingId);
 assert.equal(row.model,'BERNOULLI');
 assert.ok(row.metrics.perEligibleTrialPower>0);
 assert.equal(buildEligibility(ev).decisions.find((x:any)=>x.findingId===f.findingId).eligibility,'UNRESOLVED');
 assert.ok(d.researchCompleteness.resolvedSourceConflicts.some((x:any)=>x.resolution==='19.8%'));
});
