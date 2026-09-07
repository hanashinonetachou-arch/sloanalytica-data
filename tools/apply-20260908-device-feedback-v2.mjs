import fs from 'node:fs';

const ids = {
  triple:'LB_TRIPLE_CROWN_SEVEN_FG', yoshi:'L_SHINUCHI_YOSHIMUNE_A1', kyokou:'L_KYOKOU_SUIRI_ST', akudama:'L_AKUDAMA_DRIVE_TP'
};
const read = p => JSON.parse(fs.readFileSync(p,'utf8'));
const write = (p,o) => fs.writeFileSync(p, JSON.stringify(o,null,2)+'\n');
const rp = id => `research/${id}`;
const getInput = (s,id) => s.inputs.find(x=>x.id===id);
const getFeature = (s,id) => s.features.find(x=>x.researchFeatureId===id || x.featureId===id);
const setUiName = (ui,id,name) => { if(ui.inputContracts?.[id]) ui.inputContracts[id].name=name; };
const renameSection = (ui,oldName,newName) => {
  if(oldName===newName || !ui.sections?.[oldName]) return;
  ui.sections[newName]=ui.sections[oldName]; delete ui.sections[oldName];
  ui.sectionOrder=ui.sectionOrder.map(x=>x===oldName?newName:x);
};

// ---------- Triple Crown ----------
{
  const s=read(`${rp(ids.triple)}/selection-data.json`);
  const bt=getFeature(s,'RF_BT_REPLAY_BB');
  bt.userFacingReason='BT中リプレイ+BB in BBには設定差があるが、設定1=1/293.9・設定6=1/257.0と差が小さく、BT中という限定区間では1日実戦で得られる有効試行数も限られる。公開解析でもサンプルを稼ぎづらく大きな差ではないとされ、同じ試行数を使う他Featureに比べ追加の識別情報量が小さいため不採用とする。入力負担は不採用理由に用いない。';
  const plum=getFeature(s,'RF_PLUM');
  plum.userFacingReason='プラム自体には設定差がある。ただし通常ゲーム1Gごとにプラム・チェリーは排他的に成立するため、採用済みチェリーと別々の独立Binomialとして同時評価すると「非成立」側を含む同じ通常ゲーム試行を重ね、尤度の独立性を過大評価する。現行契約ではチェリーを代表小役Featureとして採用し、プラム単独Featureは二重計上回避のため不採用とする。';
  const rbTrial=getInput(s,'INP_RB_BGM_TRIALS'); if(rbTrial) rbTrial.name='100G以内連チャン中のRB入賞回数';
  const rb=getFeature(s,'RF_RB_BGM');
  rb.userReason='BB後100G以内の連チャン中（途中にRBを挟んでも継続）のRB入賞時に直接観測でき、安里屋ユンタ選択率は設定1/5=6%、設定2=12%、設定6=15%と偶数設定で高い。条件を満たすRBだけを母数にして補助Featureとして採用する。';
  write(`${rp(ids.triple)}/selection-data.json`,s);

  const ui=read(`${rp(ids.triple)}/ui-design-data.json`);
  renameSection(ui,'BB回数','通常時');
  ui.sections['通常時'].description='通常ゲーム数と、通常時に成立したBB・RB・チェリーを記録します。';
  renameSection(ui,'Specialトロフィー','BT中MB入賞時のSpecialトロフィー');
  ui.sections['BT中MB入賞時のSpecialトロフィー'].description='BT中のMB入賞時、Specialトロフィーが点灯する順番を1回ずつ記録します。「下→上」「上→下」のどちらかを入力してください。';
  renameSection(ui,'BB入賞時 琉球メドレー選択率','連チャン中BBの楽曲');
  ui.sections['連チャン中BBの楽曲'].description='BB後100G以内の連チャン中にBBへ当選したとき、琉球メドレーが流れた回数と対象BB回数を記録します。途中にRBを挟んでも連チャン扱いです。';
  renameSection(ui,'RB入賞時 安里屋ユンタ選択率','連チャン中RBの楽曲');
  ui.sections['連チャン中RBの楽曲'].description='BB後100G以内の連チャン中にRBへ当選したとき、安里屋ユンタが流れた回数と対象RB回数を記録します。途中にRBを挟んでも連チャン扱いです。';
  setUiName(ui,'INP_BB_INITIAL_COUNT','BB'); setUiName(ui,'INP_RB_INITIAL_COUNT','RB'); setUiName(ui,'INP_CHERRY_COUNT','チェリー');
  setUiName(ui,'INP_SPECIAL_BOTTOM_TOP','下→上'); setUiName(ui,'INP_SPECIAL_TOP_BOTTOM','上→下');
  setUiName(ui,'INP_BB_BGM_RYUKYU','琉球メドレー'); setUiName(ui,'INP_BB_BGM_TRIALS','対象BB回数');
  setUiName(ui,'INP_RB_BGM_ASADOYA','安里屋ユンタ'); setUiName(ui,'INP_RB_BGM_TRIALS','対象RB回数');
  write(`${rp(ids.triple)}/ui-design-data.json`,ui);
}

