import fs from 'node:fs';

const machineId='L_MAGIA_RECORD_RN';
const uiPath=`research/${machineId}/ui-design-data.json`;
const selPath=`research/${machineId}/selection-data.json`;
const ui=JSON.parse(fs.readFileSync(uiPath,'utf8'));
const sel=JSON.parse(fs.readFileSync(selPath,'utf8'));

const mergedTitle='通常時・初当り';
ui.sectionOrder = [
  mergedTitle,
  '弱チェリー',
  'エピソードボーナス選択率',
  'みたま報酬',
  'BIG終了画面',
  'AT終了画面',
  'ストーリー5話開始',
  'ストーリーコンプリート',
  'エンディングカード',
];

ui.sections[mergedTitle] = {
  inputIds:['INP_NORMAL_GAME_COUNT','INP_BONUS_FIRST_HIT_COUNT','INP_AT_FIRST_HIT_COUNT'],
  description:'有効通常ゲーム数は、通常時に回したゲーム数です。ボーナス・AT・CZ中など初当り抽選を受けていないゲームは含めません。この1つのゲーム数を、ボーナス初当りとマギアラッシュ初当りの共通分母として使います。',
  observationRole:'DIRECT_PLAY',
  observationRefs:['OBS_BONUS_FIRST_HIT','OBS_AT_FIRST_HIT'],
  acquisitionSources:['DIRECT_PLAY'],
  collapsible:false,
  defaultExpanded:true,
};
delete ui.sections['通常ゲーム数'];
delete ui.sections['ボーナス初当り'];
delete ui.sections['マギアラッシュ初当り'];

ui.sections['弱チェリー'].description='弱チェリーを実際にカウントした通常時のゲーム数を「カウント対象G数」に入力します。実戦開始から継続して弱チェリーを数えているなら、上の「有効通常ゲーム数」と同じ値です。途中から数え始めた・途中で数えるのをやめた場合は、そのカウント区間のゲーム数だけを入力してください。';

Object.assign(ui.inputContracts.INP_NORMAL_GAME_COUNT,{name:'有効通常ゲーム数',gridSpan:12,directInput:true,inputVisible:true});
Object.assign(ui.inputContracts.INP_BONUS_FIRST_HIT_COUNT,{name:'ボーナス初当り',gridSpan:6});
Object.assign(ui.inputContracts.INP_AT_FIRST_HIT_COUNT,{name:'マギアラッシュ初当り',gridSpan:6});
Object.assign(ui.inputContracts.INP_WEAK_CHERRY_COUNT,{name:'弱チェリー',gridSpan:6});
Object.assign(ui.inputContracts.INP_WEAK_CHERRY_TRIALS,{name:'カウント対象G数',gridSpan:6,directInput:true});

for(const input of sel.inputs){
  if(input.id==='INP_BONUS_FIRST_HIT_COUNT') input.name='ボーナス初当り';
  if(input.id==='INP_AT_FIRST_HIT_COUNT') input.name='マギアラッシュ初当り';
  if(input.id==='INP_WEAK_CHERRY_COUNT') input.name='弱チェリー';
  if(input.id==='INP_WEAK_CHERRY_TRIALS') input.name='カウント対象G数';
}
sel.machineDataVersion='0.1.3';

fs.writeFileSync(uiPath,JSON.stringify(ui,null,2)+'\n');
fs.writeFileSync(selPath,JSON.stringify(sel,null,2)+'\n');
console.log('applied Magia device UX3');
