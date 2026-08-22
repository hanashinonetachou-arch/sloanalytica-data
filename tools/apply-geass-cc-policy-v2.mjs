import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const machineId='S_CODE_GEASS_3_CC_FS';
const rp=path.join(root,'research',machineId,'research-data.json');
const sp=path.join(root,'research',machineId,'selection-data.json');
const r=JSON.parse(fs.readFileSync(rp,'utf8'));
const s=JSON.parse(fs.readFileSync(sp,'utf8'));

const rfBonus=r.features.find(f=>f.researchFeatureId==='RF01');
const rfRoles=r.features.find(f=>f.researchFeatureId==='RF02');
if(!rfBonus||!rfRoles) throw new Error('RF01/RF02 missing');
const cherryCat='CAT_1_INP_CHERRY_COUNT';
const cherryRbCat='CAT_3_INP_CHERRY_RB_COUNT';

rfBonus.notes='設定差のあるボーナス内訳自体には情報価値があるが、チェリー＋RB等が小役Featureと同じ成立事象を共有する。全内訳を独立Featureとして加えると尤度を二重計上するため、フル内訳は直接採用せず、安全に条件付き分解できるチェリー＋RBのみを別Feature化する。必要試行量だけを理由には除外しない。';

const condId='RF05_CHERRY_RB_GIVEN_CHERRY';
let rfCond=r.features.find(f=>f.researchFeatureId===condId);
const settingValues={};
for(const setting of r.machine.settings){
  const pCherry=Number(rfRoles.settingDistributions?.[setting]?.[cherryCat]);
  const pCherryRb=Number(rfBonus.settingDistributions?.[setting]?.[cherryRbCat]);
  if(!(pCherry>0)&&pCherry!==0) throw new Error(`${setting}: cherry probability missing`);
  if(!Number.isFinite(pCherryRb)||pCherryRb<0||pCherryRb>pCherry) throw new Error(`${setting}: cherry+RB probability invalid`);
  settingValues[setting]={probability:pCherryRb/pCherry,rawDisplay:`${(pCherryRb/pCherry*100).toFixed(3)}%`};
}
const condFeature={
  researchFeatureId:condId,
  name:'チェリー成立時の赤赤白RB当選率',
  factStatus:'verified',
  candidateModel:'binomial',
  trialUnit:'チェリー成立回数',
  observationScope:'通常時・AT中に成立したチェリーのうち、赤赤白RBへ当選した割合',
  numeratorDefinition:'INP_CHERRY_RB_COUNT',
  denominatorDefinition:'INP_CHERRY_COUNT',
  sourceRefs:[...new Set([...(rfBonus.sourceRefs??[]),...(rfRoles.sourceRefs??[])])],
  crossSourceStatus:'confirmed',
  notes:'公開されているゲーム当たり「チェリー＋赤赤白RB」確率を、同じ設定のチェリー出現率で割って条件付き確率 P(RB|チェリー) を導出。P(チェリー) × P(RB|チェリー) と分解することで、総チェリー回数との二重計上を避けて追加情報だけを評価する。',
  settingValues
};
if(rfCond) Object.assign(rfCond,condFeature); else r.features.push(condFeature);

const inputId='INP_CHERRY_RB_COUNT';
if(!s.inputs.some(i=>i.id===inputId)){
  const idx=s.inputs.findIndex(i=>i.id==='INP_CHERRY_COUNT');
  const input={id:inputId,name:'チェリー＋RB回数',category:'PRIMARY_SMALL_ROLE',type:'counter',unit:'回',displayOrder:13,parentInputId:'INP_CHERRY_COUNT',inferenceRole:'INCLUDE_SUPPORT',defaultValue:0,description:'チェリー成立を契機に赤赤白RBへ当選した回数を、チェリー回数と同じ集計区間で入力します。ボーナス当選契機は入賞時のPUSHで確認できます。'};
  s.inputs.splice(idx>=0?idx+1:s.inputs.length,0,input);
}

const sfBonus=s.features.find(f=>f.featureId==='FEAT_NORMAL_BONUS_DETAIL_MULTINOMIAL');
if(!sfBonus) throw new Error('bonus Selection feature missing');
sfBonus.adoptionCategory='EXCLUDE';
sfBonus.rejectionReason='ボーナス内訳には有用な設定差がありますが、チェリー＋RBなどが採用中の小役Featureと同じ成立事象を共有し、独立Featureとして加えると二重計上になります。フル内訳は不採用とし、重複せず分解できるチェリー＋RBだけを条件付きFeatureとして採用します。';
delete sfBonus.userReason;

const sfId='FEAT_CHERRY_RB_GIVEN_CHERRY';
const sfCond={
  researchFeatureId:condId,
  featureId:sfId,
  adoptionCategory:'INCLUDE_SUPPORT',
  minimumSample:20,
  sampleRecommendation:100,
  weight:1.0,
  numeratorInputId:inputId,
  denominatorInputId:'INP_CHERRY_COUNT',
  displayFormat:'percent',
  difficultyParticipation:'INCLUDE',
  difficultyExposure:{mode:'derived_event_rate',sourceFeatureId:'FEAT_CHERRY_WATERMELON_MULTINOMIAL',sourceCategoryId:cherryCat,eventMultiplier:1.0,quality:'DERIVED',basisId:'NORMAL_AT_GAMES'},
  userReason:'チェリー成立率とは条件付きに分解できるため二重計上せず併用できます。チェリーから赤赤白RBへ当選する割合は高設定ほど大きく、既存の小役情報に追加の判別材料を与えるため補助採用します。',
  requiredTrials:{value:367,unit:'チェリー成立回数'}
};
const existing=s.features.findIndex(f=>f.featureId===sfId);
if(existing>=0) s.features[existing]=sfCond; else {
  const after=s.features.findIndex(f=>f.featureId==='FEAT_CHERRY_WATERMELON_MULTINOMIAL');
  s.features.splice(after>=0?after+1:s.features.length,0,sfCond);
}

s.machineDataVersion='0.1.9';
r.researchedAt='2026-08-22';
fs.writeFileSync(rp,JSON.stringify(r,null,2)+'\n');
fs.writeFileSync(sp,JSON.stringify(s,null,2)+'\n');
console.log('Applied C.C.&Kallen Feature Selection Policy v2 conditional cherry-RB update.');