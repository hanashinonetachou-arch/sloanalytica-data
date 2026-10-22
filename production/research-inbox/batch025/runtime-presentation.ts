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
 for(const item of pkg.v8?.machineResearchSummary?.adopted??[])item.reason=concreteAdoptionReason(pkg,item.featureId);
 for(const item of [...(pkg.v8?.machineResearchSummary?.adopted??[]),...(pkg.v8?.machineResearchSummary?.notAdopted??[])]){
  if(item.label===item.featureId&&['BIG','REG'].includes(item.label))item.label+='の出現率';
 }
 pkg.metadata.batch025Presentation={adapter:'batch025-reviewed-presentation-v1',groups,statisticalModelsUnchanged:true};
}
