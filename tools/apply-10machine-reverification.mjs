import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const IDS = [
  'L_YOSHIMUNE_RISING_SA2','L_MACROSS_FRONTIER4_BA','L_BIOHAZARD_VILLAGE_XA','L_KAMEN_RIDER_7RIDERS_UJA','L_STRIKE_WITCHES2_TF',
  'L_SKY_LOVE_GNB','L_G1_YUSHUN_CLUB_GOLD_KD','L_SAEKANO_SA3','L_GODZILLA_VS_EVANGELION_JA','L_CODE_GEASS_REVIVAL_ZS',
];
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const write = (p, v) => fs.writeFileSync(p, JSON.stringify(v, null, 2) + '\n', 'utf8');
const researchPath = id => path.join(ROOT, 'research', id, 'research-data.json');
const selectionPath = id => path.join(ROOT, 'research', id, 'selection-data.json');
const upsert = (arr, key, value) => { const i = arr.findIndex(x => x?.[key] === value[key]); if (i >= 0) arr[i] = value; else arr.push(value); };
const removeBy = (arr, pred) => arr.filter(x => !pred(x));
const omit = (obj, keys) => { for (const k of keys) delete obj[k]; return obj; };
const settingValuesFromRatios = ratios => Object.fromEntries(Object.entries(ratios).map(([k,v]) => [k,{ probability: 1/v, rawDisplay: `1/${v}` }]));
const settingValuesFromPercents = values => Object.fromEntries(Object.entries(values).map(([k,v]) => [k,{ probability: v/100, rawDisplay: `${v}%` }]));

function addSeatedRejection(selection) {
  selection.rejectedElements ??= [];
  upsert(selection.rejectedElements, 'id', {
    id: 'REJECTED_PREDECESSOR_DENOMINATOR',
    name: '着席時データ',
    reason: '店舗データカウンターの総ゲーム数は公開解析の通常ゲーム数と集計区間が一致する保証がないため、前任者区間の設定推測には使用しません。実機メニュー等で分子・分母を同一区間で直接取得できる場合のみ個別採用します。',
  });
}
function setCompletenessChecked(research, surface, sourceRef) {
  const all = research.researchCompleteness?.numericSurfaces ?? [];
  const item = all.find(x => x.surface === surface);
  if (item) { item.status = 'CHECKED'; item.sourceRefs = [sourceRef]; item.notes = '再検証で設定差候補と観測定義を確認。'; }
}
function excludeFeature(f, reason) {
  f.adoptionCategory = 'EXCLUDE';
  f.rejectionReason = reason;
  omit(f, ['numeratorInputId','denominatorInputId','trialCountInputId','categoryInputIds','minimumSample','sampleRecommendation','weight','displayFormat','difficultyExposure','difficultyParticipation','userReason']);
}

function patchYoshimune() {
  const r = read(researchPath('L_YOSHIMUNE_RISING_SA2'));
  upsert(r.features, 'researchFeatureId', {
    researchFeatureId:'RF_MYSTERY_AT', name:'爆走大盤振舞 謎当り', factStatus:'verified', candidateModel:'binomial', trialUnit:'通常ゲーム', observationScope:'通常時・規定G数/成立役/天井以外のAT当選',
    numeratorDefinition:'爆走大盤振舞の謎当り回数', denominatorDefinition:'通常ゲーム数',
    settingValues: settingValuesFromRatios({SET_1:10508.1,SET_2:9015.3,SET_3:5528.8,SET_4:3123.0,SET_5:2155.6,SET_6:1594.1}), sourceRefs:['SRC_YR_NANA'], crossSourceStatus:'single_source_verified',
    notes:'設定1→6で約6.6倍。極端設定間の80%分離目安は約7,835Gで、終日実戦なら主要な追加情報になり得る。',
  });
  write(researchPath('L_YOSHIMUNE_RISING_SA2'), r);

  const s = read(selectionPath('L_YOSHIMUNE_RISING_SA2'));
  s.inputs = s.inputs.filter(x => x.id !== 'INP_INITIAL');
  upsert(s.inputs,'id',{id:'INP_MYSTERY_AT',name:'爆走大盤振舞 謎当り回数',type:'counter',category:'PRIMARY',unit:'回',displayOrder:2,description:'規定G数・成立役・天井到達以外の契機で爆走大盤振舞に当選した回数。',defaultValue:0});
  const bell = s.inputs.find(x => x.id === 'INP_COMMON_BELL');
  if (bell) bell.description = '通常時、左第1停止の13枚ベルを共通ベルとしてカウントします。';
  const initial = s.features.find(x => x.researchFeatureId === 'RF_INITIAL');
  if (initial) excludeFeature(initial,'総初当りは謎当りより終日での情報効率が低く、謎当りを同時採用すると包含関係による二重計上が生じるため不採用。');
  upsert(s.features,'featureId',{researchFeatureId:'RF_MYSTERY_AT',featureId:'FEAT_MYSTERY_AT',adoptionCategory:'INCLUDE_PRIMARY',numeratorInputId:'INP_MYSTERY_AT',denominatorInputId:'INP_NORMAL_GAMES',minimumSample:1,sampleRecommendation:7000,weight:1,displayFormat:'ratio_1_over_n',difficultyExposure:{mode:'per_game',factor:1,quality:'EXACT',basisId:'NORMAL_GAMES'},difficultyParticipation:'INCLUDE',userReason:'低頻度だが設定差が非常に大きく、極端設定間の必要試行量が約7,835Gと終日実戦に近いため主軸採用。'});
  s.uiCategoryLabels.PRIMARY = '謎当り';
  addSeatedRejection(s);
  write(selectionPath('L_YOSHIMUNE_RISING_SA2'), s);
}

