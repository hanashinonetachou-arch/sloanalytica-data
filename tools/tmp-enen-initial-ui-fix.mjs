import fs from 'node:fs';

const p='research/L_ENEN_NO_SHOUBOUTAI_JG/selection-data.json';
const d=JSON.parse(fs.readFileSync(p,'utf8'));
d.machineDataVersion='0.1.7';
const initial=d.inputs.find(i=>i.id==='INP_INITIAL');
const bonus=d.inputs.find(i=>i.id==='INP_BONUS_INITIAL');
if(!initial||!bonus) throw new Error('initial inputs missing');
initial.name='灰焔騎士団の回数';
delete initial.description;
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

let bp='tools/build-machine-data.mjs';
let s=fs.readFileSync(bp,'utf8');
const old=`  if(rf.candidateModel==="binomial" || rf.candidateModel==="poisson"){\n    if(!sf.numeratorInputId||!sf.denominatorInputId) fail(\`${'${sf.featureId}'}: numeratorInputId/denominatorInputId required\`);\n    if(!inputIds.has(sf.numeratorInputId)||!inputIds.has(sf.denominatorInputId)) fail(\`${'${sf.featureId}'}: unknown input mapping\`);\n    base.numeratorInputId=sf.numeratorInputId; base.denominatorInputId=sf.denominatorInputId;\n    if(base.displayFormat==null) base.displayFormat="ratio_1_over_n";\n    base.probabilities=Object.fromEntries(Object.entries(rf.settingValues??{}).map(([s,v])=>[s,v.probability]).filter(([,p])=>Number.isFinite(p)));\n  } else if(rf.candidateModel==="multinomial"){`;
const next=`  if(rf.candidateModel==="binomial" || rf.candidateModel==="poisson"){\n    const numeratorInputIds=Array.isArray(sf.numeratorInputIds)?sf.numeratorInputIds:[];\n    const usesNumeratorSum=sf.inputTransform==="sum_inputs_to_numerator";\n    const usesDenominatorSum=sf.inputTransform==="sum_inputs_to_trials";\n    if(!sf.numeratorInputId) fail(\`${'${sf.featureId}'}: numeratorInputId required\`);\n    if(!inputIds.has(sf.numeratorInputId)) fail(\`${'${sf.featureId}'}: unknown numerator input\`);\n    if(usesNumeratorSum){\n      if(numeratorInputIds.length<2||numeratorInputIds.some(id=>!inputIds.has(id))) fail(\`${'${sf.featureId}'}: invalid numeratorInputIds\`);\n      base.numeratorInputIds=[...numeratorInputIds];\n    }\n    if(usesDenominatorSum){\n      if(!Array.isArray(sf.denominatorInputIds)||sf.denominatorInputIds.length<2||sf.denominatorInputIds.some(id=>!inputIds.has(id))) fail(\`${'${sf.featureId}'}: invalid denominatorInputIds\`);\n      base.denominatorInputIds=[...sf.denominatorInputIds];\n    } else {\n      if(!sf.denominatorInputId||!inputIds.has(sf.denominatorInputId)) fail(\`${'${sf.featureId}'}: denominatorInputId required/unknown\`);\n      base.denominatorInputId=sf.denominatorInputId;\n    }\n    base.numeratorInputId=sf.numeratorInputId;\n    if(base.displayFormat==null) base.displayFormat="ratio_1_over_n";\n    base.probabilities=Object.fromEntries(Object.entries(rf.settingValues??{}).map(([s,v])=>[s,v.probability]).filter(([,p])=>Number.isFinite(p)));\n  } else if(rf.candidateModel==="multinomial"){`;
if(s.includes(old)) s=s.replace(old,next); else if(!s.includes('usesNumeratorSum=sf.inputTransform')) throw new Error('build-machine-data patch target not found');
fs.writeFileSync(bp,s);

let vp='tools/validate-selection-data.mjs';
s=fs.readFileSync(vp,'utf8');
if(!s.includes('numeratorInputIds must contain at least 2 input ids')){
  const anchor='   if(f.trialCountInputId && !idset.has(f.trialCountInputId)) errors.push(`${f.featureId}: unknown trialCountInputId ${f.trialCountInputId}`);';
  const insert=`   if(f.numeratorInputIds){\n     if(!Array.isArray(f.numeratorInputIds) || f.numeratorInputIds.length<2) errors.push(\`${'${f.featureId}'}: numeratorInputIds must contain at least 2 input ids\`);\n     else for(const id of f.numeratorInputIds) if(!idset.has(id)) errors.push(\`${'${f.featureId}'}: unknown numerator input ${'${id}'}\`);\n   }`;
  if(!s.includes(anchor)) throw new Error('validate-selection patch target not found');
  s=s.replace(anchor,anchor+'\n'+insert);
}
fs.writeFileSync(vp,s);
