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

test('derived_event_rate validates source feature and category dependencies',()=>{
  const r={machine:{machineId:'X',settings:['SET_1','SET_2']},features:[
    {researchFeatureId:'RF_SRC',candidateModel:'multinomial',categories:['A','B'],settingDistributions:{SET_1:{A:.5,B:.5},SET_2:{A:.4,B:.6}}},
    {researchFeatureId:'RF_CHILD',candidateModel:'binomial',settingValues:{SET_1:{probability:.2},SET_2:{probability:.3}}}
  ],evidenceCandidates:[]};
  const s={schemaVersion:'selection-data-v1',machineId:'X',machineDataVersion:'0.0.1',inputs:[],features:[
    {researchFeatureId:'RF_SRC',featureId:'FEAT_SRC',adoptionCategory:'INCLUDE_PRIMARY',difficultyExposure:{mode:'per_game',factor:1,quality:'EXACT'}},
    {researchFeatureId:'RF_CHILD',featureId:'FEAT_CHILD',adoptionCategory:'INCLUDE_SUPPORT',difficultyExposure:{mode:'derived_event_rate',quality:'DERIVED',sourceFeatureId:'FEAT_SRC',sourceCategoryId:'A'}}
  ]};
  const ok=validateSelectionData(s,r); assert.equal(ok.ok,true);
  s.features[1].difficultyExposure.sourceCategoryId='NOPE';
  const bad=validateSelectionData(s,r); assert.equal(bad.ok,false); assert.ok(bad.errors.some(e=>e.includes('unknown sourceCategoryId')));
});

test('suppressedByFeatureIds must reference another selected feature',()=>{
 const research={machine:{machineId:'M'},features:[{researchFeatureId:'RF1'},{researchFeatureId:'RF2'}]};
 const base={schemaVersion:'selection-data-v1',machineId:'M',machineDataVersion:'0.1.0',inputs:[],features:[
  {researchFeatureId:'RF1',featureId:'FEAT_A',adoptionCategory:'INCLUDE_PRIMARY',suppressedByFeatureIds:['FEAT_B']},
  {researchFeatureId:'RF2',featureId:'FEAT_B',adoptionCategory:'INCLUDE_PRIMARY'}
 ]};
 assert.equal(validateSelectionData(base,research).ok,true);
 const bad=structuredClone(base); bad.features[0].suppressedByFeatureIds=['MISSING'];
 const result=validateSelectionData(bad,research);
 assert.equal(result.ok,false); assert.ok(result.errors.some(e=>e.includes('unknown suppressedByFeatureId')));
});
