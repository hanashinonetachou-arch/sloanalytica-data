import test from "node:test";
import assert from "node:assert/strict";
import { compileV8MachinePackage } from "../tools/compile-v8-machine-package.mjs";

const settings=["SET_1","SET_2"];
const research={machine:{machineId:"TEST_DIRECT_MULTI",displayName:"test",manufacturer:"test",settings},features:[{
 researchFeatureId:"RF_STAGE",name:"stage",candidateModel:"multinomial",categories:["A","B"],
 settingDistributions:{SET_1:{A:.75,B:.25},SET_2:{A:.5,B:.5}}
}]};
const selection={machineId:"TEST_DIRECT_MULTI",features:[{researchFeatureId:"RF_STAGE",featureId:"FEAT_STAGE",adoptionCategory:"INCLUDE_SUPPORT",denominatorInputId:"INP_STAGE_TRIALS"}]};
const observation={machineId:"TEST_DIRECT_MULTI",numeric:[{featureId:"FEAT_STAGE",context:"stage",inputs:[
 {id:"INP_STAGE_A",type:"counter",engineInputId:"INP_STAGE_A"},
 {id:"INP_STAGE_B",type:"counter",engineInputId:"INP_STAGE_B"}
]}]};
const canonical={machineId:"TEST_DIRECT_MULTI"};
const materializeUi=()=>({sections:[]});

test("generic V8 compiler supports one research multinomial with directly observed exhaustive categories",()=>{
 const pkg=compileV8MachinePackage({research,selection,observation,evidence:{groups:[]},highLow:{},summary:{},canonical,materializeUi});
 const f=pkg.features.features[0];
 assert.equal(f.modelType,"multinomial");
 assert.deepEqual(f.categoryLabels,["A","B"]);
 assert.deepEqual(f.categoryProbabilities,{SET_1:[.75,.25],SET_2:[.5,.5]});
 assert.equal(f.categoryConditioning.normalization,"NONE_EXHAUSTIVE_DIRECT");
 assert.equal(f.categoryConditioning.residualCategory,null);
 assert.equal(f.numeratorInputId,"INP_STAGE_A");
 assert.deepEqual(f.categoryInputIds,["INP_STAGE_B"]);
});

test("generic V8 compiler rejects incomplete direct categorical likelihoods",()=>{
 const bad=structuredClone(research); delete bad.features[0].settingDistributions.SET_2.B;
 assert.throws(()=>compileV8MachinePackage({research:bad,selection,observation,evidence:{groups:[]},highLow:{},summary:{},canonical,materializeUi}),/incomplete multinomial probabilities/);
});
