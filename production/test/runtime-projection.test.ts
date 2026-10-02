import test from 'node:test'; import assert from 'node:assert/strict';
import {buildRuntimeProjection} from '../src/runtime-projection-builder.ts';
import {validateRuntimeProjectionDocument} from '../src/runtime-projection-validator.ts';
const mr={path:'m'}, pr={path:'p'};
test('projects active features and preserves evidence',()=>{
 const md={batchId:'b',machineId:'M',machineName:'M',features:[{findingId:'a',name:'Active'},{findingId:'i',name:'Inactive'}],evidence:[{runtimePolicyControlled:false}],heldObservations:[{findingId:'h'}],settings:{},packagePolicy:{},highLowDiscrimination:{},uiContract:{numericSections:[{sourceFindingId:'a'},{sourceFindingId:'i'}]}};
 const p={batchId:'b',machineId:'M',featureDecisions:[{findingId:'a',state:'ACTIVE',metric:'X',value:2,threshold:1},{findingId:'i',state:'INACTIVE',metric:'X',value:0,threshold:1}]};
 const d=buildRuntimeProjection(md,p,mr,pr); assert.equal(d.activeFeatures.length,1); assert.equal(d.inactiveFeatures[0].name,'Inactive'); assert.equal(d.runtimeUi.numericSections.length,1); assert.deepEqual(d.evidence,md.evidence); assert.doesNotThrow(()=>validateRuntimeProjectionDocument(d,md,p,mr,pr));
});
test('no-feature projection retains evidence',()=>{
 const md={batchId:'b',machineId:'M',machineName:'M',features:[],evidence:[{runtimePolicyControlled:false}],heldObservations:[],settings:{},packagePolicy:{},highLowDiscrimination:{},uiContract:{numericSections:[]}};
 const p={batchId:'b',machineId:'M',featureDecisions:[]};
 const d=buildRuntimeProjection(md,p,mr,pr); assert.equal(d.activeFeatures.length,0); assert.equal(d.evidence.length,1); assert.doesNotThrow(()=>validateRuntimeProjectionDocument(d,md,p,mr,pr));
});


test('runtime policy removes game-count ranges used only by inactive features',()=>{
 const md:any={
  batchId:'b',machineId:'M',machineName:'M',
  features:[
   {findingId:'normal',name:'通常時CZ',trialUniverse:'NORMAL_GAME_TRIAL'},
   {findingId:'total',name:'総G小役',trialUniverse:'TOTAL_GAME_TRIAL'},
  ],
  evidence:[],heldObservations:[],settings:{},packagePolicy:{},highLowDiscrimination:{},
  uiContract:{
   playInfo:{mode:'TOTAL_AND_NORMAL',startFields:[{id:'startTotalGames',label:'着席時 総ゲーム数'},{id:'startNormalGames',label:'着席時 通常ゲーム数'}],currentFields:[{id:'currentTotalGames',label:'現在 総ゲーム数'},{id:'currentNormalGames',label:'現在 通常ゲーム数'}]},
   numericSections:[
    {sourceFindingId:'normal',trialUniverse:'NORMAL_GAME_TRIAL'},
    {sourceFindingId:'total',trialUniverse:'TOTAL_GAME_TRIAL'},
   ],
  },
 };
 const p:any={batchId:'b',machineId:'M',featureDecisions:[
  {findingId:'normal',state:'ACTIVE',metric:'X',value:2,threshold:1},
  {findingId:'total',state:'INACTIVE',metric:'X',value:0,threshold:1},
 ]};
 const d=buildRuntimeProjection(md,p,mr,pr);
 assert.equal(d.runtimeUi.playInfo.mode,'NORMAL_ONLY');
 assert.deepEqual(d.runtimeUi.playInfo.startFields.map((x:any)=>x.id),['startNormalGames']);
 assert.deepEqual(d.runtimeUi.playInfo.currentFields.map((x:any)=>x.id),['currentNormalGames']);
 assert.doesNotThrow(()=>validateRuntimeProjectionDocument(d,md,p,mr,pr));
});
