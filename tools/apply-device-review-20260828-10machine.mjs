#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT=process.cwd();
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');
const req=(arr,pred,msg)=>{const x=arr.find(pred);if(!x)throw new Error(msg);return x;};
const bumpResearch=(research,version)=>{research.machine.machineDataVersion=version;};
const bumpSelection=(selection,version)=>{selection.machineDataVersion=version;};

function patchOkidoki(){
  const base=path.join(ROOT,'research','S_OKIDOKI_GOLD_GS');
  const rp=path.join(base,'research-data.json');
  const sp=path.join(base,'selection-data.json');
  const research=read(rp), selection=read(sp);
  bumpResearch(research,'0.1.1');
  bumpSelection(selection,'0.1.1');

  let input=selection.inputs.find(x=>x.id==='INP_CHERRY_B_COUNT');
  if(!input){
    input={
      id:'INP_CHERRY_B_COUNT',
      name:'チェリーB（判別できる場合のみ）',
      type:'counter',category:'CHERRY_B',unit:'回',displayOrder:20,
      inferenceRole:'INCLUDE_SUPPORT',defaultValue:null,parentInputId:'INP_NORMAL_GAMES'
    };
    selection.inputs.push(input);
  }
  selection.uiCategoryLabels={...(selection.uiCategoryLabels??{}),CHERRY_B:'チェリーB'};
  selection.uiCategoryDescriptions={...(selection.uiCategoryDescriptions??{}),CHERRY_B:'停止形でチェリーA/Bを正確に判別できる場合のみ入力してください。判別できない場合は空欄のままにしてください。'};
  const f=req(selection.features,x=>x.researchFeatureId==='RF_CHERRY_B','Okidoki RF_CHERRY_B selection missing');
  Object.assign(f,{
    featureId:'FEAT_CHERRY_B',adoptionCategory:'INCLUDE_SUPPORT',
    numeratorInputId:'INP_CHERRY_B_COUNT',denominatorInputId:'INP_NORMAL_GAMES',weight:1,
    difficultyParticipation:'INCLUDE',
    difficultyExposure:{mode:'per_game',factor:1,quality:'EXACT',basisId:'NORMAL_GAMES'},
    userReason:'チェリーBは停止形でA/Bを判別でき、設定1の1/168.0から設定6の1/128.0まで継続的な設定差があり、実戦でも母数を得やすいため補助採用します。停止形を判別できない場合は入力せず、推測にも参加させません。'
  });
  write(rp,research); write(sp,selection);
}

function patchDiscup(){
  const base=path.join(ROOT,'research','L_DISCUP_ULTRA_REMIX_XR');
  const rp=path.join(base,'research-data.json');
  const sp=path.join(base,'selection-data.json');
  const research=read(rp), selection=read(sp);
  bumpResearch(research,'0.1.1'); bumpSelection(selection,'0.1.1');

  req(selection.inputs,x=>x.id==='INP_BONUS_OUTCOME_BIG','Disc BIG input missing').name='BIG';
  req(selection.inputs,x=>x.id==='INP_BONUS_OUTCOME_REG','Disc REG input missing').name='REG';
  const three=req(selection.inputs,x=>x.id==='INP_THREE_COIN_COUNT','Disc 3coin input missing');
  three.category='THREE_COIN';
  three.displayOrder=31;
  delete three.parentInputId;
  let games=selection.inputs.find(x=>x.id==='INP_THREE_COIN_GAMES');
  if(!games){
    games={id:'INP_THREE_COIN_GAMES',name:'3枚役 判別用ゲーム数',type:'integer',category:'THREE_COIN',unit:'G',displayOrder:30,inferenceRole:'INCLUDE_SUPPORT',defaultValue:null};
    selection.inputs.push(games);
  }
  selection.uiCategoryLabels={...(selection.uiCategoryLabels??{}),THREE_COIN:'3枚役'};
  selection.uiCategoryDescriptions={...(selection.uiCategoryDescriptions??{}),THREE_COIN:'マイスロ利用時は、マイスロで取得した3枚役回数と、その集計に対応するマイスロ上のゲーム数をセットで入力してください。自身でカウントする場合は、3枚役回数とデータカウンター上のゲーム数をセットで入力してください（ボーナス中はカウントせず、AT中をカウントする一般的なデータカウンター仕様を想定）。異なる集計方法の分子・分母を混在させないでください。'};
  const sf=req(selection.features,x=>x.researchFeatureId==='RF_THREE_COIN','Disc RF_THREE_COIN missing');
  sf.denominatorInputId='INP_THREE_COIN_GAMES';
  sf.userReason='3枚役は比較的高頻度で設定差があり、マイスロまたは自力カウントで観測できるため補助採用します。分母はボーナス推測用の通常ゲーム数と共用せず、3枚役の集計方法に対応する専用ゲーム数を使用します。';

  const rf=req(research.features,x=>x.researchFeatureId==='RF_THREE_COIN','Disc research RF_THREE_COIN missing');
  rf.denominatorDefinition='3枚役の集計方法に対応する判別用ゲーム数。マイスロ利用時はマイスロで3枚役と対応して表示されるゲーム数、自力カウント時はボーナス中を除外しAT中を含むデータカウンター上のゲーム数。';
  rf.notes='実機確認により、マイスロのゲーム数と一般的なデータカウンターのゲーム数ではボーナス中ゲーム数の扱いが異なる。3枚役は分子と分母を同じ集計系で揃え、両者を混在させない。';

  const grouped=new Set(['RF_REACH_T2','RF_REACH_T3','RF_REACH_A2','RF_REACH_D2','RF_REACH_G2','RF_D2_BONUS_TYPE','RF_G2_BONUS_TYPE','RF_T2_BONUS_TYPE']);
  for(const f of selection.features){ if(grouped.has(f.researchFeatureId)) f.summarySuppressed=true; }
  selection.rejectedElements=(selection.rejectedElements??[]).filter(x=>x.id!=='REJECTED_REACH_ROLE_GROUP');
  selection.rejectedElements.push({
    id:'REJECTED_REACH_ROLE_GROUP',name:'リーチ目役関連',
    reason:'各リーチ目役の出現率や成立時ボーナス種別には設定差がありますが、個別役が低頻度で実戦範囲の母数を得にくく、ボーナス内訳との依存もあるため現行推測ではまとめて不採用としています。'
  });
  write(rp,research); write(sp,selection);
}

