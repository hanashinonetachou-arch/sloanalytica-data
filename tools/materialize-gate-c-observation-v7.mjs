import fs from 'node:fs';
import path from 'node:path';
import { validateObservationObject } from './validate-machine-observation-data.mjs';

const ROOT=process.cwd();
const BATCH='20260908-manifest-v7-first10';
const machineIds=['L_ANIMAL_SLOT_DOCCHI_ZT','L_BIG_DREAM_GOLDEN_PUSHER_KR','L_BIOHAZARD_RE3_ZD','L_TAKT_OP_DESTINY_M1','L_SUPER_RIO_ACE2_ND02H','L_BIRDIE_WING_BC','L_SAO2_PA1','L_SENGOKU_OTOME5_L8','L_DARK_HAIBI_SB','L_LOTIS_TN'];
const linked={
 L_BIG_DREAM_GOLDEN_PUSHER_KR:'マイスロ',L_TAKT_OP_DESTINY_M1:'打-WIN LITE',L_SUPER_RIO_ACE2_ND02H:'スロプラNEXT',L_BIRDIE_WING_BC:'ユニメモ',L_SAO2_PA1:'ダイトモ',L_SENGOKU_OTOME5_L8:'打-WIN LITE'
};
const unresolvedFeatureIds=new Set([
 'L_BIOHAZARD_RE3_ZD/FEAT_HEARTBEAT_DOWN','L_BIOHAZARD_RE3_ZD/FEAT_WEAK_RARE_CZ_BY_STATE','L_BIOHAZARD_RE3_ZD/FEAT_STRONG_RARE_AT_DIRECT_BY_STATE',
 'L_SUPER_RIO_ACE2_ND02H/FEAT_ACE_MODE',
 'L_LOTIS_TN/FEAT_MODE_BONUS_MORNING','L_LOTIS_TN/FEAT_MODE_BONUS_CHANCE','L_LOTIS_TN/FEAT_MODE_BONUS_NORMAL','L_LOTIS_TN/FEAT_MODE_BONUS_RETURN_A','L_LOTIS_TN/FEAT_MODE_BONUS_RETURN_B'
]);
const linkedDebt=new Set(['L_BIRDIE_WING_BC','L_SAO2_PA1']);
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const clean=s=>String(s??'').replace(/[^A-Z0-9_]/g,'_');
const report=[]; let errors=[];
for(const id of machineIds){
 const dir=path.join(ROOT,'research',id), research=read(path.join(dir,'research-data.json')), sel=read(path.join(dir,'selection-data.json'));
 const featureById=new Map((research.features??[]).map(r=>[`FEAT_${clean(r.researchFeatureId.replace(/^RF_/,''))}`,r]));
 const observations=[], mappings=[], reopen=[], verify=[];
 let n=1;
 for(const f of (sel.features??[]).filter(x=>String(x.adoptionCategory??'').startsWith('INCLUDE'))){
   const rf=featureById.get(f.featureId); if(!rf){errors.push(`${id}: missing Research feature for ${f.featureId}`);continue;}
   const unresolved=unresolvedFeatureIds.has(`${id}/${f.featureId}`);
   const obsId=`OBS_${String(n++).padStart(3,'0')}_${clean(f.featureId.replace(/^FEAT_/,''))}`;
   const isMulti=rf.candidateModel==='multinomial';
   observations.push({
     observationId:obsId,
     sourceType:'DIRECT_PLAY',
     observationMode:isMulti?'MANUAL_COUNTER':'MANUAL_COUNTER',
     status:unresolved?'UNRESOLVED':'FOUND',
     label:rf.name,
     categories:isMulti?(rf.categories??[]):[],
     numeratorDefinition:rf.numeratorDefinition??'カテゴリ別観測回数',
     denominatorDefinition:rf.denominatorDefinition??rf.trialUnit??'対象試行回数',
     acquisitionUnit:rf.trialUnit??'1試行',
     targetState:rf.trialUnit??'',
     timing:['該当事象の成立・結果確定時に更新'],
     excludedConditions:[],
     resetCondition:'実戦セッション開始時に0へリセット',
     previousPlayerUsable:false,
     ownSessionUsable:true,
     definitionEquality:unresolved?'UNRESOLVED':'EXACT_WITH_PUBLIC_RESEARCH_DEFINITION',
     sourceRefs:rf.sourceRefs??[],
     notes:unresolved?'公開確率の条件となる内部状態を実戦中に一意に識別できるか未確認。観測可能と仮定しない。':'ResearchDataの分子・分母・条件を変更せず手動観測するPrimary経路。'
   });
   mappings.push({featureId:f.featureId,mappingType:unresolved?'UNRESOLVED':'EXACT',observationIds:[obsId],collectionMethods:['MANUAL_COUNTER'],usableForInference:!unresolved,usableForDifficulty:!unresolved,primaryObservationId:obsId,fallbackObservationIds:[]});
   if(unresolved){
     reopen.push({requestId:`RR_${clean(f.featureId)}`,status:'RESEARCH_REOPEN_REQUIRED',reason:`${rf.name}: 公開値の母集団となる内部状態をプレイヤーが正確に識別可能か未確認。正確に観測できなければSelectionの採用を再評価する。`,featureId:f.featureId});
     verify.push({verificationId:`FV_${clean(f.featureId)}`,status:'WAITING_FOR_MACHINE',sourceType:'DIRECT_PLAY',priority:'HIGH',question:`${rf.name}の分母条件となる状態を、通常遊技中に曖昧さなく判別・カウントできるか。`});
   }
 }
 // Evidence is observed directly at the event; no probabilistic feature mapping required.
 for(const g of sel.evidenceUi?.groups??[]){
   const obsId=`OBS_EVI_${clean(g.groupId)}`;
   observations.push({observationId:obsId,sourceType:'END_EVENT',observationMode:'VISUAL_EVENT',status:'FOUND',label:g.label,categories:(g.options??[]).map(o=>o.label),timing:['該当画面・表示・演出の発生時'],excludedConditions:[],sourceRefs:[],notes:'Evidenceは確率Featureと分離して観測する。'});
 }
 const hasLinked=Boolean(linked[id]);
 if(hasLinked){
   verify.push({verificationId:`FV_LINKED_${clean(id)}`,status:linkedDebt.has(id)?'WAITING_FOR_MACHINE':'NOT_REQUIRED',sourceType:'LINKED_SERVICE',priority:linkedDebt.has(id)?'HIGH':'MEDIUM',question:`${linked[id]}でこの機種固有に取得できる項目一覧と、Research/Selectionの分子・分母へ完全一致する項目を確認する。`});
 }
 const data={
  schemaVersion:'machine-observation-data-v2',machineId:id,displayName:research.machine.displayName,provisionalRegistrationId:null,registrationId:null,releaseDate:null,researchedAt:'2026-09-08',
  sources:(research.sources??[]).map(s=>({sourceId:s.sourceId,publisher:s.publisher,title:s.title,url:s.url})),
  sourceCoverage:{machineMenu:'CHECKED_NONE',dataCounter:'CHECKED_NONE',linkedService:hasLinked?(linkedDebt.has(id)?'UNRESOLVED':'FOUND'):'CHECKED_NONE',directPlay:'FOUND',endEvent:(sel.evidenceUi?.groups??[]).length?'FOUND':'CHECKED_NONE',seatedState:'CHECKED_NONE'},
  observations,featureMappings:mappings,researchReopenRequests:reopen,fieldVerificationItems:verify,
  linkedService:hasLinked?{service:linked[id],status:linkedDebt.has(id)?'UNRESOLVED':'FOUND',notes:linkedDebt.has(id)?'サービス対応は確認済みだが機種固有の完全フィールド一覧が未解決。':'公開情報で具体的取得項目または設定示唆確認経路を確認済み。'}:{service:null,status:'CHECKED_NONE'},
  observationContract:{naturalSharedDenominator:true,duplicateTrialInputForbidden:true,selectionReopenOnDefinitionMismatch:true}
 };
 const v=validateObservationObject(data,`${id}/machine-observation-data.json`); if(!v.ok)errors.push(...v.errors);
 fs.writeFileSync(path.join(dir,'machine-observation-data.json'),JSON.stringify(data,null,2)+'\n');
 report.push({machineId:id,adoptedFeatures:mappings.length,exactMappings:mappings.filter(x=>x.mappingType==='EXACT').length,unresolvedMappings:mappings.filter(x=>x.mappingType==='UNRESOLVED').length,researchReopenRequests:reopen.length,linkedService:hasLinked?linked[id]:null,linkedServiceDebt:linkedDebt.has(id),validator:v.ok?'PASS':'FAIL'});
}
const out={schemaVersion:'gate-c-observation-draft-report-v1',batchId:BATCH,status:errors.length?'BLOCKED':'DRAFT_READY',machines:report,errors,summary:{machines:10,validatorPass:report.filter(x=>x.validator==='PASS').length,exactMappings:report.reduce((a,x)=>a+x.exactMappings,0),unresolvedMappings:report.reduce((a,x)=>a+x.unresolvedMappings,0),researchReopenRequests:report.reduce((a,x)=>a+x.researchReopenRequests,0),linkedServiceDebt:report.filter(x=>x.linkedServiceDebt).length}};
fs.writeFileSync(path.join(ROOT,'batches',BATCH,'gate-c-observation-draft-report.json'),JSON.stringify(out,null,2)+'\n');
console.log(`GATE C DRAFT ${out.status}`,JSON.stringify(out.summary));
if(errors.length){for(const e of errors)console.error(e);process.exit(1);}
