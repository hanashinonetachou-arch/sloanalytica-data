import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');

const maps={
 L_SAO2_PA1:{
  'CZ初当り':'FEAT_CZ_INITIAL','AT初当り':'FEAT_AT_INITIAL','低確滞在時スイカ→シューティングチャージ':'FEAT_WATERMELON_SC_NORMAL','低確滞在時 強チェリー→CZ':'FEAT_STRONG_CHERRY_CZ_NORMAL','高確滞在時 強チェリー→CZ':'FEAT_STRONG_CHERRY_CZ_HIGH','GGOモード詩乃によるAT直撃出現率':'FEAT_SHINO_AT_DIRECT','突入時THE END状態の確定CZ':'FEAT_CONFIRMED_CZ','CZ失敗時アイテム獲得':'FEAT_CZ_FAIL_ITEM','強チャンス目→確定CZ':'FEAT_STRONG_CHANCE_CONFIRMED_CZ','AT初当り時ステージ選択率':'FEAT_AT_INITIAL_STAGE','強チャンス目B出現率':'FEAT_STRONG_CHANCE_B','CZ失敗時 曠野の決闘突入':'FEAT_WILDERNESS_DUEL'
 },
 L_SENGOKU_OTOME5_L8:{
  'AT初当り':'FEAT_AT_INITIAL','巫女ポイント0pt到達時 乙女アタック当選':'FEAT_OTOME_ATTACK_ZERO_PT','戦国乙女ボーナス出現':'FEAT_SENGOKU_OTOME_BONUS','強カワチャンス出現率':'FEAT_STRONG_KAWA_SET1','繚乱の刻・紫炎 AT期待度':'FEAT_RYORAN_SHIEN_SUCCESS','本能寺の変 突入率':'FEAT_HONNOJI_ENTRY','本能寺の変 勝利期待度':'FEAT_HONNOJI_WIN','決戦ノ刻 勝利期待度':'FEAT_KESSEN_WIN','出陣ボーナス確率':'FEAT_SHUTSUJIN_BONUS','剣聖チャンス成功期待度（AT初当り時）':'FEAT_KENSEI_SUCCESS_INITIAL','剣聖チャンス成功期待度（AT終了時）':'FEAT_KENSEI_SUCCESS_END','カシンバトル 勝利期待度':'FEAT_KASHIN_WIN','オウガイバトル 勝利期待度':'FEAT_OUGAI_WIN'
 },
 L_LOTIS_TN:{
  'BIG初当り':'FEAT_BIG','REG初当り':'FEAT_REG','擬似チェリー→本前兆移行':'FEAT_PSEUDO_CHERRY_TRUE_PRELUDE','擬似チェリー→フェイク前兆移行':'FEAT_PSEUDO_CHERRY_FAKE_PRELUDE','フェイク前兆中 本前兆書き換え':'FEAT_FAKE_TO_TRUE_REWRITE','リアルチェリーB（平行揃い）':'FEAT_REAL_CHERRY_B','朝一モード滞在時ボーナス当選率':'FEAT_MODE_BONUS_MORNING','チャンスモード滞在時ボーナス当選率':'FEAT_MODE_BONUS_CHANCE','通常A/B・天国準備滞在時ボーナス当選率':'FEAT_MODE_BONUS_NORMAL','引き戻しA滞在時ボーナス当選率':'FEAT_MODE_BONUS_RETURN_A','引き戻しB滞在時ボーナス当選率':'FEAT_MODE_BONUS_RETURN_B'
 }
};

for(const [id,nameMap] of Object.entries(maps)){
 const p=`research/${id}/selection-data.json`,s=read(p),byId=new Map(s.features.map(f=>[f.featureId,f]));
 const sum=s.selectionSummaryContract;
 if(!sum) throw new Error(`${id}: missing selectionSummaryContract`);
 const resolve=item=>item.featureId||nameMap[item.name];
 sum.selected=(sum.selected||[]).map(item=>({...item,featureId:resolve(item)})).filter(item=>{
   if(!item.featureId) throw new Error(`${id}: unresolved selected summary ${item.name}`);
   const f=byId.get(item.featureId); if(!f) throw new Error(`${id}: missing selected feature ${item.featureId}`);
   return f.adoptionCategory!=='EXCLUDE';
 });
 sum.rejected=(sum.rejected||[]).map(item=>({...item,featureId:resolve(item)}));
 for(const f of s.features.filter(f=>f.adoptionCategory==='EXCLUDE')){
   if(sum.rejected.some(x=>x.featureId===f.featureId)) continue;
   const name=Object.entries(nameMap).find(([,fid])=>fid===f.featureId)?.[0]||f.featureId;
   sum.rejected.push({name,reason:f.userFacingReason||f.userReason,featureId:f.featureId});
 }
 for(const item of sum.rejected){
   if(!item.featureId) throw new Error(`${id}: unresolved rejected summary ${item.name}`);
   const f=byId.get(item.featureId); if(!f) throw new Error(`${id}: missing rejected feature ${item.featureId}`);
   item.reason=f.userFacingReason||f.userReason||item.reason;
 }
 sum.selectedCount=sum.selected.length; sum.rejectedCount=sum.rejected.length; sum.evaluatedCount=sum.selectedCount+sum.rejectedCount;
 if(s.denominatorSharingContract?.sharedGroups){
   const active=new Set(s.features.filter(f=>f.adoptionCategory!=='EXCLUDE').map(f=>f.featureId));
   s.denominatorSharingContract.sharedGroups=s.denominatorSharingContract.sharedGroups.map(g=>({...g,featureIds:(g.featureIds||[]).filter(fid=>active.has(fid))})).filter(g=>g.featureIds.length>=2);
 }
 write(p,s);
}
console.log('Round2 selection summary contracts synchronized');
