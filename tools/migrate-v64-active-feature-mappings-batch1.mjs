#!/usr/bin/env node
import fs from 'node:fs';

function read(p){return JSON.parse(fs.readFileSync(p,'utf8'));}
function write(p,v){fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');}
function replaceMappings(o,removeIds,add){
  const rm=new Set(removeIds);
  o.featureMappings=(o.featureMappings??[]).filter(m=>!rm.has(m.featureId));
  const existing=new Set(o.featureMappings.map(m=>m.featureId));
  for(const m of add){ if(existing.has(m.featureId)) throw new Error(`${o.machineId}: duplicate ${m.featureId}`); o.featureMappings.push(m); }
}

{
  const p='research/L_MONSTER_HUNTER_RISE_XA/machine-observation-data.json';
  const o=read(p);
  if(!o.observations.some(x=>x.observationId==='OBS_REPLAY_THRESHOLD')){
    o.observations.push({
      observationId:'OBS_REPLAY_THRESHOLD',sourceType:'DIRECT_PLAY',observationMode:'MANUAL_COUNTER',status:'FOUND',
      label:'CZ間の規定リプレイ到達回数',categories:['SELF_PLAY'],timing:['通常のCZ間サイクル終了時'],
      excludedConditions:['設定変更後初回サイクル（内部リプレイ回数ランダム加算）'],sourceRefs:[],
      notes:'CZ間のリプレイを数え、40/80/120/160/200回のどの規定で当選したかをサイクル単位で記録する。ライブ用リプレイカウンター自体は推測値ではない。'
    });
  }
  replaceMappings(o,['FEAT_REPLAY_THRESHOLD'],[{
    featureId:'FEAT_REPLAY_THRESHOLD',mappingType:'EXACT',observationIds:['OBS_REPLAY_THRESHOLD'],collectionMethods:['MANUAL_COUNTER'],usableForInference:true,usableForDifficulty:false,
    notes:'設定変更後初回を除外した通常CZ間サイクルの到達規定回数を5カテゴリで記録する。'
  }]);
  write(p,o);
}

{
  const p='research/L_SHIN_IKKITOUSEN_V/machine-observation-data.json';
  const o=read(p);
  const common=o.observations.find(x=>x.observationId==='OBS_IKKITOUSEN_COMMON_BELL');
  if(!common) throw new Error('Ikkitousen common bell Observation missing');
  common.label='1枚/11枚共通ベル';
  common.categories=['1枚共通ベル','11枚共通ベル'];
  common.notes='左第1停止を基本として通常時の払い出し枚数で1枚共通ベルと11枚共通ベルを区別して数える。同じ通常ゲーム分母を共有するが、各枚数は別Featureへ入力する。';
  replaceMappings(o,['FEAT_COMMON_BELL','FEAT_COMMON_BELL_1','FEAT_COMMON_BELL_11'],[
    {featureId:'FEAT_COMMON_BELL_1',mappingType:'COMBINABLE',observationIds:['OBS_IKKITOUSEN_NORMAL_GAMES','OBS_IKKITOUSEN_COMMON_BELL'],collectionMethods:['MANUAL_COUNTER','MANUAL_COUNTER'],usableForInference:true,usableForDifficulty:true,notes:'通常時の1枚共通ベルだけをカテゴリ識別して数える。'},
    {featureId:'FEAT_COMMON_BELL_11',mappingType:'COMBINABLE',observationIds:['OBS_IKKITOUSEN_NORMAL_GAMES','OBS_IKKITOUSEN_COMMON_BELL'],collectionMethods:['MANUAL_COUNTER','MANUAL_COUNTER'],usableForInference:true,usableForDifficulty:true,notes:'通常時の11枚共通ベルだけをカテゴリ識別して数える。'}
  ]);
  write(p,o);
}

{
  const p='research/S_ODANOBUNA_ZENKOKU_SNT/machine-observation-data.json';
  const o=read(p);
  replaceMappings(o,['FEAT_AT_FIRST_HIT','FEAT_AT_INITIAL'],[
    {featureId:'FEAT_AT_INITIAL',mappingType:'COMBINABLE',observationIds:['OBS_NOBUNA_NORMAL_GAMES','OBS_NOBUNA_AT_FIRST_HIT'],collectionMethods:['MANUAL_COUNTER','MANUAL_COUNTER'],usableForInference:true,usableForDifficulty:true,notes:'Selectionの現行Feature IDへ同期。通常GベースのAT初当り主Feature。'}
  ]);
  write(p,o);
}

{
  const p='research/S_GRANBELM_ZX/machine-observation-data.json';
  const o=read(p);
  const menu=o.observations.find(x=>x.observationId==='OBS_GRANBELM_MENU_HINTS');
  if(!menu) throw new Error('Granbelm menu Observation missing');
  menu.label='ナカミミエール/アタリミエール等のメニュー情報';
  menu.categories=['NAKAMI_NUMERIC','EVIDENCE','OBSERVATION_ONLY'];
  menu.notes='ナカミミエールの魔・月・希（青/緑）は、Selectionで通常/0-5周期/55周期/99周期の条件を分離して数値Inferenceに利用する。アルマノクスの確定・否定アイコンはEvidence、その他の先読み項目はObservation only。異なる周期条件を混合しない。';
  replaceMappings(o,['FEAT_AT_FIRST_HIT','FEAT_AT_INITIAL','FEAT_NAKAMI_NORMAL','FEAT_NAKAMI_05','FEAT_NAKAMI_55','FEAT_NAKAMI_99'],[
    {featureId:'FEAT_AT_INITIAL',mappingType:'COMBINABLE',observationIds:['OBS_GRANBELM_NORMAL_GAMES','OBS_GRANBELM_AT_FIRST_HIT'],collectionMethods:['MANUAL_COUNTER','MANUAL_COUNTER'],usableForInference:true,usableForDifficulty:true,notes:'Selectionの現行Feature IDへ同期。'},
    {featureId:'FEAT_NAKAMI_NORMAL',mappingType:'EXACT',observationIds:['OBS_GRANBELM_MENU_HINTS'],collectionMethods:['MENU_READ'],usableForInference:true,usableForDifficulty:false,notes:'通常条件タブの魔/月/希（青/緑）だけを同一母集団として集計。'},
    {featureId:'FEAT_NAKAMI_05',mappingType:'EXACT',observationIds:['OBS_GRANBELM_MENU_HINTS'],collectionMethods:['MENU_READ'],usableForInference:true,usableForDifficulty:false,notes:'0-5周期条件タブの魔/月/希（青/緑）だけを同一母集団として集計。'},
    {featureId:'FEAT_NAKAMI_55',mappingType:'EXACT',observationIds:['OBS_GRANBELM_MENU_HINTS'],collectionMethods:['MENU_READ'],usableForInference:true,usableForDifficulty:false,notes:'55周期条件タブの魔/月/希（青/緑）だけを同一母集団として集計。'},
    {featureId:'FEAT_NAKAMI_99',mappingType:'EXACT',observationIds:['OBS_GRANBELM_MENU_HINTS'],collectionMethods:['MENU_READ'],usableForInference:true,usableForDifficulty:false,notes:'99周期条件タブの魔/月/希（青/緑）だけを同一母集団として集計。'}
  ]);
  write(p,o);
}

console.log('UPDATED 4 machines / 9 active Feature mappings');
