#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const id='L_SHIN_EVANGELION';
const researchPath=path.join(root,'research',id,'research-data.json');
const selectionPath=path.join(root,'research',id,'selection-data.json');

const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n','utf8');
const assert=(cond,msg)=>{ if(!cond) throw new Error(msg); };
const upsertBy=(arr,key,value)=>{
  const i=arr.findIndex(x=>x?.[key]===value?.[key]);
  if(i>=0) arr[i]=value; else arr.push(value);
};

const research=read(researchPath);
const selection=read(selectionPath);
assert(research.machine?.machineId===id,'Research machineId mismatch');
assert(selection.machineId===id,'Selection machineId mismatch');

// 1) Research: publish the verified bonus-end distribution instead of leaving it empty.
const bonus=research.features.find(f=>f.researchFeatureId==='RF_BONUS_END_SCREEN');
assert(bonus,'RF_BONUS_END_SCREEN missing');
bonus.distributionMode='complete';
bonus.settingDistributions={
  SET_1:{WHITE:0.8475,RED1:0.10,RED2:0.0125,PURPLE1:0.0,PURPLE2:0.02,PURPLE3:0.02,SILVER:0.0,GOLD:0.0,RAINBOW:0.0},
  SET_2:{WHITE:0.8290,RED1:0.1125,RED2:0.0175,PURPLE1:0.02,PURPLE2:0.0,PURPLE3:0.021,SILVER:0.0,GOLD:0.0,RAINBOW:0.0},
  SET_3:{WHITE:0.8105,RED1:0.1250,RED2:0.0225,PURPLE1:0.021,PURPLE2:0.021,PURPLE3:0.0,SILVER:0.0,GOLD:0.0,RAINBOW:0.0},
  SET_4:{WHITE:0.7590,RED1:0.1375,RED2:0.0275,PURPLE1:0.022,PURPLE2:0.022,PURPLE3:0.022,SILVER:0.010,GOLD:0.0,RAINBOW:0.0},
  SET_5:{WHITE:0.7290,RED1:0.1500,RED2:0.0325,PURPLE1:0.023,PURPLE2:0.023,PURPLE3:0.023,SILVER:0.012,GOLD:0.0075,RAINBOW:0.0},
  SET_6:{WHITE:0.6990,RED1:0.1625,RED2:0.0375,PURPLE1:0.024,PURPLE2:0.024,PURPLE3:0.024,SILVER:0.014,GOLD:0.010,RAINBOW:0.005}
};
bonus.sourceRefs=[...new Set([...(bonus.sourceRefs??[]),'SRC_DMM','SRC_PWORLD'])];
bonus.notes='設定別振り分け公開済み。全9カテゴリを1か所でカウントし、紫A/B/C・銀・金・虹は同じカウンターをEvidenceにも共用する。設定5の金枠は公開丸め値0.8%に対し、完全分布整合のため一次表相当の0.75%を採用。';

// 2) Research: denial evidences for purple frames are part of the same observed surface.
const evidenceDefs=[
  {researchEvidenceId:'RE_BONUS_END_NOT_1',name:'ボーナス終了画面 紫A（設定1否定）',allowedSettings:['SET_2','SET_3','SET_4','SET_5','SET_6'],deniedSettings:['SET_1'],sourceRefs:['SRC_PWORLD','SRC_DMM']},
  {researchEvidenceId:'RE_BONUS_END_NOT_2',name:'ボーナス終了画面 紫B（設定2否定）',allowedSettings:['SET_1','SET_3','SET_4','SET_5','SET_6'],deniedSettings:['SET_2'],sourceRefs:['SRC_PWORLD','SRC_DMM']},
  {researchEvidenceId:'RE_BONUS_END_NOT_3',name:'ボーナス終了画面 紫C（設定3否定）',allowedSettings:['SET_1','SET_2','SET_4','SET_5','SET_6'],deniedSettings:['SET_3'],sourceRefs:['SRC_PWORLD','SRC_DMM']},
];
for(const e of evidenceDefs) upsertBy(research.evidenceCandidates,'researchEvidenceId',e);
const dc=(research.discoveryInventory??[]).find(x=>x.discoveryCandidateId==='DC_BONUS_END');
if(dc){
  const current=Array.isArray(dc.researchTarget)?dc.researchTarget:[dc.researchTarget].filter(Boolean);
  dc.researchTarget=[...new Set([...current,'RF_BONUS_END_SCREEN',...evidenceDefs.map(x=>x.researchEvidenceId),'RE_BONUS_END_SILVER','RE_BONUS_END_GOLD','RE_BONUS_END_RAINBOW'])];
}

