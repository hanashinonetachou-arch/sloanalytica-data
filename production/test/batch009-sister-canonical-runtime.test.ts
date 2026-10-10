import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildAppRuntime} from '../src/app-runtime-builder.ts';
import {validateAppRuntimeDocument} from '../src/app-runtime-validator.ts';
import {categoricalEvidenceMirrorIssues} from '../src/categorical-evidence-mirror.ts';
const read=()=>JSON.parse(fs.readFileSync('batches/batch-20261008-009/research-evidence-staged/wave-1/L_SISTER_QUEST_CA.json','utf8'));
// Validation fixture only: this does not approve Research or publish Batch009 Runtime.
test('Sister Quest actual mirrored categories use one counter each and exact constraints reuse those counters',()=>{
 const d=read(),ids=['at-end-categorical','at-monster-categorical'];
 for(const id of ids){
  const f=d.findings.find((f:any)=>f.findingId===id),e=d.findings.find((x:any)=>x.findingId===f.mirrorsEvidenceFindingId);
  const evidence={id:'EVI_'+e.findingId,sourceFindingId:e.findingId,title:e.label,evidenceItems:[e]};
  const inputIds=e.semanticCategories.map((_c:any,i:number)=>id+'.categoryCounts.'+i);
  const numeric={id:'OBS_'+id,sourceFindingId:id,title:f.label,model:'CATEGORICAL',trialUniverse:f.trialUniverse,description:f.denominatorSemantics,inputs:[{id:id+'.eligibleTrialCount',label:f.label+'確認回数',role:'trial'},...e.semanticCategories.map((c:any,i:number)=>({id:inputIds[i],label:c.label,role:'categoryCount',quickAdd:[1]}))]};
  const projection:any={batchId:'batch009-link-validation-only',machineId:d.machineId,machineName:d.name,settings:d.settings,packagePolicy:{offlineCapable:true},highLowDiscrimination:{status:'NOT_COMPUTED',reason:'Validation fixture only'},activeFeatures:[{findingId:id,name:f.label,model:'CATEGORICAL',trialUniverse:f.trialUniverse,categoryModel:f.categoryModel,settingDistribution:f.settingDistribution,runtimePolicyBinding:{metric:'PER_ELIGIBLE_TRIAL_POWER',value:1},score:{status:'NOT_COMPUTED'}}],inactiveFeatures:[],heldObservations:[],evidence:[evidence],runtimeUi:{schemaVersion:'canonical-ui-v1',playInfo:{visible:true,mode:'NONE',useDifference:{label:'着席時との差分を使用'}},numericSections:[numeric],evidenceSections:[evidence]}};
  const ref={path:'validation-only'},runtime=buildAppRuntime(projection,ref);
  assert.doesNotThrow(()=>validateAppRuntimeDocument(runtime,projection,ref));
  assert.equal(runtime.package.features.features.length,1);
  assert.equal(runtime.package.features.features[0].denominatorRule,'SUM_CATEGORY_COUNTS');
  assert.deepEqual(runtime.package.inputs.inputs.filter((x:any)=>x.id!==id+'.eligibleTrialCount').map((x:any)=>x.id).sort(),[...inputIds].sort());
  assert.ok(!runtime.package.inputs.inputs.some((x:any)=>x.id.startsWith('REF_')));
  const counters=runtime.package.ui.v8Sections.flatMap((s:any)=>s.items??[]).flatMap((n:any)=>n.interaction?.categories??[]);
  assert.equal(counters.length,e.semanticCategories.length);
  for(const c of e.semanticCategories)assert.ok(counters.some((x:any)=>x.label===c.label&&x.meaning===c.meaning));
  const exact=runtime.package.evidence.evidences;
  assert.equal(exact.length,id==='at-end-categorical'?3:0);
  for(const constraint of exact)assert.ok(inputIds.includes(constraint.inputId));
  if(id==='at-end-categorical'){
   assert.deepEqual(exact.find((x:any)=>x.name.startsWith('シフォン＆ステラ')).confirmedSettings,['SET_2','SET_3','SET_4','SET_5','SET_6']);
   assert.deepEqual(exact.find((x:any)=>x.name.startsWith('水晶姫クレア')).confirmedSettings,['SET_6']);
  }
 }
});
test('Reconciliation cannot be claimed by a flag if a reviewed category loses its exact input link',()=>{
 const d=read(),e=d.findings.find((f:any)=>f.findingId==='reviewed-at-end');
 delete e.semanticCategories[0].linkedFindingId;
 assert.ok(categoricalEvidenceMirrorIssues(d).includes('MIRRORED_CATEGORICAL_EVIDENCE_NOT_RECONCILED:at-end-categorical'));
});
import {buildEvaluation} from '../src/evaluation-builder.ts';
import {buildEligibility} from '../src/eligibility-builder.ts';
import {buildCandidateContract} from '../src/candidate-contract-builder.ts';
import {buildObservationEvidence} from '../src/observation-evidence-builder.ts';
import {buildCanonicalUi} from '../src/canonical-ui-builder.ts';
import {buildMachineData} from '../src/machine-data-builder.ts';
import {buildRuntimePolicy} from '../src/runtime-policy-builder.ts';
import {buildRuntimeProjection} from '../src/runtime-projection-builder.ts';
test('Actual AT-end mapping survives every production builder without separate Evidence counters',()=>{
 const research=read(),ref={path:'validation-only'};
 research.findings=research.findings.filter((f:any)=>['at-end-categorical','reviewed-at-end'].includes(f.findingId));
 research.blockedItems=[];
 const evaluation=buildEvaluation(research),eligibility=buildEligibility(evaluation);
 const candidate=buildCandidateContract(evaluation,eligibility,ref,ref);
 const observation=buildObservationEvidence(candidate,research,ref);
 const ui=buildCanonicalUi(candidate,observation,evaluation,ref,ref,ref);
 const machine=buildMachineData(ui,candidate,observation,ref,ref,ref,research,ref);
 const config=JSON.parse(fs.readFileSync('config/runtime-policy-v8.5.json','utf8'));
 const policy=buildRuntimePolicy(machine,config,ref,ref);
 const projection=buildRuntimeProjection(machine,policy,ref,ref);
 const runtime=buildAppRuntime(projection,ref);
 assert.doesNotThrow(()=>validateAppRuntimeDocument(runtime,projection,ref));
 assert.equal(runtime.package.features.features.length,1);
 assert.equal(runtime.package.evidence.evidences.length,3);
 assert.ok(!runtime.package.inputs.inputs.some((x:any)=>x.id.startsWith('REF_')));
 const categories=runtime.package.ui.v8Sections.flatMap((s:any)=>s.items??[]).flatMap((n:any)=>n.interaction?.categories??[]);
 assert.equal(categories.length,7);
 assert.ok(categories.some((c:any)=>c.label==='水晶姫クレア'&&c.meaning==='設定6'));
});
