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

// Umineko: make the rare-event basis concrete and give newly-added summary entries
// explicit feature IDs to avoid fragile name/reason matching later in Gate D.
{
 const p='research/L_UMINEKO_2_A1/selection-data.json';
 const s=read(p);
 const f=s.features.find(x=>x.researchFeatureId==='RF_CONFIRM_A');
 const reason='通常ゲームを分母として直接観測でき、確定役Aは設定1約1/16384に対して設定6約1/7281.8と2倍超の発生率差がある。1日では低頻度でも成立1回の尤度比が大きいrare-eventとして補助Featureに採用する。';
 if(f) f.userReason=reason;
 const idByName=new Map([
  ['ステージチェンジ時ロゴ発光','FEAT_LOGO_FLASH'],
  ['周期天井到達時・真実ポイント振り分け','FEAT_CYCLE_CEILING_TRUTH'],
  ['引き継ぎ100G選択率','FEAT_ART_INHERIT_100G'],
  ['1枚役B確率','FEAT_ROLE_1B'],
  ['1枚役C確率','FEAT_ROLE_1C'],
  ['確定役A確率','FEAT_CONFIRM_A'],
  ['ART中ハズレ','FEAT_ART_MISS'],
  ['ART中共通ベル','FEAT_ART_COMMON_BELL'],
  ['特定11種ボーナス構成比','FEAT_SPECIFIC_BONUS_COMPOSITION']
 ]);
 for(const group of ['selected','rejected']) for(const item of s.selectionSummaryContract?.[group]??[]){
   if(idByName.has(item.name)) item.featureId=idByName.get(item.name);
   if(item.name==='確定役A確率') item.reason=reason;
 }
 write(p,s);
}

console.log('Existing Next10 pre-Gate-D blockers repaired.');