function patchMacross() {
  const r = read(researchPath('L_MACROSS_FRONTIER4_BA'));
  upsert(r.features,'researchFeatureId',{researchFeatureId:'RF_8_BELL',name:'8枚ベル（上段ベル）',factStatus:'verified',candidateModel:'binomial',trialUnit:'小役集計ゲーム',observationScope:'通常時・判別可能区間',numeratorDefinition:'8枚ベル回数',denominatorDefinition:'小役集計ゲーム数',settingValues:settingValuesFromRatios({SET_1:17.2,SET_2:17.1,SET_3:16.9,SET_4:16.7,SET_5:16.5,SET_6:16.4}),sourceRefs:['SRC_MF4_NANA'],crossSourceStatus:'single_source_verified',notes:'設定差はあるが極端設定間の80%分離目安は約5.1万試行。'});
  upsert(r.features,'researchFeatureId',{researchFeatureId:'RF_CHANCE_COMBINED',name:'チャンス目A・B合算',factStatus:'verified',candidateModel:'binomial',trialUnit:'小役集計ゲーム',observationScope:'通常時・判別可能区間',numeratorDefinition:'チャンス目A・B回数',denominatorDefinition:'小役集計ゲーム数',settingValues:settingValuesFromRatios({SET_1:41,SET_2:41,SET_3:40,SET_4:39,SET_5:37,SET_6:36}),sourceRefs:['SRC_MF4_NANA'],crossSourceStatus:'single_source_verified',notes:'極端設定間の80%分離目安は約1.62万試行で終日では不足。'});
  const evs = [
    {researchEvidenceId:'RE_UTAHIME_END_2PLUS',name:'歌姫ボーナス終了画面 シェリル＆ランカ（白） 設定2以上',allowedSettings:['SET_2','SET_3','SET_4','SET_5','SET_6'],deniedSettings:['SET_1']},
    {researchEvidenceId:'RE_UTAHIME_END_2_DENIED',name:'歌姫ボーナス終了画面 バンドメンバー（白） 設定2否定',allowedSettings:['SET_1','SET_3','SET_4','SET_5','SET_6'],deniedSettings:['SET_2']},
    {researchEvidenceId:'RE_UTAHIME_END_6',name:'歌姫ボーナス終了画面 水着（金） 設定6',allowedSettings:['SET_6'],deniedSettings:['SET_1','SET_2','SET_3','SET_4','SET_5']},
  ];
  for (const e of evs) upsert(r.evidenceCandidates,'researchEvidenceId',{...e,factStatus:'verified',observationScope:'歌姫ボーナス終了画面',sourceRefs:['SRC_MF4_NANA'],notes:e.name});
  write(researchPath('L_MACROSS_FRONTIER4_BA'), r);

  const s = read(selectionPath('L_MACROSS_FRONTIER4_BA'));
  upsert(s.features,'featureId',{researchFeatureId:'RF_8_BELL',featureId:'FEAT_8_BELL',adoptionCategory:'EXCLUDE',rejectionReason:'設定1→6の差が約1/17.2→1/16.4と小さく、80%分離目安は約5.1万試行。終日では約400回程度しか成立せず不採用。'});
  upsert(s.features,'featureId',{researchFeatureId:'RF_CHANCE_COMBINED',featureId:'FEAT_CHANCE_COMBINED',adoptionCategory:'EXCLUDE',rejectionReason:'設定1→6で約1/41→1/36だが80%分離目安は約1.62万試行。7000Gでは成立回数が約170～194回に留まるため不採用。'});
  s.rejectedElements ??= [];
  upsert(s.rejectedElements,'id',{id:'REJECTED_UTAHIME_END_SOFT_DISTRIBUTION',name:'歌姫ボーナス終了画面の高設定示唆（弱・強）出現割合',reason:'出現率が消化ゲーム数帯で変化し、終日の歌姫ボーナス回数も数十回程度のため、単一分布としての尤度計算には不採用。設定2以上・設定2否定・設定6の確定系だけEvidenceとして採用します。'});
  const floor=s.evidenceUi.groups.find(g=>g.groupId==='SETTING_FLOOR');
  const opt2=floor?.options.find(o=>o.value==='SET_2_OR_HIGHER'); if(opt2&&!opt2.sourceEvidenceIds.includes('RE_UTAHIME_END_2PLUS')) opt2.sourceEvidenceIds.push('RE_UTAHIME_END_2PLUS');
  const opt6=floor?.options.find(o=>o.value==='SET_6'); if(opt6&&!opt6.sourceEvidenceIds.includes('RE_UTAHIME_END_6')) opt6.sourceEvidenceIds.push('RE_UTAHIME_END_6');
  if(!s.evidenceUi.groups.some(g=>g.groupId==='SETTING_DENIAL')) s.evidenceUi.groups.push({groupId:'SETTING_DENIAL',label:'確認した設定否定',selectionMode:'single',normalizationMode:'EXCLUDED_SETTINGS',options:[{value:'DENY_SET_2',label:'設定2否定',excludedSettings:['SET_2'],sourceEvidenceIds:['RE_UTAHIME_END_2_DENIED']}]});
  addSeatedRejection(s);
  write(selectionPath('L_MACROSS_FRONTIER4_BA'), s);
}

