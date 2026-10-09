import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {validateCategoryRates} from '../src/batch009-rate-matrix.ts';

const root = path.resolve('batches', 'batch-20261008-009');
const read = (relative: string) => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
function validateRows(f: any, settings: Array<string|number>) {
  assert.deepEqual(Object.keys(f.settingPercentRows), settings.map(String));
  const table = {
    settings: settings.map(String),
    categories: f.categories,
    percentRows: settings.map((s) => f.settingPercentRows[String(s)])
  };
  assert.deepEqual(validateCategoryRates(table), [], f.findingId);
}
test('Sister Quest screen/monster categorical rates preserve six-setting coverage', () => {
  const d = read('research-quantitative-addenda/L_SISTER_QUEST_CA.json');
  assert.equal(d.status, 'SOURCE_CROSSCHECKED_NOT_CANONICAL');
  const screen = d.findings.find((f: any) => f.findingId === 'at-end-setting-distribution');
  const monster = d.findings.find((f: any) => f.findingId === 'at-monster-setting-distribution');
  assert.ok(screen && monster);
  validateRows(screen, [1,2,3,4,5,6]);
  validateRows(monster, [1,2,3,4,5,6]);
  assert.equal(screen.categories.length, 7);
  assert.equal(monster.categories.length, 4);
});
test('BIG島唄 conditional outcomes are source-tracked and omit nonexistent setting 4', () => {
  const d = read('research-quantitative-addenda/S_BIG_SHIMAUTA_E2_30.json');
  assert.deepEqual(d.settings, [1,2,3,5,6]);
  assert.equal(d.status, 'SOURCE_CROSSCHECKED_NOT_CANONICAL');
  for (const id of ['non-watermelon-non-confirmed-seesa-distribution','watermelon-seesa-distribution']) {
    const f = d.findings.find((x: any) => x.findingId === id);
    assert.ok(f);
    validateRows(f, d.settings);
  }
  assert.notEqual(d.findings[1].trialUniverse, d.findings[2].trialUniverse);
});
test('緑ドン reach-me replay retains all six public rates while research remains pending', () => {
  const d = read('research-evidence-staged/wave-1/L_MIDORIDON_VIVA_REVIVAL_FY.json');
  const f = d.findings.find((x: any) => x.findingId === 'reach-me-replay');
  assert.ok(f);
  assert.deepEqual(f.settingDistribution, {'1':'1/2978.9','2':'1/2978.9','3':'1/2520.6','4':'1/2520.6','5':'1/2048.0','6':'1/2048.0'});
  assert.notEqual(d.researchCompleteness.status, 'COMPLETE');
  assert.equal(f.liveObservation.status, 'UNRESOLVED');
  assert.equal(f.trialUniverse,'TOTAL_GAME_TRIAL');
  assert.equal(f.sourceVerification.status,'PUBLISHED_FULL_SIX_SETTING_TABLE_TWO_PUBLISHERS');
  assert.ok(f.sourceIds.includes('green-v23-full-small-role-scope'));
  assert.match(f.denominatorSemantics,/総ゲーム数/);
  assert.match(f.liveObservation.reason,/停止手順/);
});
test('バイオ5 special 256枚 is a noncontiguous setting constraint', () => {
  const d = read('research-evidence-reviewed/L_BIOHAZARD5_ZE.json');
  const f = d.evidenceCandidates.find((x: any) => x.findingId === 'special-medal');
  assert.ok(f);
  const c = f.semanticCategories.find((x: any) => x.label === '256枚OVER');
  assert.equal(c?.semanticType, 'EXACT_CONSTRAINT');
  assert.equal(c?.meaning, '設定2・5・6');
  assert.equal(f.semanticCategories.some((x: any) => x.label === '246枚OVER'), false);
});

test('BIG島唄 two distinct reset mode tables never become numeric setting likelihoods',()=>{
 const d=read('research-quantitative-addenda/S_BIG_SHIMAUTA_E2_30.json');
 assert.equal(d.referenceModeRateTables.length,2);
 const [change,afterBonus]=d.referenceModeRateTables;
 assert.equal(change.event,'SETTING_CHANGE');
 assert.equal(afterBonus.event,'BONUS_END_PARTIAL_ADVANTAGE_INTERVAL_RESET');
 assert.deepEqual(change.percentages,{'通常A':9.8,'通常B':9.8,'チャンス':30,'天国準備A':50,'天国準備B':0.4});
 assert.deepEqual(afterBonus.percentages,{'通常B':25,'天国準備A':25,'天国準備B':50});
 for(const t of [change,afterBonus]){
  assert.equal(t.numericInference,'FORBIDDEN_NO_SETTING_DIFFERENCE');
  assert.ok(t.sources.length>=2);
  assert.ok(t.sampleSpace&&t.event);
  assert.equal(Object.values(t.percentages).reduce((a:any,b:any)=>a+b,0),100);
 }
 const stage=read('research-evidence-staged/wave-2/S_BIG_SHIMAUTA_E2_30.json');
 assert.equal(stage.settings.values.includes('SET_4'),false);
 assert.equal(stage.settings.values.includes('SET_L'),false);
 assert.equal(stage.researchCompleteness.domains.find((x:any)=>x.domain==='RESET_BEHAVIOR').status,'CHECKED');
 for(const id of ['bonus-end-reset-shared-modes','mode-specific-ceilings-are-not-settings','no-visible-reset-lamp'])
  assert.ok(stage.blockedItems.some((x:any)=>x.blockId===id));
 assert.equal(stage.researchCompleteness.status,'INCOMPLETE');
});
