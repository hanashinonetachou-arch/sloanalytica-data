import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const read = p => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const write = (p, v) => fs.writeFileSync(path.join(ROOT, p), JSON.stringify(v, null, 2) + '\n');
const upsert = (arr, key, value) => {
  const i = arr.findIndex(x => x?.[key] === value[key]);
  if (i >= 0) arr[i] = value; else arr.push(value);
};
const removeBy = (arr, key, value) => arr.filter(x => x?.[key] !== value);
const norm = obj => {
  const sum = Object.values(obj).reduce((a,b)=>a+b,0);
  return Object.fromEntries(Object.entries(obj).map(([k,v])=>[k, v/sum]));
};

function addPredecessor(machineId) {
  const rp = `research/${machineId}/research-data.json`;
  const sp = `research/${machineId}/selection-data.json`;
  const r = read(rp), s = read(sp);
  const base = r.features.find(f => f.researchFeatureId === 'RF_BONUS');
  if (!base) throw new Error(`${machineId}: RF_BONUS missing`);
  upsert(r.features, 'researchFeatureId', {
    ...JSON.parse(JSON.stringify(base)),
    researchFeatureId: 'RF_PREDECESSOR_BONUS',
    name: '着席時BIG/REG',
    trialUnit: '着席前ゲーム',
    observationScope: '当日・着席前区間',
    numeratorDefinition: '着席時BIG/REG回数',
    denominatorDefinition: '着席時ゲーム数',
    notes: 'データカウンターで当日累計ゲーム数・BIG・REGを同一区間で取得できる場合のみ使用。取得できない場合は未入力でよい。'
  });
  const predInputs = [
    {id:'INP_PREDECESSOR_GAMES',name:'着席時ゲーム数',type:'integer',category:'PREDECESSOR',unit:'G',displayOrder:1,defaultValue:0,observationScope:'PREDECESSOR_SNAPSHOT',description:'着席時のデータカウンターに表示されている当日累計ゲーム数。同一区間のBIG・REGが確認できる場合のみ入力します。'},
    {id:'INP_PREDECESSOR_BIG',name:'着席時BIG',type:'counter',category:'PREDECESSOR',unit:'回',displayOrder:2,defaultValue:0,observationScope:'PREDECESSOR_SNAPSHOT',parentInputId:'INP_PREDECESSOR_GAMES',description:'着席時の当日累計BIG回数。'},
    {id:'INP_PREDECESSOR_REG',name:'着席時REG',type:'counter',category:'PREDECESSOR',unit:'回',displayOrder:3,defaultValue:0,observationScope:'PREDECESSOR_SNAPSHOT',parentInputId:'INP_PREDECESSOR_GAMES',description:'着席時の当日累計REG回数。'}
  ];
  for (const x of predInputs) upsert(s.inputs, 'id', x);
  upsert(s.features, 'featureId', {
    researchFeatureId:'RF_PREDECESSOR_BONUS', featureId:'FEAT_PREDECESSOR_BONUS', adoptionCategory:'INCLUDE_PRIMARY',
    denominatorInputId:'INP_PREDECESSOR_GAMES', numeratorInputId:'INP_PREDECESSOR_BIG', categoryInputIds:['INP_PREDECESSOR_REG'], residualCategoryLabel:'OTHER',
    minimumSample:1, sampleRecommendation:3000, weight:1, displayFormat:'ratio_1_over_n', difficultyParticipation:'EXCLUDE',
    userReason:'着席時に当日累計ゲーム数・BIG・REGを同一区間で取得できる場合、前任者区間も独立した設定推測情報として利用できるため採用。入力できない場合は未入力で構いません。',
    difficultyExclusionReason:'共通Difficultyは自分が遊技したゲーム数を基準にするため、着席前区間はスコア計算へ含めない。'
  });
  s.rejectedElements = removeBy(s.rejectedElements ?? [], 'id', 'REJECTED_PREDECESSOR_DENOMINATOR');
  s.uiCategoryLabels = {PREDECESSOR:'着席時データ', ...(s.uiCategoryLabels ?? {})};
  write(rp,r); write(sp,s);
}