function patchBio() {
  const r=read(researchPath('L_BIOHAZARD_VILLAGE_XA'));
  upsert(r.features,'researchFeatureId',{researchFeatureId:'RF_CZ_RETRY',name:'CZ失敗時の引き戻し',factStatus:'verified',candidateModel:'binomial',trialUnit:'CZ失敗',observationScope:'CZ「パニックゾーン」失敗時',numeratorDefinition:'CZ失敗後の引き戻し当選回数',denominatorDefinition:'CZ失敗回数',settingValues:settingValuesFromPercents({SET_1:9.77,SET_2:11.33,SET_3:12.89,SET_4:16.80,SET_5:17.58,SET_6:18.75}),sourceRefs:['SRC_BIO_NANA'],crossSourceStatus:'single_source_verified',notes:'極端設定間の80%分離目安は約109回のCZ失敗。終日では不足。'});
  write(researchPath('L_BIOHAZARD_VILLAGE_XA'),r);
  const s=read(selectionPath('L_BIOHAZARD_VILLAGE_XA'));
  upsert(s.features,'featureId',{researchFeatureId:'RF_CZ_RETRY',featureId:'FEAT_CZ_RETRY',adoptionCategory:'EXCLUDE',rejectionReason:'設定差は約9.8%→18.8%と大きいが、80%分離には約109回のCZ失敗が必要。終日で得られる失敗回数は大幅に不足するため不採用。'});
  addSeatedRejection(s); write(selectionPath('L_BIOHAZARD_VILLAGE_XA'),s);
}

