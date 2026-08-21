import fs from 'node:fs';
const p='research/L_ENEN_NO_SHOUBOUTAI_JG/selection-data.json';
const s=JSON.parse(fs.readFileSync(p,'utf8'));
s.machineDataVersion='0.1.4';

function compactEnding(category,prefix,baseOrder){
  s.inputs=s.inputs.filter(i=>i.id!==`${prefix}_TOTAL`);
  const ids=[`${prefix}_DEFAULT`,`${prefix}_FRONT`,`${prefix}_LEFT`,`${prefix}_GROUP`,`${prefix}_RED`,`${prefix}_GOLD`];
  const defaultInput={id:`${prefix}_DEFAULT`,name:'デフォルト',type:'counter',category,displayOrder:baseOrder,defaultValue:null,unit:'回',uiGridSpan:6,uiCompactCounter:true};
  const firstIdx=s.inputs.findIndex(i=>i.category===category);
  s.inputs.splice(firstIdx<0?s.inputs.length:firstIdx,0,defaultInput);
  ids.slice(1).forEach((id,index)=>{const i=s.inputs.find(x=>x.id===id); if(i){delete i.parentInputId;i.displayOrder=baseOrder+index+1;i.uiGridSpan=6;i.uiCompactCounter=true;}});
  return ids;
}
const ffIds=compactEnding('FF_END','INP_FF_END',30);
const regIds=compactEnding('REG_END','INP_REG_END',40);

for(const f of s.features){
  if(f.featureId==='FEAT_FF_BONUS_END'){
    f.inputTransform='sum_inputs_to_trials';
    f.numeratorInputId=ffIds[0];
    f.categoryInputIds=ffIds.slice(1);
    f.denominatorInputIds=ffIds;
    delete f.denominatorInputId;
    delete f.residualCategoryLabel;
  }
  if(f.featureId==='FEAT_REG_END'){
    f.inputTransform='sum_inputs_to_trials';
    f.numeratorInputId=regIds[0];
    f.categoryInputIds=regIds.slice(1);
    f.denominatorInputIds=regIds;
    delete f.denominatorInputId;
    delete f.residualCategoryLabel;
  }
}
s.uiCategoryDescriptions={...(s.uiCategoryDescriptions||{}),FF_END:'終了画面を確認したら該当する1項目に+1してください。総数は6項目の合計から自動計算します。',REG_END:'終了画面を確認したら該当する1項目に+1してください。総数は6項目の合計から自動計算します。'};
fs.writeFileSync(p,JSON.stringify(s,null,2)+'\n');

const b='tools/build-machine-data.mjs';
let text=fs.readFileSync(b,'utf8');
text=text.replace(`...(i.uiDirectInput===false?{config:{directInput:false}}:{}),`,`...((i.uiDirectInput===false||i.uiCompactCounter===true)?{config:{...(i.uiDirectInput===false?{directInput:false}:{}),...(i.uiCompactCounter===true?{compact:true}:{})}}:{}),`);
fs.writeFileSync(b,text);
console.log('Fire Force explicit default + compact counter metadata applied');