// 3) Selection inputs: one natural counting surface per event family.
selection.uiCategoryLabels={
  ...selection.uiCategoryLabels,
  NUMERIC:'初当り',
  REI_NAV:'レイチャンス ナビ種別',
  REI_SUCCESS:'レイチャンス成功画面',
  BONUS_END:'ボーナス終了画面',
  EVIDENCE:'その他の設定確定・示唆'
};
selection.uiCategoryDescriptions={
  ...(selection.uiCategoryDescriptions??{}),
  REI_NAV:'殲滅EXTRA中は全設定共通で全ナビのため集計しません。',
  REI_SUCCESS:'成功時に確認した画面を1回だけ入力します。月背景・ロングヘアは、この入力がそのまま設定Evidenceにも反映されます。',
  BONUS_END:'確認した終了画面を1回だけ入力します。紫・銀・金・虹は、この入力が割合推測と設定否定・確定Evidenceの両方に反映されます。'
};

const existingCore=selection.inputs.filter(i=>['INP_NORMAL_GAMES','INP_FIRST_HIT_COUNT'].includes(i.id));
const mk=(id,name,category,order)=>({id,name,type:'counter',category,unit:'回',displayOrder:order,inferenceRole:'INCLUDE_SUPPORT',defaultValue:null,uiGridSpan:6,uiDirectInput:false,uiCompactCounter:true});
selection.inputs=[
  ...existingCore,
  mk('INP_REI_NAV_FOUR_CHOICE','4択ナビ','REI_NAV',20),
  mk('INP_REI_NAV_TWO_CHOICE','2択ナビ','REI_NAV',21),
  mk('INP_REI_NAV_FULL_NAV','全ナビ','REI_NAV',22),
  mk('INP_REI_PIC_STANDING','立ち姿（デフォルト）','REI_SUCCESS',30),
  mk('INP_REI_PIC_SITTING','座り姿（高設定示唆）','REI_SUCCESS',31),
  mk('INP_REI_PIC_MOON','月背景（設定4以上）','REI_SUCCESS',32),
  mk('INP_REI_PIC_LONG_HAIR','ロングヘア（設定6）','REI_SUCCESS',33),
  mk('INP_BONUS_END_WHITE','白（デフォルト）','BONUS_END',40),
  mk('INP_BONUS_END_RED1','赤A（高設定示唆・弱）','BONUS_END',41),
  mk('INP_BONUS_END_RED2','赤B（高設定示唆・強）','BONUS_END',42),
  mk('INP_BONUS_END_PURPLE1','紫A（設定1否定）','BONUS_END',43),
  mk('INP_BONUS_END_PURPLE2','紫B（設定2否定）','BONUS_END',44),
  mk('INP_BONUS_END_PURPLE3','紫C（設定3否定）','BONUS_END',45),
  mk('INP_BONUS_END_SILVER','銀（設定4以上）','BONUS_END',46),
  mk('INP_BONUS_END_GOLD','金（設定5以上）','BONUS_END',47),
  mk('INP_BONUS_END_RAINBOW','虹（設定6）','BONUS_END',48),
];

// 4) Selection features: use the same counters for numeric likelihood.
const byRf=new Map(selection.features.map(f=>[f.researchFeatureId,f]));
byRf.set('RF_REI_NAV',{
  researchFeatureId:'RF_REI_NAV',featureId:'FEAT_REI_NAV',adoptionCategory:'INCLUDE_SUPPORT',
  numeratorInputId:'INP_REI_NAV_FOUR_CHOICE',categoryInputIds:['INP_REI_NAV_TWO_CHOICE','INP_REI_NAV_FULL_NAV'],
  inputTransform:'sum_inputs_to_trials',weight:1,difficultyParticipation:'EXCLUDE',
  userReason:'レイチャンスのナビ種別は1回の発生ごとに排他的に観測でき、設定別の完全分布が公開されているため補助採用します。'
});
byRf.set('RF_REI_CHANCE_PICTURE',{
  researchFeatureId:'RF_REI_CHANCE_PICTURE',featureId:'FEAT_REI_CHANCE_PICTURE',adoptionCategory:'INCLUDE_SUPPORT',
  numeratorInputId:'INP_REI_PIC_STANDING',categoryInputIds:['INP_REI_PIC_SITTING','INP_REI_PIC_MOON','INP_REI_PIC_LONG_HAIR'],
  inputTransform:'sum_inputs_to_trials',weight:1,difficultyParticipation:'EXCLUDE',
  userReason:'成功画面は設定別の完全分布が公開され、同じ画面カウンターをEvidenceにも共用できるため、二重入力せず割合推測と確定判定の両方に利用します。'
});
byRf.set('RF_BONUS_END_SCREEN',{
  researchFeatureId:'RF_BONUS_END_SCREEN',featureId:'FEAT_BONUS_END_SCREEN',adoptionCategory:'INCLUDE_SUPPORT',
  numeratorInputId:'INP_BONUS_END_WHITE',categoryInputIds:['INP_BONUS_END_RED1','INP_BONUS_END_RED2','INP_BONUS_END_PURPLE1','INP_BONUS_END_PURPLE2','INP_BONUS_END_PURPLE3','INP_BONUS_END_SILVER','INP_BONUS_END_GOLD','INP_BONUS_END_RAINBOW'],
  inputTransform:'sum_inputs_to_trials',weight:1,difficultyParticipation:'EXCLUDE',
  userReason:'ボーナス終了画面は設定別の完全分布が公開され、同じ画面カウンターを設定否定・確定Evidenceにも共用できるため、1回の入力を割合推測とEvidence判定の両方に利用します。'
});
selection.features=[...byRf.values()];

