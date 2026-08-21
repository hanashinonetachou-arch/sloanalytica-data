import fs from 'node:fs';
const p='research/S_HARD_BOILED_XX/selection-data.json';
const d=JSON.parse(fs.readFileSync(p,'utf8'));
d.machineDataVersion='0.1.3';
d.inputs=(d.inputs??[]).filter(i=>i.id!=='INP_JAC_VOICE_TOTAL');
const ids=['INP_JAC_VOICE_GOOD','INP_JAC_VOICE_GREAT','INP_JAC_VOICE_MARVELOUS','INP_JAC_VOICE_EXCELLENT','INP_JAC_VOICE_UNBELIEVABLE'];
for(const i of d.inputs??[]){
  if(ids.includes(i.id)) delete i.parentInputId;
}
const f=(d.features??[]).find(x=>x.featureId==='FEAT_BIG_JAC_MISS_VOICE');
if(!f) throw new Error('JAC voice feature missing');
f.numeratorInputId='INP_JAC_VOICE_GOOD';
f.categoryInputIds=['INP_JAC_VOICE_GREAT','INP_JAC_VOICE_MARVELOUS','INP_JAC_VOICE_EXCELLENT','INP_JAC_VOICE_UNBELIEVABLE'];
f.denominatorInputIds=[...ids];
f.inputTransform='sum_inputs_to_trials';
f.categoryExcludeLabels=['NONE'];
delete f.denominatorInputId;
delete f.residualCategoryLabel;
f.userReason='JAC INハズシ成功時に確認できた5種類のセリフ構成比を条件付き分布として評価する。総数は5項目の合計から自動計算する。';
d.uiCategoryDescriptions={...(d.uiCategoryDescriptions||{}),JAC_VOICE:'通常時BIG中、逆押しJAC INハズシ成功時にセリフを確認したら該当項目を＋してください。5項目の合計を母数として自動計算します。'};
fs.writeFileSync(p,JSON.stringify(d,null,2)+'\n');
