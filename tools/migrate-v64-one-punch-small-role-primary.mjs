#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const MACHINE_ID='L_ONE_PUNCH_MAN';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');

export function migrate(root=process.cwd(),{apply=false}={}){
  const base=path.join(root,'research',MACHINE_ID);
  const research=read(path.join(base,'research-data.json'));
  const selectionPath=path.join(base,'selection-data.json');
  const selection=read(selectionPath);
  const multi=(research.features??[]).find(f=>f.researchFeatureId==='RF_SMALL_ROLE_MULTI');
  if(!multi||multi.candidateModel!=='multinomial') throw new Error('RF_SMALL_ROLE_MULTI multinomial Research feature is required');

  selection.machineDataVersion='0.1.2';
  selection.uiCategoryLabels??={};
  selection.uiCategoryLabels.ROLE='小役';
  selection.inputs??=[];
  const upsertInput=input=>{
    const i=selection.inputs.findIndex(x=>x.id===input.id);
    if(i>=0) selection.inputs[i]=input; else selection.inputs.push(input);
  };
  upsertInput({id:'INP_ROLE_GAMES',name:'小役集計ゲーム数',type:'integer',category:'ROLE',unit:'G',displayOrder:10,defaultValue:null,description:'通常時に弱チェリー・スイカを数えたゲーム数を入力してください。'});
  upsertInput({id:'INP_WEAK_CHERRY',name:'弱チェリー',type:'counter',category:'ROLE',unit:'回',displayOrder:11,defaultValue:null,parentInputId:'INP_ROLE_GAMES',uiQuickAdd:1});
  upsertInput({id:'INP_WATERMELON',name:'スイカ',type:'counter',category:'ROLE',unit:'回',displayOrder:12,defaultValue:null,parentInputId:'INP_ROLE_GAMES',uiQuickAdd:1});
  selection.inputs.sort((a,b)=>(a.displayOrder??9999)-(b.displayOrder??9999));

  selection.features??=[];
  const feature=id=>selection.features.find(f=>f.researchFeatureId===id);
  const at=feature('RF_AT_INITIAL');
  if(!at) throw new Error('RF_AT_INITIAL selection feature is required');
  Object.keys(at).forEach(k=>{ if(!['researchFeatureId','featureId','adoptionCategory'].includes(k)) delete at[k]; });
  at.adoptionCategory='EXCLUDE';
  at.userFacingReason='AT初当りには設定差がありますが、公開確率の集計対象ゲームと実機で入力できるゲーム数の定義一致が未確認です。また弱チェリー・スイカを主軸採用する現構成では下流ATと独立尤度として同時評価できないため、現版では推測計算に使用しません。';

  for(const id of ['RF_WEAK_CHERRY','RF_WATERMELON']){
    const f=feature(id);
    if(!f) throw new Error(`${id} selection feature is required`);
    Object.keys(f).forEach(k=>{ if(!['researchFeatureId','featureId','adoptionCategory'].includes(k)) delete f[k]; });
    f.adoptionCategory='EXCLUDE';
    f.userFacingReason='単独Binomialではなく、弱チェリー・スイカ・その他を同一通常ゲーム上の排他的Multinomialとしてまとめて評価します。';
  }

  const small=feature('RF_SMALL_ROLE_MULTI');
  if(!small) throw new Error('RF_SMALL_ROLE_MULTI selection feature is required');
  Object.keys(small).forEach(k=>delete small[k]);
  Object.assign(small,{
    researchFeatureId:'RF_SMALL_ROLE_MULTI',featureId:'FEAT_SMALL_ROLE_MULTI',adoptionCategory:'INCLUDE_PRIMARY',
    denominatorInputId:'INP_ROLE_GAMES',numeratorInputId:'INP_WEAK_CHERRY',categoryInputIds:['INP_WATERMELON'],residualCategoryLabel:'OTHER',
    minimumSample:1,sampleRecommendation:3000,weight:1,displayFormat:'ratio_1_over_n',
    difficultyExposure:{mode:'per_game',factor:1,quality:'EXACT',basisId:'NORMAL_GAMES'},difficultyParticipation:'INCLUDE',
    userReason:'弱チェリー・スイカは同じ通常時ゲームを母数に排他的カテゴリとして観測でき、AT初当りより設定1↔6の1Gあたり識別情報が大きいため主軸採用。'
  });

  selection.difficultyAnalysis??={};
  selection.difficultyAnalysis.targetGameBasis={basisId:'NORMAL_GAMES',label:'通常ゲーム数',quality:'EXACT'};
  selection.difficultyAnalysis.calibrationAllowedExposureQualities=['EXACT','DERIVED','ESTIMATED'];
  selection.selectionNotes=[
    '弱チェリー/スイカは残余カテゴリを含む排他的Multinomialとして主軸採用する。',
    'AT初当りは公開確率の分母定義と実機入力Gの一致が未確認で、小役主軸とのjoint likelihoodも未定義のため現版では推測不参加。',
    '通常滞在時レア役→CZなど内部状態を必要とする条件付きFeatureはResearchに保持する。'
  ];

  if(apply) write(selectionPath,selection);
  return {machineId:MACHINE_ID,version:selection.machineDataVersion,primary:'RF_SMALL_ROLE_MULTI'};
}

const root=path.resolve(process.argv[2]??'.');
const apply=process.argv.includes('--apply');
if(apply) console.log('APPLIED '+JSON.stringify(migrate(root,{apply:true})));
else {
  const tmp=fs.mkdtempSync(path.join(process.env.RUNNER_TEMP??process.env.TMPDIR??'/tmp','slo-v64-onepunch-'));
  fs.cpSync(root,tmp,{recursive:true,filter:src=>!src.includes(`${path.sep}.git${path.sep}`)});
  console.log('DRY-RUN PASS '+JSON.stringify(migrate(tmp,{apply:true})));
}