function patchKamen() {
  const r=read(researchPath('L_KAMEN_RIDER_7RIDERS_UJA'));
  upsert(r.features,'researchFeatureId',{researchFeatureId:'RF_YUITIME',name:'ゆいたいむ突入率',factStatus:'verified',candidateModel:'binomial',trialUnit:'X非滞在ゲーム',observationScope:'通常時・X非滞在時',numeratorDefinition:'X非滞在時のゆいたいむ突入回数',denominatorDefinition:'X非滞在時の対象ゲーム数',settingValues:settingValuesFromRatios({SET_1:71.9,SET_2:71.4,SET_4:69.0,SET_5:67.7,SET_6:67.2}),sourceRefs:['SRC_KR_NANA'],crossSourceStatus:'single_source_verified',notes:'X滞在時は全設定共通1/72.3。X非滞在時でも設定差は小さく、80%分離目安は約11万試行。'});
  write(researchPath('L_KAMEN_RIDER_7RIDERS_UJA'),r);
  const s=read(selectionPath('L_KAMEN_RIDER_7RIDERS_UJA'));
  upsert(s.features,'featureId',{researchFeatureId:'RF_YUITIME',featureId:'FEAT_YUITIME',adoptionCategory:'EXCLUDE',rejectionReason:'X非滞在時でも約1/71.9→1/67.2と差が小さく、80%分離には約11万試行が必要。終日の設定推測には情報量不足のため不採用。'});
  addSeatedRejection(s); write(selectionPath('L_KAMEN_RIDER_7RIDERS_UJA'),s);
}

function patchStrike() {
  const s=read(selectionPath('L_STRIKE_WITCHES2_TF'));
  s.inputs=s.inputs.filter(x=>x.id!=='INP_STRIKE_BONUS');
  upsert(s.inputs,'id',{id:'INP_DIRECT_BONUS',name:'ストライクボーナス直撃回数',type:'counter',category:'PRIMARY',unit:'回',displayOrder:2,description:'通常時の毎ゲーム抽選によるストライクボーナス直撃回数。',defaultValue:0});
  const total=s.features.find(x=>x.researchFeatureId==='RF_STRIKE_BONUS'); if(total) excludeFeature(total,'直撃より設定差が小さく、直撃を同時採用すると包含関係による二重計上になるため不採用。');
  const direct=s.features.find(x=>x.researchFeatureId==='RF_DIRECT_BONUS');
  if(direct) Object.assign(direct,{adoptionCategory:'INCLUDE_PRIMARY',numeratorInputId:'INP_DIRECT_BONUS',denominatorInputId:'INP_NORMAL_GAMES',minimumSample:1,sampleRecommendation:7000,weight:1,displayFormat:'ratio_1_over_n',difficultyExposure:{mode:'per_game',factor:1,quality:'EXACT',basisId:'NORMAL_GAMES'},difficultyParticipation:'INCLUDE',userReason:'設定1→6で約5倍の差があり、極端設定間の80%分離目安は約1.05万G。7000Gでも総ボーナスより情報効率が高いため主軸採用。'});
  s.rejectedElements = removeBy(s.rejectedElements??[],x=>x.name==='ストライクボーナス直撃');
  addSeatedRejection(s); write(selectionPath('L_STRIKE_WITCHES2_TF'),s);
}