// ---------- Shinuchi Yoshimune ----------
{
  const ui=read(`${rp(ids.yoshi)}/ui-design-data.json`);
  renameSection(ui,'初当り','初当り・CZ柳生選択');
  const main=ui.sections['初当り・CZ柳生選択'];
  main.inputIds=[...new Set([...main.inputIds,'INP_CZ_YAGYU_SELECTED'])];
  main.description='通常ゲーム数とAT/CZ初当りを記録します。CZ当選時に「柳生」が選ばれた回数も入力し、柳生選択率はCZ初当り回数を母数に計算します。';
  if(ui.sections['CZ柳生選択回数']) { delete ui.sections['CZ柳生選択回数']; ui.sectionOrder=ui.sectionOrder.filter(x=>x!=='CZ柳生選択回数'); }
  renameSection(ui,'抜刀メーターMAX時 / 抜刀チャンス当選率','抜刀メーターMAX時の抽選');
  ui.sections['抜刀メーターMAX時の抽選'].description='有効な抜刀メーターMAX到達ごとに、抜刀チャンスへ当選したかを記録します。AT終了後の初回周期と5周期目は対象外です。';
  const atSec=ui.sections['AT終了画面'];
  atSec.inputIds=[
    'INP_AT_END_SCREEN_NO_MOON','INP_AT_END_SCREEN_CRESCENT','INP_AT_END_SCREEN_FULL_MOON',
    'INP_EVIDENCE_AT_END_2PLUS','INP_EVIDENCE_AT_END_4PLUS','INP_EVIDENCE_AT_END_5PLUS','INP_EVIDENCE_AT_END_6'
  ];
  atSec.description='AT終了時に表示された画面を1回につき1つ記録します。通常3パターンは確率推測、確定系4パターンはEvidenceとして同じ観測から分離して処理します。';
  const ev=ui.sections['設定示唆・確定情報'];
  ev.inputIds=ev.inputIds.filter(x=>!['INP_EVIDENCE_AT_END_2PLUS','INP_EVIDENCE_AT_END_4PLUS','INP_EVIDENCE_AT_END_5PLUS','INP_EVIDENCE_AT_END_6'].includes(x));
  ev.description='AT終了画面以外で確認した設定確定・否定演出を入力します。';
  setUiName(ui,'INP_AT_INITIAL_COUNT','AT初当り'); setUiName(ui,'INP_CZ_INITIAL_COUNT','CZ初当り'); setUiName(ui,'INP_CZ_YAGYU_SELECTED','柳生');
  setUiName(ui,'INP_BATTO_METER_MAX_HIT','抜刀チャンス当選'); setUiName(ui,'INP_BATTO_METER_MAX_TRIAL','対象MAX到達');
  setUiName(ui,'INP_AT_END_SCREEN_NO_MOON','月なし'); setUiName(ui,'INP_AT_END_SCREEN_CRESCENT','三日月'); setUiName(ui,'INP_AT_END_SCREEN_FULL_MOON','満月');
  setUiName(ui,'INP_EVIDENCE_AT_END_2PLUS','大岡越前'); setUiName(ui,'INP_EVIDENCE_AT_END_4PLUS','柳生宗矩'); setUiName(ui,'INP_EVIDENCE_AT_END_5PLUS','大奥'); setUiName(ui,'INP_EVIDENCE_AT_END_6','吉宗');
  write(`${rp(ids.yoshi)}/ui-design-data.json`,ui);
}

