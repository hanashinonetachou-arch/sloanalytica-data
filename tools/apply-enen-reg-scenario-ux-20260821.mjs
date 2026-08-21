import fs from 'node:fs';
import path from 'node:path';

const ROOT=process.cwd();
const p=path.join(ROOT,'research/L_ENEN_NO_SHOUBOUTAI_JG/selection-data.json');
const s=JSON.parse(fs.readFileSync(p,'utf8'));
s.machineDataVersion='0.1.2';

const labels={
  INP_REG_SCENARIO_E8_1:'第8①（低設定寄り）',
  INP_REG_SCENARIO_IRIS_2:'アイリス②（設定2否定）',
  INP_REG_SCENARIO_IRIS_3:'アイリス③（設定4否定）',
  INP_REG_SCENARIO_IRIS_4:'アイリス④（設定5否定）',
  INP_REG_SCENARIO_DENDO_1:'伝導者①（設定2・5寄り）',
  INP_REG_SCENARIO_E8_2:'第8②（設定6寄り）',
  INP_REG_SCENARIO_IRIS_1:'アイリス①（設定2以上）',
  INP_REG_SCENARIO_E8_3:'第8③（設定4以上）',
  INP_REG_SCENARIO_CAPTAIN:'大隊長（設定4以上）',
  INP_REG_SCENARIO_DENDO_2:'伝導者②（設定5以上）',
  INP_REG_SCENARIO_IRIS_5:'アイリス⑤（設定6）',
};
for(const input of s.inputs){
  if(labels[input.id]) input.name=labels[input.id];
}

const scenarioOrder=[
  'INP_REG_SCENARIO_TOTAL','INP_REG_SCENARIO_E8_1','INP_REG_SCENARIO_IRIS_2','INP_REG_SCENARIO_IRIS_3',
  'INP_REG_SCENARIO_IRIS_4','INP_REG_SCENARIO_DENDO_1','INP_REG_SCENARIO_E8_2','INP_REG_SCENARIO_IRIS_1',
  'INP_REG_SCENARIO_E8_3','INP_REG_SCENARIO_CAPTAIN','INP_REG_SCENARIO_DENDO_2','INP_REG_SCENARIO_IRIS_5'
];
scenarioOrder.forEach((id,i)=>{const x=s.inputs.find(v=>v.id===id); if(x) x.displayOrder=13+i;});

s.uiCategoryLabels={
  ...(s.uiCategoryLabels||{}),
  REG_SCENARIO:'REG中キャラ紹介',
  FF_END:'炎炎ボーナス終了画面',
  REG_END:'REG終了画面'
};
s.uiCategoryDescriptions={
  ...(s.uiCategoryDescriptions||{}),
  REG_SCENARIO:'REG中のキャラ紹介シナリオを、設定推測上の意味が分かる項目へ加算してください。',
  FF_END:'ST中は主に炎炎ボーナスとなるため、必要なときだけ開いて入力してください。',
  REG_END:'通常時は主にREGとなるため、必要なときだけ開いて入力してください。'
};
s.uiSectionOptions={
  ...(s.uiSectionOptions||{}),
  FF_END:{...(s.uiSectionOptions?.FF_END||{}),collapsible:true,defaultExpanded:false},
  REG_END:{...(s.uiSectionOptions?.REG_END||{}),collapsible:true,defaultExpanded:false},
  ADORA_JAC:{...(s.uiSectionOptions?.ADORA_JAC||{}),collapsible:true,defaultExpanded:false}
};

fs.writeFileSync(p,JSON.stringify(s,null,2)+'\n');
console.log('Fire Force REG scenario UX updated');
