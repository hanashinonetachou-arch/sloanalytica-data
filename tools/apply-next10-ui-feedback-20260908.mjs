import fs from 'node:fs';
import path from 'node:path';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const write=(p,j)=>fs.writeFileSync(p,JSON.stringify(j,null,2)+'\n');
const uiPath=id=>`research/${id}/ui-design-data.json`;
const selPath=id=>`research/${id}/selection-data.json`;
const obsPath=id=>`research/${id}/machine-observation-data.json`;
const loadUI=id=>read(uiPath(id));
const saveUI=(id,j)=>write(uiPath(id),j);
const loadSel=id=>read(selPath(id));
const saveSel=(id,j)=>write(selPath(id),j);
const setSelInputName=(id,inputId,name)=>{const s=loadSel(id); const i=(s.inputs??[]).find(x=>x.id===inputId); if(i)i.name=name; saveSel(id,s)};

// Global user-facing wording cleanup: remove ambiguous 「有効」 from labels.
const labelFixes={
  L_GHOST_IN_THE_SHELL_ZS:{INP_TACHIKOMA_200_400_TRIALS:'モードA～Dの200G/400G到達回数（白の境界失敗後の確定当選区間は除外）'},
  L_GOBLIN_SLAYER_2_JZ:{INP_300_500_CZ_TRIALS:'300G/500Gゾーン到達回数'},
  L_GODZILLA_NS:{INP_AT_FIRST_HIT_TRIALS:'通常ゲーム数'},
  L_KABANERI_UNATO_KESSEN_XX:{INP_CYCLE3_BONUS_TRIALS:'3周期目到達回数',INP_CYCLE4_BONUS_TRIALS:'4周期目到達回数'},
  L_KYOKOU_SUIRI_ST:{INP_EP_START_TRIALS:'エピソード開始回数'},
  L_MAGIA_RECORD_RN:{INP_NORMAL_GAME_COUNT:'通常ゲーム数'},
  L_MAHJONG_MONOGATARI_S2:{INP_AT_FIRST_HIT_TRIALS:'通常ゲーム数'},
  L_MILLION_GOD_KISEKI_CX:{INP_NON_GAIA_ZZONE_TRIALS:'非ガイアステージでGG当選した回数'},
  L_UMINEKO_2_A1:{INP_REG_DIAG_BLUE7_TRIALS:'REG中の青7狙いゲーム数'}
};
for(const [id,map] of Object.entries(labelFixes)){
  const ui=loadUI(id);
  const sel=loadSel(id);
  for(const [inputId,name] of Object.entries(map)){
    if(ui.inputContracts?.[inputId]) ui.inputContracts[inputId].name=name;
    const si=(sel.inputs??[]).find(x=>x.id===inputId); if(si) si.name=name;
  }
  saveUI(id,ui); saveSel(id,sel);
}

// Lパチスロ 炎炎ノ消防隊2: split the giant Evidence block by natural observation context.
{
  const id='L_FIRE_FORCE_2'; const ui=loadUI(id);
  const regIds=Object.keys(ui.inputContracts).filter(x=>x.startsWith('INP_EVIDENCE_REG_'));
  const bonusEndIds=Object.keys(ui.inputContracts).filter(x=>x.startsWith('INP_EVIDENCE_BONUS_END_'));
  const payoutIds=Object.keys(ui.inputContracts).filter(x=>x.startsWith('INP_EVIDENCE_PAYOUT_'));
  const endCharIds=Object.keys(ui.inputContracts).filter(x=>x.startsWith('INP_EVIDENCE_END_CHAR_'));
  for(const x of [...regIds,...bonusEndIds,...payoutIds,...endCharIds]) ui.inputContracts[x].gridSpan=6;
  delete ui.sections['設定示唆・確定情報'];
  const sec=(inputIds,description)=>({inputIds,description,observationRole:'END_EVENT',observationRefs:[],acquisitionSources:['END_EVENT'],collapsible:true,defaultExpanded:false});
  ui.sections['REGキャラ紹介']=sec(regIds,'REG中のキャラ紹介で確認したシナリオ・キャラを入力します。該当パターンが出現したときだけ加算してください。');
  ui.sections['ボーナス終了画面・確定パターン']=sec(bonusEndIds,'ボーナス終了時に表示された設定確定系の画面を入力します。通常の終了画面振り分けとは分離して扱います。');
  ui.sections['獲得枚数表示']=sec(payoutIds,'ボーナス・AT中に特定の獲得枚数表示を確認した回数を入力します。');
  ui.sections['エンディングミニキャラ']=sec(endCharIds,'エンディング中に表示された設定否定・確定系のミニキャラを入力します。');
  ui.sectionOrder=['初当り','REG/アクセル/灰焰終了画面','炎炎ボーナス終了画面','REGキャラ紹介','ボーナス終了画面・確定パターン','獲得枚数表示','エンディングミニキャラ'];
  saveUI(id,ui);
}

// スマスロヨルムンガンド: replace internal enum labels with user-facing names.
{
  const id='L_JORMUNGAND_ND01G'; const ui=loadUI(id); const sel=loadSel(id);
  const names={
    INP_BONUS_END_SCREEN_DEFAULT:'デフォルト',
    INP_BONUS_END_SCREEN_EVENING:'夕方',
    INP_BONUS_END_SCREEN_SLEEPING_VALMET:'睡眠バルメ',
    INP_BONUS_END_SCREEN_THREE_DOCTORS:'博士3人'
  };
  for(const [inputId,name] of Object.entries(names)){
    ui.inputContracts[inputId].name=name;
    const si=(sel.inputs??[]).find(x=>x.id===inputId); if(si)si.name=name;
  }
  saveUI(id,ui); saveSel(id,sel);
}

