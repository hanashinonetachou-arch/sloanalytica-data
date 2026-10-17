import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';
const b=path.resolve(import.meta.dirname,'../batches/batch-20261017-020/artifacts/L_OSU_BANCHO4_A3');
const read=(s:string)=>JSON.parse(fs.readFileSync(path.join(b,s,'result.json'),'utf8'));
test('common bell is a distinct accepted rate, with unchanged probabilities and policy',()=>{
 const c=read('candidate_contract'),bell=c.candidates.find((x:any)=>x.findingId==='M02-C02');assert.equal(bell.runtimeInferenceAllowed,true);assert.equal(bell.dependencyGroupId,null);assert.equal(bell.runtimePolicyBinding.metric,'PER_ELIGIBLE_TRIAL_POWER');
 assert.ok(!c.dependencyGroups.some((g:any)=>g.members.includes('M02-C02')));
 const p=read('app_runtime').package,f=p.features.features.find((x:any)=>x.featureId==='M02-C02');
 [21.8,21.6,21.4,21.2,21,20.6].forEach((v,i)=>assert.equal(f.probabilities['SET_'+(i+1)],1/v));
 assert.ok(!p.v8.machineResearchSummary.notAdopted.some((e:any)=>e.featureId==='M02-C02'));
 assert.ok(p.v8.machineResearchSummary.adopted.some((e:any)=>e.featureId==='M02-C02'));
 assert.equal(f.displayFormat,'ratio_1_over_n');
});
test('common bell uses total delta minus unidentifiable games while AT direct retains normal delta',()=>{
 const p=read('app_runtime').package;assert.equal(p.machine.machineDataVersion,'8.5.2-batch-20261017-020');
 assert.equal(p.ui.playInfo.mode,'TOTAL_AND_NORMAL');assert.match(p.ui.playInfo.exclusionGames.label,/エンブレム.*ED/);assert.equal(p.ui.playInfo.exclusionGames.base,'TOTAL');
 const find=(id:string)=>p.ui.v8Sections.flatMap((s:any)=>s.items??[]).find((n:any)=>n.featureId===id).inputs.find((i:any)=>i.input==='denominator');
 assert.deepEqual(find('M02-C02').playDataBinding,{source:'PLAY_TOTAL_GAME_DELTA_EXCLUDED',mode:'AUTO_EXACT'});
 assert.equal(find('M02-C03').playDataBinding.source,'PLAY_NORMAL_GAME_DELTA');
 assert.deepEqual(find('M02-C02').quickAdd,[50]);
});
