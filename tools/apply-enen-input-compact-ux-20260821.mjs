import fs from 'node:fs';

const p='research/L_ENEN_NO_SHOUBOUTAI_JG/selection-data.json';
const s=JSON.parse(fs.readFileSync(p,'utf8'));
s.machineDataVersion='0.1.3';

// REG character scenarios: all 11 outcomes are explicitly entered, so the total is redundant.
s.inputs=s.inputs.filter(x=>x.id!=='INP_REG_SCENARIO_TOTAL');
for(const x of s.inputs){
  if(x.category==='REG_SCENARIO') delete x.parentInputId;
  if((x.category==='FF_END'||x.category==='REG_END') && x.type==='counter') x.uiGridSpan=6;
}
const rf=s.features.find(x=>x.researchFeatureId==='RF_REG_SCENARIO');
if(!rf) throw new Error('RF_REG_SCENARIO selection missing');
delete rf.denominatorInputId;
rf.inputTransform='sum_inputs_to_trials';
rf.denominatorInputIds=[rf.numeratorInputId,...(rf.categoryInputIds||[])];

s.uiCategoryDescriptions={
  ...(s.uiCategoryDescriptions||{}),
  REG_SCENARIO:'REG中に確認したシナリオへ+1してください。確認回数は各シナリオの合計から自動計算します。'
};
s.uiSectionOptions={
  ...(s.uiSectionOptions||{}),
  REG_SCENARIO:{...(s.uiSectionOptions?.REG_SCENARIO||{}),collapsible:true,defaultExpanded:false},
  FF_END:{...(s.uiSectionOptions?.FF_END||{}),collapsible:true,defaultExpanded:false},
  REG_END:{...(s.uiSectionOptions?.REG_END||{}),collapsible:true,defaultExpanded:false}
};

fs.writeFileSync(p,JSON.stringify(s,null,2)+'\n');
console.log('Fire Force compact input UX applied');
