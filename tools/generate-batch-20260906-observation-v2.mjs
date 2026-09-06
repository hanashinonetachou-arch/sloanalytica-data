#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const batch=[
  [240,'L_BURNING_EXPRESS_ZN','バーニングエクスプレス'],
  [241,'L_PRISM_NANA_CC','プリズムナナ'],
  [242,'L_GINGA_EIYUU_DNT_GH','銀河英雄伝説 Die Neue These'],
  [243,'L_HIHODEN_PA7','スマスロ 秘宝伝'],
  [244,'L_OKIDOKI_DUO_ENCORE_FR','スマスロ 沖ドキ！DUO アンコール'],
  [245,'L_HOKUTO_TENSEI_2_MW','スマスロ 北斗の拳 転生の章2'],
  [246,'L_TEKKEN_6_YD01H','スマスロ鉄拳6'],
  [247,'L_HANMA_BAKI_L5','L範馬刃牙'],
  [248,'L_GOBLIN_SLAYER_2_JZ','スマスロ ゴブリンスレイヤーⅡ'],
  [249,'L_GHOST_IN_THE_SHELL_ZS','スマスロ 攻殻機動隊'],
];

const inputRefs=f=>[...new Set([f.numeratorInputId,...(f.categoryInputIds??[]),f.denominatorInputId,...(f.denominatorInputIds??[])].filter(Boolean))];
const confirmedServiceStatus=s=>['FOUND','CONFIRMED','VERIFIED','SUPPORTED'].includes(String(s??'').toUpperCase());
const checkedNoneStatus=s=>['CHECKED_NONE','NONE','NOT_SUPPORTED'].includes(String(s??'').toUpperCase());

