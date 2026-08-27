import test from 'node:test';
import assert from 'node:assert/strict';
import { assessSelectionQuality } from '../tools/selection-quality-gate.mjs';

test('selection quality blocks a research feature with no explicit disposition', () => {
  const research={
    machine:{machineId:'TEST',settings:['SET_1','SET_6']},
    features:[
      {researchFeatureId:'RF_A',factStatus:'verified'},
      {researchFeatureId:'RF_B',factStatus:'verified'}
    ],
    evidenceCandidates:[],
    discoveryInventory:[]
  };
  const selection={
    machineId:'TEST',
    features:[{researchFeatureId:'RF_A',featureId:'FEAT_A',adoptionCategory:'INCLUDE_PRIMARY',userReason:'通常ゲームを分母として直接観測でき、全設定の確率が公開されているため採用します。'}],
    inputs:[]
  };
  const result=assessSelectionQuality(research,selection);
  assert.equal(result.status,'BLOCKED');
  assert.ok(result.blockers.some(x=>x.includes('unclassified research feature: RF_B')));
});

test('selection quality accepts an explicit EXCLUDE disposition', () => {
  const research={
    machine:{machineId:'TEST',settings:['SET_1','SET_6']},
    features:[
      {researchFeatureId:'RF_A',factStatus:'verified'},
      {researchFeatureId:'RF_B',factStatus:'verified'}
    ],
    evidenceCandidates:[],
    discoveryInventory:[]
  };
  const selection={
    machineId:'TEST',
    features:[
      {researchFeatureId:'RF_A',featureId:'FEAT_A',adoptionCategory:'INCLUDE_PRIMARY',userReason:'通常ゲームを分母として直接観測でき、全設定の確率が公開されているため採用します。'},
      {researchFeatureId:'RF_B',featureId:'FEAT_B_EXCLUDED',adoptionCategory:'EXCLUDE',userFacingReason:'採用Featureと同じ当選経路を共有し、独立評価すると二重評価になるため不採用です。'}
    ],
    inputs:[]
  };
  const result=assessSelectionQuality(research,selection);
  assert.notEqual(result.status,'BLOCKED');
});
