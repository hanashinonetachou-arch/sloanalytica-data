import test from 'node:test';import assert from 'node:assert/strict';import {buildEvaluation} from '../src/evaluation-builder.ts';import {validateEvaluationDocument} from '../src/evaluation-validator.ts';

test('TOTAL_GAME_TRIAL receives exact 7000G selection score',()=>{
 const research={manifestVersion:'8.5',batchId:'b',machineId:'M',machineName:'M',findings:[{findingId:'f',label:'総ゲーム数要素',observationType:'probability',sourceIds:['s'],trialUniverse:'TOTAL_GAME_TRIAL',denominatorSemantics:'総ゲーム数に対する回数。',settingDistribution:{'1':'1/22.2','2':'1/21.8','3':'1/21.4','4':'1/21.0','5':'1/20.6','6':'1/20.2'}}],blockedItems:[]};
 const d=buildEvaluation(research);const e=d.evaluations[0];
 assert.equal(e.benchmarkExposure.status,'EXACT');
 assert.equal(e.benchmarkExposure.trials,7000);
 assert.equal(e.metrics.selectionScore.status,'COMPUTED');
 assert.ok(e.metrics.selectionScore.value>20);
 assert.equal(e.selectionClass,'CORE');
});


test('source categorical distribution uses strings and rejects object rows before production',()=>{
 const research={manifestVersion:'8.5',batchId:'b',machineId:'M',machineName:'M',findings:[{findingId:'f',label:'男女比',observationType:'appearance_distribution',sourceIds:['s'],trialUniverse:'STANDBY_CHARACTER_TRIAL',settingDistribution:{'1':'男性 60% / 女性 40%','2':'男性 40% / 女性 60%','3':'男性 60% / 女性 40%','4':'男性 40% / 女性 60%','5':'男性 60% / 女性 40%','6':'男性 40% / 女性 60%'},categoryModel:{residualPolicy:'SOURCE_EXHAUSTIVE'}}],blockedItems:[]};
 const d=buildEvaluation(research);const e=d.evaluations[0];
 assert.equal(e.model,'CATEGORICAL');
 assert.ok(e.metrics.perEligibleTrialPower>0);
 const invalid=structuredClone(research) as any;
 invalid.findings[0].settingDistribution={'1':{male:0.6,female:0.4},'2':{male:0.4,female:0.6}};
 assert.throws(()=>buildEvaluation(invalid),/EVAL_CATEGORY/);
});

test('preserves structured Evidence semantics from Research',()=>{
 const research:any={manifestVersion:'8.5',batchId:'b',machineId:'M',machineName:'M',findings:[{findingId:'e',label:'終了画面',observationType:'evidence',sourceIds:['s'],semanticType:'MIXED_CATEGORICAL',semanticCategories:[{label:'制服',meaning:'高設定示唆',semanticType:'PROBABILITY_UNKNOWN'},{label:'虹',meaning:'設定6濃厚',semanticType:'EXACT_CONSTRAINT'}]}],blockedItems:[]};
 const d=buildEvaluation(research);
 assert.deepEqual(d.evidenceCandidates[0].semanticCategories,research.findings[0].semanticCategories);
 assert.equal(d.evidenceCandidates[0].semanticType,'MIXED_CATEGORICAL');
});


test('numeric candidate details survive evaluation for user-facing runtime explanations',()=>{
 const research:any={manifestVersion:'8.5',batchId:'b',machineId:'M',machineName:'M',findings:[{findingId:'f',label:'条件別分布',observationType:'appearance_distribution',sourceIds:['s'],trialUniverse:'EVENT_TRIAL',details:['条件Aと条件Bを混ぜずに記録します。'],settingDistribution:{'1':'A 60% / B 40%','6':'A 40% / B 60%'},categoryModel:{residualPolicy:'SOURCE_EXHAUSTIVE'}}],blockedItems:[]};
 const d=buildEvaluation(research);assert.deepEqual(d.evaluations[0].details,research.findings[0].details);
});


test('accepts published categorical rows with up to 1.5% rounding drift without rewriting source values',()=>{
 const research:any={manifestVersion:'8.5',batchId:'b',machineId:'M',machineName:'M',findings:[{findingId:'f',label:'公開丸め表',observationType:'appearance_distribution',sourceIds:['s'],trialUniverse:'EVENT_TRIAL',settingDistribution:{'1':'A 54% / B 36% / C 4% / D 1% / E 2% / F 2% / G 2%','6':'A 34% / B 52% / C 4% / D 1% / E 2% / F 3% / G 3%'},categoryModel:{residualPolicy:'SOURCE_EXHAUSTIVE'}}],blockedItems:[]};
 const before=structuredClone(research.findings[0].settingDistribution);
 const d=buildEvaluation(research);
 assert.equal(d.evaluations[0].model,'CATEGORICAL');
 assert.ok(d.evaluations[0].metrics.perEligibleTrialPower>0);
 assert.deepEqual(research.findings[0].settingDistribution,before,'published rounded values remain immutable');
 const invalid=structuredClone(research);invalid.findings[0].settingDistribution['1']='A 60% / B 45%';
 assert.throws(()=>buildEvaluation(invalid),/EVAL_CATEGORY_SUM/);
});


test('same trial universe candidates are deferred instead of assumed independent',()=>{
 const research:any={manifestVersion:'8.5',batchId:'b',machineId:'M',machineName:'M',findings:[{findingId:'cz',label:'CZ初当たり',observationType:'probability',sourceIds:['s'],trialUniverse:'NORMAL_GAME_TRIAL',settingDistribution:{'1':'1/240','6':'1/180'}},{findingId:'at',label:'AT初当たり',observationType:'probability',sourceIds:['s'],trialUniverse:'NORMAL_GAME_TRIAL',settingDistribution:{'1':'1/540','6':'1/400'}}],blockedItems:[]};
 const d=buildEvaluation(research);const a=d.evaluations.find((x:any)=>x.findingId==='cz'),b=d.evaluations.find((x:any)=>x.findingId==='at');
 assert.equal(a.dependency.status,'DEFERRED_TO_CANDIDATE_CONTRACT');assert.equal(a.dependency.groupId,b.dependency.groupId);assert.equal(a.dependency.kind,'OVERLAP_UNRESOLVED');assert.equal(d.dependencyReview.status,'COMPLETE');
});


test('evidence without top-level semanticType round-trips through JSON and validation',()=>{
 const research:any={manifestVersion:'8.5',batchId:'b',machineId:'M',machineName:'M',findings:[{findingId:'e',label:'終了画面',observationType:'evidence',sourceIds:['s'],semanticCategories:[{label:'虹',meaning:'設定6',semanticType:'EXACT_CONSTRAINT',linkedFindingId:'screen-dist'}]}],blockedItems:[]};
 const built=buildEvaluation(research);
 const persisted=JSON.parse(JSON.stringify(built));
 assert.equal(Object.hasOwn(persisted.evidenceCandidates[0],'semanticType'),false);
 assert.equal(persisted.evidenceCandidates[0].semanticCategories[0].linkedFindingId,'screen-dist');
 assert.doesNotThrow(()=>validateEvaluationDocument(persisted,research));
});
