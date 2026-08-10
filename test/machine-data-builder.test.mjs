import test from "node:test";
import assert from "node:assert/strict";
import { buildMachineData } from "../tools/build-machine-data.mjs";

const research={schemaVersion:"research-data-v1",machine:{machineId:"M",displayName:"Machine",modelNumber:"M1",manufacturer:"Maker",settings:["SET_1","SET_6"]},
 sources:[{sourceId:"SRC1",publisher:"P",title:"T",url:"https://example.com",checkedAt:"2026-08-10",sourceType:"official"}],
 features:[{researchFeatureId:"RF1",name:"Rate",candidateModel:"binomial",settingValues:{SET_1:{probability:.1},SET_6:{probability:.2}},sourceRefs:["SRC1"]},
 {researchFeatureId:"RF2",name:"Screen",candidateModel:"multinomial",categories:["A","B"],settingDistributions:{SET_1:{A:.8,B:.2},SET_6:{A:.5,B:.5}},sourceRefs:["SRC1"]}],
 evidenceCandidates:[]};
test("builds binomial and multinomial draft deterministically",()=>{
 const sel={schemaVersion:"selection-data-v1",machineId:"M",machineDataVersion:"0.1.0",
 inputs:[
  {id:"INP_T",name:"Trials",type:"integer",category:"A",displayOrder:1,inferenceRole:"INCLUDE_PRIMARY"},
  {id:"INP_S",name:"Success",type:"counter",category:"A",displayOrder:2,inferenceRole:"INCLUDE_PRIMARY"},
  {id:"INP_A",name:"A",type:"counter",category:"B",displayOrder:3,inferenceRole:"INCLUDE_SUPPORT"},
  {id:"INP_B",name:"B",type:"counter",category:"B",displayOrder:4,inferenceRole:"INCLUDE_SUPPORT"}],
 features:[
  {researchFeatureId:"RF1",featureId:"FEAT_RATE",adoptionCategory:"INCLUDE_PRIMARY",numeratorInputId:"INP_S",denominatorInputId:"INP_T"},
  {researchFeatureId:"RF2",featureId:"FEAT_SCREEN",adoptionCategory:"INCLUDE_SUPPORT",categoryInputIds:["INP_A","INP_B"]}]};
 const p=buildMachineData(research,sel);
 assert.equal(p.machine.machineId,"M");
 assert.deepEqual(p.features.features[0].probabilities,{SET_1:.1,SET_6:.2});
 assert.deepEqual(p.features.features[1].categoryProbabilities.SET_6,[.5,.5]);
 assert.equal(p.evidence.sources[0].classification,"OFFICIAL");
});
test("does not infer missing input mappings",()=>{
 const sel={schemaVersion:"selection-data-v1",machineId:"M",machineDataVersion:"0.1.0",inputs:[],features:[
  {researchFeatureId:"RF1",featureId:"FEAT_RATE",adoptionCategory:"INCLUDE_PRIMARY"}]};
 assert.throws(()=>buildMachineData(research,sel),/required/);
});
test("EXCLUDE feature is not emitted",()=>{
 const sel={schemaVersion:"selection-data-v1",machineId:"M",machineDataVersion:"0.1.0",inputs:[],features:[
  {researchFeatureId:"RF1",featureId:"FEAT_RATE",adoptionCategory:"EXCLUDE"}]};
 assert.equal(buildMachineData(research,sel).features.features.length,0);
});

test("preserves explicitly selected safe inputTransform and displayFormat",()=>{
 const sel={schemaVersion:"selection-data-v1",machineId:"M",machineDataVersion:"0.1.0",
 inputs:[
  {id:"INP_T",name:"Trials",type:"number",category:"A",displayOrder:1,inferenceRole:"INCLUDE_PRIMARY"},
  {id:"INP_S",name:"Success",type:"counter",category:"A",displayOrder:2,inferenceRole:"INCLUDE_PRIMARY"}],
 features:[{researchFeatureId:"RF1",featureId:"FEAT_RATE",adoptionCategory:"INCLUDE_PRIMARY",
  numeratorInputId:"INP_S",denominatorInputId:"INP_T",inputTransform:"inverse_ratio_to_trials",displayFormat:"percentage"}]};
 const p=buildMachineData(research,sel);
 assert.equal(p.features.features[0].inputTransform,"inverse_ratio_to_trials");
 assert.equal(p.features.features[0].displayFormat,"percentage");
});

test("multinomial preserves explicit mapping, residual convention and subtract rules",()=>{
 const r={...research,features:[{researchFeatureId:"RFM",name:"M",candidateModel:"multinomial",
  distributionMode:"implicit_residual",categories:["A","B"],
  settingDistributions:{SET_1:{A:.1,B:.2},SET_6:{A:.2,B:.3}},sourceRefs:["SRC1"]}]};
 const sel={schemaVersion:"selection-data-v1",machineId:"M",machineDataVersion:"0.1.0",
 inputs:[
  {id:"INP_DEN",name:"Den",type:"integer",category:"C",displayOrder:1},
  {id:"INP_A",name:"A",type:"counter",category:"C",displayOrder:2},
  {id:"INP_B",name:"B",type:"counter",category:"C",displayOrder:3}],
 features:[{researchFeatureId:"RFM",featureId:"FEAT_M",adoptionCategory:"INCLUDE_PRIMARY",
  numeratorInputId:"INP_A",categoryInputIds:["INP_B"],denominatorInputId:"INP_DEN",
  categorySubtractInputIds:{INP_B:["INP_A"]},inputTransform:"sum_inputs_to_trials"}]};
 const f=buildMachineData(r,sel).features.features[0];
 assert.deepEqual(f.categoryProbabilities.SET_1,[.1,.2]);
 assert.deepEqual(f.probabilities,{});
 assert.deepEqual(f.categorySubtractInputIds,{INP_B:["INP_A"]});
 assert.equal(f.inputTransform,"sum_inputs_to_trials");
});
