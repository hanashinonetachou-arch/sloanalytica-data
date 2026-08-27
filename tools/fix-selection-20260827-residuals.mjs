import fs from 'node:fs';
import path from 'node:path';

const ROOT=process.cwd();
const WS=path.join(ROOT,'selection-batch','SELECTION_20260827151959');
for(const id of ['L_DISCUP_ULTRA_REMIX_XR','L_STAR_HANAHANA_MX']){
  const p=path.join(WS,id,'selection-data.json');
  const s=JSON.parse(fs.readFileSync(p,'utf8'));
  const f=s.features.find(x=>x.researchFeatureId==='RF_BONUS_OUTCOME');
  if(!f||f.adoptionCategory==='EXCLUDE') continue;
  const prefix='INP_BONUS_OUTCOME_';
  const noBonus=`${prefix}NO_BONUS`;
  s.inputs=s.inputs.filter(x=>x.id!==noBonus);
  let normal=s.inputs.find(x=>x.id==='INP_NORMAL_GAMES');
  if(!normal){
    normal={id:'INP_NORMAL_GAMES',name:'通常ゲーム数',type:'integer',category:'NUMERIC',unit:'G',displayOrder:5,inferenceRole:'INCLUDE_PRIMARY',defaultValue:null,observationScope:'SELF_PLAY'};
    s.inputs.push(normal);
  }
  f.numeratorInputId=`${prefix}BIG`;
  f.categoryInputIds=[`${prefix}REG`];
  f.denominatorInputId='INP_NORMAL_GAMES';
  delete f.inputTransform;
  f.residualCategoryLabel='NO_BONUS';
  f.difficultyParticipation='INCLUDE';
  f.difficultyExposure={mode:'per_game',factor:1,quality:'EXACT',basisId:'NORMAL_GAMES'};
  fs.writeFileSync(p,JSON.stringify(s,null,2)+'\n','utf8');
  console.log(`fixed residual mapping: ${id}`);
}
