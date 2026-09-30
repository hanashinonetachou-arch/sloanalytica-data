import test from 'node:test';import assert from 'node:assert/strict';import {buildObservationEvidence} from '../src/observation-evidence-builder.ts';import {validateObservationEvidenceDocument} from '../src/observation-evidence-validator.ts';
const research={machineId:'M',sources:[{sourceId:'s'}]};
test('materializes ready Bernoulli/categorical and preserves joint-resolved members without duplicate input',()=>{const candidate:any={batchId:'b',machineId:'M',machineName:'M',candidates:[
 {findingId:'b',label:'B',model:'BERNOULLI',trialUniverse:'NORMAL_GAME_TRIAL',liveInferenceRoute:'LIVE_CONDITIONAL',runtimeInferenceAllowed:true,dependencyResolution:'CONDITIONALLY_SEPARATE'},
 {findingId:'j',label:'J',model:'CATEGORICAL',trialUniverse:'END',liveInferenceRoute:'LIVE_CONDITIONAL',runtimeInferenceAllowed:true,dependencyResolution:'MUTUALLY_EXCLUSIVE_CATEGORICAL'},
 {findingId:'m',label:'M',model:'BERNOULLI',trialUniverse:'END',liveInferenceRoute:'LIVE_CONDITIONAL',runtimeInferenceAllowed:false,dependencyResolution:'RESOLVED_IN_JOINT_MODEL',resolvedIntoFindingId:'j'},
 {findingId:'h',label:'H',model:'BERNOULLI',trialUniverse:'NORMAL_GAME_TRIAL',liveInferenceRoute:'LIVE_CONDITIONAL',runtimeInferenceAllowed:false,dependencyResolution:'HELD_NO_JOINT_MODEL'},
 ],evidenceCandidates:[{findingId:'e',label:'Evidence',sourceIds:['s']}],blockedItems:[],sourceIntegrityIssues:[]};
 const d=buildObservationEvidence(candidate,research,{path:'c'});
 assert.equal(d.observations.find((x:any)=>x.findingId==='b').collectionContract.type,'SUCCESS_TRIAL_COUNTS');
 assert.equal(d.observations.find((x:any)=>x.findingId==='j').collectionContract.trialField,'eligibleTrialCount');
 assert.equal(d.observations.find((x:any)=>x.findingId==='m').observationStatus,'RESOLVED_IN_JOINT_MODEL');
 assert.equal(d.observations.find((x:any)=>x.findingId==='h').observationStatus,'HELD_NO_JOINT_MODEL');
 assert.doesNotThrow(()=>validateObservationEvidenceDocument(d,candidate,research));
});


test('materializes explicit Evidence semantics instead of leaving downstream label inference implicit',()=>{const candidate:any={batchId:'b',machineId:'M',machineName:'M',candidates:[],evidenceCandidates:[{findingId:'e',label:'終了画面',sourceIds:['s'],details:['金：設定4以上','高設定示唆（強）','基本パターン']}],blockedItems:[{label:'終了画面の設定別出現率',reason:'設定別出現率を確認できない'}],sourceIntegrityIssues:[]};const d=buildObservationEvidence(candidate,research,{path:'c'});assert.deepEqual(d.evidence[0].categorySemantics,[{label:'金：設定4以上',semantic:'EXACT_CONSTRAINT'},{label:'高設定示唆（強）',semantic:'PROBABILITY_UNKNOWN'},{label:'基本パターン',semantic:'PROBABILITY_UNKNOWN'}]);assert.doesNotThrow(()=>validateObservationEvidenceDocument(d,candidate,research));});