function addNangokuSunshine() {
  const rp='research/L_NANGOKU_SODACHI_S3/research-data.json', sp='research/L_NANGOKU_SODACHI_S3/selection-data.json';
  const r=read(rp), s=read(sp);
  upsert(r.sources,'sourceId',{sourceId:'SRC_NS_CHON',publisher:'ちょんぼりすた',title:'スマスロ 南国育ち 設定判別',url:'https://chonborista.com/slot/orinpia-slot/205447/',checkedAt:'2026-08-20',sourceType:'analysis'});
  upsert(r.features,'researchFeatureId',{
    researchFeatureId:'RF_SUNSHINE',name:'蝶飛翔時「感じてSunshine!!」選択率',factStatus:'verified',candidateModel:'binomial',trialUnit:'楽曲選択機会',observationScope:'ボーナス中1G連上乗せ時または赤7BIG先飛翔時',numeratorDefinition:'感じてSunshine!!選択回数',denominatorDefinition:'対象楽曲選択機会数',
    settingValues:{SET_1:{probability:0.02,rawDisplay:'2.0%'},SET_2:{probability:0.04,rawDisplay:'4.0%'},SET_3:{probability:0.06,rawDisplay:'6.0%'},SET_5:{probability:0.08,rawDisplay:'8.0%'},SET_6:{probability:0.10,rawDisplay:'10.0%'}},sourceRefs:['SRC_NS_CHON'],crossSourceStatus:'single_source_verified',notes:'設定1→6で5倍差。対象機会を手入力できる場合は有力な補助情報。'
  });
  upsert(s.inputs,'id',{id:'INP_SUNSHINE_TRIALS',name:'蝶飛翔時の楽曲選択機会',type:'integer',category:'BONUS',unit:'回',displayOrder:20,defaultValue:null,description:'ボーナス中1G連上乗せ時または赤7BIG先飛翔時など、対象となる楽曲選択機会を数えます。負担なら未入力で構いません。'});
  upsert(s.inputs,'id',{id:'INP_SUNSHINE',name:'感じてSunshine!!',type:'counter',category:'BONUS',unit:'回',displayOrder:21,defaultValue:null,parentInputId:'INP_SUNSHINE_TRIALS'});
  upsert(s.features,'featureId',{researchFeatureId:'RF_SUNSHINE',featureId:'FEAT_SUNSHINE',adoptionCategory:'INCLUDE_SUPPORT',numeratorInputId:'INP_SUNSHINE',denominatorInputId:'INP_SUNSHINE_TRIALS',minimumSample:1,sampleRecommendation:20,weight:1,displayFormat:'percent',difficultyParticipation:'EXCLUDE',userReason:'選択率が設定1の2%から設定6の10%まで5倍差あり、対象機会を正確に数えられる場合は序盤から有効な補助材料になるため採用。入力は任意です。',difficultyExclusionReason:'通常ゲーム数から対象楽曲選択機会数を正確に導出できないため共通Difficultyには含めない。'});
  s.uiCategoryLabels={...(s.uiCategoryLabels??{}),BONUS:'蝶飛翔時BGM'};
  write(rp,r); write(sp,s);
}

function addShinobiEvening() {
  const rp='research/L_SHINOBIDAMASHII3_A3/research-data.json', sp='research/L_SHINOBIDAMASHII3_A3/selection-data.json';
  const r=read(rp), s=read(sp);
  const old=r.features.find(f=>f.researchFeatureId==='RF_EVENING_ROLE');
  r.features=removeBy(r.features,'researchFeatureId','RF_EVENING_ROLE');
  const sourceRefs=old?.sourceRefs?.length?old.sourceRefs:['SRC_SH_NANA','SRC_SH_GABU'];
  const defs=[
    ['CHERRY','チェリー',[0.301,0.309,0.316,0.324,0.352,0.359]],
    ['SUIKA','スイカ',[0.500,0.508,0.539,0.578,0.602,0.617]],
    ['CHANCE_REPLAY','チャンスリプレイ',[0.402,0.414,0.426,0.469,0.484,0.500]]
  ];
  const sets=['SET_1','SET_2','SET_3','SET_4','SET_5','SET_6'];
  for (const [key,label,vals] of defs) {
    upsert(r.features,'researchFeatureId',{researchFeatureId:`RF_EVENING_${key}`,name:`夕方ステージ中${label}→CZ/AT`,factStatus:'verified',candidateModel:'binomial',trialUnit:`夕方ステージ中${label}`,observationScope:'夕方ステージ',numeratorDefinition:`${label}契機CZ/AT当選回数`,denominatorDefinition:`夕方ステージ中${label}成立回数`,settingValues:Object.fromEntries(sets.map((st,i)=>[st,{probability:vals[i],rawDisplay:`${(vals[i]*100).toFixed(1)}%`}])) ,sourceRefs,crossSourceStatus:'matched',notes:'夕方ステージは周期ごとに入る高確率パート。役別に独立して集計する。'});
    upsert(s.inputs,'id',{id:`INP_EVENING_${key}`,name:`夕方中${label}回数`,type:'counter',category:'EVENING',unit:'回',displayOrder:30+defs.findIndex(x=>x[0]===key)*2,defaultValue:null,description:'夕方ステージ中のみカウント。負担なら未入力で構いません。'});
    upsert(s.inputs,'id',{id:`INP_EVENING_${key}_HIT`,name:`${label}→CZ/AT`,type:'counter',category:'EVENING',unit:'回',displayOrder:31+defs.findIndex(x=>x[0]===key)*2,defaultValue:null,parentInputId:`INP_EVENING_${key}`});
    upsert(s.features,'featureId',{researchFeatureId:`RF_EVENING_${key}`,featureId:`FEAT_EVENING_${key}`,adoptionCategory:'INCLUDE_SUPPORT',numeratorInputId:`INP_EVENING_${key}_HIT`,denominatorInputId:`INP_EVENING_${key}`,minimumSample:1,sampleRecommendation:30,weight:1,displayFormat:'percent',difficultyParticipation:'EXCLUDE',userReason:`夕方ステージは周期ごとに試行機会があり、${label}成立時のCZ/AT当選率に段階的な設定差があるため補助採用。入力は任意です。`,difficultyExclusionReason:'通常ゲーム数から夕方中の役別成立回数を正確に導出できないため共通Difficultyには含めない。'});
  }
  s.features=removeBy(s.features,'featureId','FEAT_EVENING_ROLE');
  s.uiCategoryLabels={...(s.uiCategoryLabels??{}),EVENING:'夕方ステージ'};
  write(rp,r); write(sp,s);
}

