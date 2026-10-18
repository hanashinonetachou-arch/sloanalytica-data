import test from 'node:test';import assert from 'node:assert/strict';
import {isDeclaredResearchSetting} from '../src/research-validator.ts';
import {classifyEvidenceCategory} from '../src/evidence-semantics.ts';
import {buildEvaluation} from '../src/evaluation-builder.ts';
import {buildEligibility} from '../src/eligibility-builder.ts';
import {buildCandidateContract} from '../src/candidate-contract-builder.ts';
test('zero requires explicit source-derived declaration; setting3 is not substituted for zero',()=>{
 assert.equal(isDeclaredResearchSetting({},'0'),false);assert.equal(isDeclaredResearchSetting({settings:{values:['SET_0']}},'0'),false);
 const d={settings:{status:'SOURCE_DERIVED',values:['SET_0','SET_1','SET_2','SET_4','SET_5','SET_6']}};
 assert.equal(isDeclaredResearchSetting(d,'0'),true);for(const s of ['-1','7','00','SET_0'])assert.equal(isDeclaredResearchSetting(d,s),false);
 assert.equal(classifyEvidenceCategory({label:'MAP16',meaning:'設定0'}),'EXACT_CONSTRAINT');
 assert.equal(classifyEvidenceCategory({label:'MAP16',meaning:'設定0示唆'}),'PROBABILITY_UNKNOWN');
});
test('zero remains a distinct hypothesis through Evaluation Eligibility Candidate Contract',()=>{
 const settings={'0':.1,'1':.01,'2':.02,'4':.04,'5':.05,'6':.06};
 const e=buildEvaluation({batchId:'b',machineId:'m',machineName:'乃木坂46',findings:[{findingId:'f',label:'観測率',observationType:'conditional_probability',settingDistribution:settings,trialUniverse:'OBSERVED_EVENT_TRIAL',sourceIds:['s'],liveObservation:{status:'DIRECT_EXACT',reason:'直接観測'}}]});
 const g=buildEligibility(e),c=buildCandidateContract(e,g,{},{});
 assert.deepEqual(c.candidates[0].settingDistribution,settings);assert.equal('3' in c.candidates[0].settingDistribution,false);assert.equal(c.candidates[0].runtimeInferenceAllowed,true);
});
