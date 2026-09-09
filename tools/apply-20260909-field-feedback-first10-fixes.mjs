import fs from 'node:fs';
import path from 'node:path';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');
const must=(cond,msg)=>{if(!cond)throw new Error(msg)};
const by=(xs,key,val)=>xs.find(x=>x?.[key]===val);
const removeInputs=(obj,ids)=>{ obj.inputs=(obj.inputs??[]).filter(x=>!ids.has(x.id)); };

const BIG='research/L_BIG_DREAM_GOLDEN_PUSHER_KR';
const RIO='research/L_SUPER_RIO_ACE2_ND02H';

// ---------- Big Dream: ceiling re-review + end screen ----------
{
  const rp=`${BIG}/research-data.json`, sp=`${BIG}/selection-data.json`, op=`${BIG}/machine-observation-data.json`, up=`${BIG}/ui-design-data.json`;
  const r=read(rp), s=read(sp), o=read(op), u=read(up);
  must(by(r.features,'researchFeatureId','RF_GAME_CEILING_1499'),'Big Dream ceiling research feature missing');
  const ceiling=by(s.features,'featureId','FEAT_GAME_CEILING_1499');
  must(ceiling,'Big Dream ceiling selection feature missing');
  Object.assign(ceiling,{
    adoptionCategory:'EXCLUDE',
    userReason:'天井振り分け自体には設定差があるが、選ばれた天井ゲーム数は到達前にAT等へ当選すると外から確定できない。到達した周期だけを母数にすると偏りが生じるため、同じ条件で全試行を数えられず数値推測には使用しない。',
    userFacingReason:'天井振り分けには設定差がありますが、途中でATなどに当選すると「何G天井が選ばれていたか」は確認できません。天井まで到達したときだけ数えるとデータが偏るため、設定推測の計算には使用しません。天井到達時は成功濃厚のJUDGEMENTを経由してATへ入りますが、これは到達した周期の確認用です。'
  });
  delete ceiling.numeratorInputId; delete ceiling.denominatorInputId;
  const ceilingInputs=new Set(['INP_NUM_GAME_CEILING_1499','INP_DEN_GAME_CEILING_1499']);
  removeInputs(s,ceilingInputs);

  if(!by(r.sources,'sourceId','SRC_NANA_END_SCREEN')) r.sources.push({sourceId:'SRC_NANA_END_SCREEN',publisher:'nana-press.com',title:'ビッグドリーム （覚醒）ゴールデンチャレンジ終了画面の示唆',url:'https://nana-press.com/kaiseki/machine/1151/36860/',checkedAt:'2026-09-09',sourceType:'analysis'});
  if(!by(r.features,'researchFeatureId','RF_GC_END_SCREEN')) r.features.push({
    researchFeatureId:'RF_GC_END_SCREEN',name:'ゴールデンチャレンジ終了画面',factStatus:'verified',candidateModel:'multinomial',trialUnit:'通常AT後のゴールデンチャレンジ終了画面1回',numeratorDefinition:'終了画面ごとの出現回数',denominatorDefinition:'通常AT後のゴールデンチャレンジ終了画面回数',settingValues:{},
    categories:['帽子','銃&玉','剣','金銀財宝の山','ギルガメッシュ立ち絵','ギルガメッシュ見返り','ギルガメッシュ玉座','覚醒ギルガメッシュ'],
    settingDistributions:{
      SET_1:{'帽子':0.775,'銃&玉':0.15,'剣':0.075,'金銀財宝の山':0,'ギルガメッシュ立ち絵':0,'ギルガメッシュ見返り':0,'ギルガメッシュ玉座':0,'覚醒ギルガメッシュ':0},
      SET_2:{'帽子':0.7154,'銃&玉':0.20,'剣':0.075,'金銀財宝の山':0,'ギルガメッシュ立ち絵':0.0095,'ギルガメッシュ見返り':0,'ギルガメッシュ玉座':0,'覚醒ギルガメッシュ':0},
      SET_3:{'帽子':0.7533,'銃&玉':0.155,'剣':0.08,'金銀財宝の山':0,'ギルガメッシュ立ち絵':0.0117,'ギルガメッシュ見返り':0,'ギルガメッシュ玉座':0,'覚醒ギルガメッシュ':0},
      SET_4:{'帽子':0.6717,'銃&玉':0.20,'剣':0.10,'金銀財宝の山':0.005,'ギルガメッシュ立ち絵':0.0134,'ギルガメッシュ見返り':0.0098,'ギルガメッシュ玉座':0,'覚醒ギルガメッシュ':0},
      SET_5:{'帽子':0.6636,'銃&玉':0.16,'剣':0.1375,'金銀財宝の山':0.005,'ギルガメッシュ立ち絵':0.0138,'ギルガメッシュ見返り':0.0101,'ギルガメッシュ玉座':0.0101,'覚醒ギルガメッシュ':0},
      SET_6:{'帽子':0.60,'銃&玉':0.20,'剣':0.15,'金銀財宝の山':0.005,'ギルガメッシュ立ち絵':0.0141,'ギルガメッシュ見返り':0.0103,'ギルガメッシュ玉座':0.0103,'覚醒ギルガメッシュ':0.0103}
    },distributionMode:'complete',sourceRefs:['SRC_NANA_END_SCREEN'],crossSourceStatus:'single_source',notes:'設定下限が確定する5カテゴリはEvidenceとして分離し、数値Featureでは帽子・銃&玉・剣の3カテゴリだけを条件付きで使用する。マイスロで終了画面出現回数を自動カウント可能。'
  });
  for(const ev of [
    ['RE_GC_TREASURE_4PLUS','金銀財宝の山','SET_4'],['RE_GC_STANDING_2PLUS','ギルガメッシュ立ち絵','SET_2'],['RE_GC_LOOKBACK_4PLUS','ギルガメッシュ見返り','SET_4'],['RE_GC_THRONE_5PLUS','ギルガメッシュ玉座','SET_5'],['RE_GC_AWAKENED_6','覚醒ギルガメッシュ','SET_6']
  ]) if(!by(r.evidenceCandidates,'researchEvidenceId',ev[0])){
    const start=Number(ev[2].split('_')[1]);
    r.evidenceCandidates.push({researchEvidenceId:ev[0],name:ev[1],factStatus:'verified',allowedSettings:r.machine.settings.filter(x=>Number(x.split('_')[1])>=start),deniedSettings:r.machine.settings.filter(x=>Number(x.split('_')[1])<start),sourceRefs:['SRC_NANA_END_SCREEN'],sourceWording:`${ev[1]}は設定${start}以上濃厚`});
  }
  const endInputDefs=[
    {id:'INP_GC_END_HAT',name:'帽子',category:'SEL_GC_END_SCREEN',type:'counter',unit:'回',displayOrder:18,inferenceRole:'INCLUDE_SUPPORT',defaultValue:'',minimum:0,uiGridSpan:6},
    {id:'INP_GC_END_GUN',name:'銃&玉',category:'SEL_GC_END_SCREEN',type:'counter',unit:'回',displayOrder:19,inferenceRole:'INCLUDE_SUPPORT',defaultValue:'',minimum:0,uiGridSpan:6},
    {id:'INP_GC_END_SWORD',name:'剣',category:'SEL_GC_END_SCREEN',type:'counter',unit:'回',displayOrder:20,inferenceRole:'INCLUDE_SUPPORT',defaultValue:'',minimum:0,uiGridSpan:6}
  ];
  for(const inp of endInputDefs) if(!by(s.inputs,'id',inp.id)) s.inputs.push(inp);
  if(!by(s.features,'featureId','FEAT_GC_END_SCREEN')) s.features.push({featureId:'FEAT_GC_END_SCREEN',researchFeatureId:'RF_GC_END_SCREEN',adoptionCategory:'INCLUDE_SUPPORT',userReason:'通常AT後のゴールデンチャレンジ終了画面は設定別選択率が公開され、画面を直接確認できる。設定下限確定画面はEvidenceへ分離し、帽子・銃&玉・剣の相対分布だけを数値推測に使用する。',userFacingReason:'通常AT後のゴールデンチャレンジ終了画面は設定別の出現率が公開されているため採用します。帽子・銃&玉・剣を数えてください。設定2以上などが確定する画面は下の「設定確定・否定情報」で別に入力します。マイスロ利用時は終了画面の回数を自動で確認できます。',weight:1,integratedContribution:false,numeratorInputId:'INP_GC_END_HAT',categoryInputIds:['INP_GC_END_GUN','INP_GC_END_SWORD'],inputTransform:'sum_inputs_to_trials',denominatorInputIds:['INP_GC_END_HAT','INP_GC_END_GUN','INP_GC_END_SWORD'],categoryExcludeLabels:['金銀財宝の山','ギルガメッシュ立ち絵','ギルガメッシュ見返り','ギルガメッシュ玉座','覚醒ギルガメッシュ']});
  s.evidenceUi=s.evidenceUi??{groups:[]}; s.evidenceUi.groups=s.evidenceUi.groups??[];
  for(const [gid,label,rid,start] of [
    ['EVI_GC_TREASURE_4PLUS','金銀財宝の山','RE_GC_TREASURE_4PLUS',4],['EVI_GC_STANDING_2PLUS','ギルガメッシュ立ち絵','RE_GC_STANDING_2PLUS',2],['EVI_GC_LOOKBACK_4PLUS','ギルガメッシュ見返り','RE_GC_LOOKBACK_4PLUS',4],['EVI_GC_THRONE_5PLUS','ギルガメッシュ玉座','RE_GC_THRONE_5PLUS',5],['EVI_GC_AWAKENED_6','覚醒ギルガメッシュ','RE_GC_AWAKENED_6',6]
  ]) if(!by(s.evidenceUi.groups,'groupId',gid)) s.evidenceUi.groups.push({groupId:gid,label,options:[{value:rid,label,allowedSettings:s.features? r.machine.settings.filter(x=>Number(x.split('_')[1])>=start):[],excludedSettings:r.machine.settings.filter(x=>Number(x.split('_')[1])<start),sourceEvidenceIds:[rid]}]});

  const ss=s.selectionSummaryContract;
  if(ss){
    ss.selected=(ss.selected??[]).filter(x=>x.name!=='ゲーム数天井1499G選択');
    if(!ss.selected.some(x=>x.name==='ゴールデンチャレンジ終了画面')) ss.selected.push({name:'ゴールデンチャレンジ終了画面',reason:'通常AT後の終了画面は設定別選択率が公開され、直接カウントできるため採用。設定下限確定画面はEvidenceへ分離する。'});
    if(!ss.rejected.some(x=>x.name==='ゲーム数天井1499G選択')) ss.rejected.push({name:'ゲーム数天井1499G選択',reason:ceiling.userFacingReason});
    ss.selectedCount=ss.selected.length; ss.rejectedCount=ss.rejected.length; ss.evaluatedCount=ss.selectedCount+ss.rejectedCount;
  }

  o.observations=(o.observations??[]).filter(x=>x.label!=='ゲーム数天井1499G選択' && !String(x.observationId).includes('GAME_CEILING'));
  o.featureMappings=(o.featureMappings??[]).filter(x=>x.featureId!=='FEAT_GAME_CEILING_1499');
  if(!by(o.observations,'observationId','OBS_GC_END_SCREEN')) o.observations.push({observationId:'OBS_GC_END_SCREEN',sourceType:'DIRECT_PLAY',observationMode:'MANUAL_COUNTER',status:'FOUND',label:'ゴールデンチャレンジ終了画面',categories:['帽子','銃&玉','剣'],numeratorDefinition:'終了画面ごとの出現回数',denominatorDefinition:'帽子・銃&玉・剣の合計回数',acquisitionUnit:'通常AT後のゴールデンチャレンジ終了画面1回',targetState:'通常AT後のゴールデンチャレンジ終了時',timing:['終了画面が表示されたとき'],excludedConditions:['覚醒ゴールデンチャレンジ終了画面','設定下限が確定する終了画面（Evidenceとして別入力）'],resetCondition:'実戦セッション開始時に0へリセット。',previousPlayerUsable:false,ownSessionUsable:true,definitionEquality:'EXACT_WITH_PUBLIC_RESEARCH_DEFINITION',sourceRefs:['SRC_NANA_END_SCREEN','SRC_MYSLOT'],notes:'帽子・銃&玉・剣のみを数値推測に使用。マイスロの終了画面自動カウントも利用可能。',includedConditions:['通常AT後のゴールデンチャレンジ終了画面']});
  if(!by(o.featureMappings,'featureId','FEAT_GC_END_SCREEN')) o.featureMappings.push({featureId:'FEAT_GC_END_SCREEN',mappingType:'EXACT',observationIds:['OBS_GC_END_SCREEN'],collectionMethods:['MANUAL_COUNTER','LINKED_SERVICE'],usableForInference:true,usableForDifficulty:true,primaryObservationId:'OBS_GC_END_SCREEN',fallbackObservationIds:[],fallbackConsidered:true,fallbackReason:'実機表示を直接数える。マイスロは同じ終了画面回数を確認する補助経路。',denominatorDefinition:'帽子・銃&玉・剣の合計回数',numeratorDefinition:'終了画面ごとの出現回数',includedConditions:['通常AT後のゴールデンチャレンジ終了画面'],excludedConditions:['覚醒ゴールデンチャレンジ終了画面','設定下限が確定する終了画面'],resetCondition:'実戦セッション開始時に0へリセット。',previousPlayerUsable:false,ownSessionUsable:true,updateTiming:['終了画面が表示されたとき']});

  for(const key of [...(u.sectionOrder??[])]){
    const sec=u.sections?.[key]; if(sec?.inputIds?.some(id=>ceilingInputs.has(id))){ u.sectionOrder=u.sectionOrder.filter(x=>x!==key); delete u.sections[key]; }
  }
  for(const id of ceilingInputs) delete u.inputContracts?.[id];
  if(!u.sectionOrder.includes('ゴールデンチャレンジ終了画面')) u.sectionOrder.push('ゴールデンチャレンジ終了画面');
  u.sections['ゴールデンチャレンジ終了画面']={inputIds:['INP_GC_END_HAT','INP_GC_END_GUN','INP_GC_END_SWORD'],description:'通常AT後のゴールデンチャレンジが終わったときの画面を数えてください。「帽子」「銃&玉」「剣」の3種類だけをここへ入力します。設定2以上などが確定する画面は「設定確定・否定情報」へ入力してください。マイスロを使っている場合は終了画面の回数を自動で確認できます。',collapsible:false,defaultExpanded:true,observationRole:'DIRECT_PLAY',suppressInputDescriptions:true};
  for(const inp of endInputDefs) u.inputContracts[inp.id]={name:inp.name,mode:'COUNTER',gridSpan:6,directInput:false,compact:true,step:1,emptyMeansUnobserved:true,observedZeroAllowed:true,quickAdd:[1]};
  write(rp,r); write(sp,s); write(op,o); write(up,u);
}

