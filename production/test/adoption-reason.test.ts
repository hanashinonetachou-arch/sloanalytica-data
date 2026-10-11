import fs from 'node:fs';import test from 'node:test';import assert from 'node:assert/strict';
import {concreteAdoptionReason,repairGenericAdoptionReasons,isGenericAdoptionReason} from '../src/adoption-reason.ts';
const baseline='batches/batch-20261011-011/validation/golden-baselines';
for(const file of fs.readdirSync(baseline))test(file+' repairs generic rationale without changing inference, UI or authored reasons',()=>{
 const pkg=JSON.parse(fs.readFileSync(baseline+'/'+file,'utf8')),before=structuredClone(pkg);
 const authored=(before.v8.machineResearchSummary.adopted??[]).filter((x:any)=>!isGenericAdoptionReason(x.reason));
 assert.ok(repairGenericAdoptionReasons(pkg)>0);
 for(const e of pkg.v8.machineResearchSummary.adopted)assert.equal(isGenericAdoptionReason(e.reason),false);
 for(const e of authored)assert.deepEqual(pkg.v8.machineResearchSummary.adopted.find((x:any)=>x.featureId===e.featureId),e);
 const strip=(p:any)=>{for(const f of p.features.features)if(f.selectionRationale)delete f.selectionRationale.adoptionReason;for(const e of p.v8.machineResearchSummary.adopted)delete e.reason;return p};
 assert.deepEqual(strip(pkg),strip(before));
});
test('conditional rates retain percent format and do not imply monotonic high-setting direction',()=>{
 const pkg={features:{features:[{featureId:'F',name:'CZ中の成功',modelType:'binomial',trialUniverse:'CZ_REPLAY_TRIAL',denominatorInputId:'n',numeratorInputId:'k',probabilities:{SET_1:.1,SET_2:.3,SET_6:.2}}]},inputs:{inputs:[{id:'n',name:'CZ中のリプレイ回数'},{id:'k',name:'成功回数'}]}};
 const s=concreteAdoptionReason(pkg,'F');assert.match(s,/設定1 10%、設定2 30%/);assert.match(s,/CZ中のリプレイ回数/);assert.doesNotMatch(s,/高設定ほど|1\//);
});
test('missing model information fails rather than inventing a generic adoption reason',()=>{
 assert.throws(()=>concreteAdoptionReason({features:{features:[]}},'MISSING'),/ADOPTION_REASON_FEATURE/);
});