for(const [provisionalRegistrationId,machineId,displayName] of batch){
  const dir=path.join(root,'research',machineId);
  const selection=JSON.parse(fs.readFileSync(path.join(dir,'selection-data.json'),'utf8'));
  const research=JSON.parse(fs.readFileSync(path.join(dir,'research-data.json'),'utf8'));
  const inputById=new Map((selection.inputs??[]).map(i=>[i.id,i]));
  const adopted=(selection.features??[]).filter(f=>String(f.adoptionCategory??'').startsWith('INCLUDE'));
  const observations=[];const featureMappings=[];

  for(const feature of adopted){
    const refs=inputRefs(feature);const names=refs.map(id=>inputById.get(id)?.name??id);const obsId=`OBS_${feature.featureId.replace(/^FEAT_/,'')}`;
    const rf=(research.features??[]).find(x=>x.researchFeatureId===feature.researchFeatureId);
    const conditional=feature.adoptionCategory==='INCLUDE_FALLBACK'||Boolean(feature.inputTransform)||refs.length>2||!/通常ゲーム数$/.test(String(rf?.denominatorDefinition??''));
    const suppression=(feature.suppressedByFeatureIds??[]);
    observations.push({
      observationId:obsId,sourceType:'DIRECT_PLAY',observationMode:'MANUAL_COUNTER',status:'FOUND',label:names.join('・')||feature.featureId,categories:names,
      timing:[`自己実戦中、${rf?.denominatorDefinition??'SelectionDataで定義された対象試行'}の成立時に更新`],
      excludedConditions:[
        `分母「${rf?.denominatorDefinition??'SelectionData定義'}」外の遊技状態・試行を混ぜない`,
        '着席前累積値を自己実戦値へ混ぜない','未観測を観測済み0として扱わない',
        ...(conditional?['条件付き母集団を総通常ゲームへ平坦化しない']:[]),
        ...(suppression.length?[`Selection suppression契約を保持し、${suppression.join(', ')}が利用可能な区間では本Fallbackを同時尤度化しない`]:[])
      ],
      sourceRefs:rf?.sourceRefs??[],notes:`Selection ${feature.featureId} (${feature.adoptionCategory}) の観測契約。分子=${rf?.numeratorDefinition??'Selection定義'} / 分母=${rf?.denominatorDefinition??'Selection定義'}`
    });
    featureMappings.push({featureId:feature.featureId,mappingType:feature.inputTransform||(feature.categoryInputIds?.length??0)?'COMBINABLE':'EXACT',observationIds:[obsId],collectionMethods:['MANUAL_COUNTER'],usableForInference:true,usableForDifficulty:false,notes:'Gate C写像。Difficulty exposureは実戦時の取得単位・露出率確定まで未参加。'});
  }

  const evidence=selection.evidence??[];
  if(evidence.length) observations.push({observationId:'OBS_HARD_EVIDENCE_EVENTS',sourceType:'END_EVENT',observationMode:'VISUAL_EVENT',status:'FOUND',label:'設定確定・否定情報',categories:evidence.map(e=>e.displayName??e.name??e.evidenceId),timing:['各Evidence成立タイミングで即時確認'],excludedConditions:['傾向示唆をHard Evidenceへ昇格させない','同一画面・音声の確定部分以外を設定集合制約へ使わない'],sourceRefs:[],notes:'SelectionDataでINCLUDE_UIとなったHard Evidenceのみ。'});

  const services=research.linkedServices??[];
  const confirmed=services.filter(s=>confirmedServiceStatus(s.status));
  const checkedNone=services.length>0&&services.every(s=>checkedNoneStatus(s.status));
  for(const svc of confirmed){
    observations.push({observationId:`OBS_LINKED_SERVICE_${String(svc.name??'SERVICE').normalize('NFKC').toUpperCase().replace(/[^A-Z0-9]+/g,'_').replace(/^_+|_+$/g,'')||'SERVICE'}`,sourceType:'LINKED_SERVICE',observationMode:'LINKED_SERVICE_READ',status:'FOUND',label:`${svc.name} 遊技情報`,categories:(svc.verifiedFields?.length?svc.verifiedFields:['Researchで確認済みのサービス表示項目']),timing:['遊技中または遊技終了時に連動サービス画面を確認'],excludedConditions:['サービス未起動区間を取得済みとして扱わない','サービス表示項目の分母定義がSelectionと一致しない場合は直接流用しない'],sourceRefs:svc.sourceRefs??[],notes:svc.notes??'Researchで対応確認済み。'});
  }

  const linkedService=confirmed.length?'FOUND':checkedNone?'CHECKED_NONE':'UNRESOLVED';
  const sourceCoverage={machineMenu:'UNRESOLVED',dataCounter:'UNRESOLVED',linkedService,directPlay:'FOUND',endEvent:evidence.length?'FOUND':'NOT_REQUIRED',seatedState:'UNRESOLVED'};
  const fieldVerificationItems=[];
  fieldVerificationItems.push({verificationId:`VFY_${machineId}_MACHINE_MENU`,status:'WAITING_FOR_MACHINE',sourceType:'MACHINE_MENU',priority:'MEDIUM',question:'筐体メニュー/遊技履歴に総G・通常G・CZ・Bonus・AT・小役・連動サービス導線のどこまで表示されるか実機で確認する。'});
  fieldVerificationItems.push({verificationId:`VFY_${machineId}_DATA_COUNTER`,status:'WAITING_FOR_MACHINE',sourceType:'DATA_COUNTER',priority:'HIGH',question:'ホールのデータカウンターで取得できる総G・現在G・Bonus・AT・CZ・初当り履歴と、Selectionの分母定義が一致する範囲を確認する。設備依存のためWebだけで確定しない。'});
  fieldVerificationItems.push({verificationId:`VFY_${machineId}_SEATED_STATE`,status:'WAITING_FOR_MACHINE',sourceType:'SEATED_STATE',priority:'HIGH',question:'着席直後に取得できる当日累積値を確認し、前任者区間を安全に利用できるFeatureと差分計算方法を確定する。'});
  if(linkedService==='UNRESOLVED') fieldVerificationItems.push({verificationId:`VFY_${machineId}_LINKED_SERVICE`,status:'WAITING_FOR_MACHINE',sourceType:'LINKED_SERVICE',priority:'MEDIUM',question:'Researchで機種固有連動サービスを確定できていない。実機メニューのQR/連動導線と取得項目を確認する。'});

  const out={schemaVersion:'machine-observation-data-v2',machineId,displayName,provisionalRegistrationId,researchedAt:'2026-09-06',sources:[],sourceCoverage,observations,featureMappings,researchReopenRequests:[],fieldVerificationItems};
  fs.writeFileSync(path.join(dir,'machine-observation-data.json'),JSON.stringify(out,null,2)+'\n');
  console.log(`${machineId}: observations=${observations.length} mappings=${featureMappings.length} evidence=${evidence.length} linkedService=${linkedService}`);
}
