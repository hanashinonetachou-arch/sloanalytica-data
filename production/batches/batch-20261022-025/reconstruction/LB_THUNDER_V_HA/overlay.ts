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
 const sharedBigGames='INP_THUNDER_BIG_FIRST_HALF_G';
 const bigRows=[['OBS_BIG_BELL_B','ベルB'],['OBS_BIG_BELL_C','ベルC'],['OBS_BIG_REACH','15枚リーチ目']];
 const overlapRows=[['OBS_OVERLAP_BELL_A','ベルA'],['OBS_OVERLAP_CHERRY_B','チェリーB'],['OBS_OVERLAP_WATER_A','スイカA'],['OBS_OVERLAP_WATER_B','スイカB'],['OBS_OVERLAP_REPLAY','リプレイ']];
 const bigSections=bigRows.map(([id])=>pkg.ui.v8Sections.find((s:any)=>s.id===id));
 if(bigSections.some((s:any)=>!s))throw Error('BIG_SECTIONS_MISSING');
 const commonInput=structuredClone(bigSections[0].items[0].inputs.find((x:any)=>x.input==='denominator'));
 if(commonInput?.inputId!==sharedBigGames)throw Error('SHARED_BIG_GAMES_ALIAS_REQUIRED');
 Object.assign(commonInput,{id:'THUNDER_BIG_COMMON_G',label:'BIG前半ゲーム数',gridSpan:12,engineBinding:{inputId:sharedBigGames}});
 const combinedBig={...bigSections[0],id:'OBS_BIG_FIRST_HALF',title:'BIG前半の停止形',description:'同じBIG前半の区間について、ゲーム数は1回だけ入力します。JAC待機BT・JAC中は含めません。回数は数えた項目だけを入力し、未確認は空欄のままにしてください。以前の保存分は対象区間を確認して共通のゲーム数を入力してください。',groups:[commonInput],items:bigRows.map(([,label],i)=>{const row=structuredClone(bigSections[i].items[0]);row.title=label;row.gridSpan=6;row.inputs=row.inputs.filter((x:any)=>x.input==='counter');for(const x of row.inputs)x.gridSpan=12;delete row.description;return row;})};
 const overlapSections=overlapRows.map(([id])=>pkg.ui.v8Sections.find((s:any)=>s.id===id));
 if(overlapSections.some((s:any)=>!s))throw Error('OVERLAP_SECTIONS_MISSING');
 const combinedOverlap={...overlapSections[0],id:'OBS_ROLE_OVERLAP',title:'小役別のボーナス同時当選',description:'同じ観測区間について、各役の成立回数と、そのうちボーナスに同時当選した回数を記録します。成立回数は役ごとに異なるため、それぞれ入力します。同時当選した役だけを抜き出さないでください。',groups:[],items:overlapRows.map(([,label],i)=>{const row=structuredClone(overlapSections[i].items[0]);row.title=label;row.gridSpan=12;delete row.description;return row;})};
 delete combinedBig.tabGroup;delete combinedOverlap.tabGroup;
 const bigIds=new Set(bigRows.map(([id])=>id)),overlapIds=new Set(overlapRows.map(([id])=>id));
 pkg.ui.v8Sections=pkg.ui.v8Sections.flatMap((section:any)=>bigIds.has(section.id)?section.id===bigRows[0][0]?[combinedBig]:[]:overlapIds.has(section.id)?section.id===overlapRows[0][0]?[combinedOverlap]:[]:[section]);
 for(const fid of ['BIG_BELL_C','BIG_REACH']){
  const feature=pkg.features.features.find((f:any)=>f.featureId===fid),input=pkg.inputs.inputs.find((x:any)=>x.id===feature.denominatorInputId);
  Object.assign(input,{inputVisible:false,derivedCalculation:'linear_combination',derivedTerms:[{inputId:sharedBigGames,multiplier:1}]});
 }
 const groups=[{id:'THUNDER_END_SCREENS',title:'ボーナス終了画面',tabs:[['EVI_BIG_END','通常BIG'],['EVI_BIG_1G_END','1G連BIG'],['EVI_REG_END','REG']]}];
 for(const group of groups)for(const [id,label] of group.tabs){const section=pkg.ui.v8Sections.find((s:any)=>s.id===id);if(!section)throw Error('TAB_SECTION_MISSING:'+id);section.tabGroup={id:group.id,title:group.title,label};}
 pkg.metadata.batch025Presentation={adapter:'thunder-only-v85',groups:groups.map(g=>({...g,tabs:g.tabs.map(([sectionId,label])=>({sectionId,label}))})),statisticalModelsUnchanged:false};
 delete pkg.metadata.thunderTabPresentation;
 pkg.metadata.thunderInlinePresentation={revision:'20261025',sharedBigGamesInputId:sharedBigGames,numericProbabilitiesAndPriorityUnchanged:true,legacyBigGamesRequireExplicitConfirmation:true};
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
