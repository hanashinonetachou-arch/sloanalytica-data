import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMachineData } from '../tools/build-machine-data.mjs';

function fixture({tooLarge=false}={}) {
  const rounded = tooLarge ? {A:0.5,B:0.3,C:0.22} : {A:0.5,B:0.3,C:0.201};
  const research = {
    machine:{machineId:'TEST_ROUNDED_MULTI',displayName:'Test',modelNumber:'Test',manufacturer:'Test',settings:['SET_1','SET_6']},
    sources:[],
    features:[{
      researchFeatureId:'RF_ROUNDED',name:'丸め分布',factStatus:'verified',candidateModel:'multinomial',
      distributionMode:'explicit_complete',categories:['A','B','C'],sourceRefs:[],
      settingDistributions:{SET_1:rounded,SET_6:{A:0.4,B:0.3,C:0.3}}
    }],
    evidenceCandidates:[]
  };
  const selection = {
    machineId:'TEST_ROUNDED_MULTI',machineDataVersion:'0.0.1',
    inputs:[
      {id:'INP_A',name:'A',type:'counter',category:'TEST',displayOrder:1},
      {id:'INP_B',name:'B',type:'counter',category:'TEST',displayOrder:2},
      {id:'INP_C',name:'C',type:'counter',category:'TEST',displayOrder:3}
    ],
    features:[{
      researchFeatureId:'RF_ROUNDED',featureId:'FEAT_ROUNDED',adoptionCategory:'INCLUDE_SUPPORT',
      numeratorInputId:'INP_A',categoryInputIds:['INP_B','INP_C'],normalizeRoundedCategoryProbabilities:true
    }],
    evidence:[],uiCategoryLabels:{TEST:'テスト'}
  };
  return {research,selection};
}

test('explicit rounded multinomial can be normalized only when Selection explicitly opts in',()=>{
  const {research,selection}=fixture();
  const pkg=buildMachineData(research,selection);
  const feature=pkg.features.features[0];
  const probs=feature.categoryProbabilities.SET_1;
  assert.ok(Math.abs(probs.reduce((a,b)=>a+b,0)-1)<1e-12);
  assert.equal(feature.categoryConditioning?.roundingNormalization,true);
});

test('rounded multinomial normalization refuses a deviation above 0.5%',()=>{
  const {research,selection}=fixture({tooLarge:true});
  assert.throws(()=>buildMachineData(research,selection),/rounded category normalization exceeds 0\.5%/);
});
