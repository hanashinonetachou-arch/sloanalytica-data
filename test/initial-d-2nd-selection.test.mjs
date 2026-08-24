import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const selection=JSON.parse(fs.readFileSync('research/L_INITIAL_D_2ND/selection-data.json','utf8'));
const generated=JSON.parse(fs.readFileSync('build/L_INITIAL_D_2ND/machine-package.generated.json','utf8'));
const difficulty=JSON.parse(fs.readFileSync('reports/difficulty-L_INITIAL_D_2ND.json','utf8'));

test('Initial D 2nd excludes AT initial hit from input/inference and keeps LB/bell as numeric inference',()=>{
  const byId=new Map(generated.features.features.map(f=>[f.featureId,f]));
  assert.equal(byId.get('FEAT_LB_INITIAL')?.probabilityEngineUsage,true);
  assert.equal(byId.get('FEAT_BELL_NORMAL')?.probabilityEngineUsage,true);
  assert.equal(byId.has('FEAT_AT_INITIAL'),false);
  assert.equal(selection.inputs.some(i=>i.id==='INP_AT_INITIAL_COUNT'),false);
  const atSelection=selection.features.find(f=>f.researchFeatureId==='RF_AT_INITIAL');
  assert.equal(atSelection?.adoptionCategory,'EXCLUDE');
  assert.match(atSelection?.rejectionReason??'',/LB初当りと重複/);
});

test('Initial D 2nd bell denominator preserves exclusion contract during migration',()=>{
  const excluded=selection.inputs.find(i=>i.id==='INP_BELL_EXCLUDED_GAMES');
  const legacy=selection.inputs.find(i=>i.id==='INP_BELL_TARGET_GAMES');
  const feature=selection.features.find(f=>f.featureId==='FEAT_BELL_NORMAL');
  if(excluded){
    assert.equal(legacy,undefined);
    const wording=`${excluded.name??''} ${excluded.description??''}`;
    assert.match(wording,/除外/);
    assert.match(wording,/押し順ナビ区間/);
    assert.match(wording,/LB中/);
    assert.equal(feature?.denominatorInputId,'INP_MY_SAMMY_NORMAL_GAMES');
    assert.deepEqual(feature?.denominatorAdjustments,[{inputId:'INP_BELL_EXCLUDED_GAMES',multiplier:-1}]);
  }else{
    assert.ok(legacy,'legacy direct bell-target input must remain valid before migration is committed');
    assert.match(legacy?.name??'',/押し順ナビ区間.*LB中.*除外/);
    assert.equal(feature?.denominatorInputId,'INP_BELL_TARGET_GAMES');
    assert.equal(feature?.denominatorAdjustments,undefined);
  }
});

test('Initial D 2nd 86 OVER occurrence state is single-select',()=>{
  const group=selection.evidenceUi.groups.find(g=>g.groupId==='INITIAL_D_PAYOUT_86_COUNT');
  assert.equal(group?.selectionMode,'single');
  assert.deepEqual(group?.options.map(o=>o.value),['OVER_86_1_2','OVER_86_3','OVER_86_4']);
});

test('Initial D 2nd AT-LB end screen uses app-compatible implicit default residual and preserves red/gold as evidence',()=>{
  const f=generated.features.features.find(x=>x.featureId==='FEAT_AT_LB_END_SCREEN');
  assert.equal(f?.probabilityEngineUsage,true);
  assert.deepEqual(f?.categoryLabels,['奇数示唆','偶数示唆','水着']);
  assert.deepEqual(f?.categoryConditioning?.excludedCategories,['設定4以上','設定6']);
  assert.equal(f?.categoryConditioning?.residualCategory,'デフォルト');
  for(const probs of Object.values(f?.categoryProbabilities??{})){
    const explicit=probs.reduce((a,b)=>a+b,0);
    assert.ok(explicit>0 && explicit<1);
  }
  const screenGroup=selection.evidenceUi.groups.find(g=>g.groupId==='INITIAL_D_LB_END');
  assert.ok(screenGroup?.options.some(o=>o.value==='RED'));
  assert.ok(screenGroup?.options.some(o=>o.value==='GOLD'));
});

test('Initial D 2nd swimsuit-only feature is excluded because full end-screen distribution is used',()=>{
  const f=selection.features.find(x=>x.featureId==='FEAT_AT_LB_END_SWIMSUIT_ONLY');
  assert.equal(f?.adoptionCategory,'EXCLUDE');
  assert.match(f?.rejectionReason??'',/終了画面全体/);
});

