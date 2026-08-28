import fs from 'node:fs';

const selectionPath='research/L_MAGICAL_HALLOWEEN8_FE/selection-data.json';
const observationPath='research/L_MAGICAL_HALLOWEEN8_FE/machine-observation-data.json';
const s=JSON.parse(fs.readFileSync(selectionPath,'utf8'));
const f=s.features.find(x=>x.featureId==='FEAT_ART_PREDECESSOR');
if(!f) throw new Error('FEAT_ART_PREDECESSOR not found');
f.adoptionCategory='EXCLUDE';
delete f.numeratorInputId; delete f.denominatorInputId; delete f.minimumSample; delete f.sampleRecommendation; delete f.weight; delete f.displayFormat; delete f.difficultyParticipation; delete f.userReason;
f.rejectionReason='着席時データカウンターのART初当り回数・累計ゲーム数が、公開ART初当り確率と同じ試行母集団を表すことを実機で確認できていないため、現版では推測に使用しない。実機確認後に再評価する。';
s.selectionNotes ??= [];
const note='RF_ART_PREDECESSORはResearch候補として保持するが、前任者データカウンターの観測元・試行母集団の同値性が未確認のため現版SelectionではEXCLUDEとする。';
if(!s.selectionNotes.includes(note)) s.selectionNotes.push(note);
fs.writeFileSync(selectionPath,JSON.stringify(s,null,2)+'\n');

const o={
  schemaVersion:'machine-observation-data-v2', machineId:'L_MAGICAL_HALLOWEEN8_FE', displayName:'マジカルハロウィン8', researchedAt:'2026-08-29',
  sources:[
    {sourceId:'OBS_SRC_MAGI8_KONAMI_MENU',publisher:'KONAMI',title:'スマスロ「マジカルハロウィン８」Trick or Tweet（メニュー・遊技情報集計）',url:'https://www.konami.com/amusement/psm/slot/magihallo8/16_hint.html?category=others',checkedAt:'2026-08-22',sourceType:'manufacturer_official'},
    {sourceId:'OBS_SRC_MAGI8_NANA_COMMON_COIN',publisher:'なな徹',title:'マジカルハロウィン8 設定差のある要素・共通コイン判別方法',url:'https://nana-press.com/kaiseki/machine/627/18063/',checkedAt:'2026-08-22',sourceType:'major_analysis'}
  ],
  sourceCoverage:{machineMenu:'FOUND',dataCounter:'UNRESOLVED',linkedService:'FOUND',directPlay:'FOUND',endEvent:'FOUND',seatedState:'UNRESOLVED'},
  observations:[
    {observationId:'OBS_PLAY_INFO_ART',sourceType:'MACHINE_MENU',observationMode:'MACHINE_MENU_READ',status:'FOUND',label:'遊技情報集計の自己区間ゲーム数・ART初当り',categories:['通常ゲーム数','ART初当り'],timing:['遊技情報集計開始後','途中経過または終了時'],excludedConditions:['集計開始前の前任者区間を含めない'],sourceRefs:['OBS_SRC_MAGI8_KONAMI_MENU']},
    {observationId:'OBS_COMMON_COIN',sourceType:'LINKED_SERVICE',observationMode:'LINKED_SERVICE_READ',status:'FOUND',label:'遊技情報集計の共通コイン',categories:['小役集計ゲーム数','共通コイン回数','共通コイン出現率'],timing:['遊技情報集計中'],excludedConditions:['集計開始前の区間と混在させない'],sourceRefs:['OBS_SRC_MAGI8_KONAMI_MENU','OBS_SRC_MAGI8_NANA_COMMON_COIN']},
    {observationId:'OBS_DOKOMAJI',sourceType:'DIRECT_PLAY',observationMode:'MANUAL_COUNTER',status:'FOUND',label:'どこまじ対象ボーナスと発生',categories:['集計対象ボーナス','どこまじ発生'],timing:['通常時ボーナス当選時'],excludedConditions:['超高確中を除外','ART中を除外','朝一約30Gのボーナスを除外'],sourceRefs:['OBS_SRC_MAGI8_NANA_COMMON_COIN']},
    {observationId:'OBS_REG_REQUIRED_KILLS',sourceType:'DIRECT_PLAY',observationMode:'VISUAL_CONFIRMATION',status:'FOUND',label:'殲滅ボーナス規定撃破数',categories:['25体','50体','75体','100体'],timing:['殲滅ボーナス中'],excludedConditions:['一撃フラグやレア役多数などで規定撃破数を一意に特定できない回は除外'],sourceRefs:['OBS_SRC_MAGI8_NANA_COMMON_COIN']},
    {observationId:'OBS_SETTING_EVIDENCE',sourceType:'DIRECT_PLAY',observationMode:'VISUAL_CONFIRMATION',status:'FOUND',label:'設定確定・下限示唆',categories:['トロフィー','獲得枚数表示','ボーナス確定・終了画面','ART終了画面'],timing:['各該当イベント発生時'],excludedConditions:[],sourceRefs:['OBS_SRC_MAGI8_NANA_COMMON_COIN']}
  ],
  featureMappings:[
    {featureId:'FEAT_ART_INITIAL',mappingType:'EXACT',observationIds:['OBS_PLAY_INFO_ART'],collectionMethods:['MACHINE_MENU_READ'],usableForInference:true,usableForDifficulty:true},
    {featureId:'FEAT_COMMON_COIN',mappingType:'EXACT',observationIds:['OBS_COMMON_COIN'],collectionMethods:['LINKED_SERVICE_READ'],usableForInference:true,usableForDifficulty:false},
    {featureId:'FEAT_DOKOMAJI',mappingType:'CONDITIONAL',observationIds:['OBS_DOKOMAJI'],collectionMethods:['MANUAL_COUNTER'],usableForInference:true,usableForDifficulty:false},
    {featureId:'FEAT_REG_REQUIRED_KILLS',mappingType:'CONDITIONAL',observationIds:['OBS_REG_REQUIRED_KILLS'],collectionMethods:['VISUAL_CONFIRMATION'],usableForInference:true,usableForDifficulty:false}
  ],
  researchReopenRequests:[],
  fieldVerificationItems:[
    {verificationId:'VFY_MAGI8_PREDECESSOR_ART_COUNTER',status:'WAITING_FOR_MACHINE',sourceType:'DATA_COUNTER',priority:'HIGH',question:'着席時に取得できるART初当り回数と累計ゲーム数の表示仕様が、公開ART初当り確率の試行母集団と一致するか確認する。確認できるまで前任者Featureは推測非参加。'}
  ]
};
fs.writeFileSync(observationPath,JSON.stringify(o,null,2)+'\n');
console.log('UPDATED Magihallo8 Selection + Observation v2');
