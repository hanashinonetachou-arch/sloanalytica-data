#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT=process.cwd();
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n','utf8');
const req=(arr,pred,msg)=>{const x=(arr??[]).find(pred);if(!x)throw new Error(msg);return x;};

const base=path.join(ROOT,'research','L_DISCUP_ULTRA_REMIX_XR');
const researchPath=path.join(base,'research-data.json');
const selectionPath=path.join(base,'selection-data.json');
const research=read(researchPath);
const selection=read(selectionPath);

research.machine.machineDataVersion='0.1.2';
selection.machineDataVersion='0.1.2';

const rf=req(research.features,x=>x.researchFeatureId==='RF_REG_HINT_MODE','RF_REG_HINT_MODE missing');
if(rf.candidateModel!=='multinomial') throw new Error('RF_REG_HINT_MODE must be multinomial');
const expected=['ODD','EVEN','SET2PLUS','SET5PLUS','SET6'];
if(JSON.stringify(rf.categories)!==JSON.stringify(expected)) throw new Error(`Unexpected REG hint categories: ${JSON.stringify(rf.categories)}`);

// Public percentages for SET_5 / SET_6 sum to 100.01% because of source rounding.
// Preserve the published values in notes and normalize only the model probabilities to 1.0.
const published={};
for(const [setting,dist] of Object.entries(rf.settingDistributions??{})){
  published[setting]=Object.fromEntries(expected.map(c=>[c,Number(dist[c])]));
  const sum=expected.reduce((a,c)=>a+Number(dist[c]),0);
  if(!Number.isFinite(sum)||sum<=0) throw new Error(`${setting}: invalid REG hint distribution`);
  if(Math.abs(sum-1)>0.001) throw new Error(`${setting}: REG hint distribution sum too far from 1: ${sum}`);
  rf.settingDistributions[setting]=Object.fromEntries(expected.map(c=>[c,Number(dist[c])/sum]));
}
rf.distributionMode='complete';
rf.notes='REG中の設定示唆は演出モードを問わずトータル選択率が共通。公開丸め値は SET_1=55.00/45.00/0/0/0%、SET_2=45.00/53.90/1.10/0/0%、SET_5=57.50/39.57/2.02/0.92/0%、SET_6=46.15/50.00/2.02/0.92/0.92%。SET_5・SET_6は丸めで合計100.01%となるため、推測用確率のみ同一比率のまま合計1.0へ正規化する。REG1回につき最終的な示唆区分を1カテゴリとして集計する。';

selection.uiCategoryLabels={...(selection.uiCategoryLabels??{}),REG_HINT:'REG中設定示唆'};
selection.uiCategoryDescriptions={...(selection.uiCategoryDescriptions??{}),REG_HINT:'REG1回につき、最終的に確認できた示唆区分を1つだけ入力してください。「設定2以上」「設定5以上」「設定6」は、この同じ入力が割合推測と設定確定Evidenceの両方に反映されます。'};

const inputs=[
  ['INP_REG_HINT_ODD','奇数設定示唆',40],
  ['INP_REG_HINT_EVEN','偶数設定示唆',41],
  ['INP_REG_HINT_2PLUS','設定2以上',42],
  ['INP_REG_HINT_5PLUS','設定5以上',43],
  ['INP_REG_HINT_6','設定6',44],
];
for(const [id,name,displayOrder] of inputs){
  let inp=(selection.inputs??[]).find(x=>x.id===id);
  if(!inp){
    inp={id,name,type:'counter',category:'REG_HINT',unit:'回',displayOrder,inferenceRole:'INCLUDE_SUPPORT',defaultValue:null};
    selection.inputs.push(inp);
  }else Object.assign(inp,{name,type:'counter',category:'REG_HINT',unit:'回',displayOrder,inferenceRole:'INCLUDE_SUPPORT',defaultValue:null});
}

const sf=req(selection.features,x=>x.researchFeatureId==='RF_REG_HINT_MODE','Selection RF_REG_HINT_MODE missing');
Object.assign(sf,{
  featureId:'FEAT_REG_HINT_MODE',
  adoptionCategory:'INCLUDE_SUPPORT',
  numeratorInputId:'INP_REG_HINT_ODD',
  categoryInputIds:['INP_REG_HINT_EVEN','INP_REG_HINT_2PLUS','INP_REG_HINT_5PLUS','INP_REG_HINT_6'],
  inputTransform:'sum_inputs_to_trials',
  weight:1,
  difficultyParticipation:'EXCLUDE',
  userReason:'REG中設定示唆は各REGで排他的に観測でき、演出モード共通の設定別トータル選択率が公開されているため補助採用します。設定下限・確定カテゴリは同じ入力をEvidenceにも共用し、二重入力せず割合推測と確定判定の両方に利用します。'
});
delete sf.summarySuppressed;
delete sf.denominatorInputId;
delete sf.denominatorInputIds;