function addGoldenKamuyPhotos() {
  const rp='research/L_GOLDEN_KAMUY_KR/research-data.json', sp='research/L_GOLDEN_KAMUY_KR/selection-data.json';
  const r=read(rp), s=read(sp);
  const endCats=['WHITE_A','WHITE_B','BLUE_A','BLUE_B','YELLOW_A','YELLOW_B','GREEN','RED','GOLD'];
  const endPct={
    SET_1:[41.4,24.9,8.2,4.0,6.7,6.7,3.5,4.7,0], SET_2:[24.8,41.3,4.0,8.2,6.7,6.7,3.6,4.7,0],
    SET_4:[24.2,38.0,4.0,8.0,7.1,7.1,3.8,5.6,2.3], SET_5:[37.6,24.3,8.0,4.0,7.1,7.1,3.8,5.8,2.3], SET_6:[23.9,37.4,4.0,8.0,7.2,7.2,3.9,6.0,2.4]
  };
  const pyuCats=['WHITE_A','WHITE_B','BLUE_A','BLUE_B','YELLOW_A','YELLOW_B','GREEN'];
  const pyuPct={
    SET_1:[43.3,26.0,9.0,4.3,6.8,6.8,3.7], SET_2:[25.9,43.2,4.4,9.0,6.9,6.9,3.7],
    SET_4:[25.2,42.1,4.5,9.0,7.5,7.5,4.1], SET_5:[41.5,25.4,9.0,4.5,7.6,7.6,4.2], SET_6:[24.9,41.4,4.6,9.1,7.8,7.8,4.3]
  };
  const mkDist=(cats,pcts)=>Object.fromEntries(Object.entries(pcts).map(([st,vals])=>[st,norm(Object.fromEntries(cats.map((c,i)=>[c,vals[i]])))]));
  upsert(r.features,'researchFeatureId',{researchFeatureId:'RF_BONUS_END_PHOTO',name:'カムイボーナス/決戦CHANCE終了時の写真',factStatus:'verified',candidateModel:'multinomial',trialUnit:'写真確認1回',observationScope:'カムイボーナス最終G・決戦CHANCE終了時PUSH',numeratorDefinition:'写真枠別回数',denominatorDefinition:'写真確認回数',settingValues:{},sourceRefs:['SRC_GK_NANA'],crossSourceStatus:'single_source_verified',notes:'白/青は奇偶、黄/緑/赤は高設定寄り、金は設定4以上。',categories:endCats,distributionMode:'complete',settingDistributions:mkDist(endCats,endPct)});
  upsert(r.features,'researchFeatureId',{researchFeatureId:'RF_200PYU_PHOTO',name:'200ピュウ☆予兆失敗時の写真',factStatus:'verified',candidateModel:'multinomial',trialUnit:'写真確認1回',observationScope:'200ピュウ☆の予兆ステージ失敗時PUSH',numeratorDefinition:'写真枠別回数',denominatorDefinition:'写真確認回数',settingValues:{},sourceRefs:['SRC_GK_NANA'],crossSourceStatus:'single_source_verified',notes:'終了時写真とは別分布のため別Featureとして集計。',categories:pyuCats,distributionMode:'complete',settingDistributions:mkDist(pyuCats,pyuPct)});

  const labels={WHITE_A:'白①',WHITE_B:'白②',BLUE_A:'青①',BLUE_B:'青②',YELLOW_A:'黄①',YELLOW_B:'黄②',GREEN:'緑',RED:'赤'};
  upsert(s.inputs,'id',{id:'INP_GK_END_PHOTO_TOTAL',name:'BONUS/決戦 写真確認回数',type:'integer',category:'PHOTO',unit:'回',displayOrder:20,defaultValue:null,description:'カムイボーナス最終G・決戦CHANCE終了時にPUSHで写真を確認した回数。負担なら未入力で構いません。'});
  let order=21; for (const c of endCats.slice(0,-1)) upsert(s.inputs,'id',{id:`INP_GK_END_${c}`,name:`BONUS/決戦 ${labels[c]}`,type:'counter',category:'PHOTO',unit:'回',displayOrder:order++,defaultValue:null,parentInputId:'INP_GK_END_PHOTO_TOTAL'});
  upsert(s.features,'featureId',{researchFeatureId:'RF_BONUS_END_PHOTO',featureId:'FEAT_BONUS_END_PHOTO',adoptionCategory:'INCLUDE_SUPPORT',denominatorInputId:'INP_GK_END_PHOTO_TOTAL',numeratorInputId:'INP_GK_END_WHITE_A',categoryInputIds:endCats.slice(1,-1).map(c=>`INP_GK_END_${c}`),residualCategoryLabel:'GOLD',minimumSample:1,sampleRecommendation:20,weight:1,displayFormat:'percent',difficultyParticipation:'EXCLUDE',userReason:'写真の全設定別分布が公開され、奇偶差と高設定差を同時に持つためMultinomialで補助採用。入力は任意です。',difficultyExclusionReason:'通常ゲーム数から写真確認回数を正確に導出できないため共通Difficultyには含めない。'});

  upsert(s.inputs,'id',{id:'INP_GK_200_PHOTO_TOTAL',name:'200ピュウ予兆 写真確認回数',type:'integer',category:'PHOTO200',unit:'回',displayOrder:40,defaultValue:null,description:'200ピュウ☆の予兆ステージ失敗時にPUSHで写真を確認した回数。負担なら未入力で構いません。'});
  order=41; for (const c of pyuCats.slice(0,-1)) upsert(s.inputs,'id',{id:`INP_GK_200_${c}`,name:`200ピュウ ${labels[c]}`,type:'counter',category:'PHOTO200',unit:'回',displayOrder:order++,defaultValue:null,parentInputId:'INP_GK_200_PHOTO_TOTAL'});
  upsert(s.features,'featureId',{researchFeatureId:'RF_200PYU_PHOTO',featureId:'FEAT_200PYU_PHOTO',adoptionCategory:'INCLUDE_SUPPORT',denominatorInputId:'INP_GK_200_PHOTO_TOTAL',numeratorInputId:'INP_GK_200_WHITE_A',categoryInputIds:pyuCats.slice(1,-1).map(c=>`INP_GK_200_${c}`),residualCategoryLabel:'GREEN',minimumSample:1,sampleRecommendation:20,weight:1,displayFormat:'percent',difficultyParticipation:'EXCLUDE',userReason:'200ピュウ☆予兆失敗時には別の写真分布があり、奇偶・高設定傾向の追加情報を得られるため別Featureとして採用。入力は任意です。',difficultyExclusionReason:'通常ゲーム数から200ピュウ予兆失敗時の写真確認回数を正確に導出できないため共通Difficultyには含めない。'});
  s.uiCategoryLabels={...(s.uiCategoryLabels??{}),PHOTO:'BONUS/決戦終了時の写真',PHOTO200:'200ピュウ予兆失敗時の写真'};
  write(rp,r); write(sp,s);
}

addPredecessor('L_KING_PULSAR_SLCC');
addPredecessor('L_DRAGON_HANAHANA_SENKO_JP');
addNangokuSunshine();
addShinobiEvening();
addGoldenKamuyPhotos();
console.log('OK: reconsidered smartslot Features and predecessor inputs.');
