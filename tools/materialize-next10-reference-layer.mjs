#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
const ROOT=process.cwd();
const specs={
 L_IZA_BANCHO_SB8:[['DIRECT_BIG','直撃BIG','AT初当りとの包含関係が公開定義だけでは確定できず、独立尤度として併用すると二重計上のおそれがあるため数値推測には採用しない。'],['WEAK_CHERRY','弱チェリー','7000G規模でも設定1↔6の期待情報量が極小で、独立入力としての寄与が小さいため数値推測から除外。'],['MODE_STATE','モード・規定G・状態移行','条件別の同一試行母集団を実戦で安定して数えられないため数値推測には採用しない。']],
 L_ZETTAI_SHOGEKI_PLATONIC_HEART_TK:[['CZ','CZ関連','完全な同一条件分母を実戦で安定して取得できないため数値推測には採用しない。'],['ROLE_HIGH_STATE','成立役→高確移行・状態依存抽選','状態別の対象試行を正確に数える必要があり、通常総Gへ置換できないため数値推測には採用しない。']],
 L_WATASHI_NO_SHIAWASE_NA_KEKKON_PN:[['CZ','CZ関連','現在の検証済み取得経路では分母定義を十分に固定できないため数値推測には採用しない。'],['BONUS_THROUGH_CEILING','ボーナススルー天井振り分け','条件付き分母となるeligible attemptの観測母集団と一日あたりの対象試行数が安定せず、同一条件の分母を確定できないため数値推測には採用しない。']],
 LB_TRIPLE_CROWN_SF4:[['BONUS_TOTAL','ボーナス合算','BIG+REGの決定的集計値であり、採用済みBIG/REGと同時利用すると同一事象を重複評価するため除外。'],['ROLE_BONUS_OVERLAP','小役別ボーナス同時当選','採用済み小役とボーナス事象を同じ観測から再利用する構成で、joint modelなしでは独立尤度として扱えず二重計上となるため数値推測には採用しない。']],
 LB_MATADOR_3_TT:[['BONUS_TOTAL','ボーナス合算','BB+RBの決定的集計値であり、採用済みBB/RBと同時利用すると重複評価になるため除外。'],['BT_ONE_COIN','BT中1枚役','公開設定差は大きいが分母はBT中ゲームであり、総Gではない。安定したBT試行数取得経路が未確立のため数値推測には採用しない。'],['NORMAL_ROLE_OVERLAP','通常時小役・同時当選','成立役と同時当選を同じ観測事象から再利用する構成だが、依存関係表と同一条件分母が未確立で独立尤度にできないため数値推測には採用しない。']],
 L_TENSEI_SHITARA_KEN_DESHITA_GT:[['CZ_INITIAL','CZ初当り','ATへ至る上流経路で、AT初当りと独立に掛けると過信につながるため除外。'],['BONUS_INITIAL','ボーナス初当り','ATへ至る上流経路で、AT初当りと独立に掛けると過信につながるため除外。'],['WEAK_CHANCE_STATE_BONUS','状態別 弱チャンス役→ボーナス','通常・高確・超高確ごとに別の試行母集団であり、内部状態の正確な機会数を数えられないため数値推測には採用しない。'],['MODE_GAME','規定G・モード','条件付き母集団を実戦で安定して観測できないため数値推測には採用しない。']],
 L_DARLING_IN_THE_FRANXX_SA:[['BONUS_HIGH_INITIAL','ボーナス高確初当り','総ボーナス初当りに対する状態限定subsetであり、独立利用を避けるため数値推測には採用しない。'],['CZ_COMBINED','CZ合算','弱く非単調な設定差に加えてサブタイプ構成との重複があるため数値推測には採用しない。'],['CONNECT_LEVEL','コネクトチャンス初期レベル・成功率','レベル別の条件付き分母となるeligible attemptを個別に観測する必要があり、総試行数へ集約すると試行母集団が変わるため数値推測には採用しない。'],['FRANXX_HIGH_TRANSITION','フランクス高確移行','成立役・状態別条件付き試行で、総ゲーム数へ置換できないため数値推測には採用しない。']],
 L_SAKI_CHOJO_KESSEN_YR:[['CZ_INITIAL','CZ初当り','ATへ至る上流経路で、AT初当りと独立に掛けると二重評価のおそれがあるため除外。'],['CYCLE_RIVAL_STATE','周期・ライバルモード・状態関連','条件付きの正確な試行機会をデフォルト実戦で安定取得できないため数値推測には採用しない。'],['CZ_THROUGH','CZスルー天井','eligible attemptが少なく条件付き母集団のため数値推測には採用しない。'],['KIYOSUMI_TRIAL','清澄トライアル','条件付き試行の完全な観測経路が未確立のため数値推測には採用しない。']],
 S_KONOSUBA_ZR:[['EMERGENCY_QUEST','緊急クエスト相手振り分け','条件付きカテゴリ分布で一日試行数が少なく、標準の数値推測には採用しない。'],['QUEST_RANK_SUCCESS','クエストランク別成功率','ランク別の条件付き分母となるeligible attemptを別々に観測する必要があり、総クエスト数へ集約すると試行母集団が変わるため数値推測には採用しない。'],['BATH_INITIAL_POINTS','お風呂ゾーン初期pt','条件付きカテゴリ分布で、安定した試行数・完全分布の入力経路が未確立のため数値推測には採用しない。'],['BONUS_7_ALIGN','ボーナス中7揃い','条件付き試行の完全な分母取得が未確立のため数値推測には採用しない。'],['HIDDEN_MODE','裏モード移行','内部状態を確定観測できないため数値推測には採用しない。']],
 S_RAKUEN_TSUHO_FS:[['RD_INITIAL','RD初当り','採用済みBB/RD/AT合算の構成要素であり、独立利用すると重複評価になるため除外。'],['AT_INITIAL','AT初当り','採用済みBB/RD/AT合算の構成要素であり、独立利用すると重複評価になるため除外。'],['STATE_ROLE_DRAW','通常/高確の成立役別初当り抽選','状態別eligible attemptを正確に数える必要があり、通常総Gへ置換できないため数値推測には採用しない。'],['NAH_TRANSITION','NAH高確移行・覚醒チャレンジ','条件付き試行の完全な分母観測が未確立のため数値推測には採用しない。']]
};
function read(p){return JSON.parse(fs.readFileSync(p,'utf8'))}function write(p,v){fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n')}
for(const [id,items] of Object.entries(specs)){
 const dir=path.join(ROOT,'research',id),rp=path.join(dir,'research-data.json'),sp=path.join(dir,'selection-data.json');
 const r=read(rp),s=read(sp); r.features??=[]; s.features??=[];
 for(const [suffix,name,reason] of items){
  const rid=`RF_REF_${suffix}`,fid=`FEAT_REF_${suffix}`;
  const researchFeature=r.features.find(x=>x.researchFeatureId===rid);
  if(!researchFeature) r.features.push({researchFeatureId:rid,name,factStatus:'low_priority_hold',candidateModel:'binomial',trialUnit:'公開条件を満たす対象試行',numeratorDefinition:`${name}の条件成立回数`,denominatorDefinition:`${name}が定義される公開上の正しい対象試行数`,settingValues:{},sourceRefs:(r.sources??[]).map(x=>x.sourceId),crossSourceStatus:(r.sources??[]).length>1?'cross_checked':'single_source',notes:reason});
  else researchFeature.notes=reason;
  const selectionFeature=s.features.find(x=>x.researchFeatureId===rid);
  if(!selectionFeature) s.features.push({researchFeatureId:rid,featureId:fid,adoptionCategory:'EXCLUDE',weight:1,userFacingReason:reason,rejectionReason:reason,difficultyParticipation:'EXCLUDE'});
  else {
   selectionFeature.userFacingReason=reason;
   selectionFeature.rejectionReason=reason;
  }
 }
 write(rp,r);write(sp,s);
}
const report={schemaVersion:'next10-reference-materialization-v1',generatedAt:new Date().toISOString(),status:'PASS_REFERENCE_TRACE',machineCount:Object.keys(specs).length,policy:['REFERENCE候補は入力欄・数値尤度を持たない。','重複/条件付き/内部状態の理由を具体的に保持する。','将来再採用時はResearch→Selection→Observationを再度通す。'],evidenceLayerStatus:'PENDING_SEPARATE_NORMALIZATION'};
fs.writeFileSync(path.join(ROOT,'reports/batch-20260904-next10-reference-materialization.json'),JSON.stringify(report,null,2)+'\n');
console.log('Materialized REFERENCE/EXCLUDE trace 10/10');
