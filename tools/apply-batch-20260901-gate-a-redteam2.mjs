import fs from 'node:fs';
import path from 'node:path';
const ROOT=process.cwd();
const p=id=>path.join(ROOT,'research',id,'research-data.json');
const r=id=>JSON.parse(fs.readFileSync(p(id),'utf8'));
const w=(id,d)=>fs.writeFileSync(p(id),JSON.stringify(d,null,2)+'\n');
function upsert(a,k,x){const i=a.findIndex(v=>v[k]===x[k]);if(i>=0)a[i]=x;else a.push(x)}
function source(d,x){upsert(d.sources,'sourceId',x)}
function feat(d,x){upsert(d.features,'researchFeatureId',x)}
function disc(d,x){d.discoveryInventory??=[];upsert(d.discoveryInventory,'discoveryCandidateId',x)}
const six=['SET_1','SET_2','SET_3','SET_4','SET_5','SET_6'];

// Magia: capture all newly public complete conditional numeric tables.
{
 const id='L_MAGIA_RECORD_RN',d=r(id);
 source(d,{sourceId:'SRC_NANA_SETTING_FULL',publisher:'なな徹',title:'マギアレコード 設定判別（設定差・示唆演出）まとめ',url:'https://nana-press.com/kaiseki/machine/914/28425/',checkedAt:'2026-09-01',sourceType:'major_analysis'});
 source(d,{sourceId:'SRC_NANA_MITAMA',publisher:'なな徹',title:'マギアレコード みたまボーナス',url:'https://nana-press.com/kaiseki/machine/914/28443/',checkedAt:'2026-09-01',sourceType:'major_analysis'});
 const dist=(a,b,c)=>({HIGH10:a,HIGH20:b,HIGH30:c,NONE:1-a-b-c});
 feat(d,{researchFeatureId:'RF_HIGH_TRANSITION_ADV_AT_END',name:'有利区間移行・AT終了時 高確G数振り分け',factStatus:'verified',candidateModel:'multinomial',trialUnit:'有利区間移行またはAT終了1回',numeratorDefinition:'高確10G/20G/30G/非当選の各回数',denominatorDefinition:'有利区間移行またはAT終了後に高確移行抽選を受けた回数',categories:['HIGH10','HIGH20','HIGH30','NONE'],distributionMode:'complete',settingValues:{},settingDistributions:{SET_1:dist(.141,.078,.031),SET_2:dist(.141,.078,.031),SET_3:dist(.156,.086,.035),SET_4:dist(.164,.090,.039),SET_5:dist(.172,.094,.039),SET_6:dist(.188,.102,.047)},sourceRefs:['SRC_NANA_SETTING_FULL'],crossSourceStatus:'single_source',notes:'公開トータル25.0～33.7%と整合。'});
 feat(d,{researchFeatureId:'RF_HIGH_TRANSITION_BIG_END',name:'BIG終了時 高確G数振り分け',factStatus:'verified',candidateModel:'multinomial',trialUnit:'AT非当選BIG終了1回',numeratorDefinition:'高確10G/20G/30G/非当選の各回数',denominatorDefinition:'AT非当選BIG終了後に高確移行抽選を受けた回数',categories:['HIGH10','HIGH20','HIGH30','NONE'],distributionMode:'complete',settingValues:{},settingDistributions:{SET_1:dist(.188,.133,.016),SET_2:dist(.188,.133,.016),SET_3:dist(.203,.141,.020),SET_4:dist(.227,.156,.023),SET_5:dist(.250,.172,.031),SET_6:dist(.273,.188,.039)},sourceRefs:['SRC_NANA_SETTING_FULL'],crossSourceStatus:'single_source',notes:'AT非当選BIG終了という条件を維持。公開トータル33.7～50.0%と整合。'});
 const cz=(m,k)=>({MAGIA_CHALLENGE:m,KUROE_CHALLENGE:k,NO_CZ:1-m-k});
 feat(d,{researchFeatureId:'RF_WATERMELON_CZ',name:'さなモード以外 スイカ成立時CZ当選種別',factStatus:'verified',candidateModel:'multinomial',trialUnit:'さなモード以外でスイカ成立1回',numeratorDefinition:'マギアチャレンジ/黒江チャレンジ/非当選の各回数',denominatorDefinition:'さなモード以外でスイカが成立した回数',categories:['MAGIA_CHALLENGE','KUROE_CHALLENGE','NO_CZ'],distributionMode:'complete',settingValues:{},settingDistributions:{SET_1:cz(.199,.004),SET_2:cz(.223,.004),SET_3:cz(.246,.004),SET_4:cz(.273,.008),SET_5:cz(.301,.008),SET_6:cz(.328,.008)},sourceRefs:['SRC_NANA_SETTING_FULL'],crossSourceStatus:'single_source',notes:'さなモードは抽選契約が異なるため除外。'});
 const vals2=[.008,.012,.023,.047,.063,.078],vals3=[.051,.063,.078,.094,.109,.125];
 for(const [rid,name,level,vals] of [['RF_MITAMA_LEVEL2_AT','みたま報酬Lv2 ウワサ発展後AT当選',2,vals2],['RF_MITAMA_LEVEL3_AT','みたま報酬Lv3 ウワサ発展後AT当選',3,vals3]]) feat(d,{researchFeatureId:rid,name,factStatus:'verified',candidateModel:'binomial',trialUnit:`報酬レベル${level}でウワサ発展1回`,numeratorDefinition:'前兆終了後AT当選回数',denominatorDefinition:`みたまボーナス報酬レベル${level}でウワサ発展した回数`,settingValues:Object.fromEntries(six.map((s,i)=>[s,{probability:vals[i],rawDisplay:`${(vals[i]*100).toFixed(1)}%`}])) ,sourceRefs:['SRC_NANA_MITAMA'],crossSourceStatus:'single_source'});
 for(const [did,target,name] of [['D_HIGH_TRANSITION_ADV_AT_END_EXACT','RF_HIGH_TRANSITION_ADV_AT_END','有利区間移行・AT終了 高確G数完全分布'],['D_HIGH_TRANSITION_BIG_END_EXACT','RF_HIGH_TRANSITION_BIG_END','BIG終了 高確G数完全分布'],['D_WATERMELON_CZ_EXACT','RF_WATERMELON_CZ','スイカCZ完全分布'],['D_MITAMA_LEVEL2_AT_EXACT','RF_MITAMA_LEVEL2_AT','みたまLv2ウワサ後AT全設定値'],['D_MITAMA_LEVEL3_AT_EXACT','RF_MITAMA_LEVEL3_AT','みたまLv3ウワサ後AT全設定値']]) disc(d,{discoveryCandidateId:did,name,researchTarget:target});
 w(id,d);
}

