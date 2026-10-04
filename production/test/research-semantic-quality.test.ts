import test from 'node:test';
import assert from 'node:assert/strict';
import {validateResearchProbabilityRouteContract,validateResearchBlockedUserFacingTextContract} from '../src/research-validator.ts';

test('probability-known distributions cannot remain evidence-only',()=>{
  assert.throws(
    ()=>validateResearchProbabilityRouteContract({findingId:'known',observationType:'evidence',settingDistribution:{'1':'A 50% / B 50%','6':'A 30% / B 70%'}}),
    /PROBABILITY_KNOWN_EVIDENCE_ONLY/
  );
  assert.doesNotThrow(()=>validateResearchProbabilityRouteContract({findingId:'unknown',observationType:'evidence'}));
});

test('blocked research reasons do not expose implementation-only UI contracts',()=>{
  assert.throws(
    ()=>validateResearchBlockedUserFacingTextContract({blockId:'ui-only',reason:'現行の数値入力ContractではUIを生成できない。',reevaluationCondition:'UI Contractが固定されること。'}),
    /BLOCK_INTERNAL_IMPLEMENTATION_TEXT/
  );
  assert.doesNotThrow(()=>validateResearchBlockedUserFacingTextContract({blockId:'data-gap',reason:'設定別の数値が公開されていない。',reevaluationCondition:'設定別の出現率が確認できること。'}));
});
