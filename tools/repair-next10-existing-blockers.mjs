import fs from 'node:fs';
function read(p){return JSON.parse(fs.readFileSync(p,'utf8'));}
function write(p,x){fs.writeFileSync(p,JSON.stringify(x,null,2)+'\n');}

// Fire Force: make selection summary mapping explicit for newly-added features.
{
 const p='research/L_FIRE_FORCE_2/selection-data.json';
 const s=read(p);
 const map=new Map([
  ['REG/アクセル/灰焰ボーナス終了画面振り分け','FEAT_BONUS_END_REG_GROUP'],
  ['炎炎ボーナス終了画面振り分け','FEAT_BONUS_END_ENEN']
 ]);
 for(const group of ['selected','rejected']) for(const item of s.selectionSummaryContract?.[group]??[]){
   if(map.has(item.name)) item.featureId=map.get(item.name);
 }
 write(p,s);
}

// Kyokou Suiri: EP4/EP5 are deliberately removed to Hard Evidence, so the remaining
// EP1-EP3 probabilities are a conditional distribution, not a rounded whole-distribution fix.
{
 const p='research/L_KYOKOU_SUIRI_ST/selection-data.json';
 const s=read(p);
 const f=s.features.find(x=>x.researchFeatureId==='RF_INITIAL_EPISODE');
 if(f) delete f.normalizeRoundedCategoryProbabilities;
 write(p,s);
}

// Jormungand: restore source precision for the pre-existing CZ feature so the re-audit
// does not create a meaningless migration contract diff from decimal truncation.
{
 const p='research/L_JORMUNGAND_ND01G/research-data.json';
 const r=read(p);
 const f=r.features.find(x=>x.researchFeatureId==='RF_CZ_INITIAL');
 const vals=[0.005149330587023687,0.005302226935312832,0.005691519635742743,0.00590318772136954,0.0059594755661501785,0.005980861244019139];
 if(f) ['SET_1','SET_2','SET_3','SET_4','SET_5','SET_6'].forEach((k,i)=>{if(f.settingValues?.[k]) f.settingValues[k].probability=vals[i];});
 write(p,r);
}

console.log('Existing Next10 pre-Gate-D blockers repaired.');