function patchSkyLove() {
  const r=read(researchPath('L_SKY_LOVE_GNB'));
  upsert(r.features,'researchFeatureId',{researchFeatureId:'RF_MEETING_INITIAL_SUCCESS',name:'作戦会議突入時の成功抽選',factStatus:'verified',candidateModel:'binomial',trialUnit:'作戦会議突入',observationScope:'作戦会議突入時',numeratorDefinition:'突入時抽選で成功した回数',denominatorDefinition:'作戦会議突入回数',settingValues:settingValuesFromPercents({SET_1:6.3,SET_2:7.0,SET_3:8.6,SET_4:17.2,SET_5:19.5,SET_6:20.3}),sourceRefs:['SRC_SKY_NANA'],crossSourceStatus:'single_source_verified',notes:'公開値は「突入時抽選」。レア役非成立時の最終成功率とは同一ではない。'});
  upsert(r.features,'researchFeatureId',{researchFeatureId:'RF_CHALLENGE_COLOR',name:'チャレンジボーナス入賞図柄 赤7/赤7/青7',factStatus:'verified',candidateModel:'binomial',trialUnit:'チャレンジボーナス',observationScope:'チャレンジボーナス入賞時',numeratorDefinition:'赤7/赤7/青7回数',denominatorDefinition:'チャレンジボーナス回数',settingValues:settingValuesFromPercents({SET_1:50.0,SET_2:43.8,SET_3:56.3,SET_4:37.5,SET_5:62.5,SET_6:50.0}),sourceRefs:['SRC_SKY_NANA'],crossSourceStatus:'single_source_verified',notes:'偶奇示唆だが終日のチャレンジボーナス回数では試行不足。'});
  upsert(r.features,'researchFeatureId',{researchFeatureId:'RF_CHALLENGE_CZ_INITIAL',name:'チャレンジボーナス当選時のCZ抽選',factStatus:'verified',candidateModel:'binomial',trialUnit:'チャレンジボーナス当選',observationScope:'チャレンジボーナス当選時',numeratorDefinition:'当選時抽選でCZに当選した回数',denominatorDefinition:'チャレンジボーナス当選回数',settingValues:settingValuesFromPercents({SET_1:6.3,SET_2:7.0,SET_3:9.4,SET_4:16.4,SET_5:20.3,SET_6:22.7}),sourceRefs:['SRC_SKY_NANA'],crossSourceStatus:'single_source_verified',notes:'極端設定間の80%分離目安は約31試行だが、終日のチャレンジボーナス回数は約11～19回程度。'});
  setCompletenessChecked(r,'character_distribution','SRC_SKY_NANA');
  write(researchPath('L_SKY_LOVE_GNB'),r);
  const s=read(selectionPath('L_SKY_LOVE_GNB'));
  upsert(s.features,'featureId',{researchFeatureId:'RF_MEETING_INITIAL_SUCCESS',featureId:'FEAT_MEETING_INITIAL_SUCCESS',adoptionCategory:'EXCLUDE',rejectionReason:'公開値は「作戦会議突入時の成功抽選」。レア役を引かなかった作戦会議でも消化中のその他役/HOLDで成功抽選があるため、実測の「レア役なし成功率」と公開値の分子・分母が一致せず不採用。'});
  upsert(s.features,'featureId',{researchFeatureId:'RF_CHALLENGE_COLOR',featureId:'FEAT_CHALLENGE_COLOR',adoptionCategory:'EXCLUDE',rejectionReason:'設定差はあるが終日のチャレンジボーナスは約11～19回程度で、偶奇判別に必要な約29～52試行へ届かないため不採用。'});
  upsert(s.features,'featureId',{researchFeatureId:'RF_CHALLENGE_CZ_INITIAL',featureId:'FEAT_CHALLENGE_CZ_INITIAL',adoptionCategory:'EXCLUDE',rejectionReason:'設定1→6で6.3%→22.7%と差は大きいが、80%分離目安約31試行に対し終日のチャレンジボーナスは約11～19回程度のため不採用。'});
  s.rejectedElements ??= [];
  upsert(s.rejectedElements,'id',{id:'REJECTED_BONUS_END_CARD_DISTRIBUTION',name:'ボーナス終了時カードの出現割合',reason:'C/B1/B2には設定差があるものの、カードはボーナス終了時の一部でのみ出現し、終日に必要な約50回前後のカード観測を安定して確保できないため割合は推測計算に不採用。A系・S・SSの確定系示唆はEvidenceとして扱います。'});
  addSeatedRejection(s); write(selectionPath('L_SKY_LOVE_GNB'),s);
}

function patchGodzilla() {
  const r=read(researchPath('L_GODZILLA_VS_EVANGELION_JA'));
  upsert(r.features,'researchFeatureId',{researchFeatureId:'RF_SUIKA_CZ',name:'スイカ成立時 CZ「アスカVSレイ」当選率',factStatus:'verified',candidateModel:'binomial',trialUnit:'通常時スイカ',observationScope:'通常時・スイカ成立時',numeratorDefinition:'スイカからCZ「アスカVSレイ」に当選した回数',denominatorDefinition:'通常時スイカ成立回数',settingValues:settingValuesFromPercents({SET_1:20.3,SET_2:21.1,SET_4:25.0,SET_5:27.7,SET_6:30.5}),sourceRefs:['SRC_GE_NANA'],crossSourceStatus:'single_source_verified',notes:'80%分離目安は約132回のスイカ。スイカ1/128のため7000Gでは期待約55回。'});
  setCompletenessChecked(r,'small_role','SRC_GE_NANA'); write(researchPath('L_GODZILLA_VS_EVANGELION_JA'),r);
  const s=read(selectionPath('L_GODZILLA_VS_EVANGELION_JA'));
  upsert(s.features,'featureId',{researchFeatureId:'RF_SUIKA_CZ',featureId:'FEAT_SUIKA_CZ',adoptionCategory:'EXCLUDE',rejectionReason:'設定差は20.3%→30.5%だが80%分離には約132回のスイカが必要。スイカは1/128で7000Gでも約55回しか得られないため終日基準では不採用。'});
  s.rejectedElements=removeBy(s.rejectedElements??[],x=>x.name==='ボーナス初当り');
  addSeatedRejection(s); write(selectionPath('L_GODZILLA_VS_EVANGELION_JA'),s);
}