// REG confirmation categories move out of the separate generic Evidence UI.
for(const group of selection.evidenceUi?.groups??[]){
  group.options=(group.options??[]).filter(o=>!['RE_REG_2PLUS','RE_REG_5PLUS','RE_REG_6'].some(id=>(o.sourceEvidenceIds??[]).includes(id)));
}
selection.evidenceUi.groups=(selection.evidenceUi?.groups??[]).filter(g=>(g.options??[]).length>0);

const direct=[
  ['RE_REG_2PLUS','EVI_REG_HINT_2PLUS','INP_REG_HINT_2PLUS'],
  ['RE_REG_5PLUS','EVI_REG_HINT_5PLUS','INP_REG_HINT_5PLUS'],
  ['RE_REG_6','EVI_REG_HINT_6','INP_REG_HINT_6'],
];
selection.evidence=selection.evidence??[];
for(const [researchEvidenceId,evidenceId,inputId] of direct){
  const existing=selection.evidence.find(e=>e.evidenceId===evidenceId || e.researchEvidenceId===researchEvidenceId);
  const value={researchEvidenceId,evidenceId,inputId,sharedFeatureIds:['FEAT_REG_HINT_MODE']};
  if(existing) Object.assign(existing,value); else selection.evidence.push(value);
}

write(researchPath,research);
write(selectionPath,selection);

// Keep the natural REG-hint input surface together in generated UI Design.
const uiBuilderPath=path.join(ROOT,'tools','build-ui-design-20260827-user-batch.mjs');
let uiBuilder=fs.readFileSync(uiBuilderPath,'utf8');
const oldRule=" L_DISCUP_ULTRA_REMIX_XR:[['通常時',/通常ゲーム/],['小役',/3枚役/],['ボーナス',/BIG|REG/]],";
const newRule=" L_DISCUP_ULTRA_REMIX_XR:[['通常時',/通常ゲーム/],['小役',/3枚役/],['ボーナス',/BIG|REG/],['REG中設定示唆',/奇数設定示唆|偶数設定示唆|設定2以上|設定5以上|設定6/]],";
if(!uiBuilder.includes(newRule)){
  if(!uiBuilder.includes(oldRule)) throw new Error('Disc UI section rule insertion point missing');
  uiBuilder=uiBuilder.replace(oldRule,newRule);
  fs.writeFileSync(uiBuilderPath,uiBuilder,'utf8');
}

// Extend the regression test so this pattern cannot regress again.
const testPath=path.join(ROOT,'test','shared-feature-evidence-input.test.mjs');
let testText=fs.readFileSync(testPath,'utf8');
if(!testText.includes("Discup REG hint shares one observation input between numeric Feature and Evidence")){
  testText += `\n\ntest('Discup REG hint shares one observation input between numeric Feature and Evidence',()=>{\n  const research=read(path.join(ROOT,'research/L_DISCUP_ULTRA_REMIX_XR/research-data.json'));\n  const selection=read(path.join(ROOT,'research/L_DISCUP_ULTRA_REMIX_XR/selection-data.json'));\n  const pkg=buildMachineData(research,selection,null);\n\n  const feature=pkg.features.features.find(f=>f.featureId==='FEAT_REG_HINT_MODE');\n  assert.ok(feature,'REG hint must be a numeric Feature');\n  assert.deepEqual(feature.categoryLabels,['ODD','EVEN','SET2PLUS','SET5PLUS','SET6']);\n  for(const probs of Object.values(feature.categoryProbabilities)){\n    const sum=probs.reduce((a,b)=>a+b,0);\n    assert.ok(Math.abs(sum-1)<1e-9,'REG hint probabilities must sum to 1');\n  }\n\n  const evidence=new Map(pkg.evidence.evidences.map(e=>[e.id,e]));\n  assert.equal(evidence.get('EVI_REG_HINT_2PLUS')?.inputId,'INP_REG_HINT_2PLUS');\n  assert.equal(evidence.get('EVI_REG_HINT_5PLUS')?.inputId,'INP_REG_HINT_5PLUS');\n  assert.equal(evidence.get('EVI_REG_HINT_6')?.inputId,'INP_REG_HINT_6');\n  assert.deepEqual(evidence.get('EVI_REG_HINT_2PLUS')?.sharedFeatureIds,['FEAT_REG_HINT_MODE']);\n  assert.deepEqual(evidence.get('EVI_REG_HINT_5PLUS')?.sharedFeatureIds,['FEAT_REG_HINT_MODE']);\n  assert.deepEqual(evidence.get('EVI_REG_HINT_6')?.sharedFeatureIds,['FEAT_REG_HINT_MODE']);\n\n  const inputById=new Map(pkg.inputs.inputs.map(i=>[i.id,i]));\n  assert.equal(inputById.get('INP_REG_HINT_ODD')?.name,'奇数設定示唆');\n  assert.equal(inputById.get('INP_REG_HINT_EVEN')?.name,'偶数設定示唆');\n  assert.equal(inputById.get('INP_REG_HINT_2PLUS')?.name,'設定2以上');\n});\n`;
  fs.writeFileSync(testPath,testText,'utf8');
}

console.log('Discup REG hint shared Feature/Evidence migration applied: v0.1.2');