// L虚構推理: use CZ initial count directly as one-shot denominator and simplify labels.
{
  const id='L_KYOKOU_SUIRI_ST'; const ui=loadUI(id); const sel=loadSel(id); const obs=read(obsPath(id));
  const old='一発成功抽選', neu='CZ開始時一発成功抽選';
  ui.sectionOrder=ui.sectionOrder.map(x=>x===old?neu:x);
  ui.sections[neu]=ui.sections[old]; delete ui.sections[old];
  ui.sections[neu].inputIds=(ui.sections[neu].inputIds??[]).filter(x=>x!=='INP_CZ_ONE_SHOT_SUCCESS_TRIALS');
  ui.sections[neu].description='CZ初当り1回につき1回行われるCZ開始時の一発成功抽選について、成功した回数を記録します。母数は「CZ初当り回数」を使用します。';
  ui.inputContracts.INP_CZ_ONE_SHOT_SUCCESS_COUNT.name='一発成功抽選で成功';
  delete ui.inputContracts.INP_CZ_ONE_SHOT_SUCCESS_TRIALS;
  ui.inputContracts.INP_COMMON_BELL_NONE.name='同時成立なし';
  ui.inputContracts.INP_COMMON_BELL_CZ.name='CZ当選';
  ui.inputContracts.INP_COMMON_BELL_BONUS.name='ボーナス直撃';
  ui.sections['共通ベル'].description='CZ・AT本前兆中を除く共通ベル成立ごとに、同時成立なし・CZ当選・ボーナス直撃のどれだったかを記録します。';
  ui.inputContracts.INP_EP_START_TRIALS.name='エピソード開始回数';
  saveUI(id,ui);

  sel.inputs=(sel.inputs??[]).filter(x=>x.id!=='INP_CZ_ONE_SHOT_SUCCESS_TRIALS');
  const suc=(sel.inputs??[]).find(x=>x.id==='INP_CZ_ONE_SHOT_SUCCESS_COUNT'); if(suc)suc.name='一発成功抽選で成功';
  for(const [iid,n] of Object.entries({INP_COMMON_BELL_NONE:'同時成立なし',INP_COMMON_BELL_CZ:'CZ当選',INP_COMMON_BELL_BONUS:'ボーナス直撃',INP_EP_START_TRIALS:'エピソード開始回数'})){const x=(sel.inputs??[]).find(v=>v.id===iid);if(x)x.name=n;}
  const feat=(sel.features??[]).find(x=>x.featureId==='FEAT_CZ_ONE_SHOT_SUCCESS');
  if(!feat) throw new Error('Kyokou one-shot feature missing');
  feat.denominatorInputId='INP_CZ_INITIAL_COUNT';
  if(Array.isArray(feat.denominatorInputIds)) feat.denominatorInputIds=['INP_CZ_INITIAL_COUNT'];
  saveSel(id,sel);

  const fm=(obs.featureMappings??[]).find(x=>x.featureId==='FEAT_CZ_ONE_SHOT_SUCCESS');
  if(fm){
    if('denominatorInputId' in fm) fm.denominatorInputId='INP_CZ_INITIAL_COUNT';
    if(Array.isArray(fm.denominatorInputIds)) fm.denominatorInputIds=['INP_CZ_INITIAL_COUNT'];
    if(Array.isArray(fm.inputIds)) fm.inputIds=fm.inputIds.map(x=>x==='INP_CZ_ONE_SHOT_SUCCESS_TRIALS'?'INP_CZ_INITIAL_COUNT':x).filter((x,i,a)=>a.indexOf(x)===i);
  }
  write(obsPath(id),obs);
}

// Lアクダマドライブ: compact Analyze UI and explicitly exclude ceiling-derived EP bonuses.
{
  const id='L_AKUDAMA_DRIVE_TP'; const ui=loadUI(id); const sel=loadSel(id);
  ui.inputContracts.INP_ANALYZE_0PT_COUNT.name='アナライズチャレンジ';
  ui.inputContracts.INP_ANALYZE_0PT_COUNT.gridSpan=6;
  ui.inputContracts.INP_ANALYZE_0PT_TRIALS.gridSpan=6;
  ui.sections['シンテツドウポイント0pt到達時のCZ抽選'].description='ベルでシンテツドウポイントが0ptへ到達した回数を母数に、CZ「アナライズチャレンジ」が当選した回数を記録します。';
  ui.sections['アクダマボーナス→エピソードボーナス昇格'].description='アクダマボーナス当選時のエピソードボーナス昇格抽選を記録します。前回STから3・5・7回目のエピソードボーナスはスルー天井到達による可能性があるため除外し、スルー天井由来ではないと確認できる対象ボーナスだけを母数・昇格回数に含めます。';
  saveUI(id,ui);
  const ai=(sel.inputs??[]).find(x=>x.id==='INP_ANALYZE_0PT_COUNT'); if(ai)ai.name='アナライズチャレンジ';
  saveSel(id,sel);
}

console.log('Applied 2026-09-08 UI feedback');
