import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const selection=JSON.parse(fs.readFileSync('research/L_INITIAL_D_2ND/selection-data.json','utf8'));
const generated=JSON.parse(fs.readFileSync('build/L_INITIAL_D_2ND/machine-package.generated.json','utf8'));
const difficulty=JSON.parse(fs.readFileSync('reports/difficulty-L_INITIAL_D_2ND.json','utf8'));

test('Initial D 2nd keeps AT initial hit display-only and LB/bell as numeric inference',()=>{
  const byId=new Map(generated.features.features.map(f=>[f.featureId,f]));
  assert.equal(byId.get('FEAT_LB_INITIAL')?.probabilityEngineUsage,true);
  assert.equal(byId.get('FEAT_BELL_NORMAL')?.probabilityEngineUsage,true);
  assert.equal(byId.get('FEAT_AT_INITIAL_REFERENCE')?.probabilityEngineUsage,false);
});

test('Initial D 2nd bell denominator UI preserves nav-exclusion condition',()=>{
  const input=selection.inputs.find(i=>i.id==='INP_BELL_TARGET_GAMES');
  assert.match(input?.name??'',/押し順ナビ区間.*LB中.*除外/);
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

test('Initial D 2nd keeps AT reference input in initial-hit section so no empty reference section is generated',()=>{
  const atInput=selection.inputs.find(i=>i.id==='INP_AT_INITIAL_COUNT');
  assert.equal(atInput?.category,'PRIMARY_INITIAL_HIT');
  const refSection=generated.ui.sections.find(s=>s.title==='参考記録');
  assert.equal(refSection,undefined);
  const hitSection=generated.ui.sections.find(s=>s.title==='初当り');
  assert.ok(hitSection?.items.some(i=>i.inputId==='INP_AT_INITIAL_COUNT'));
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