test('Initial D 2nd conditioned end-screen estimate beats swimsuit-only estimate',()=>{
  const byId=new Map(difficulty.featureTrialEstimates.map(f=>[f.featureId,f]));
  assert.equal(byId.get('FEAT_AT_LB_END_SCREEN')?.requiredTrials80,38);
  assert.equal(byId.get('FEAT_AT_LB_END_SWIMSUIT_ONLY')?.requiredTrials80,59);
});

test('Initial D 2nd LB denominator field verification resolves publish blocker',()=>{
  const research=JSON.parse(fs.readFileSync('research/L_INITIAL_D_2ND/research-data.json','utf8'));
  const review=JSON.parse(fs.readFileSync('build/L_INITIAL_D_2ND/prepublish-review.json','utf8'));
  const conflict=research.conflicts.find(c=>c.conflictId==='C_LB_AT_DENOMINATOR');
  assert.equal(conflict?.resolutionStatus,'resolved');
  assert.match(conflict?.resolutionNote??'',/2334G/);
  assert.equal(review.status,'PASS');
  assert.equal(review.publishGate?.allowed,true);
  assert.deepEqual(review.publishGate?.blockingItems,[]);
});

test('Initial D 2nd removes AT reference input and does not generate a reference section',()=>{
  assert.equal(selection.inputs.some(i=>i.id==='INP_AT_INITIAL_COUNT'),false);
  const refSection=generated.ui.sections.find(s=>s.title==='参考記録');
  assert.equal(refSection,undefined);
  const hitSection=generated.ui.sections.find(s=>s.title==='初当り');
  assert.equal(hitSection?.items.some(i=>i.inputId==='INP_AT_INITIAL_COUNT')??false,false);
});

test('Initial D 2nd exposes an automatic selected/rejected summary',()=>{
  const summary=generated.selectionSummary;
  assert.equal(summary?.schemaVersion,'selection-summary-v1');
  assert.equal(summary?.evaluatedCount,14);
  assert.equal(summary?.selectedCount,3);
  assert.equal(summary?.rejectedCount,11);
  assert.ok(summary?.selected.some(i=>i.name==='通常時レジェンドバトル初当り'));
  assert.ok(summary?.rejected.some(i=>i.name==='ATレジェンドラッシュ初当り' && /LB初当りと重複/.test(i.reason)));
});

test('Initial D 2nd selection summary exposes trial-unit-aware required trial estimates',()=>{
  const summary=generated.selectionSummary;
  const selected=new Map(summary.selected.map(i=>[i.featureId,i]));
  const rejected=new Map(summary.rejected.map(i=>[i.featureId,i]));
  assert.deepEqual(selected.get('FEAT_LB_INITIAL')?.requiredTrials,{value:23449,unit:'通常時LB抽選対象ゲーム'});
  assert.deepEqual(selected.get('FEAT_BELL_NORMAL')?.requiredTrials,{value:6084,unit:'押し順ナビ区間を除くゲーム'});
  assert.deepEqual(selected.get('FEAT_AT_LB_END_SCREEN')?.requiredTrials,{value:38,unit:'AT中LB終了画面の表示1回'});
  assert.deepEqual(rejected.get('FEAT_CHERRY_LOW_NORMAL_LB')?.requiredTrials,{value:113,unit:'低確・通常中チェリー成立'});
  assert.deepEqual(rejected.get('FEAT_LB_SCENARIO')?.requiredTrials,{value:7,unit:'AT終了時のシナリオ選択'});
});

test('Initial D 2nd AT-LB end screen materializes summed trial denominator for app FeatureEngine',()=>{
  const f=generated.features.features.find(x=>x.featureId==='FEAT_AT_LB_END_SCREEN');
  assert.equal(f?.inputTransform,'sum_inputs_to_trials');
  assert.equal(f?.denominatorInputId,'INP_AT_LB_END_DEFAULT_COUNT');
  assert.deepEqual(f?.denominatorInputIds,[
    'INP_AT_LB_END_DEFAULT_COUNT',
    'INP_AT_LB_END_ODD_COUNT',
    'INP_AT_LB_END_EVEN_COUNT',
    'INP_AT_LB_END_SWIMSUIT_COUNT'
  ]);
  assert.equal(f?.numeratorInputId,'INP_AT_LB_END_ODD_COUNT');
  assert.deepEqual(f?.categoryInputIds,['INP_AT_LB_END_EVEN_COUNT','INP_AT_LB_END_SWIMSUIT_COUNT']);
  assert.deepEqual(f?.categoryLabels,['奇数示唆','偶数示唆','水着']);
  assert.equal(f?.categoryConditioning?.residualCategory,'デフォルト');
  for(const probs of Object.values(f?.categoryProbabilities??{})){
    assert.ok(probs.reduce((a,b)=>a+b,0)<1,'default must remain implicit residual probability');
  }
});
