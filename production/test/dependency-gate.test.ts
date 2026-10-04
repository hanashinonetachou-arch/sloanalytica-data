import test from 'node:test';import assert from 'node:assert/strict';import {buildDependencyReview} from '../src/dependency-gate.ts';
test('dependency review covers every computable numeric finding',()=>{const d=buildDependencyReview([{findingId:'a',observationType:'probability',trialUniverse:'NORMAL_GAME_TRIAL',settingDistribution:{'1':0.1,'6':0.2}},{findingId:'b',observationType:'probability',trialUniverse:'NORMAL_GAME_TRIAL',settingDistribution:{'1':0.05,'6':0.1}}]);assert.equal(d.summary.candidateCount,2);assert.equal(d.summary.groupCount,1);assert.equal(d.decisions.get('a').status,'DEFERRED_TO_CANDIDATE_CONTRACT')});
test('explicit independent review is respected',()=>{const d=buildDependencyReview([{findingId:'a',observationType:'probability',trialUniverse:'NORMAL_GAME_TRIAL',settingDistribution:{'1':0.1,'6':0.2},dependencyReview:{status:'INDEPENDENT',reason:'別抽選で直接的な包含関係がないことを確認。'}},{findingId:'b',observationType:'probability',trialUniverse:'NORMAL_GAME_TRIAL',settingDistribution:{'1':0.05,'6':0.1}}]);assert.equal(d.decisions.get('a').kind,'INDEPENDENT');assert.equal(d.decisions.get('b').kind,'REVIEWED_NO_OVERLAP')});
test('explicit cross-universe causal group is preserved',()=>{const d=buildDependencyReview([{findingId:'all',observationType:'probability',trialUniverse:'NORMAL_GAME_TRIAL',settingDistribution:{'1':0.1,'6':0.2},dependencyGroupId:'g',dependencyKind:'CAUSAL_OVERLAP',dependencyReason:'全体値'},{findingId:'part',observationType:'conditional_probability',trialUniverse:'ROLE_TRIAL',settingDistribution:{'1':0.05,'6':0.1},dependencyGroupId:'g',dependencyKind:'CAUSAL_OVERLAP',dependencyReason:'全体の一部'}]);assert.equal(d.decisions.get('all').groupId,'g');assert.equal(d.decisions.get('part').groupId,'g')});

test('auto-groups cross-universe subset trials instead of assuming independence',()=>{
 const d=buildDependencyReview([
  {findingId:'suika-all',observationType:'conditional_probability',trialUniverse:'SUIKA_TRIAL',settingDistribution:{'1':0.03,'6':0.04}},
  {findingId:'suika-lock',observationType:'conditional_probability',trialUniverse:'SUIKA_REEL_LOCK_TRIAL',settingDistribution:{'1':0.518,'6':0.584}},
 ]);
 assert.equal(d.summary.groupCount,1);
 assert.equal(d.decisions.get('suika-all').status,'DEFERRED_TO_CANDIDATE_CONTRACT');
 assert.equal(d.decisions.get('suika-lock').groupId,d.decisions.get('suika-all').groupId);
 assert.equal(d.decisions.get('suika-all').kind,'CROSS_UNIVERSE_OVERLAP_UNRESOLVED');
});
test('auto-groups normal and excluded-normal universes conservatively',()=>{
 const d=buildDependencyReview([
  {findingId:'at',observationType:'probability',trialUniverse:'NORMAL_GAME_TRIAL',settingDistribution:{'1':'1/366','6':'1/273.1'}},
  {findingId:'tenha',observationType:'probability',trialUniverse:'NON_TENHA_NORMAL_GAME_TRIAL',settingDistribution:{'1':'1/100.2','6':'1/81.3'}},
 ]);
 assert.equal(d.decisions.get('at').status,'DEFERRED_TO_CANDIDATE_CONTRACT');
 assert.equal(d.decisions.get('tenha').groupId,d.decisions.get('at').groupId);
});