function patchShinEva(){
  const base=path.join(ROOT,'research','L_SHIN_EVANGELION');
  const rp=path.join(base,'research-data.json');
  const sp=path.join(base,'selection-data.json');
  const research=read(rp), selection=read(sp);
  bumpResearch(research,'0.1.2'); bumpSelection(selection,'0.1.2');
  const reasons={
    RF_INTERNAL_STATE_TRANSITION:'内部状態移行には設定差候補がありますが、公開値が主に設定1に限られ、チェリー・スイカ・ハズレ目など契機ごとに分母と抽選が異なるため、現状の1つのFeatureとして安全に再現できず不採用です。',
    RF_STATE_ROLE_FIRST_HIT:'内部状態別レア役からの初当り抽選は設定差候補ですが、全設定の具体値が揃っておらず設定別尤度を構成できないため不採用です。',
    RF_ST_MISS_MODE_1:'作戦ST1スルー後のモードB/C振り分けは数値が公開されていますが、実戦中に次回モードB/Cを確定判別して回数集計することができないため不採用です。',
    RF_ST_MISS_MODE_2_3:'作戦ST2～3スルー後のモードB/C振り分けは数値が公開されていますが、実戦中に次回モードB/Cを確定判別して回数集計することができないため不採用です。',
    RF_ST_MISS_MODE_4PLUS:'作戦ST4スルー以上後のモードB/C振り分けは数値が公開されていますが、実戦中に次回モードB/Cを確定判別して回数集計することができないため不採用です。',
    RF_ST_MISS_HEAVEN:'作戦ST駆け抜け後150G以内の当選率は設定1～5が35.8%、設定6が35.9%と設定差がほぼなく、実戦範囲で追加情報をほとんど得られないため不採用です。'
  };
  for(const [id,reason] of Object.entries(reasons)){
    const f=req(selection.features,x=>x.researchFeatureId===id,`Shin Eva ${id} missing`);
    f.userReason=reason;
  }
  write(rp,research); write(sp,selection);
}

function patchBuilder(){
  const p=path.join(ROOT,'tools','build-machine-data.mjs');
  let s=fs.readFileSync(p,'utf8');
  const old='    if(sf.adoptionCategory==="DISPLAY_ONLY") continue;';
  const neu='    if(sf.adoptionCategory==="DISPLAY_ONLY" || sf.summarySuppressed===true) continue;';
  if(!s.includes(neu)){
    if(!s.includes(old)) throw new Error('build-machine-data summary insertion point not found');
    s=s.replace(old,neu);
    fs.writeFileSync(p,s);
  }
}

patchBuilder();
patchOkidoki();
patchDiscup();
patchShinEva();
console.log('Applied device review fixes: OKIDOKI GOLD 0.1.1 / DISCUP ULTRAREMIX 0.1.1 / SHIN EVA 0.1.2');
