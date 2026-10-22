// Input copy belongs to observation/UI construction. No source values change.
export function applyBatch025ObservationLabels(doc:any){
 if(['L_HANABI_KM','LB_THUNDER_V_HA'].includes(doc.machineId))doc.gameCountPolicy='TOTAL_ONLY';
 const labels:Record<string,[string,string]>={
  MANUAL_NORMAL_GAME_TRIAL:['確認した対象通常G','該当回数'],
  BIG_GAME_TRIAL:['BIG消化ゲーム数','風鈴B成立回数'],
  REG_GAME_TRIAL:['REG消化ゲーム数','1枚役成立回数'],
  HANABI_CHALLENGE_GAME:['消化ゲーム数','ハズレ回数'],
  HANABI_GAME_GAME:['消化ゲーム数','ハズレ回数'],
  REG_END_PEACE_02:['1枚役2回以下のREG終了回数','ピース花火回数'],
  REG_END_PEACE_34:['1枚役3～4回のREG終了回数','ピース花火回数'],
  REG_END_PEACE_5:['1枚役5回以上のREG終了回数','ピース花火回数'],
  BIG_SMALL_GAME_TRIAL:['小役ゲーム数','羽B成立回数'],
  JAC_GAME_TRIAL:['JAC消化ゲーム数','リーチ目回数'],
  REG_END_TRIAL:['REG終了回数','壁画調回数'],
  BT_MISS_OR_JACIN:['純ハズレ・JACIN合計回数','純ハズレ回数'],
  BONUS_EVENT_TRIAL:['ボーナス回数','赤7頭回数'],
  BT_JAC_TRIAL:['JAC開始回数','終了JAC回数'],
  BT_FIRST_ROLE_HONEY:['スベリハニベル契機のJAC回数','継続JAC以上の回数'],
  BT_FIRST_ROLE_WHITE:['白BAR狙え・黒もやのJAC回数','継続JAC以上の回数'],
  BT_FIRST_ROLE_BELL:['ベル契機のJAC回数','継続JAC以上の回数'],
  BT_FIRST_ROLE_REPLAY:['リプレイ契機のJAC回数','継続JAC以上の回数'],
  BIG_BONUS_GAME_TRIAL:['BIG前半ゲーム数','ベルB回数'],
  PREDECESSOR_BONUS_ELIGIBLE_GAME:['着席前総ゲーム数','BIG回数'],
 };
 for(const o of doc.observations??[]){
  if(doc.machineId==='LB_THUNDER_V_HA'&&o.findingId==='PREDECESSOR')o.inputIdAliases={
   'PREDECESSOR.eligibleTrialCount':'INP_PREDECESSOR_GAMES',
   'PREDECESSOR.categoryCounts.1_BIG':'INP_PREDECESSOR_BIG_COUNT',
   'PREDECESSOR.categoryCounts.2_REG':'INP_PREDECESSOR_REG_COUNT',
  };
  if(doc.machineId==='LB_THUNDER_V_HA'&&o.findingId!=='PREDECESSOR'){
   o.inputIdAliases={...(o.inputIdAliases??{}),[o.findingId+'.eligibleTrialCount']:o.findingId+'.verifiedTrialCount'};
   if(o.findingId==='BELL_B'){
    const ids=['BELL_A','BELL_B','WATER_A','WATER_B','CHERRY_B'],names=['ベルA','ベルB','スイカA','スイカB','チェリーB'];
    ids.forEach((id,i)=>o.inputIdAliases['BELL_B.categoryCounts.'+(i+1)+'_'+names[i]]=id+'.successCount');
   }
   if(o.findingId==='REG')Object.assign(o.inputIdAliases,{'REG.categoryCounts.1_BIG':'BIG.successCount','REG.categoryCounts.2_REG':'REG.successCount'});
  }
  const pair=labels[o.trialUniverse];
  if(pair)o.inputPresentation={trialLabel:pair[0],successLabel:pair[1]};
 }
}