// ---------- Kyokou Suiri research/selection/observation ----------
{
  const r=read(`${rp(ids.kyokou)}/research-data.json`);
  if(!r.sources.some(x=>x.sourceId==='SRC_1GEKI_AYAKASHI')) r.sources.push({sourceId:'SRC_1GEKI_AYAKASHI',publisher:'1geki.jp',title:'虚構推理 あやかしぼーなす（RB）の詳細',url:'https://1geki.jp/slot/l_kyokousuiri/61/',checkedAt:'2026-09-08',sourceType:'major_analysis'});
  if(!r.features.some(x=>x.researchFeatureId==='RF_AYAKASHI_CHARACTER')) r.features.push({
    researchFeatureId:'RF_AYAKASHI_CHARACTER',name:'あやかしぼーなす中キャラ紹介（琴子/九朗）',factStatus:'verified',candidateModel:'multinomial',
    trialUnit:'あやかしぼーなす中に琴子または九朗が紹介された1枠',observationScope:'あやかしぼーなす中',
    numeratorDefinition:'岩永琴子・桜川九朗の出現回数',denominatorDefinition:'Hard Evidence/設定否定キャラを除き、琴子または九朗が紹介された総回数',
    categories:['KOTOKO','KURO'],distributionMode:'complete',settingValues:{},
    settingDistributions:{
      SET_1:{KOTOKO:0.3958333333333333,KURO:0.6041666666666666},SET_2:{KOTOKO:0.6,KURO:0.4},SET_3:{KOTOKO:0.40217391304347827,KURO:0.5978260869565217},
      SET_4:{KOTOKO:0.6,KURO:0.4},SET_5:{KOTOKO:0.4,KURO:0.6},SET_6:{KOTOKO:0.6046511627906976,KURO:0.3953488372093023}
    },
    sourceRefs:['SRC_1GEKI_AYAKASHI'],crossSourceStatus:'single_source_major',
    notes:'公開値は全キャラ出現率。琴子/九朗以外は設定否定または5以上濃厚のEvidenceとして別処理し、確率Featureでは琴子/九朗だけに条件付けて正規化する。'
  });
  const evidenceDefs=[
    ['RE_AYAKASHI_KARIN_DENY24','あやかしぼーなす中 七瀬かりん',['SET_1','SET_3','SET_5','SET_6'],['SET_2','SET_4']],
    ['RE_AYAKASHI_YUKIONNA_EVEN','あやかしぼーなす中 雪女',['SET_2','SET_4','SET_6'],['SET_1','SET_3','SET_5']],
    ['RE_AYAKASHI_RIKKA_5PLUS','あやかしぼーなす中 桜川六花',['SET_5','SET_6'],['SET_1','SET_2','SET_3','SET_4']],
    ['RE_AYAKASHI_RED3_DENY3','あやかしたち赤背景（3人目）',['SET_1','SET_2','SET_4','SET_5','SET_6'],['SET_3']],
    ['RE_AYAKASHI_RED2_DENY2','あやかしたち赤背景（2人目）',['SET_1','SET_3','SET_4','SET_5','SET_6'],['SET_2']],
    ['RE_AYAKASHI_RED1_DENY1','あやかしたち赤背景（1人目）',['SET_2','SET_3','SET_4','SET_5','SET_6'],['SET_1']]
  ];
  r.evidenceCandidates ??=[];
  for(const [id,name,allowed,denied] of evidenceDefs) if(!r.evidenceCandidates.some(x=>x.researchEvidenceId===id)) r.evidenceCandidates.push({researchEvidenceId:id,name,factStatus:'verified',allowedSettings:allowed,deniedSettings:denied,sourceRefs:['SRC_1GEKI_AYAKASHI']});
  r.discoveryInventory ??=[];
  if(!r.discoveryInventory.some(x=>x.researchTarget==='RF_AYAKASHI_CHARACTER')) r.discoveryInventory.push({discoveryCandidateId:'DC_16',name:'あやかしぼーなす中のキャラ出現率',transferStatus:'RESOLVED',researchTarget:['RF_AYAKASHI_CHARACTER',...evidenceDefs.map(x=>x[0])]});
  write(`${rp(ids.kyokou)}/research-data.json`,r);

  const s=read(`${rp(ids.kyokou)}/selection-data.json`);
  const ep1=getInput(s,'INP_INITIAL_EP1'); if(ep1) ep1.name='1から';
  const ep2=getInput(s,'INP_INITIAL_EP2'); if(ep2) ep2.name='2から';
  const ep3=getInput(s,'INP_INITIAL_EP3'); if(ep3) ep3.name='3から';
  const addInput=(obj)=>{if(!s.inputs.some(x=>x.id===obj.id)) s.inputs.push(obj)};
  addInput({id:'INP_AYAKASHI_KOTOKO',name:'岩永琴子',type:'counter',category:'SEL_RF_AYAKASHI_CHARACTER',unit:'回',displayOrder:41,inferenceRole:'INCLUDE_SUPPORT',defaultValue:''});
  addInput({id:'INP_AYAKASHI_KURO',name:'桜川九朗',type:'counter',category:'SEL_RF_AYAKASHI_CHARACTER',unit:'回',displayOrder:42,inferenceRole:'INCLUDE_SUPPORT',defaultValue:''});
  const evInputs=[
    ['INP_EVIDENCE_AYAKASHI_KARIN_DENY24','七瀬かりん'],['INP_EVIDENCE_AYAKASHI_YUKIONNA_EVEN','雪女'],['INP_EVIDENCE_AYAKASHI_RIKKA_5PLUS','桜川六花'],
    ['INP_EVIDENCE_AYAKASHI_RED3_DENY3','赤背景（3人目）'],['INP_EVIDENCE_AYAKASHI_RED2_DENY2','赤背景（2人目）'],['INP_EVIDENCE_AYAKASHI_RED1_DENY1','赤背景（1人目）']
  ];
  let order=43; for(const [id,name] of evInputs) addInput({id,name,type:'counter',category:'EVIDENCE',unit:'回',displayOrder:order++,inferenceRole:'INCLUDE_SUPPORT',defaultValue:''});
  if(!s.features.some(x=>x.researchFeatureId==='RF_AYAKASHI_CHARACTER')) s.features.push({
    researchFeatureId:'RF_AYAKASHI_CHARACTER',featureId:'FEAT_AYAKASHI_CHARACTER',adoptionCategory:'INCLUDE_SUPPORT',weight:1,
    difficultyParticipation:'EXCLUDE',difficultyExclusionReason:'あやかしぼーなすの実戦露出回数をObservationで確定後にDifficultyへ反映する。',
    userReason:'琴子/九朗の出現比率は設定ごとに奇偶傾向が明確で、あやかしぼーなす中に直接観測できる。設定否定・5以上濃厚キャラはEvidence側へ分離し、琴子/九朗だけの条件付き2カテゴリ分布を補助Featureとして採用する。',
    numeratorInputId:'INP_AYAKASHI_KOTOKO',categoryInputIds:['INP_AYAKASHI_KURO'],denominatorInputIds:['INP_AYAKASHI_KOTOKO','INP_AYAKASHI_KURO'],inputTransform:'sum_inputs_to_trials'
  });
  const selEv=(rid,eid,iid,name,allowed,denied)=>({researchEvidenceId:rid,evidenceId:eid,inputId:iid,name,displayName:name,allowedSettings:allowed,deniedSettings:denied,notes:'Researchで設定否定/設定範囲Evidenceとして検証済み。同一キャラ紹介の確率Featureでは除外し二重計上しない。'});
  const evSel=[
    selEv('RE_AYAKASHI_KARIN_DENY24','EVI_AYAKASHI_KARIN_DENY24','INP_EVIDENCE_AYAKASHI_KARIN_DENY24','あやかしぼーなす中 七瀬かりん',['SET_1','SET_3','SET_5','SET_6'],['SET_2','SET_4']),
    selEv('RE_AYAKASHI_YUKIONNA_EVEN','EVI_AYAKASHI_YUKIONNA_EVEN','INP_EVIDENCE_AYAKASHI_YUKIONNA_EVEN','あやかしぼーなす中 雪女',['SET_2','SET_4','SET_6'],['SET_1','SET_3','SET_5']),
    selEv('RE_AYAKASHI_RIKKA_5PLUS','EVI_AYAKASHI_RIKKA_5PLUS','INP_EVIDENCE_AYAKASHI_RIKKA_5PLUS','あやかしぼーなす中 桜川六花',['SET_5','SET_6'],['SET_1','SET_2','SET_3','SET_4']),
    selEv('RE_AYAKASHI_RED3_DENY3','EVI_AYAKASHI_RED3_DENY3','INP_EVIDENCE_AYAKASHI_RED3_DENY3','あやかしたち赤背景（3人目）',['SET_1','SET_2','SET_4','SET_5','SET_6'],['SET_3']),
    selEv('RE_AYAKASHI_RED2_DENY2','EVI_AYAKASHI_RED2_DENY2','INP_EVIDENCE_AYAKASHI_RED2_DENY2','あやかしたち赤背景（2人目）',['SET_1','SET_3','SET_4','SET_5','SET_6'],['SET_2']),
    selEv('RE_AYAKASHI_RED1_DENY1','EVI_AYAKASHI_RED1_DENY1','INP_EVIDENCE_AYAKASHI_RED1_DENY1','あやかしたち赤背景（1人目）',['SET_2','SET_3','SET_4','SET_5','SET_6'],['SET_1'])
  ];
  for(const e of evSel) if(!s.evidence.some(x=>x.evidenceId===e.evidenceId)) s.evidence.push(e);
  if(s.selectionSummaryContract){
    s.selectionSummaryContract.evaluatedCount=s.features.length;
    s.selectionSummaryContract.selectedCount=s.features.filter(x=>x.adoptionCategory!=='EXCLUDE').length;
    s.selectionSummaryContract.rejectedCount=s.features.filter(x=>x.adoptionCategory==='EXCLUDE').length;
    s.selectionSummaryContract.selected ??=[];
    if(!s.selectionSummaryContract.selected.some(x=>String(x.name).includes('あやかし'))) s.selectionSummaryContract.selected.push({name:'あやかしぼーなす中キャラ紹介',reason:'琴子/九朗の奇偶差を確率Featureとして採用し、設定否定・5以上濃厚キャラは同じ自然観測内のEvidenceとして分離。'});
  }
  write(`${rp(ids.kyokou)}/selection-data.json`,s);

  const o=read(`${rp(ids.kyokou)}/machine-observation-data.json`);
  const obs={observationId:'OBS_AYAKASHI_CHARACTER',sourceType:'END_EVENT',observationMode:'VISUAL_EVENT',status:'FOUND',label:'あやかしぼーなす中のキャラ紹介',categories:['岩永琴子','桜川九朗','七瀬かりん','雪女','桜川六花','あやかしたち赤背景（3人目）','あやかしたち赤背景（2人目）','あやかしたち赤背景（1人目）'],timing:['あやかしぼーなす中、キャラ紹介1枠ごとに表示キャラを記録する'],excludedConditions:['琴子/九朗以外の設定否定・5以上濃厚キャラを確率Featureへ混ぜない','同一表示を確率FeatureとEvidenceで二重計上しない','未観測を観測済み0として扱わない'],sourceRefs:['SRC_1GEKI_AYAKASHI'],notes:'琴子/九朗は確率Feature、その他6種はEvidenceとして同一自然観測から分離する。'};
  if(!o.observations.some(x=>x.observationId===obs.observationId)) o.observations.push(obs);
  if(!o.featureMappings.some(x=>x.featureId==='FEAT_AYAKASHI_CHARACTER')) o.featureMappings.push({featureId:'FEAT_AYAKASHI_CHARACTER',mappingType:'EXACT',observationIds:['OBS_AYAKASHI_CHARACTER'],collectionMethods:['VISUAL_EVENT'],usableForInference:true,usableForDifficulty:false,notes:'琴子/九朗の条件付き2カテゴリ分布。'});
  const hard=o.observations.find(x=>x.observationId==='OBS_HARD_EVIDENCE_EVENTS'); if(hard) for(const c of obs.categories.slice(2)) if(!hard.categories.includes(c)) hard.categories.push(c);
  write(`${rp(ids.kyokou)}/machine-observation-data.json`,o);

  const ui=read(`${rp(ids.kyokou)}/ui-design-data.json`);
  ui.sections['初当り'].description='通常ゲーム数と、CZ・ボーナスの初当り回数を記録します。';
  ui.sections['一発成功抽選'].description='CZ開始時の一発成功抽選について、抽選を受けた回数と成功した回数を記録します。';
  ui.sections['共通ベル'].description='CZ・AT本前兆中を除く共通ベル成立ごとに、非当選・CZ当選・ボーナス直撃のどれだったかを記録します。';
  const none=ui.inputContracts['INP_COMMON_BELL_NONE']; if(none){none.mode='NUMBER';none.gridSpan=12;none.directInput=true;none.compact=false;none.quickAdd=[50];none.quickInputEligible=false;}
  ui.inputContracts['INP_COMMON_BELL_CZ'].gridSpan=6; ui.inputContracts['INP_COMMON_BELL_BONUS'].gridSpan=6;
  renameSection(ui,'初回エピソード EP','初回エピソードの振り分け');
  ui.sections['初回エピソードの振り分け'].inputIds=['INP_INITIAL_EP1','INP_INITIAL_EP2','INP_INITIAL_EP3','INP_EVIDENCE_INITIAL_EP4_4PLUS','INP_EVIDENCE_INITIAL_EP5_6'];
  ui.sections['初回エピソードの振り分け'].description='設定変更時・虚構連モード駆け抜け後は除外';
  setUiName(ui,'INP_INITIAL_EP1','1から'); setUiName(ui,'INP_INITIAL_EP2','2から'); setUiName(ui,'INP_INITIAL_EP3','3から'); setUiName(ui,'INP_EVIDENCE_INITIAL_EP4_4PLUS','4から'); setUiName(ui,'INP_EVIDENCE_INITIAL_EP5_6','5から');
  renameSection(ui,'各エピソード開始時 / エピソードクリア当選率','エピソード開始時のクリア抽選');
  ui.sections['エピソード開始時のクリア抽選'].description='一発成功などですでにクリア済みのエピソードを除き、各エピソード開始時の抽選回数とクリア当選回数を記録します。';
  renameSection(ui,'虚構推理ボーナス終了画面','虚構推理ボーナス終了画面の振り分け');
  ui.sections['虚構推理ボーナス終了画面の振り分け'].description='虚構推理ボーナス（SUPER/赤7）の終了時に表示された画面を1回につき1つ記録します。';
  setUiName(ui,'INP_BONUS_END_KURO_KOTOKO','九朗＆琴子'); setUiName(ui,'INP_BONUS_END_KURO','九朗'); setUiName(ui,'INP_BONUS_END_KOTOKO','琴子'); setUiName(ui,'INP_BONUS_END_KOTOKO_SAKI','琴子＆紗季'); setUiName(ui,'INP_BONUS_END_RIKKA','六花');
  const charSec='あやかしぼーなす中のキャラ紹介';
  ui.sections[charSec]={inputIds:['INP_AYAKASHI_KOTOKO','INP_AYAKASHI_KURO',...evInputs.map(x=>x[0])],description:'あやかしぼーなす中、キャラ紹介1枠ごとに表示されたキャラを記録します。琴子/九朗は奇偶推測、その他は設定否定・設定範囲Evidenceとして同じ観測から分離して処理します。',observationRole:'END_EVENT',observationRefs:['OBS_AYAKASHI_CHARACTER'],acquisitionSources:['END_EVENT'],collapsible:false,defaultExpanded:true};
  const evSec='設定示唆・確定情報';
  ui.sectionOrder=ui.sectionOrder.filter(x=>x!==evSec && x!==charSec); ui.sectionOrder.push(charSec,evSec);
  const evSection=ui.sections[evSec]; evSection.inputIds=evSection.inputIds.filter(x=>!['INP_EVIDENCE_INITIAL_EP4_4PLUS','INP_EVIDENCE_INITIAL_EP5_6',...evInputs.map(x=>x[0])].includes(x));
  evSection.description='上の自然観測セクションに同居していない、その他の設定確定・否定演出を入力します。';
  const mkContract=(name,evidence=false)=>({name,mode:'COUNTER',gridSpan:6,directInput:false,compact:true,step:1,quickAdd:[1],quickInputEligible:true,inputVisible:true,emptyMeansUnobserved:true,observedZeroAllowed:true});
  ui.inputContracts['INP_AYAKASHI_KOTOKO']=mkContract('岩永琴子'); ui.inputContracts['INP_AYAKASHI_KURO']=mkContract('桜川九朗');
  for(const [id,name] of evInputs) ui.inputContracts[id]=mkContract(name,true);
  write(`${rp(ids.kyokou)}/ui-design-data.json`,ui);
}

