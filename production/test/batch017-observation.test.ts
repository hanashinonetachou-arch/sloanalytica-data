import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const root=new URL('../batches/batch-20261015-017/',import.meta.url);const read=(p:string)=>JSON.parse(fs.readFileSync(new URL(p,root),'utf8'));
const research=(m:string)=>read(`artifacts/${m}/research/result.json`),pkg=(m:string)=>read(`artifacts/${m}/app_runtime/result.json`).package;
test('Batch017 retains every original candidate and the 19-series 133-scenario diagnostics',()=>{
 const ds=read('candidate-final-dispositions.json');assert.equal(ds.length,102);assert.equal(new Set(ds.map((x:any)=>x.candidateId)).size,102);assert.ok(ds.every((x:any)=>x.reason&&x.processingRoute&&!/PENDING|REVIEW/.test(x.processingRoute)));
 const xs=read('imported-handoff/extracted/IG_TRIAL_SCENARIOS.json').scenarios;assert.equal(xs.length,133);assert.equal(new Set(xs.map((x:any)=>x.machine+':'+x.parameter)).size,19);
});
test('One Punch Man keeps exclusive small-role categories and the bonus-end non-rare logo denominator',()=>{
 const p=pkg('L_ONE_PUNCH_MAN');const f=p.features.features.find((x:any)=>x.modelType==='multinomial');assert.equal(1+f.categoryInputIds.length,2);assert.ok(f.categoryProbabilities.SET_1[0]>1/70&&f.categoryProbabilities.SET_1[0]<1/69);
 const r=research('L_ONE_PUNCH_MAN');assert.equal(r.findings.find((x:any)=>x.findingId==='02-007').trialUniverse,'BONUS_END_NON_RARE_TRIAL');assert.ok(r.findings.some((x:any)=>x.findingId==='02-012'&&x.semanticCategories.some((c:any)=>c.meaning==='設定6')));
});
test('Gamera REG screen is separate, uses one canonical category, and does not invent missing zero rates',()=>{
 const r=research('S_GAMERA2'),reg=r.findings.find((x:any)=>x.findingId==='10-010');assert.equal(reg.observationType,'evidence');assert.equal(reg.settingDistribution,undefined);assert.ok(reg.semanticCategories.some((x:any)=>x.label==='怪獣集合'&&x.meaning==='設定5以上'));assert.ok(reg.semanticCategories.some((x:any)=>x.label==='You are No1'&&x.meaning==='設定6'));
 const p=pkg('S_GAMERA2');assert.equal(p.inputs.inputs.filter((x:any)=>x.name.includes('You are No1')).length,1);assert.ok(!p.features.features.some((x:any)=>/REG_end/.test(x.featureId)));
});
test('Word of Lights preserves four settings and only the observable CT3 game-count route',()=>{
 const r=research('S_WORD_OF_LIGHTS_2');assert.deepEqual(r.settings.values,['SET_1','SET_2','SET_5','SET_6']);const ct=r.findings.find((x:any)=>x.findingId==='09-010');assert.equal(ct.trialUniverse,'CONFIRMED_CT3_MAIN_GAME_TRIAL');assert.match(ct.denominatorSemantics,/赤発光|スーパーBIG/);assert.ok(r.blockedItems.some((x:any)=>x.blockId==='09-005'&&x.reason.includes('2以上')));
 const c=read('artifacts/S_WORD_OF_LIGHTS_2/candidate_contract/result.json');assert.equal(c.dependencyGroups.find((x:any)=>x.groupId==='bonus-path').preferredFindingId,'09-004');
});
test('Busou forced ninth CZ does not fabricate a success probability; Ryujin has an excluded-game denominator',()=>{
 const r=research('S_BUSOU_SHINKI');assert.ok(!r.findings.some((x:any)=>x.findingId==='08-003'));assert.match(r.inheritedCandidateDispositions.find((x:any)=>x.candidate_id==='08-006').finalDisposition.reason,/両方から除外/);
 const ry=research('S_RYUJIN_RZ30_SUIKA_VERSION');assert.ok(ry.findings.every((x:any)=>x.trialUniverse==='NON_CHAIN_BONUS_INITIAL_GAME_TRIAL'));assert.equal(pkg('S_RYUJIN_RZ30_SUIKA_VERSION').features.features.length,1);
});
test('game-based values display as inverse rates and the two latent-state populations stay separate',()=>{
 const r=research('L_ZOMBIE_LAND_SAGA');const f=r.findings.find((x:any)=>x.findingId==='05-003');assert.match(f.denominatorSemantics,/CZ高確とは別/);const source=read('source-review/web-review-5.json');assert.ok(JSON.stringify(source).includes('1.12%'));
 for(const id of ['L_ONE_PUNCH_MAN','S_FIRE_DRIFT','S_WORD_OF_LIGHTS_2'])assert.ok(pkg(id).features.features.some((f:any)=>/_GAME_TRIAL$/.test(f.trialUniverse)));
});
