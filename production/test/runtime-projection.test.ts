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
