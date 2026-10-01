import test from 'node:test';import assert from 'node:assert/strict';import {buildEvaluation} from '../src/evaluation-builder.ts';

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
