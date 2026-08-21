import fs from 'node:fs';

const p='research/L_ENEN_NO_SHOUBOUTAI_JG/selection-data.json';
const s=JSON.parse(fs.readFileSync(p,'utf8'));
s.machineDataVersion='0.1.5';

const endingPrefixes=['INP_FF_END_','INP_REG_END_'];
for (const input of s.inputs) {
  if (endingPrefixes.some(prefix => input.id.startsWith(prefix))) {
    input.uiDirectInput=false;
  }
}

const jacIds=[
  'INP_ADORA_JAC_SHINRA',
  'INP_ADORA_JAC_ARTHUR',
  'INP_ADORA_JAC_HINAWA',
  'INP_ADORA_JAC_MAKI',
  'INP_ADORA_JAC_TAMAKI',
  'INP_ADORA_JAC_OUBI',
  'INP_ADORA_JAC_JOKER',
  'INP_ADORA_JAC_BENIMARU',
  'INP_ADORA_JAC_IRIS'
];
s.inputs=s.inputs.filter(input=>input.id!=='INP_ADORA_JAC_TOTAL');
for (const id of jacIds) {
  const input=s.inputs.find(x=>x.id===id);
  if (!input) throw new Error(`missing ${id}`);
  delete input.parentInputId;
  input.uiDirectInput=false;
}

const jacFeature=s.features.find(f=>f.featureId==='FEAT_ADORA_JAC_CHAR');
if (!jacFeature) throw new Error('missing FEAT_ADORA_JAC_CHAR');
jacFeature.inputTransform='sum_inputs_to_trials';
jacFeature.numeratorInputId=jacIds[0];
jacFeature.categoryInputIds=jacIds.slice(1);
jacFeature.denominatorInputIds=jacIds;
delete jacFeature.denominatorInputId;
delete jacFeature.residualCategoryLabel;

s.uiCategoryDescriptions={
  ...(s.uiCategoryDescriptions||{}),
  FF_END:'終了画面を確認したら該当する1項目を＋してください。総数は6項目の合計から自動計算します。',
  REG_END:'終了画面を確認したら該当する1項目を＋してください。総数は6項目の合計から自動計算します。',
  ADORA_JAC:'アドラバースト突入時のみ入力してください。JAC開始ごとに該当キャラを＋してください。総数は各キャラの合計から自動計算します。'
};

fs.writeFileSync(p,JSON.stringify(s,null,2)+'\n');
console.log('Fire Force button-only counter migration applied');
