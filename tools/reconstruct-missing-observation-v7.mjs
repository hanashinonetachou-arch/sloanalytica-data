#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT=process.cwd();
const IDS=[
'L_AZURLANE_THE_ANIMATION_KN','L_DRUAGA_NO_TOU_ZA','L_SMASLO_TOKYO_REVENGERS_ZF','L_BABEL_BA','L_SHIN_ONIMUSHA_3_SA','L_ZENIGATA_5_L2','L_TOARU_KAGAKU_NO_RAILGUN_2_FV','L_ZETTAI_SHOGEKI_FORCE_FH','L_KAKUMEIKI_VALVRAVE_2_JF','L_NEO_PLANET_SLED'
];
const ADOPTED=new Set(['INCLUDE_PRIMARY','INCLUDE_SUPPORT','INCLUDE_FALLBACK','INCLUDE']);
const catalog=JSON.parse(fs.readFileSync(path.join(ROOT,'catalog.json'),'utf8'));
const registry=JSON.parse(fs.readFileSync(path.join(ROOT,'machine-registry.json'),'utf8'));
const catById=new Map((catalog.machines??[]).map(x=>[x.machineId,x]));
const regById=new Map((registry.machines??registry.entries??registry??[]).map(x=>[x.machineId,x]));
const serviceEvidence={
  L_DRUAGA_NO_TOU_ZA:{service:'ユニメモ',url:'https://www.universal-777.com/fun/unimemo/',publisher:'universal-777.com',title:'ユニメモ対応機種一覧（スマスロ/SLOT ドルアーガの塔）'},
  L_BABEL_BA:{service:'ユニメモ',url:'https://www.universal-777.com/fun/unimemo/',publisher:'universal-777.com',title:'ユニメモ対応機種一覧（スマスロ バベル）'},
  L_SMASLO_TOKYO_REVENGERS_ZF:{service:'マイスロ',url:'https://new.sammy.co.jp/japanese/myslot/news/',publisher:'sammy.co.jp',title:'マイスロ 新機種「スマスロ 東京リベンジャーズ」'}
};

