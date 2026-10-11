import test from 'node:test';
import assert from 'node:assert/strict';
import {completeOpportunityTabGroups,validateUiPresentation,opportunitySurfaceSections,projectOpportunityTabGroups} from '../src/ui-presentation.ts';
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

const mirrored=()=>{
 const numeric=[{...make('OBS_A','NORMAL','NORMAL_GAME_TRIAL'),findingId:'A'},{...make('OBS_B','AT','AT_END_TRIAL'),findingId:'B'}];
 const evidence=numeric.map(n=>({id:'EVI_'+n.findingId,findingId:'MIRROR_'+n.findingId,observationContext:structuredClone(n.observationContext),semanticCategories:[{linkedFindingId:n.findingId}]}));
 return {numeric,evidence};
};
test('explicit evidence mirrors share the numeric tab surface without changing records',()=>{
 const {numeric,evidence}=mirrored(),before=structuredClone({numeric,evidence});
 const sections=opportunitySurfaceSections(numeric,evidence),policy=completeOpportunityTabGroups(base,sections);
 assert.deepEqual(policy.tabGroups[0].tabs.map((t:any)=>t.sectionId),['OBS_A','OBS_B']);
 assert.deepEqual({numeric,evidence},before);
 validateUiPresentation(policy,numeric,evidence);
});
test('inactive numeric conditions retain their evidence tab surface on projection',()=>{
 const {numeric,evidence}=mirrored(),policy=completeOpportunityTabGroups(base,opportunitySurfaceSections(numeric,evidence));
 const projected=projectOpportunityTabGroups(policy,[numeric[0]],evidence);
 assert.deepEqual(projected.tabGroups[0].tabs.map((t:any)=>t.sectionId),['OBS_A','EVI_B']);
 validateUiPresentation(projected,[numeric[0]],evidence);
 assert.deepEqual(policy.tabGroups[0].tabs.map((t:any)=>t.sectionId),['OBS_A','OBS_B']);
});
test('different context, multiple links and missing approval never hide evidence',()=>{
 for(const mutate of [(e:any)=>e.observationContext.conditionId='OTHER',(e:any)=>e.semanticCategories.push({linkedFindingId:'B'}),(e:any)=>e.observationContext.groupingApproved=false]){
  const {numeric,evidence}=mirrored();mutate(evidence[0]);
  assert.ok(opportunitySurfaceSections(numeric,evidence).some((s:any)=>s.id==='EVI_A'));
 }
});
test('runtime opportunity regeneration preserves authored tabs',()=>{
 const authored={id:'MANUAL',title:'手動見出し',tabs:[{sectionId:'OBS_A',label:'通常'},{sectionId:'OBS_B',label:'AT'}]};
 const {numeric,evidence}=mirrored(),policy={...base,tabGroups:[authored]};
 assert.deepEqual(projectOpportunityTabGroups(policy,numeric,evidence).tabGroups,[authored]);
});
