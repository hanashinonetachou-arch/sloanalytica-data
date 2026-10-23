import {concreteAdoptionReason} from '../../../../src/adoption-reason.ts';

// Machine-owned overlay. Uses only fields already supported by pre-audit App e161e1f.
export function applyThunderOnlyOverlay(pkg:any){
 if(pkg.machine.machineId!=='LB_THUNDER_V_HA')throw Error('THUNDER_ONLY');
 const pre=pkg.features.features.find((f:any)=>f.featureId==='PREDECESSOR');
 const residual=pkg.inputs.inputs.find((x:any)=>x.id==='PREDECESSOR.categoryCounts.3_その他');
 if(!pre||residual?.derivedCalculation!=='linear_combination')throw Error('PREDECESSOR_RESIDUAL_REQUIRED');
 // The strict existing linear combination is undefined unless G/BIG/REG were all observed.
 // Multiplication by zero preserves the denominator but makes an incomplete cohort ineligible.
 pre.denominatorAdjustments=[{inputId:residual.id,multiplier:0}];
 for(const s of pkg.ui.v8Sections){
  if(s.id==='OBS_SHARED_BONUS_ELIGIBLE_GAME_TRIAL'){
   s.title='通常時の小役・REG';
   s.description='同じ確認済み区間のゲーム数と回数を記録します。観測できた優先項目1つで計算し、未観測なら次の項目に切り替えます。数えていない欄は空欄のままにしてください。';
  }
  for(const g of s.groups??[])if(g.playDataBinding?.source==='PLAY_TOTAL_GAME_DELTA')g.label='対象通常ゲーム数';
 }
 const screens=[['EVI_BIG_END','通常BIG'],['EVI_BIG_1G_END','1G連BIG'],['EVI_REG_END','REG']];
 for(const [id,label] of screens){const s=pkg.ui.v8Sections.find((s:any)=>s.id===id);if(!s)throw Error('SCREEN_MISSING');s.tabGroup={id:'THUNDER_END_SCREENS',title:'ボーナス終了画面',label};}
 pkg.metadata.batch025Presentation={adapter:'thunder-only-v85',groups:[{id:'THUNDER_END_SCREENS',title:'ボーナス終了画面',tabs:screens.map(([sectionId,label])=>({sectionId,label}))}],statisticalModelsUnchanged:false};
 for(const f of pkg.features.features){
  f.displayFormat=String(f.trialUniverse).includes('GAME')?'ratio_1_over_n':'percentage';
  if(f.featureId==='PREDECESSOR')f.displayFormat='percentage';
  f.selectionRationale.adoptionReason=concreteAdoptionReason(pkg,f.featureId);
 }
 for(const a of pkg.v8.machineResearchSummary.adopted)a.reason=concreteAdoptionReason(pkg,a.featureId);
 pkg.metadata.thunderOnlyReconstruction={sharedEngineChanged:false,baselineApp:'e161e1f352c4f2042550aee2bfdd04c7a1ed735e',observationPolicy:'EXPLICIT_ZERO_IS_OBSERVED_MISSING_IS_DISABLED',legacyBigBreakdown:'Old category-count records remain with their original snapshots; do not reinterpret them as new Bernoulli counters.',predecessorCompleteness:'STRICT_DERIVED_RESIDUAL_ZERO_DENOMINATOR_ADJUSTMENT'};
}

export function applyThunderPlayInfo(doc:any){
 if(doc.machineId!=='LB_THUNDER_V_HA')throw Error('THUNDER_ONLY');
 doc.playInfo.totalGamesLabel='対象通常ゲーム数';
 doc.playInfo.totalGamesDescription='ボーナス・BT中を除く通常区間のゲーム数を入力してください。小役は成立後も除き、回数と集計区間をそろえます。対象区間が一致すると確認できない台の表示値は、そのまま使わないでください。';
}