// ---------- Akudama Drive UI ----------
{
  const ui=read(`${rp(ids.akudama)}/ui-design-data.json`);
  renameSection(ui,'0pt','シンテツドウポイント0pt到達時のCZ抽選');
  ui.sections['シンテツドウポイント0pt到達時のCZ抽選'].description='ベルでシンテツドウポイントが減算され、0ptへ到達したときのCZ「アナライズチャレンジ」抽選を記録します。0pt到達回数を母数、アナライズチャレンジ当選回数を分子にします。';
  setUiName(ui,'INP_ANALYZE_0PT_COUNT','アナライズチャレンジ当選'); setUiName(ui,'INP_ANALYZE_0PT_TRIALS','0pt到達');
  renameSection(ui,'ボーナス当選時 エピソードボーナス昇格','アクダマボーナス→エピソードボーナス昇格');
  ui.sections['アクダマボーナス→エピソードボーナス昇格'].description='ボーナス当選時に行われる種別昇格抽選を記録します。通常のアクダマボーナスとして告知される対象ボーナス当選を母数にし、そのうちエピソードボーナスへ昇格した回数を入力します。';
  setUiName(ui,'INP_EPISODE_UPGRADE_COUNT','エピソードボーナスへ昇格'); setUiName(ui,'INP_EPISODE_UPGRADE_TRIALS','昇格抽選を受けたボーナス');
  ui.sections['初当り'].description='通常ゲーム数と、CZ・ボーナス・ATの初当り回数を記録します。';
  write(`${rp(ids.akudama)}/ui-design-data.json`,ui);
}

