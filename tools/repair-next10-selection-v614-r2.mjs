#!/usr/bin/env node
// Trigger isolated second-pass apply after workflow registration.
import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const write=(p,x)=>fs.writeFileSync(p,JSON.stringify(x,null,2)+'\n');
const byRid=(a,id)=>a.find(x=>x.researchFeatureId===id);
const prob=(f,s)=>f.settingValues[s].probability;
function rebuild(r,s){
 const names=new Map((r.features??[]).map(f=>[f.researchFeatureId,f.name]));
 const sel=(s.features??[]).filter(f=>String(f.adoptionCategory).startsWith('INCLUDE'));
 const rej=(s.features??[]).filter(f=>f.adoptionCategory==='EXCLUDE');
 s.selectionSummaryContract={schemaVersion:'selection-summary-v1',evaluatedCount:s.features.length,selectedCount:sel.length,rejectedCount:rej.length,selected:sel.map(f=>({featureId:f.featureId,name:names.get(f.researchFeatureId)??f.featureId,reason:f.userReason??'採用'})),rejected:rej.map(f=>({featureId:f.featureId,name:names.get(f.researchFeatureId)??f.featureId,reason:f.userFacingReason??f.rejectionReason??'不採用'}))};
}
{
 const d='research/LB_TRIPLE_CROWN_SEVEN_FG',rp=`${d}/research-data.json`,sp=`${d}/selection-data.json`;
 const r=read(rp),s=read(sp),bb=byRid(r.features,'RF_BB_INITIAL'),rb=byRid(r.features,'RF_RB_INITIAL');
 if(!byRid(r.features,'RF_BONUS_OUTCOME')){
   const dist={}; for(const set of r.machine.settings){const b=prob(bb,set),q=prob(rb,set);dist[set]={BB:b,RB:q,NO_BONUS:1-b-q};}
   r.features.push({researchFeatureId:'RF_BONUS_OUTCOME',name:'通常時ボーナス構成（BB・RB・非当選）',factStatus:'verified',candidateModel:'multinomial',trialUnit:'通常ゲーム1G',observationScope:'通常時',numeratorDefinition:'BB・RB・非当選の各ゲーム数',denominatorDefinition:'通常ゲーム',categories:['BB','RB','NO_BONUS'],distributionMode:'complete',settingValues:{},settingDistributions:dist,sourceRefs:[...new Set([...(bb.sourceRefs??[]),...(rb.sourceRefs??[])])],crossSourceStatus:'single_source_major',notes:'RF_BB_INITIALとRF_RB_INITIALを、同一通常ゲーム上の排他的カテゴリとして統合したjoint model。'});
 }
 for(const rid of ['RF_BB_INITIAL','RF_RB_INITIAL']){const f=byRid(s.features,rid);Object.assign(f,{adoptionCategory:'EXCLUDE',difficultyParticipation:'EXCLUDE',difficultyExclusionReason:'jointボーナス構成へ統合したため単独FeatureはDifficultyにも参加させない。',userFacingReason:`${rid==='RF_BB_INITIAL'?'BB':'RB'}には設定差があるが、BB・RBは同じ通常ゲーム上の排他的な結果。別々のBinomialではなく「BB・RB・非当選」のMultinomialへ統合して一度だけ評価するため、単独Featureとしては不採用とする。`});delete f.userReason;delete f.numeratorInputId;delete f.denominatorInputId;}
 if(!byRid(s.features,'RF_BONUS_OUTCOME'))s.features.push({researchFeatureId:'RF_BONUS_OUTCOME',featureId:'FEAT_BONUS_OUTCOME',adoptionCategory:'INCLUDE_PRIMARY',weight:1,difficultyParticipation:'EXCLUDE',difficultyExclusionReason:'joint化後のDifficulty reportを再生成してから参加可否を再評価する。',userReason:'BBとRBは通常ゲーム1Gごとの排他的なボーナス結果なので、BB・RB・非当選を1つのMultinomialとして評価する。各単独Binomialの非成立情報を重ねず、両方の設定差を安全に利用できる。',denominatorInputId:'INP_NORMAL_GAMES',numeratorInputId:'INP_BB_INITIAL_COUNT',categoryInputIds:['INP_RB_INITIAL_COUNT'],residualCategoryLabel:'NO_BONUS'});
 const bi=s.inputs.find(x=>x.id==='INP_BB_INITIAL_COUNT');if(bi){bi.category='SEL_RF_BONUS_OUTCOME';bi.inferenceRole='INCLUDE_PRIMARY';}
 const ri=s.inputs.find(x=>x.id==='INP_RB_INITIAL_COUNT');if(ri){ri.category='SEL_RF_BONUS_OUTCOME';ri.inferenceRole='INCLUDE_PRIMARY';}
 rebuild(r,s);write(rp,r);write(sp,s);
}
{
 const d='research/L_FIRE_FORCE_2',rp=`${d}/research-data.json`,sp=`${d}/selection-data.json`;
 const r=read(rp),s=read(sp);
 const f=byRid(s.features,'RF_BONUS_INITIAL');
 f.adoptionCategory='INCLUDE_FALLBACK';
 f.userReason='ボーナス初当りには設定差があるが、炎炎ループ初当りへつながる同一の当選連鎖を含み、公開値から両者の完全なjoint/条件付き分解は作れない。独立尤度として同時加算せず、設定差がより大きく公開解析でも最重要とされる炎炎ループ初当りが使えない場合のFallbackとして採用する。';
 f.suppressedByFeatureIds=['FEAT_ENEN_LOOP_INITIAL'];
 const inp=s.inputs.find(x=>x.id==='INP_BONUS_INITIAL_COUNT');if(inp)inp.inferenceRole='INCLUDE_FALLBACK';
 rebuild(r,s);write(rp,r);write(sp,s);
}
console.log('Applied v6.14 second-pass dependency repairs.');
