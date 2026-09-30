import test from 'node:test';import assert from 'node:assert/strict';import {classifyEvidenceLabel,classifyEvidenceSemantic,evidenceSemanticExplanation} from '../src/evidence-semantics.ts';
test('classifies exact constraints',()=>assert.equal(classifyEvidenceSemantic({label:'示唆',details:['金：設定4以上']}),'EXACT_CONSTRAINT'));
test('classifies probability-backed evidence only with source distribution',()=>assert.equal(classifyEvidenceSemantic({label:'終了画面',details:['高設定示唆'],settingDistribution:{SET_1:0.01,SET_6:0.10}}),'PROBABILITY_BACKED'));
test('classifies directional hints without invented probability',()=>assert.equal(classifyEvidenceSemantic({label:'終了画面',details:['高設定示唆（強）']}),'PROBABILITY_UNKNOWN'));
test('falls back to display-only for non-inferential references',()=>assert.equal(classifyEvidenceSemantic({label:'演出メモ',details:['特殊パターン']}),'DISPLAY_ONLY'));
test('probability-unknown copy preserves uncertainty',()=>{const s=evidenceSemanticExplanation('PROBABILITY_UNKNOWN');assert.match(s,/公表・確認されていない/);assert.match(s,/直接反映していません/);assert.match(s,/反映できる可能性があります/);assert.doesNotMatch(s,/反映できます。/)});

test('mixed evidence stays aggregate-neutral while categories remain explicit',()=>{assert.equal(classifyEvidenceSemantic({label:'終了画面',details:['虹：設定6','制服：高設定示唆（強）']}),'DISPLAY_ONLY');assert.equal(classifyEvidenceLabel('虹：設定6'),'EXACT_CONSTRAINT');assert.equal(classifyEvidenceLabel('制服：高設定示唆（強）'),'PROBABILITY_UNKNOWN')});
