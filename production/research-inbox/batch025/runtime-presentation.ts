import {concreteAdoptionReason} from '../../src/adoption-reason.ts';
// Presentation adjustments only; accepted rates, settings and input IDs persist.
export function applyBatch025Presentation(pkg:any,index:number){
 const definitions:Record<number,any[]>={
  3:[['REG終了時の表示',[['OBS_PEACE_02','1枚役2回以下'],['OBS_PEACE_34','1枚役3～4回'],['OBS_PEACE_5','1枚役5回以上'],['EVI_REG_END','終了画面']]],['RT中の小役',[['OBS_HC_MISS','花火チャレンジ'],['OBS_HG_MISS','花火GAME']]]],
  7:[['BT開始時の役別JAC',[['OBS_JAC_HONEY','スベリハニベル'],['OBS_JAC_WHITE','白BAR・黒もや'],['OBS_JAC_BELL','ベル'],['OBS_JAC_REPLAY','リプレイ']]]],
  8:[['ボーナス中スイカ',[['EVI_BIG_WATER','BIG前半'],['EVI_REG_WATER','REG中']]]],
  9:[['ボーナス終了画面',[['EVI_BIG_END','通常BIG'],['EVI_BIG_1G_END','1G連BIG'],['EVI_REG_END','REG']]]],
  10:[['目押し成功時カットイン',[['EVI_REG_CUTIN','通常REG'],['EVI_FUTABA_CUTIN','フタバボーナス']]]],
 };
 const groups:any[]=[];
 for(const section of pkg.ui.v8Sections){
  if(typeof section.description==='string')section.description=section.description.replaceAll('設定候補の絞り込みに自動反映します','設定候補の絞り込みに反映できる可能性があります');
  const walk=(node:any)=>{
   // A/BT machines share the one play-information total-game input.
   if(index>=3&&node.playDataBinding?.source==='PLAY_TOTAL_GAME_DELTA')node.playDataBinding.mode='AUTO_EXACT';
   const tracking=node.interaction?.opportunityTracking;
   if(tracking){const feature=pkg.features.features.find((x:any)=>x.featureId===node.featureId);if(String(feature?.trialUniverse).includes('GAME')){tracking.quickAdd=[50];tracking.directNumeric=true;}}
   for(const child of [...(node.inputs??[]),...(node.items??[]),...(node.groups??[])])walk(child);
  };
  for(const node of [...(section.groups??[]),...(section.items??[])])walk(node);
 }
 for(const [i,[title,rows]] of (definitions[index]??[]).entries()){
  const id='B025_M'+index+'_GROUP'+(i+1),tabs=rows.map(([sectionId,label]:any)=>({sectionId,label}));
  for(const tab of tabs){const s=pkg.ui.v8Sections.find((x:any)=>x.id===tab.sectionId);if(!s)throw Error('PRESENTATION_SECTION_MISSING:'+tab.sectionId);s.tabGroup={id,title,label:tab.label};}
  groups.push({id,title,tabs});
 }
 if(index===8){const s=pkg.ui.v8Sections.find((x:any)=>x.id==='OBS_BIG');s.title='BIG・REG';s.items[0].title='BIG・REG';}
 if(index===9&&/^8\.5\.[34]-batch-20261022-025$/.test(pkg.machine.machineDataVersion)){
  const titles:Record<string,string>={BELL_B:'通常時小役',REG:'BIG・REG初当り',BIG_BELL_B:'BIG前半の停止形',REG_CAUSE_0:'ボーナス当選契機の内訳'};
  for(const [id,title] of Object.entries(titles)){
   const f=pkg.features.features.find((x:any)=>x.featureId===id);if(f)f.name=title;
   const s=pkg.ui.v8Sections.find((x:any)=>x.id==='OBS_'+id);if(s){s.title=title;for(const n of s.items??[])n.title=title;}
   const a=pkg.v8.machineResearchSummary.adopted.find((x:any)=>x.featureId===id);if(a)a.label=title;
  }
  const descriptions:Record<string,string>={
   BELL_B:'・実機連動機能で分類された通常時小役を、同じ区間の対象通常Gと一緒に入力します。総G差分は自動使用しません。\n・ボーナス・BT・成立後Gの区分を確認できない場合は対象Gを空欄にし、計算を停止してください。\n・通常時ベルA/Bは内部役・制御の分類です。BIG前半の下段ベルBと混同しないでください。\n・その区間の全Gで数えた役だけ入力します。数えていない役は空欄、確認済み0回は「0を記録」です。',
   REG:'・通常時初当りのBIG・REG回数と、同じ区間の確認済み対象通常Gを入力します。総G差分は自動使用しません。\n・RIZIN ZONEの初当りは含め、雷神ループのBIG前半再開は新しい初当りに含めません。\n・片方を数えていない場合は空欄のままにします。通常時小役を入力している間は重複加算せず、代替として待機します。',
   BIG_BELL_B:'・BIG前半で左3連Vを狙うと、ベルBは下段、Cは上段、Aは中段にベルが揃います。15枚リーチ目は崩れ目＋V字フラッシュです。\n・観測開始前に決めた同じ区間の対象Gと、その全Gで確認できた項目だけを入力します。実機連動機能の成立役記録を使用できます。\n・JAC・BT待機中を含めません。雷神ループ後のBIG前半は対象です。\n・枚数調整や判別不能Gの扱いを同区間の成立役記録と照合できない場合は、その区間を計算に使わないでください。判別できた結果だけを選んでGを除くこともできません。\n・未観測項目は空欄、確認済み0回だけ0を記録します。残余回数の手動入力は不要です。',
   REG_CAUSE_0:'・契機を区別して記録した同じ通常区間の対象Gを入力します。数えていない内訳は空欄にします。\n・通常時小役やBIG・REGの回数を記録している場合は、同じ当選情報を重ねて加算せず代替として待機します。',
   PREDECESSOR:'・同一区間の着席時ゲーム数・BIG・REGをすべて入力した場合だけ使用します。確認済み0回は0を入力してください。\n・ボーナス・BTや成立後Gが混在していない対象履歴か確認できない場合は、この3項目を入力しないでください。\n・自分の実戦区間を含めず、同じ履歴を複製して入力しません。その他ゲーム数は内部計算します。'
  };
  for(const s of pkg.ui.v8Sections){const id=s.id?.replace(/^OBS_/,'');if(descriptions[id])s.description=descriptions[id];}
  const roleMembers=['BELL_A','WATER_A','WATER_B','CHERRY_B'];
  for(const item of pkg.v8.machineResearchSummary.notAdopted){
   if(roleMembers.includes(item.featureId))item.reason='通常時小役の共同分布に統合しています。独立の尤度として重ねず、記録した役の内訳を同じ対象Gで評価します。';
   else if(item.featureId==='BIG')item.reason='BIG・REG初当りの共同分布に統合しています。BIGだけ、REGだけの部分観測も使用でき、通常時小役の記録がある間は重複加算せず代替として待機します。';
   else if(['BIG_BELL_C','BIG_REACH'].includes(item.featureId))item.reason='BIG前半の停止形の共同分布に統合しています。ベルB・ベルC・15枚リーチ目を別々の尤度として重ねません。未観測の項目は0回としません。';
   else if(item.featureId.startsWith('RED7_')||item.featureId.startsWith('VBIG_')||item.featureId.startsWith('REG_CAUSE_')){
    if(!pkg.features.features.some((f:any)=>f.featureId==='REG_CAUSE_0')){item.reason='公表確率は保持していますが、通常の停止形記録から内部の当選契機を全件分類できる手順が確認できません。一部を見抜けた回数を全通常Gで割ると誤推測になるため、数値推測には使いません。';continue;}
    const i=Number(item.featureId.split('_').at(-1));const constant=(item.featureId.startsWith('RED7_')&&[1,2,3,4].includes(i))||(item.featureId.startsWith('VBIG_')&&[1,2,3,4,7].includes(i));
    item.reason=constant?'設定別の公表値が同じため、この項目単独から設定差を得られません。公表値は保持し、共同分布の未観測の残余に含めます。':'ボーナス当選契機の内訳の共同分布に統合しています。記録した契機だけを同じ対象Gで比較し、小役やBIG・REGの別尤度とは重複加算しません。';
   }else if(item.featureId==='BIG_BELL_A')item.reason='公表分母の丸めにより、停止形の確率合計が1を超える設定があります。Aの公表分母を独立に乗算せず、採用した停止形以外の回数を内部で残余として扱います。';
  }
  pkg.metadata.observationContractRevision={version:Number(pkg.machine.machineDataVersion.split('.')[2].split('-')[0]),manualTargetGames:true,legacyTotalGamesNotReused:true,blankCategories:'MARGINALIZE',predecessorRequiresAllThree:true};
 }
 for(const item of pkg.v8?.machineResearchSummary?.adopted??[])item.reason=concreteAdoptionReason(pkg,item.featureId);
 for(const item of [...(pkg.v8?.machineResearchSummary?.adopted??[]),...(pkg.v8?.machineResearchSummary?.notAdopted??[])]){
  if(item.label===item.featureId&&['BIG','REG'].includes(item.label))item.label+='の出現率';
 }
 pkg.metadata.batch025Presentation={adapter:'batch025-reviewed-presentation-v1',groups,statisticalModelsUnchanged:true};
}
