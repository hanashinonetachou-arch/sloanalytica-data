import test from 'node:test';
import assert from 'node:assert/strict';
import {completeOpportunityTabGroups,validateUiPresentation} from '../src/ui-presentation.ts';
const base={hiddenDerivedFindingIds:[],sectionOrder:[],evidenceSectionMerges:[],tabGroups:[]};
const make=(id:string,conditionId:string,trialUniverse:string)=>({id,trialUniverse,observationContext:{groupingApproved:true,opportunityId:'SCREEN',conditionId,groupTitle:'終了画面',conditionLabel:conditionId}});
test('approved contexts produce tabs and keep independent trial universes',()=>{
 const sections=[make('OBS_A','NORMAL','NORMAL_GAME_TRIAL'),make('OBS_B','AT','AT_END_TRIAL')];
 const result=completeOpportunityTabGroups(base,sections);
 assert.equal(result.tabGroups.length,1);
 assert.deepEqual(result.tabGroups[0].tabs.map((t:any)=>t.sectionId),['OBS_A','OBS_B']);
 assert.notEqual(sections[0].trialUniverse,sections[1].trialUniverse);
 validateUiPresentation(result,sections,[]);
});
test('unapproved and duplicate conditions fail closed',()=>{
 const sections=[make('OBS_A','NORMAL','A'),make('OBS_B','NORMAL','B')];
 assert.equal(completeOpportunityTabGroups(base,sections).tabGroups.length,0);
 sections[1].observationContext.groupingApproved=false;
 assert.equal(completeOpportunityTabGroups(base,sections).tabGroups.length,0);
});
