import test from 'node:test';import assert from 'node:assert/strict';
import {guardApprovedAdoptionReasons} from '../src/adoption-reason-guard.ts';
const pkg=(reason:string)=>({v8:{machineResearchSummary:{adopted:[{featureId:'BIG',reason}]}},features:{features:[{featureId:'BIG',probabilities:{SET_1:.1,SET_6:.2}}]}});
test('unchanged approved rationale is preserved',()=>assert.equal(guardApprovedAdoptionReasons(pkg('設定別BIG確率'),pkg('設定別BIG確率')).status,'PASS'));
test('generic regression fails closed even when model is unchanged',()=>assert.throws(()=>guardApprovedAdoptionReasons(pkg('設定別BIG確率'),pkg('現在の採用基準を満たしているため')),/ADOPTION_GUARD_UNREVIEWED:BIG/));
test('non-generic unintended rewrite also fails',()=>assert.throws(()=>guardApprovedAdoptionReasons(pkg('元の監査済み説明'),pkg('別の説明')),/ADOPTION_GUARD_UNREVIEWED/));
test('removed adopted item fails unless reviewed',()=>assert.throws(()=>guardApprovedAdoptionReasons(pkg('元の説明'),{v8:{machineResearchSummary:{adopted:[]}}}),/ADOPTION_GUARD_REMOVED/));
test('intentional change requires exact feature approval',()=>assert.deepEqual(guardApprovedAdoptionReasons(pkg('旧'),pkg('新'),['BIG']).reviewedChanges,['BIG']));
test('no missing baseline can silently pass',()=>assert.throws(()=>guardApprovedAdoptionReasons({},pkg('説明')),/ADOPTION_GUARD_SUMMARY_MISSING/));