// ---------- Rio: direct bonus clarification + Howard UI + end sign + watermelon rejection ----------
{
  const rp=`${RIO}/research-data.json`, sp=`${RIO}/selection-data.json`, op=`${RIO}/machine-observation-data.json`, up=`${RIO}/ui-design-data.json`;
  const r=read(rp), s=read(sp), o=read(op), u=read(up);
  const direct=by(s.features,'featureId','FEAT_BONUS_DIRECT');
  if(direct) direct.userFacingReason='通常時にノワールルームを経由せず当選したボーナスは、設定差が大きく公開確率も全設定そろっているため採用します。通常ゲーム数と、該当するボーナス直撃回数を入力してください。';
  const wm=by(s.features,'featureId','FEAT_WATERMELON_NEXT_NOIR'); must(wm,'Rio watermelon feature missing');
  Object.assign(wm,{adoptionCategory:'EXCLUDE',userReason:'スイカ成立時の次回ノワールルーム成功抽選には設定差があるが、内部で先に行われる成功抽選であり、通常遊技中に「このスイカで当選した」と確定できる表示が確認できない。次回ノワールルームの成功だけでは通常の成功抽選との区別もできないため、分子を確実に数えられず数値推測には使用しない。',userFacingReason:'スイカ成立時の「次回ノワールルーム成功抽選」には設定差がありますが、そのスイカで内部当選したかを確実に見分ける方法が確認できません。次のノワールルームが成功しても、スイカの抽選で成功が決まったとは断定できないため、設定推測の計算には使用しません。PUSHなどの示唆は期待度を示すもので、当選確定のカウントには使いません。'});
  delete wm.numeratorInputId; delete wm.denominatorInputId;
  const wmInputs=new Set(['INP_NUM_WATERMELON_NEXT_NOIR','INP_DEN_WATERMELON_NEXT_NOIR']); removeInputs(s,wmInputs);

  const hi=by(s.inputs,'id','INP_NUM_HOWARD_THRESHOLD'), hd=by(s.inputs,'id','INP_DEN_HOWARD_THRESHOLD');
  must(hi&&hd,'Rio Howard inputs missing'); hi.name='ハワードゲーム'; hi.uiGridSpan=12; hd.name='規定リプレイ50回到達'; hd.uiGridSpan=12;

  if(!by(r.sources,'sourceId','SRC_ALTEMA_END_SCREEN')) r.sources.push({sourceId:'SRC_ALTEMA_END_SCREEN',publisher:'altema.jp',title:'リオエース2 終了画面の設定示唆',url:'https://altema.jp/pachimo/lrioace2gamen',checkedAt:'2026-09-09',sourceType:'analysis'});
  if(!by(r.features,'researchFeatureId','RF_RINA_SIGN')) r.features.push({researchFeatureId:'RF_RINA_SIGN',name:'BB・AT終了画面 リナサイン',factStatus:'verified',candidateModel:'binomial',trialUnit:'BB・AT終了画面1回',numeratorDefinition:'リナサイン出現回数',denominatorDefinition:'BB・AT終了画面確認回数',settingValues:{SET_1:{probability:0.01,rawDisplay:'1.0%'},SET_2:{probability:0.02,rawDisplay:'2.0%'},SET_3:{probability:0.03,rawDisplay:'3.0%'},SET_4:{probability:0.04,rawDisplay:'4.0%'},SET_5:{probability:0.045,rawDisplay:'4.5%'},SET_6:{probability:0.05,rawDisplay:'5.0%'}},sourceRefs:['SRC_ALTEMA_END_SCREEN'],crossSourceStatus:'single_source',notes:'リオサインは奇数示唆、ミントサインは偶数示唆だが、設定別の完全な出現率が公開確認できないため数値Featureにはリナサインのみ採用。'});
  const rinaInputs=[
    {id:'INP_NUM_RINA_SIGN',name:'リナサイン',category:'SEL_RINA_SIGN',type:'counter',unit:'回',displayOrder:18,inferenceRole:'INCLUDE_SUPPORT',defaultValue:'',minimum:0,uiGridSpan:12},
    {id:'INP_DEN_RINA_SIGN',name:'BB・AT終了画面',category:'SEL_RINA_SIGN',type:'integer',unit:'回',displayOrder:19,inferenceRole:'INCLUDE_SUPPORT',defaultValue:'',minimum:0,uiGridSpan:12}
  ];
  for(const inp of rinaInputs) if(!by(s.inputs,'id',inp.id)) s.inputs.push(inp);
  if(!by(s.features,'featureId','FEAT_RINA_SIGN')) s.features.push({featureId:'FEAT_RINA_SIGN',researchFeatureId:'RF_RINA_SIGN',adoptionCategory:'INCLUDE_SUPPORT',userReason:'リナサインはBB・AT終了画面ごとの設定別出現率が全設定で公開され、直接カウントできるため補助推測要素として採用する。',userFacingReason:'BB・AT終了画面のリナサインは、設定1の1.0%から設定6の5.0%まで設定別出現率が公開されているため採用します。終了画面を確認した回数と、リナサインが出た回数を入力してください。',weight:1,integratedContribution:false,numeratorInputId:'INP_NUM_RINA_SIGN',denominatorInputId:'INP_DEN_RINA_SIGN'});
  const hints=by(s.qualitativeDisposition,'candidateId','RQ_HINTS'); if(hints){hints.reason='リナサインは設定別出現率が公開されたため数値推測へ採用。リオサイン（奇数示唆）とミントサイン（偶数示唆）は示唆内容は有用だが設定別出現率が揃っていないため確率計算には使用せず参考情報として保持する。'; hints.userFacingRejected=false;}

  const ss=s.selectionSummaryContract;
  if(ss){
    ss.selected=(ss.selected??[]).filter(x=>x.name!=='スイカ成立時 次回ノワールルーム成功抽選');
    if(!ss.selected.some(x=>x.name==='BB・AT終了画面 リナサイン')) ss.selected.push({name:'BB・AT終了画面 リナサイン',reason:'設定別出現率が全設定で公開され、終了画面から直接カウントできるため採用する。'});
    if(!ss.rejected.some(x=>x.name==='スイカ成立時 次回ノワールルーム成功抽選')) ss.rejected.push({name:'スイカ成立時 次回ノワールルーム成功抽選',reason:wm.userFacingReason});
    ss.selectedCount=ss.selected.length; ss.rejectedCount=ss.rejected.length; ss.evaluatedCount=ss.selectedCount+ss.rejectedCount;
  }

  o.observations=(o.observations??[]).filter(x=>!String(x.observationId).includes('WATERMELON_NEXT_NOIR'));
  o.featureMappings=(o.featureMappings??[]).filter(x=>x.featureId!=='FEAT_WATERMELON_NEXT_NOIR');
  const howObs=by(o.observations,'observationId','OBS_004_HOWARD_THRESHOLD'); if(howObs){howObs.label='ハワードゲーム';howObs.numeratorDefinition='ハワードゲーム当選回数';howObs.denominatorDefinition='規定リプレイ50回到達回数';howObs.includedConditions=['通常時に規定リプレイ50回へ到達したとき'];}
  const howMap=by(o.featureMappings,'featureId','FEAT_HOWARD_THRESHOLD'); if(howMap){howMap.numeratorDefinition='ハワードゲーム当選回数';howMap.denominatorDefinition='規定リプレイ50回到達回数';howMap.includedConditions=['通常時に規定リプレイ50回へ到達したとき'];}
  if(!by(o.observations,'observationId','OBS_RINA_SIGN')) o.observations.push({observationId:'OBS_RINA_SIGN',sourceType:'DIRECT_PLAY',observationMode:'MANUAL_COUNTER',status:'FOUND',label:'BB・AT終了画面 リナサイン',categories:[],numeratorDefinition:'リナサイン出現回数',denominatorDefinition:'BB・AT終了画面確認回数',acquisitionUnit:'BB・AT終了画面1回',targetState:'BB・AT終了時',timing:['BBまたはATの終了画面が表示されたとき'],excludedConditions:[],resetCondition:'実戦セッション開始時に0へリセット。',previousPlayerUsable:false,ownSessionUsable:true,definitionEquality:'EXACT_WITH_PUBLIC_RESEARCH_DEFINITION',sourceRefs:['SRC_ALTEMA_END_SCREEN','SRC_SLOPLA'],notes:'画面左上のサインを確認。スロプラNEXTの各種サイン回数も補助経路として利用可能。',includedConditions:['BB・AT終了画面']});
  if(!by(o.featureMappings,'featureId','FEAT_RINA_SIGN')) o.featureMappings.push({featureId:'FEAT_RINA_SIGN',mappingType:'EXACT',observationIds:['OBS_RINA_SIGN'],collectionMethods:['MANUAL_COUNTER','LINKED_SERVICE'],usableForInference:true,usableForDifficulty:true,primaryObservationId:'OBS_RINA_SIGN',fallbackObservationIds:[],fallbackConsidered:true,fallbackReason:'終了画面を直接確認し、スロプラNEXTのサイン回数も補助的に利用できる。',sharedDenominatorInputId:'INP_DEN_RINA_SIGN',denominatorDefinition:'BB・AT終了画面確認回数',numeratorDefinition:'リナサイン出現回数',includedConditions:['BB・AT終了画面'],excludedConditions:[],resetCondition:'実戦セッション開始時に0へリセット。',previousPlayerUsable:false,ownSessionUsable:true,updateTiming:['BBまたはATの終了画面が表示されたとき']});

  // UI: remove uncountable watermelon section, make Howard friendly and vertical, add Rina section.
  for(const key of [...(u.sectionOrder??[])]){ const sec=u.sections?.[key]; if(sec?.inputIds?.some(id=>wmInputs.has(id))){u.sectionOrder=u.sectionOrder.filter(x=>x!==key);delete u.sections[key];}}
  for(const id of wmInputs) delete u.inputContracts?.[id];
  const oldHoward=Object.keys(u.sections??{}).find(k=>u.sections[k]?.inputIds?.includes('INP_DEN_HOWARD_THRESHOLD'));
  if(oldHoward){ const sec=u.sections[oldHoward]; delete u.sections[oldHoward]; u.sectionOrder=u.sectionOrder.map(x=>x===oldHoward?'ハワードゲーム':x); u.sections['ハワードゲーム']={...sec,inputIds:['INP_DEN_HOWARD_THRESHOLD','INP_NUM_HOWARD_THRESHOLD'],description:'通常時に規定リプレイが50回まで到達したら「規定リプレイ50回到達」を1回数えてください。そのときハワードゲームに当選したら「ハワードゲーム」も1回数えます。'}; }
  u.inputContracts['INP_DEN_HOWARD_THRESHOLD']={...(u.inputContracts['INP_DEN_HOWARD_THRESHOLD']??{}),name:'規定リプレイ50回到達',gridSpan:12,quickAdd:[1]};
  u.inputContracts['INP_NUM_HOWARD_THRESHOLD']={...(u.inputContracts['INP_NUM_HOWARD_THRESHOLD']??{}),name:'ハワードゲーム',gridSpan:12};
  const normal=u.sections?.['通常時']; if(normal) normal.description='自分で回した通常ゲーム数と、その間に確認できた初当り・ノワールルーム・ボーナス直撃を入力してください。ボーナス直撃は、通常時にノワールルームを経由せずボーナスへ当選したときだけ数えます。';
  if(!u.sectionOrder.includes('BB・AT終了画面')) u.sectionOrder.push('BB・AT終了画面');
  u.sections['BB・AT終了画面']={inputIds:['INP_DEN_RINA_SIGN','INP_NUM_RINA_SIGN'],description:'BBまたはATが終わるたびに終了画面を確認してください。「BB・AT終了画面」は確認した回数、「リナサイン」は画面左上にリナのサインが出た回数を入力します。リオサインは奇数設定示唆、ミントサインは偶数設定示唆ですが、設定別出現率が揃っていないため推測計算には使いません。',collapsible:false,defaultExpanded:true,observationRole:'DIRECT_PLAY',suppressInputDescriptions:true};
  for(const inp of rinaInputs) u.inputContracts[inp.id]={name:inp.name,mode:inp.type==='counter'?'COUNTER':'NUMBER',gridSpan:12,directInput:inp.type!=='counter',...(inp.type==='counter'?{compact:true,step:1}:{}),emptyMeansUnobserved:true,observedZeroAllowed:true,quickAdd:[1]};
  write(rp,r); write(sp,s); write(op,o); write(up,u);
}

// ---------- Global: soften first10 section descriptions ----------
const first10=['L_ANIMAL_SLOT_DOCCHI_ZT','L_BIG_DREAM_GOLDEN_PUSHER_KR','L_BIOHAZARD_RE3_ZD','L_TAKT_OP_DESTINY_M1','L_SUPER_RIO_ACE2_ND02H','L_BIRDIE_WING_BC','L_SAO2_PA1','L_SENGOKU_OTOME5_L8','L_DARK_HAIBI_SB','L_LOTIS_TN'];
for(const id of first10){
  const p=`research/${id}/ui-design-data.json`; if(!fs.existsSync(p)) continue; const u=read(p);
  for(const sec of Object.values(u.sections??{})){
    if(typeof sec.description!=='string') continue;
    sec.description=sec.description
      .replaceAll('同じ観測区間で','同じ実戦中に')
      .replaceAll('実戦を開始した時点から自分で確認できた区間だけを入力してください。','自分で確認できた回数だけを入力してください。')
      .replaceAll('対象条件下の','条件に当てはまる')
      .replaceAll('観測区間','実戦中の範囲')
      .replaceAll('数える範囲：','数え方：');
  }
  write(p,u);
}

console.log('PASS 20260909 field-feedback first10 canonical fixes applied');
