import fs from 'node:fs';
const p='research/L_ENEN_NO_SHOUBOUTAI_JG/selection-data.json';
const d=JSON.parse(fs.readFileSync(p,'utf8'));
d.machineDataVersion='0.1.7';
const initial=d.inputs.find(i=>i.id==='INP_INITIAL');
const bonus=d.inputs.find(i=>i.id==='INP_BONUS_INITIAL');
if(!initial||!bonus) throw new Error('initial inputs missing');
initial.name='灰焔騎士団の回数';
initial.description=undefined;
initial.category='PRIMARY';
bonus.name='初当りボーナスの回数';
bonus.description='灰焔騎士団からのボーナス当選は除いてください。';
bonus.category='PRIMARY';
delete bonus.parentInputId;
const feat=d.features.find(f=>f.featureId==='FEAT_INITIAL');
if(!feat) throw new Error('FEAT_INITIAL missing');
feat.numeratorInputIds=['INP_INITIAL','INP_BONUS_INITIAL'];
feat.numeratorInputId='INP_INITIAL';
feat.inputTransform='sum_inputs_to_numerator';
const share=d.features.find(f=>f.featureId==='FEAT_BONUS_SHARE');
if(share){
  share.numeratorInputId='INP_BONUS_INITIAL';
  share.denominatorInputIds=['INP_INITIAL','INP_BONUS_INITIAL'];
  share.inputTransform='sum_inputs_to_trials';
  delete share.denominatorInputId;
}
for(const i of d.inputs){
  if(i.category==='ADORA_JAC'){
    i.uiDirectInput=false;
    i.uiGridSpan=6;
    i.uiCompactCounter=true;
  }
}
d.uiCategoryLabels={...(d.uiCategoryLabels||{}),PRIMARY:'初当り'};
d.uiCategoryDescriptions={...(d.uiCategoryDescriptions||{}),PRIMARY:'通常時は「灰焔騎士団」または「初当りボーナス」のどちらかに＋1してください。初当り合算は2項目の合計から自動計算します。'};
fs.writeFileSync(p,JSON.stringify(d,null,2)+'\n');