function patchGeass() {
  const r=read(researchPath('L_CODE_GEASS_REVIVAL_ZS'));
  upsert(r.features,'researchFeatureId',{researchFeatureId:'RF_CZ_YELLOW_SUCCESS',name:'リベリオンアタック 黄エフェクト時ボーナス当選率',factStatus:'verified',candidateModel:'binomial',trialUnit:'黄エフェクト到達CZ',observationScope:'CZ「リベリオンアタック」黄エフェクト時',numeratorDefinition:'黄エフェクト時のボーナス当選回数',denominatorDefinition:'黄エフェクト到達回数',settingValues:settingValuesFromPercents({SET_1:10.5,SET_2:11.3,SET_3:15.2,SET_4:19.5,SET_5:23.4,SET_6:25.4}),sourceRefs:['SRC_CG_NANA'],crossSourceStatus:'single_source_verified',notes:'80%分離目安は約47回の黄エフェクト試行。終日ではCZ総数自体がこれを下回りやすい。'});
  upsert(r.features,'researchFeatureId',{researchFeatureId:'RF_MUGEN_SUIKA',name:'AT中スイカ 無限新生当選率',factStatus:'verified',candidateModel:'binomial',trialUnit:'対象AT中スイカ',observationScope:'無限新生非発動・シャムナステージ以外のAT中',numeratorDefinition:'スイカから無限新生に当選した回数',denominatorDefinition:'対象状態でのスイカ成立回数',settingValues:settingValuesFromPercents({SET_1:0.4,SET_2:0.8,SET_3:1.2,SET_4:1.6,SET_5:2.0,SET_6:2.3}),sourceRefs:['SRC_CG_NANA'],crossSourceStatus:'single_source_verified',notes:'80%分離には約232回の対象スイカが必要。'});
  setCompletenessChecked(r,'small_role','SRC_CG_NANA'); write(researchPath('L_CODE_GEASS_REVIVAL_ZS'),r);
  const s=read(selectionPath('L_CODE_GEASS_REVIVAL_ZS'));
  const mode=s.features.find(x=>x.researchFeatureId==='RF_MODE_C'); if(mode) mode.rejectionReason='モードCは末尾50G以降の前兆で判別可能だが、極端設定間の80%分離に約92回のモード移行機会が必要。終日では移行機会が不足するため不採用。';
  upsert(s.features,'featureId',{researchFeatureId:'RF_CZ_YELLOW_SUCCESS',featureId:'FEAT_CZ_YELLOW_SUCCESS',adoptionCategory:'EXCLUDE',rejectionReason:'黄エフェクト時は10.5%→25.4%と差が大きいが、80%分離には約47回の黄エフェクト試行が必要。終日のCZ回数・黄到達回数では不足するため不採用。'});
  upsert(s.features,'featureId',{researchFeatureId:'RF_MUGEN_SUIKA',featureId:'FEAT_MUGEN_SUIKA',adoptionCategory:'EXCLUDE',rejectionReason:'スイカ契機は0.4%→2.3%と倍率差が大きいが、80%分離に約232回の対象AT中スイカが必要。終日では大幅に不足するため不採用。'});
  s.rejectedElements=removeBy(s.rejectedElements??[],x=>x.name==='モードC移行');
  addSeatedRejection(s); write(selectionPath('L_CODE_GEASS_REVIVAL_ZS'),s);
}

function patchSimpleSelections() {
  for(const id of ['L_G1_YUSHUN_CLUB_GOLD_KD','L_SAEKANO_SA3']) { const s=read(selectionPath(id)); addSeatedRejection(s); if(id==='L_SAEKANO_SA3') s.rejectedElements=removeBy(s.rejectedElements??[],x=>x.name==='ボーナス直撃'); write(selectionPath(id),s); }
}

export function applyAll() {
  patchYoshimune(); patchMacross(); patchBio(); patchKamen(); patchStrike(); patchSkyLove(); patchGodzilla(); patchGeass(); patchSimpleSelections();
  console.log(`Applied reverification updates to ${IDS.length} machines.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) applyAll();