function read(file){return JSON.parse(fs.readFileSync(file,'utf8'));}
function write(file,v){fs.writeFileSync(file,JSON.stringify(v,null,2)+'\n');}
function inputRefs(f){return [...new Set(['numeratorInputId','denominatorInputId','successInputId','trialsInputId','countInputId','gamesInputId','inputId'].map(k=>f?.[k]).filter(Boolean).concat(f?.categoryInputIds??[]))];}
function endLike(name,rf,inputs){
 const text=[name,rf?.name,rf?.trialUnit,rf?.numeratorDefinition,rf?.denominatorDefinition,...inputs.map(x=>x?.name)].filter(Boolean).join(' ');
 return /(終了画面|画面|トロフィ|スタンプ|ボイス|セリフ|獲得枚数|示唆|キャラ紹介|エンディング|裏ボタン)/.test(text);
}
function safeId(s){return String(s).replace(/[^A-Z0-9_]/gi,'_').replace(/_+/g,'_');}
let created=0;
for(const id of IDS){
 const dir=path.join(ROOT,'research',id), op=path.join(dir,'machine-observation-data.json');
 if(fs.existsSync(op)){console.log(`${id}: already exists`);continue;}
 const research=read(path.join(dir,'research-data.json'));
 const selection=read(path.join(dir,'selection-data.json'));
 const cat=catById.get(id)??{}; const reg=regById.get(id)??{};
 const rfs=new Map((research.features??[]).map(x=>[x.researchFeatureId,x]));
 const inputs=new Map((selection.inputs??[]).map(x=>[x.id,x]));
 const sources=(research.sources??[]).map(s=>({...s}));
 const service=serviceEvidence[id];
 if(service) sources.push({sourceId:'SRC_LINKED_SERVICE_CONFIRM',publisher:service.publisher,title:service.title,url:service.url,checkedAt:'2026-09-12',sourceType:'official'});
 const observations=[]; const featureMappings=[];
 let n=0;
 for(const f of (selection.features??[]).filter(x=>ADOPTED.has(x.adoptionCategory))){
   n++; const rf=rfs.get(f.researchFeatureId); const refs=inputRefs(f); const inps=refs.map(x=>inputs.get(x)).filter(Boolean);
   const visual=endLike(f.featureId,rf,inps);
   const obsId=`OBS_${String(n).padStart(3,'0')}_${safeId(f.featureId.replace(/^FEAT_/,''))}`;
   observations.push({
     observationId:obsId,
     sourceType:visual?'END_EVENT':'DIRECT_PLAY',
     observationMode:visual?'VISUAL_EVENT':'MANUAL_COUNTER',
     status:'FOUND',
     label:rf?.name??inps[0]?.name??f.featureId,
     categories:inps.map(x=>x.name).filter(Boolean),
     numeratorDefinition:rf?.numeratorDefinition??(inps.find(x=>x.id===f.numeratorInputId)?.name??null),
     denominatorDefinition:rf?.denominatorDefinition??(inps.find(x=>x.id===f.denominatorInputId)?.name??null),
     acquisitionUnit:rf?.trialUnit??null,
     targetState:rf?.trialUnit??null,
     timing:[visual?'該当画面・表示・演出が発生した時':'該当事象の成立・結果確定時に更新'],
     excludedConditions:Array.isArray(rf?.conditions?.excluded)?rf.conditions.excluded:[],
     resetCondition:'実戦セッション開始時に0へリセット',
     previousPlayerUsable:false,
     ownSessionUsable:true,
     definitionEquality:'EXACT_WITH_PUBLIC_RESEARCH_DEFINITION',
     sourceRefs:rf?.sourceRefs??[],
     notes:'ResearchDataの公開定義とSelectionDataの採用契約を変えずに観測する。未観測は空欄、観測して0回は0として扱う。'
   });
   featureMappings.push({featureId:f.featureId,mappingType:'EXACT',observationIds:[obsId],collectionMethods:[visual?'VISUAL_EVENT':'MANUAL_COUNTER'],usableForInference:true,usableForDifficulty:f.difficultyParticipation!=='EXCLUDE',primaryObservationId:obsId,fallbackObservationIds:[],fallbackConsidered:true,fallbackReason:'公開定義と同一母集団を保証できる別経路が確認できないため、推測でFallbackを追加しない。'});
 }
 for(const input of selection.inputs??[]){
   if(input.type!=='multi_enum' || !String(input.category??'').includes('EVIDENCE')) continue;
   const obsId=`OBS_EVI_${safeId(input.id)}`;
   observations.push({observationId:obsId,sourceType:'END_EVENT',observationMode:'VISUAL_EVENT',status:'FOUND',label:input.name,categories:(input.options??[]).map(x=>x.label).filter(Boolean),timing:['該当画面・表示・演出が発生した時'],excludedConditions:[],sourceRefs:[],notes:'確認できた示唆だけを記録し、未出現を低設定方向の情報として扱わない。'});
 }
 const out={
  schemaVersion:'machine-observation-data-v2',machineId:id,displayName:research.machine?.displayName??cat.displayName??id,
  provisionalRegistrationId:reg.provisionalRegistrationId??null,registrationId:reg.registrationId??null,releaseDate:reg.releaseDate??cat.introductionDate??null,researchedAt:'2026-09-12',
  sources,sourceCoverage:{machineMenu:'UNRESOLVED',dataCounter:'UNRESOLVED',linkedService:'UNRESOLVED',directPlay:'FOUND',endEvent:observations.some(x=>x.sourceType==='END_EVENT')?'FOUND':'CHECKED_NONE',seatedState:'UNRESOLVED'},
  observations,featureMappings,researchReopenRequests:[],fieldVerificationItems:[],
  linkedService:service?{service:service.service,status:'CONFIRMED_SERVICE_ONLY',notes:'公式対応機種一覧/公式マイスロ告知で対応自体は確認。取得できる具体項目は公開ページだけでは確定できないため、Primary観測経路には採用しない。'}:{service:null,status:'UNRESOLVED',notes:'メーカー系列から連動機能の有無を推定しない。公開情報で具体項目まで確証できるまではPrimary観測経路に採用しない。'},
  observationContract:{naturalSharedDenominator:true,duplicateTrialInputForbidden:true,selectionReopenOnDefinitionMismatch:true}
 };
 write(op,out); created++;
 console.log(`${id}: reconstructed ${featureMappings.length} feature mapping(s), ${observations.length} observation(s)`);
}
console.log(`Created ${created} missing Observation file(s).`);