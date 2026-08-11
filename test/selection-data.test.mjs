import test from "node:test";
import assert from "node:assert/strict";
import { validateSelectionData } from "../tools/validate-selection-data.mjs";
test("valid selection passes",()=>{
 const s={schemaVersion:"selection-data-v1",machineId:"M",machineDataVersion:"0.1.0",
  inputs:[{id:"INP_A",name:"A",type:"integer",category:"C",displayOrder:1}],
  features:[{researchFeatureId:"RF1",featureId:"FEAT_A",adoptionCategory:"DISPLAY_ONLY",numeratorInputId:"INP_A"}]};
 const r={machine:{machineId:"M"},features:[{researchFeatureId:"RF1"}]};
 assert.equal(validateSelectionData(s,r).ok,true);
});
test("unknown research feature and input fail",()=>{
 const s={schemaVersion:"selection-data-v1",machineId:"M",machineDataVersion:"0.1.0",inputs:[],
  features:[{researchFeatureId:"NO",featureId:"FEAT_A",adoptionCategory:"INCLUDE_PRIMARY",numeratorInputId:"INP_X"}]};
 const r={machine:{machineId:"M"},features:[]};
 const v=validateSelectionData(s,r); assert.equal(v.ok,false); assert.ok(v.errors.length>=2);
});

test('difficultyExposure setting_rate requires every machine setting',()=>{
  const s={schemaVersion:'selection-data-v1',machineId:'M',machineDataVersion:'0.1.0',
    inputs:[{id:'INP_A',name:'A',type:'integer',category:'C',displayOrder:1}],
    features:[{researchFeatureId:'RF1',featureId:'FEAT_A',adoptionCategory:'INCLUDE_PRIMARY',numeratorInputId:'INP_A',difficultyExposure:{mode:'setting_rate',trialsPerGameBySetting:{SET_1:1}}}]};
  const research={machine:{machineId:'M',settings:['SET_1','SET_2']},features:[{researchFeatureId:'RF1'}]};
  const r=validateSelectionData(s,research);
  assert.equal(r.ok,false);
  assert.ok(r.errors.some(x=>x.includes('setting_rate missing/invalid SET_2')));
});
