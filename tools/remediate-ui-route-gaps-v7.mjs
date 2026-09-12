#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
const ROOT=process.cwd();
const IDS=['S_MHW_ICEBORNE_ZF','S_HIDAN_NO_ARIA_II_JZ','L_TOARU_ACCELERATOR_RZ','L_KYOUKARA_OREHA_FE','S_SENGOKU_KOIHIME_FC','S_SUPER_BINGO_NEO_CLASSIC_HH1','S_GRANBELM_ZX'];
function read(p){return JSON.parse(fs.readFileSync(p,'utf8'));}
function write(p,v){fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');}
function makeContract(x){
  if(!x) throw new Error('Selection input missing');
  if(x.inputVisible===false && x.derivedCalculation){return {name:x.name,mode:'DERIVED',gridSpan:12,directInput:false,derivedCalculation:x.derivedCalculation,derivedFromInputIds:x.derivedFromInputIds??[]};}
  const mode=x.type==='counter'?'COUNTER':x.type==='integer'?'NUMBER':x.type==='enum'?'SELECT':'NUMBER';
  const c={name:x.name,mode,gridSpan:x.uiGridSpan??(mode==='COUNTER'?6:12),directInput:x.uiDirectInput??true};
  if(mode==='COUNTER'){c.compact=x.uiCompactCounter??true;c.quickInput=true;c.quickStep=Array.isArray(x.uiQuickAdd)?(x.uiQuickAdd[0]??1):(x.uiQuickAdd??1);}
  if(x.description)c.description=x.description;
  return c;
}
function inputMap(sel){return new Map((sel.inputs??[]).map(x=>[x.id,x]));}
function replaceSectionIds(ui,mapping){
  for(const s of Object.values(ui.sections??{})) s.inputIds=(s.inputIds??[]).map(id=>mapping[id]??id);
  for(const [oldId,newId] of Object.entries(mapping)){
    if(ui.inputContracts?.[oldId] && !ui.inputContracts?.[newId]) ui.inputContracts[newId]={...ui.inputContracts[oldId]};
    delete ui.inputContracts?.[oldId];
  }
}
function ensureContract(ui,im,id){if(!ui.inputContracts[id])ui.inputContracts[id]=makeContract(im.get(id));}
function insertBefore(arr,before,items){const base=arr.filter(x=>!items.includes(x));const i=base.indexOf(before);if(i<0)return [...base,...items];base.splice(i,0,...items);return base;}

for(const id of IDS){
 const dir=path.join(ROOT,'research',id); const up=path.join(dir,'ui-design-data.json');
 const ui=read(up), sel=read(path.join(dir,'selection-data.json')), im=inputMap(sel);
 if(id==='L_KYOUKARA_OREHA_FE'){
   replaceSectionIds(ui,{INP_GAMES:'INP_NORMAL_GAMES',INP_BB:'INP_BIG',INP_RB:'INP_REG'});
   for(const x of ['INP_NORMAL_GAMES','INP_BIG','INP_REG']) ui.inputContracts[x]=makeContract(im.get(x));
   ui.sections['遊技情報'].description='自分で消化した通常ゲーム数を入力します。';
 }
 if(id==='S_SENGOKU_KOIHIME_FC'){
   replaceSectionIds(ui,{INP_GAMES:'INP_NORMAL_GAMES'});
   ui.inputContracts.INP_NORMAL_GAMES=makeContract(im.get('INP_NORMAL_GAMES'));
   ui.sections['遊技情報'].description='自分で消化した通常ゲーム数を入力します。';
 }
 if(id==='S_HIDAN_NO_ARIA_II_JZ'){
   ensureContract(ui,im,'INP_COMMON_BELL_GAMES');
 }
 if(id==='S_MHW_ICEBORNE_ZF'){
   const ids=['INP_CZ_QUEST_COUNT','INP_CZ_AIROU_COUNT','INP_CZ_SELIANA_COUNT'];
   ui.sectionOrder=insertBefore(ui.sectionOrder,'通常時小役',['CZ種類別']);
   ui.sections['CZ種類別']={inputIds:ids,evidenceIds:[],description:'CZ当選時に種類を判別できた場合、クエスト・アイルーBINGO・セリエナ防衛戦のいずれかを記録します。CZ合算とは「総当選率」と「当選後の種類構成」に分けて評価します。',observationRole:'DIRECT_PLAY',collapsible:true,quickInputEligible:true};
   ids.forEach(x=>ensureContract(ui,im,x));
   ui.sections['通常時'].description='自分で消化した通常ゲーム数とCZ合算を記録します。状態別レア役抽選・AT初当りは重複評価を避けるため入力しません。';
 }
 if(id==='L_TOARU_ACCELERATOR_RZ'){
   const visible=['INP_CZ_ACCEL_COUNT','INP_CZ_LASTORDER_COUNT','INP_CZ_DUAL_COUNT'];
   ui.sections['通常時'].inputIds=['INP_NORMAL_GAMES',...visible];
   ui.sections['通常時'].description='自分で消化した通常ゲーム数と、当選したCZを「一方通行」「打ち止め」「一方通行＆打ち止め」に分けて記録します。CZ合算は自動計算し、種類構成はCZ当選を条件とした割合として評価します。';
   visible.forEach(x=>ensureContract(ui,im,x));
   ensureContract(ui,im,'INP_CZ_TYPED_TOTAL'); ensureContract(ui,im,'INP_CZ_TOTAL_RESOLVED');
   if(ui.inputContracts.INP_CZ_TOTAL_COUNT) ui.inputContracts.INP_CZ_TOTAL_COUNT={...ui.inputContracts.INP_CZ_TOTAL_COUNT,name:'CZ合算（旧履歴互換）'};
 }
 if(id==='S_SUPER_BINGO_NEO_CLASSIC_HH1'){
   replaceSectionIds(ui,{INP_FIRST_CYCLE:'INP_CYCLE_FIRST_TRIALS',INP_FIRST_CYCLE_BC:'INP_CYCLE_FIRST_WINS',INP_LATER_CYCLE:'INP_CYCLE_LATER_TRIALS',INP_LATER_CYCLE_BC:'INP_CYCLE_LATER_WINS'});
   for(const x of ['INP_CYCLE_FIRST_TRIALS','INP_CYCLE_FIRST_WINS','INP_CYCLE_LATER_TRIALS','INP_CYCLE_LATER_WINS']) ui.inputContracts[x]=makeContract(im.get(x));
   ui.sectionOrder=insertBefore(ui.sectionOrder,'設定示唆',['BC初当り（簡易）']);
   ui.sections['BC初当り（簡易）']={inputIds:['INP_NORMAL_GAMES','INP_BC_FIRST_HIT'],description:'周期別データを記録しない場合だけ、通常ゲーム数とBC初当りを簡易入力として使用します。周期別データがある場合はそちらを優先し、同じBC当選を二重評価しません。',observationRole:'DIRECT_PLAY',collapsible:true,quickInputEligible:true};
   ensureContract(ui,im,'INP_NORMAL_GAMES');ensureContract(ui,im,'INP_BC_FIRST_HIT');
   ui.auditNotes=(ui.auditNotes??[]).filter(x=>!String(x).includes('BC初当り合算は周期別Featureと重複するため不採用'));
   ui.auditNotes.push('BC初当りは周期別入力がない場合のFallback。周期別Featureが有効な場合はSelectionのsuppression契約で二重評価を防ぐ。');
 }
 if(id==='S_GRANBELM_ZX'){
   const groups=[
    ['ナカミミエール（通常）','INP_NAKAMI_NORMAL_','通常サイクル'],
    ['ナカミミエール（0.5周期）','INP_NAKAMI_C05_','0.5周期'],
    ['ナカミミエール（5.5周期）','INP_NAKAMI_C55_','5.5周期'],
    ['ナカミミエール（9.9周期）','INP_NAKAMI_C99_','9.9周期']
   ];
   const suffixes=['MAGIC_BLUE','MAGIC_GREEN','MOON_BLUE','MOON_GREEN','HOPE_BLUE','HOPE_GREEN'];
   const names=groups.map(g=>g[0]); ui.sectionOrder=insertBefore(ui.sectionOrder,'設定示唆',names);
   for(const [section,prefix,cycle] of groups){
     const ids=suffixes.map(s=>prefix+s); ids.forEach(x=>ensureContract(ui,im,x));
     ui.sections[section]={inputIds:ids,description:`${cycle}でナカミミエールを確認した時、魔・月・希の青/緑だけを記録します。アルマノクス系アイコンと先読み後の次回アイテムはこの数値入力に含めません。`,observationRole:'DIRECT_PLAY',collapsible:true,quickInputEligible:true};
   }
   ui.auditNotes=(ui.auditNotes??[]).filter(x=>!String(x).includes('ナカミミエールの魔/月/希は周期依存のため数値Inferenceへ入れず'));
   ui.auditNotes.push('ナカミミエールの魔/月/希はサイクル条件を分離し、青/緑の排他的構成としてSelectionで採用。アルマノクス系と先読み後の次回アイテムは数値推測から除外する。');
 }
 write(up,ui);
 console.log(`${id}: remediated canonical UI route`);
}