// 5) Direct Evidence: same numeric counter -> EvidenceEngine. No duplicate Evidence UI entry.
selection.evidence=[
  {researchEvidenceId:'RE_REI_MOON',evidenceId:'EVI_REI_MOON',inputId:'INP_REI_PIC_MOON'},
  {researchEvidenceId:'RE_REI_LONG_HAIR',evidenceId:'EVI_REI_LONG_HAIR',inputId:'INP_REI_PIC_LONG_HAIR'},
  {researchEvidenceId:'RE_BONUS_END_NOT_1',evidenceId:'EVI_BONUS_END_NOT_1',inputId:'INP_BONUS_END_PURPLE1'},
  {researchEvidenceId:'RE_BONUS_END_NOT_2',evidenceId:'EVI_BONUS_END_NOT_2',inputId:'INP_BONUS_END_PURPLE2'},
  {researchEvidenceId:'RE_BONUS_END_NOT_3',evidenceId:'EVI_BONUS_END_NOT_3',inputId:'INP_BONUS_END_PURPLE3'},
  {researchEvidenceId:'RE_BONUS_END_SILVER',evidenceId:'EVI_BONUS_END_SILVER',inputId:'INP_BONUS_END_SILVER'},
  {researchEvidenceId:'RE_BONUS_END_GOLD',evidenceId:'EVI_BONUS_END_GOLD',inputId:'INP_BONUS_END_GOLD'},
  {researchEvidenceId:'RE_BONUS_END_RAINBOW',evidenceId:'EVI_BONUS_END_RAINBOW',inputId:'INP_BONUS_END_RAINBOW'},
];

// Keep only genuinely separate Evidence in the generic Evidence group (payout displays).
if(selection.evidenceUi?.groups){
  for(const g of selection.evidenceUi.groups){
    g.options=(g.options??[]).filter(o=>!(o.sourceEvidenceIds??[]).some(x=>[
      'RE_REI_MOON','RE_REI_LONG_HAIR','RE_BONUS_END_SILVER','RE_BONUS_END_GOLD','RE_BONUS_END_RAINBOW',
      'RE_BONUS_END_NOT_1','RE_BONUS_END_NOT_2','RE_BONUS_END_NOT_3'
    ].includes(x)));
    if(g.label==='設定確定・設定下限情報') g.label='獲得枚数表示';
  }
  selection.evidenceUi.groups=selection.evidenceUi.groups.filter(g=>(g.options??[]).length>0);
}

// Version bump because UI/inference contract changed.
selection.machineDataVersion='0.1.1';
research.machine.machineDataVersion='0.1.1';

write(researchPath,research);
write(selectionPath,selection);

// Self-check important UX invariants.
const inputIds=new Set(selection.inputs.map(i=>i.id));
for(const e of selection.evidence) assert(inputIds.has(e.inputId),`evidence input missing: ${e.inputId}`);
assert(selection.features.find(f=>f.researchFeatureId==='RF_REI_CHANCE_PICTURE')?.adoptionCategory==='INCLUDE_SUPPORT','Rei picture not adopted');
assert(selection.features.find(f=>f.researchFeatureId==='RF_BONUS_END_SCREEN')?.adoptionCategory==='INCLUDE_SUPPORT','Bonus end not adopted');
assert(selection.inputs.find(i=>i.id==='INP_REI_NAV_TWO_CHOICE')?.name==='2択ナビ','nav label not localized');
console.log('SHIN EVA SHARED FEATURE/EVIDENCE UI FIX: PASS');
