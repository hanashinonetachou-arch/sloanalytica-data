import test from 'node:test';import assert from 'node:assert/strict';import {classifyEvidenceLabel,classifyEvidenceCategory,classifyEvidenceSemantic,evidenceSemanticExplanation} from '../src/evidence-semantics.ts';
test('classifies exact constraints',()=>assert.equal(classifyEvidenceSemantic({label:'示唆',details:['金：設定4以上']}),'EXACT_CONSTRAINT'));
test('classifies probability-backed evidence only with source distribution',()=>assert.equal(classifyEvidenceSemantic({label:'終了画面',details:['高設定示唆'],settingDistribution:{SET_1:0.01,SET_6:0.10}}),'PROBABILITY_BACKED'));
test('classifies directional hints without invented probability',()=>assert.equal(classifyEvidenceSemantic({label:'終了画面',details:['高設定示唆（強）']}),'PROBABILITY_UNKNOWN'));
test('falls back to display-only for non-inferential references',()=>assert.equal(classifyEvidenceSemantic({label:'演出メモ',details:['特殊パターン']}),'DISPLAY_ONLY'));
test('probability-unknown copy preserves uncertainty',()=>{const s=evidenceSemanticExplanation('PROBABILITY_UNKNOWN');assert.match(s,/公表・確認されていない/);assert.match(s,/直接反映していません/);assert.match(s,/反映できる可能性があります/);assert.doesNotMatch(s,/反映できます。/)});

test('mixed evidence stays aggregate-neutral while categories remain explicit',()=>{assert.equal(classifyEvidenceSemantic({label:'終了画面',details:['虹：設定6','制服：高設定示唆（強）']}),'DISPLAY_ONLY');assert.equal(classifyEvidenceLabel('虹：設定6'),'EXACT_CONSTRAINT');assert.equal(classifyEvidenceLabel('制服：高設定示唆（強）'),'PROBABILITY_UNKNOWN')});

test('classifies parity-rich exact constraints',()=>{assert.equal(classifyEvidenceLabel('246枚：偶数設定濃厚'),'EXACT_CONSTRAINT');assert.equal(classifyEvidenceLabel('奇数設定濃厚'),'EXACT_CONSTRAINT');assert.equal(classifyEvidenceLabel('偶数設定示唆'),'PROBABILITY_UNKNOWN')});

test('does not upgrade directional wording into an exact setting constraint',()=>{
 assert.equal(classifyEvidenceLabel('1回：設定2以上の期待大'),'PROBABILITY_UNKNOWN');
 assert.equal(classifyEvidenceLabel('赤：設定2以上示唆'),'PROBABILITY_UNKNOWN');
 assert.equal(classifyEvidenceLabel('ヨナ＆ココ：設定2・4・6示唆'),'PROBABILITY_UNKNOWN');
 assert.equal(classifyEvidenceLabel('金：設定4以上濃厚'),'EXACT_CONSTRAINT');
});


test('multi-setting denial is an exact constraint',()=>{ assert.equal(classifyEvidenceLabel('来栖の刀：設定2・3否定'),'EXACT_CONSTRAINT'); });
test('physical close-up labels do not weaken a separately published exact condition',()=>{
 assert.equal(classifyEvidenceCategory({label:'アクア：ドアップ',meaning:'設定6'}),'EXACT_CONSTRAINT');
 assert.equal(classifyEvidenceSemantic({semanticCategories:[{label:'アクア：ドアップ',meaning:'設定6'}]}),'EXACT_CONSTRAINT');
 assert.equal(classifyEvidenceCategory({label:'設定6',meaning:'高設定示唆（強）'}),'PROBABILITY_UNKNOWN');
 assert.equal(classifyEvidenceCategory({label:'ドアップ',meaning:'設定6の期待度アップ'}),'PROBABILITY_UNKNOWN');
 assert.equal(classifyEvidenceCategory({label:'虹：設定6'}),'EXACT_CONSTRAINT');
});