// ---------- Global wording cleanup for the other Next10 UI contracts ----------
const globalDescriptions={
  L_FIRE_FORCE_2:{'初当り':'通常ゲーム数と、ボーナス・炎炎激闘の初当り回数を記録します。','REG/アクセル/灰焰終了画面':'REG・アクセルボーナス・灰焰ボーナスの終了時に表示された画面を1回につき1つ記録します。','炎炎ボーナス終了画面':'炎炎ボーナス終了時に表示された画面を1回につき1つ記録します。'},
  L_KABANERI_UNATO_KESSEN_XX:{'初当り':'通常ゲーム数と、ボーナス・STの初当り回数を記録します。','下段ベル':'下段ベルを判別できるゲームだけを母数にし、そのうち下段ベルが成立した回数を記録します。','3周期到達時ボーナス当選':'3周期目まで到達した回数を母数にし、その周期でボーナスへ当選した回数を記録します。','4周期到達時ボーナス当選':'4周期目まで到達した回数を母数にし、その周期でボーナスへ当選した回数を記録します。'},
  L_JORMUNGAND_ND01G:{'初当り':'通常ゲーム数と、CZ・ATの初当り回数を記録します。','REG/BIG終了画面振り分け':'REG/BIG終了時に表示された通常の終了画面を1回につき1つ記録します。確定系はEvidenceとして別処理します。'},
  L_MILLION_GOD_KISEKI_CX:{'GG初当り回数':'通常ゲーム数とGG初当り回数を記録します。','非ガイアステージGG当選後Z-ZONE移行':'ガイアステージ以外でGGへ当選した回数を母数にし、その後Z-ZONEへ移行した回数を記録します。'},
  L_GUNDAM_UNICORN_KAKUSEI_DRIVE_2JA:{'初当り':'通常ゲーム数と、CZ・ATの初当り回数を記録します。','スタンバイ時':'STANDBY状態へ移行したときに表示されたキャラを、男性・女性のどちらかで1回ずつ記録します。'}
};
for(const [id,map] of Object.entries(globalDescriptions)){
  const p=`${rp(id)}/ui-design-data.json`; const ui=read(p);
  for(const [sec,desc] of Object.entries(map)) if(ui.sections?.[sec]) ui.sections[sec].description=desc;
  if(ui.sections?.['設定示唆・確定情報']) ui.sections['設定示唆・確定情報'].description='実戦中に確認した設定確定・否定演出を入力します。通常の確率推測とは分離して扱います。';
  write(p,ui);
}

console.log('Applied 2026-09-08 device feedback v2');