// Midoridon: replace grouped pending state/role bonus candidate with exact role/state feature rows where setting differs.
{
 const id='L_MIDORIDON_VIVA_REVIVAL_FY',d=r(id);
 source(d,{sourceId:'SRC_NANA_NORMAL',publisher:'なな徹',title:'緑ドン 通常時のゲーム性・ボーナス抽選',url:'https://nana-press.com/kaiseki/machine/936/29342/',checkedAt:'2026-09-01',sourceType:'major_analysis'});
 const normal={
  RF_NORMAL_BONUS_WEAK_CHERRY:['通常滞在 弱チェリー→ボーナス',[.004,.004,.004,.004,.008,.008]],
  RF_NORMAL_BONUS_WEAK_WAVE:['通常滞在 弱波→ボーナス',[.016,.016,.016,.016,.023,.023]],
  RF_NORMAL_BONUS_CHANCE:['通常滞在 チャンス目→ボーナス',[.137,.137,.137,.137,.152,.172]],
  RF_NORMAL_BONUS_STRONG_CHERRY:['通常滞在 強チェリー→ボーナス',[.199,.199,.199,.250,.250,.250]],
  RF_NORMAL_BONUS_STRONG_WAVE:['通常滞在 強波→ボーナス',[.266,.266,.266,.332,.332,.332]],
  RF_HIGH_BONUS_WEAK_WAVE:['高確滞在 弱波→ボーナス',[.031,.031,.031,.031,.051,.051]]
 };
 for(const [rid,[name,vals]] of Object.entries(normal)){
   const high=rid.startsWith('RF_HIGH_'); const role=name.split(' ')[1].split('→')[0];
   feat(d,{researchFeatureId:rid,name,factStatus:'verified',candidateModel:'binomial',trialUnit:`${high?'高確':'通常'}滞在中の${role}成立1回`,numeratorDefinition:`${role}成立を契機とするボーナス当選回数`,denominatorDefinition:`${high?'高確':'通常'}滞在中に${role}が成立した回数`,settingValues:Object.fromEntries(six.map((s,i)=>[s,{probability:vals[i],rawDisplay:`${(vals[i]*100).toFixed(1)}%`}])) ,sourceRefs:['SRC_NANA_NORMAL'],crossSourceStatus:'single_source',notes:'内部状態・成立役別の条件付き抽選。総通常Gを分母にしない。'});
   disc(d,{discoveryCandidateId:`D_${rid}`,name,researchTarget:rid});
 }
 const grouped=d.features.find(x=>x.researchFeatureId==='RF_STATE_ROLE_BONUS'); if(grouped) grouped.notes='完全公開表を個別Featureへ分解済み。設定差なしの役/状態組合せはREFERENCE扱い。';
 w(id,d);
}
