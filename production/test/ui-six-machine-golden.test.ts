import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {completeOpportunityTabGroups,validateUiPresentation,applyUiPresentation} from '../src/ui-presentation.ts';
import {buildObservationEvidence} from '../src/observation-evidence-builder.ts';
import {validateObservationEvidenceDocument} from '../src/observation-evidence-validator.ts';
import {buildCanonicalUi} from '../src/canonical-ui-builder.ts';

const batch='batches/batch-20261011-011/validation/golden-baselines';
const ids=['S_DANMACHI_GAIDEN_XR','S_MAHOIKU_NB','S_TOARU_RAILGUN_FB','L_GOBLIN_SLAYER_RD','S_KONOSUBA_ZR','S_RAKUEN_TSUHO_FS'];
for(const id of ids) test(id+' published audit survives common tab generator and saved-input replay',()=>{
 const pkg=JSON.parse(fs.readFileSync(batch+'/'+id+'.json','utf8'));
 const sections=pkg.ui.v8Sections;
 const groups=new Map<string,any>();
 for(const s of sections)if(s.tabGroup){
  const t=s.tabGroup,g=groups.get(t.id)??{id:t.id,title:t.title,tabs:[]};
  g.tabs.push({sectionId:s.id,label:t.label});groups.set(t.id,g);
 }
 assert.ok(groups.size>0,'missing curated tabs');
 const policy={hiddenDerivedFindingIds:[],evidenceSectionMerges:[],sectionOrder:sections.map((s:any)=>s.id),tabGroups:[...groups.values()]};
 const completed=completeOpportunityTabGroups(policy,sections);
 assert.deepEqual(completed,policy,'legacy authored groups must remain authoritative');
 validateUiPresentation(completed,sections,[]);
 const rendered=applyUiPresentation(sections,completed);
 assert.deepEqual(rendered,sections,'inputs, bindings, Evidence and descriptions must be unchanged');
 const saved=new Map<string,number>();
 const inputIds=(ss:any[])=>ss.flatMap(s=>[...(s.groups??[]),...(s.items??[]).flatMap((n:any)=>n.inputs??[])]).flatMap((i:any)=>i.engineBinding?.inputIds??[i.inputId??i.id]).filter(Boolean);
 for(const [i,key] of inputIds(sections).entries())saved.set(key,i+1);
 assert.deepEqual(inputIds(rendered).map(key=>saved.get(key)),inputIds(sections).map(key=>saved.get(key)));
 assert.ok([...saved.values()].every(n=>n>0));
 assert.deepEqual(pkg.evidence,JSON.parse(fs.readFileSync(batch+'/'+id+'.json','utf8')).evidence);
});

test('reviewed Research context flows through Observation and Canonical UI without mixing denominators',()=>{
 const context=(conditionId:string)=>({groupingApproved:true,opportunityId:'END_SCREEN',conditionId,groupTitle:'終了画面',conditionLabel:conditionId});
 const research={machineId:'M',sources:[{sourceId:'s'}],findings:[
  {findingId:'a',trialUniverse:'NORMAL_GAME_TRIAL',denominatorSemantics:'通常ゲーム数',observationContext:context('通常')},
  {findingId:'b',trialUniverse:'AT_END_TRIAL',denominatorSemantics:'AT終了回数',observationContext:context('AT')},
 ]};
 const candidate:any={batchId:'b',machineId:'M',machineName:'M',candidates:research.findings.map(f=>({findingId:f.findingId,label:'終了画面 '+f.observationContext.conditionLabel,model:'BERNOULLI',trialUniverse:f.trialUniverse,liveInferenceRoute:'LIVE_CONDITIONAL',runtimeInferenceAllowed:true,dependencyResolution:'CONDITIONALLY_SEPARATE',runtimePolicyBinding:{value:10}})),evidenceCandidates:[],blockedItems:[],sourceIntegrityIssues:[]};
 const observation=buildObservationEvidence(candidate,research,{path:'c'});
 validateObservationEvidenceDocument(observation,candidate,research);
 const evaluation={machineId:'M',evaluations:research.findings.map(f=>({findingId:f.findingId,metrics:{selectionScore:{status:'COMPUTED',value:20}}}))};
 const ui=buildCanonicalUi(candidate,observation,evaluation,{path:'c'},{path:'o'},{path:'e'});
 assert.equal(ui.uiPresentation.tabGroups.length,1);
 assert.deepEqual(ui.numericSections.map((s:any)=>s.trialUniverse),['NORMAL_GAME_TRIAL','AT_END_TRIAL']);
 assert.deepEqual(ui.numericSections.map((s:any)=>s.inputs.map((i:any)=>i.id)),[['a.eligibleTrialCount','a.successCount'],['b.eligibleTrialCount','b.successCount']]);
 const corrupted=structuredClone(observation);corrupted.observations[1].observationContext.conditionId='別条件';
 assert.throws(()=>validateObservationEvidenceDocument(corrupted,candidate,research),/VALIDATION_FAILED/);
});
