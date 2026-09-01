#!/usr/bin/env node
import fs from 'node:fs';

const root='research/L_MAGIA_RECORD_RN';
const selPath=`${root}/selection-data.json`;
const uiPath=`${root}/ui-design-data.json`;
const obsPath=`${root}/machine-observation-data.json`;
const sel=JSON.parse(fs.readFileSync(selPath,'utf8'));
const ui=JSON.parse(fs.readFileSync(uiPath,'utf8'));
const obs=JSON.parse(fs.readFileSync(obsPath,'utf8'));

sel.machineDataVersion='0.1.2';
const oldTrialIds=new Set(['INP_BONUS_FIRST_HIT_TRIALS','INP_AT_FIRST_HIT_TRIALS']);
sel.inputs=sel.inputs.filter(i=>!oldTrialIds.has(i.id));
if(!sel.inputs.some(i=>i.id==='INP_NORMAL_GAME_COUNT')){
  sel.inputs.splice(0,0,{id:'INP_NORMAL_GAME_COUNT',name:'有効通常ゲーム数',category:'COMMON_NORMAL_GAMES',type:'integer',unit:'G',displayOrder:5,inferenceRole:'INCLUDE_PRIMARY',defaultValue:''});
}
for(const f of sel.features){
  if(f.featureId==='FEAT_BONUS_FIRST_HIT'||f.featureId==='FEAT_AT_FIRST_HIT') f.denominatorInputId='INP_NORMAL_GAME_COUNT';
}
for(const i of sel.inputs){
  if(i.id==='INP_MITAMA_LEVEL2_AT_COUNT') i.name='Lv2 AT当選';
  if(i.id==='INP_MITAMA_LEVEL2_AT_TRIALS'){i.name='Lv2 試行';i.type='counter';}
  if(i.id==='INP_MITAMA_LEVEL3_AT_COUNT') i.name='Lv3 AT当選';
  if(i.id==='INP_MITAMA_LEVEL3_AT_TRIALS'){i.name='Lv3 試行';i.type='counter';}
}

ui.sectionOrder=['通常ゲーム数','ボーナス初当り','マギアラッシュ初当り','弱チェリー','エピソードボーナス選択率','みたま報酬','BIG終了画面','AT終了画面','エンディングカード','ストーリーコンプリート','ストーリー5話開始'];
const old=ui.sections;
ui.sections={
  '通常ゲーム数':{inputIds:['INP_NORMAL_GAME_COUNT'],description:'ボーナス初当り・マギアラッシュ初当りの共通分母です。通常時に回した有効ゲーム数を入力します。ボーナス・AT・CZ中など、通常時の初当り抽選を受けていないゲームは含めません。',observationRole:'DIRECT_PLAY',observationRefs:['OBS_BONUS_FIRST_HIT','OBS_AT_FIRST_HIT'],acquisitionSources:['DIRECT_PLAY'],collapsible:false,defaultExpanded:true},
  'ボーナス初当り':{...old['ボーナス初当り'],inputIds:['INP_BONUS_FIRST_HIT_COUNT'],description:'通常時から当選したボーナス初当り回数。分母は上の「有効通常ゲーム数」を共通利用します。'},
  'マギアラッシュ初当り':{...old['マギアラッシュ初当り'],inputIds:['INP_AT_FIRST_HIT_COUNT'],description:'通常時から当選したマギアラッシュ初当り回数。分母は上の「有効通常ゲーム数」を共通利用します。'},
  '弱チェリー':old['弱チェリー'],
  'エピソードボーナス選択率':old['エピソードボーナス選択率'],
  'みたま報酬':{inputIds:['INP_MITAMA_LEVEL2_AT_TRIALS','INP_MITAMA_LEVEL3_AT_TRIALS','INP_MITAMA_LEVEL2_AT_COUNT','INP_MITAMA_LEVEL3_AT_COUNT'],description:'ウワサ発展1回ごとに該当Lvの「試行」を+1。ATに当選した場合は同じLvの「AT当選」も+1します。',observationRole:'DIRECT_PLAY',observationRefs:['OBS_MITAMA_LEVEL2_AT','OBS_MITAMA_LEVEL3_AT'],acquisitionSources:['DIRECT_PLAY'],collapsible:false,defaultExpanded:true},
  'BIG終了画面':{inputIds:['INP_BIG_END_2PLUS_COUNT','INP_BIG_END_4PLUS_COUNT','INP_BIG_END_5PLUS_COUNT','INP_BIG_END_6_COUNT'],description:'BIG終了画面で確認した確定系だけ入力します。',collapsible:false,defaultExpanded:true},
  'AT終了画面':{inputIds:['INP_AT_END_6_COUNT'],description:'AT終了画面で確認した確定系だけ入力します。',collapsible:false,defaultExpanded:true},
  'エンディングカード':{inputIds:['INP_END_CARD_4PLUS_COUNT','INP_END_CARD_DENY1_COUNT','INP_END_CARD_DENY2_COUNT','INP_END_CARD_DENY3_COUNT','INP_END_CARD_DENY4_PENDULUM_COUNT','INP_END_CARD_DENY4_NIGHTJAR_COUNT'],description:'エンディングで確認したカードを入力します。',collapsible:true,defaultExpanded:false},
  'ストーリーコンプリート':{inputIds:['INP_STORY_5PLUS_COUNT'],description:'ストーリーコンプリート時のキャラ紹介シナリオを入力します。',collapsible:true,defaultExpanded:false},
  'ストーリー5話開始':{inputIds:['INP_STORY_ORDER_DENY1_COUNT','INP_STORY_ORDER_DENY2_COUNT','INP_STORY_ORDER_DENY3_COUNT','INP_STORY_ORDER_5PLUS_COUNT'],description:'5話開始時のキャラ紹介順を確認して入力します。',collapsible:true,defaultExpanded:false}
};

