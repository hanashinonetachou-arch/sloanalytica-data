import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8')); const write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');
const ACTIVE=new Set(['INCLUDE_PRIMARY','INCLUDE_SUPPORT','INCLUDE_FALLBACK']);
const machineIds=['L_CHIBARIYO2_ZB','L_CODE_GEASS_REVIVAL_ZS','L_D4DJ_KB','L_GEGEGE_NO_KITARO_KAKUSEI_JC','L_KARAKURI_CIRCUS_G','L_KINNIKUMAN4_SLDC','L_LOVEKYURE2_PS','L_NANGOKU_SODACHI_S3','L_NOGIZAKA46_UD'];
function refs(f){const ids=[f.numeratorInputId,f.denominatorInputId,f.trialCountInputId,f.conditionedOnInputId,...(f.categoryInputIds??[]),...(f.denominatorInputIds??[]),...(f.optionalCategoryInputIds??[])].filter(Boolean);if(f.categorySubtractInputIds)for(const [k,v] of Object.entries(f.categorySubtractInputIds)){ids.push(k,...(v??[]));}return [...new Set(ids)];}
function cov(v){return v==='CHECKED'?'FOUND':'UNRESOLVED';}
for(const mid of machineIds){
 const sp=`research/${mid}/selection-data.json`,op=`research/${mid}/machine-observation-data.json`; const s=read(sp),old=read(op),byId=new Map((s.inputs??[]).map(i=>[i.id,i]));
 if(old.schemaVersion!=='machine-observation-data-v1')throw new Error(`${mid}: not v1`);
 const active=(s.features??[]).filter(f=>ACTIVE.has(f.adoptionCategory)); if(!active.length)throw new Error(`${mid}: no active features`);
 const observations=[],featureMappings=[];
 for(const f of active){
  const ids=refs(f),inputs=ids.map(id=>byId.get(id)).filter(Boolean); if(!ids.length||inputs.length!==ids.length)throw new Error(`${mid}/${f.featureId}: unresolved inputs`);
  if(inputs.some(i=>i.category==='PREDECESSOR'||i.observationScope==='PREDECESSOR_SNAPSHOT'||i.sessionDifferenceHelper===true))throw new Error(`${mid}/${f.featureId}: unsafe source dependency`);
  const oid=`OBS_${f.featureId.replace(/^FEAT_/,'').replace(/[^A-Z0-9_]/g,'_')}`,cats=inputs.map(i=>i.name??i.id);
  observations.push({observationId:oid,sourceType:'DIRECT_PLAY',observationMode:'MANUAL_OR_LINKED_READ',status:'FOUND',label:cats.join('・'),categories:cats,timing:['自己実戦の該当条件中'],excludedConditions:['着席前の累積値を混ぜない','条件外ゲームを分母に混ぜない','未取得の任意入力を観測済み0として扱わない'],sourceRefs:[],notes:`SelectionData ${f.featureId} の既存入力契約を保持する。分子・分母・カテゴリ・条件付き試行を別の観測へ置換しない。`});
  featureMappings.push({featureId:f.featureId,mappingType:(f.inputTransform||f.denominatorInputIds||f.categorySubtractInputIds)?'COMBINABLE':'EXACT',observationIds:[oid],collectionMethods:['MANUAL_OR_LINKED_READ'],usableForInference:true,usableForDifficulty:f.difficultyParticipation==='INCLUDE',notes:'SelectionDataの既存試行宇宙を1対1でObservationへ固定する。'});
 }
 if(s.evidenceUi?.groups?.length)observations.push({observationId:'OBS_SETTING_EVIDENCE',sourceType:'END_EVENT',observationMode:'VISUAL_CONFIRMATION',status:'FOUND',label:'設定確定・設定下限Evidence',categories:s.evidenceUi.groups.map(g=>g.label??g.groupId),timing:['該当示唆を実際に確認した時'],excludedConditions:['未確認を非発生とみなさない'],sourceRefs:[]});
 write(op,{schemaVersion:'machine-observation-data-v2',machineId:mid,displayName:old.displayName??mid,researchedAt:'2026-08-29',sources:old.sources??[],sourceCoverage:{machineMenu:cov(old.machineMenu?.status),dataCounter:'UNRESOLVED',linkedService:cov(old.linkedService?.status),directPlay:'FOUND',endEvent:s.evidenceUi?.groups?.length?'FOUND':'UNRESOLVED',seatedState:'UNRESOLVED'},observations,featureMappings,researchReopenRequests:[],fieldVerificationItems:[{verificationId:`VFY_${mid}_SOURCE_FIELDS`,status:'WAITING_FOR_MACHINE',sourceType:'MACHINE_MENU',priority:'LOW',question:'筐体メニュー・データカウンター・実機連動機能で取得できる具体項目を確認する。現行active Featureは自己実戦の直接観測契約で成立する。'}]});
 console.log('migrated',mid,active.length);
}
console.log('batch migrated',machineIds.length);