ui.inputContracts['INP_NORMAL_GAME_COUNT']={name:'有効通常ゲーム数',mode:'NUMBER',gridSpan:12,directInput:true,quickAdd:[50],quickInputEligible:false,inputVisible:true,emptyMeansUnobserved:true,observedZeroAllowed:true};
delete ui.inputContracts['INP_BONUS_FIRST_HIT_TRIALS'];
delete ui.inputContracts['INP_AT_FIRST_HIT_TRIALS'];
for(const id of ['INP_MITAMA_LEVEL2_AT_TRIALS','INP_MITAMA_LEVEL3_AT_TRIALS']){
  Object.assign(ui.inputContracts[id],{mode:'COUNTER',gridSpan:6,directInput:false,compact:true,step:1,quickAdd:[1],quickInputEligible:true});
}
for(const id of ['INP_MITAMA_LEVEL2_AT_COUNT','INP_MITAMA_LEVEL3_AT_COUNT']) Object.assign(ui.inputContracts[id],{gridSpan:6,directInput:false,compact:true,step:1,quickAdd:[1],quickInputEligible:true});
for(const [id,name] of Object.entries({INP_MITAMA_LEVEL2_AT_TRIALS:'Lv2 試行',INP_MITAMA_LEVEL3_AT_TRIALS:'Lv3 試行',INP_MITAMA_LEVEL2_AT_COUNT:'Lv2 AT当選',INP_MITAMA_LEVEL3_AT_COUNT:'Lv3 AT当選'})) ui.inputContracts[id].name=name;

for(const id of ['INP_BIG_END_2PLUS_COUNT','INP_BIG_END_4PLUS_COUNT','INP_BIG_END_5PLUS_COUNT','INP_BIG_END_6_COUNT','INP_END_CARD_4PLUS_COUNT','INP_END_CARD_DENY1_COUNT','INP_END_CARD_DENY2_COUNT','INP_END_CARD_DENY3_COUNT','INP_END_CARD_DENY4_PENDULUM_COUNT','INP_END_CARD_DENY4_NIGHTJAR_COUNT','INP_STORY_ORDER_DENY1_COUNT','INP_STORY_ORDER_DENY2_COUNT','INP_STORY_ORDER_DENY3_COUNT','INP_STORY_ORDER_5PLUS_COUNT']) ui.inputContracts[id].gridSpan=6;

for(const o of obs.observations){
  if(o.observationId==='OBS_BONUS_FIRST_HIT'){
    o.label='ボーナス初当り 回数・有効通常ゲーム数'; o.categories=['ボーナス初当り 回数','有効通常ゲーム数'];
    o.notes='通常時からのボーナス初当り回数を、共通の有効通常ゲーム数で評価する。AT初当りが入力される場合はSelectionのsuppressionにより独立二重評価しない。';
  }
  if(o.observationId==='OBS_AT_FIRST_HIT'){
    o.label='マギアラッシュ初当り 回数・有効通常ゲーム数'; o.categories=['マギアラッシュ初当り 回数','有効通常ゲーム数'];
    o.notes='通常時からのマギアラッシュ初当り回数を、共通の有効通常ゲーム数で評価する。';
  }
  if(o.observationId==='OBS_MITAMA_LEVEL2_AT'){o.label='みたま報酬Lv2 試行・AT当選';o.categories=['Lv2 試行','Lv2 AT当選'];}
  if(o.observationId==='OBS_MITAMA_LEVEL3_AT'){o.label='みたま報酬Lv3 試行・AT当選';o.categories=['Lv3 試行','Lv3 AT当選'];}
}

fs.writeFileSync(selPath,JSON.stringify(sel,null,2)+'\n');
fs.writeFileSync(uiPath,JSON.stringify(ui,null,2)+'\n');
fs.writeFileSync(obsPath,JSON.stringify(obs,null,2)+'\n');
console.log('Applied Magia device UX refinement 2.');
