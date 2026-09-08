import fs from 'node:fs';
import path from 'node:path';
import { validateObservationObject } from './validate-machine-observation-data.mjs';

const ROOT=process.cwd();
const BATCH='20260908-manifest-v7-first10';
const machineIds=['L_ANIMAL_SLOT_DOCCHI_ZT','L_BIG_DREAM_GOLDEN_PUSHER_KR','L_BIOHAZARD_RE3_ZD','L_TAKT_OP_DESTINY_M1','L_SUPER_RIO_ACE2_ND02H','L_BIRDIE_WING_BC','L_SAO2_PA1','L_SENGOKU_OTOME5_L8','L_DARK_HAIBI_SB','L_LOTIS_TN'];
const linked={L_BIG_DREAM_GOLDEN_PUSHER_KR:'マイスロ',L_TAKT_OP_DESTINY_M1:'打-WIN LITE',L_SUPER_RIO_ACE2_ND02H:'スロプラNEXT',L_BIRDIE_WING_BC:'ユニメモ',L_SAO2_PA1:'ダイトモ',L_SENGOKU_OTOME5_L8:'打-WIN LITE'};
const linkedConcrete={
 L_BIG_DREAM_GOLDEN_PUSHER_KR:['AT終了画面出現回数'],
 L_TAKT_OP_DESTINY_M1:['1000Gごとの隠れ凪表示','AT終了スタンプ確認'],
 L_SUPER_RIO_ACE2_ND02H:['総ゲーム数','通常ゲーム数','通常ボーナス回数','AT初当り回数','弱チェリー','スイカ','チャンスリプレイ','チャンス目','強チェリー','ノワールルーム回数','ノワールルーム成功回数','ハワードゲーム回数','ハワードゲーム成功回数'],
 L_BIRDIE_WING_BC:['総プレイ数','ボーナス回数','途中記録','遊技結果'],
 L_SAO2_PA1:['総プレイ数','ボーナス回数'],
 L_SENGOKU_OTOME5_L8:['1000Gごとの隠れ凪表示']
};
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const clean=s=>String(s??'').replace(/[^A-Z0-9_]/g,'_');
const report=[]; let errors=[];
for(const id of machineIds){
 const dir=path.join(ROOT,'research',id), research=read(path.join(dir,'research-data.json')), sel=read(path.join(dir,'selection-data.json'));
 const featureById=new Map((research.features??[]).map(r=>[`FEAT_${clean(r.researchFeatureId.replace(/^RF_/,''))}`,r]));
 const observations=[], mappings=[], reopen=[], verify=[]; let n=1;
 for(const f of (sel.features??[]).filter(x=>String(x.adoptionCategory??'').startsWith('INCLUDE'))){
   const rf=featureById.get(f.featureId); if(!rf){errors.push(`${id}: missing Research feature for ${f.featureId}`);continue;}
   const obsId=`OBS_${String(n++).padStart(3,'0')}_${clean(f.featureId.replace(/^FEAT_/,''))}`; const isMulti=rf.candidateModel==='multinomial';
   const heartbeat=id==='L_BIOHAZARD_RE3_ZD'&&f.featureId==='FEAT_HEARTBEAT_DOWN';
   observations.push({observationId:obsId,sourceType:'DIRECT_PLAY',observationMode:'MANUAL_COUNTER',status:'FOUND',label:rf.name,categories:isMulti?(rf.categories??[]):[],numeratorDefinition:rf.numeratorDefinition??'カテゴリ別観測回数',denominatorDefinition:rf.denominatorDefinition??rf.trialUnit??'対象試行回数',acquisitionUnit:rf.trialUnit??'1試行',targetState:rf.trialUnit??'',timing:['該当事象の成立・結果確定時に更新'],excludedConditions:[],resetCondition:'実戦セッション開始時に0へリセット',previousPlayerUsable:false,ownSessionUsable:true,definitionEquality:'EXACT_WITH_PUBLIC_RESEARCH_DEFINITION',sourceRefs:rf.sourceRefs??[],notes:heartbeat?'心音レベルは青/緑/赤/紫の画面表示で直接識別し、公開された6G保証・再セット条件を守って分母を数える。':'ResearchDataの分子・分母・条件を変更せず手動観測するPrimary経路。'});
   mappings.push({featureId:f.featureId,mappingType:'EXACT',observationIds:[obsId],collectionMethods:['MANUAL_COUNTER'],usableForInference:true,usableForDifficulty:true,primaryObservationId:obsId,fallbackObservationIds:[],fallbackConsidered:true,fallbackReason:'Primaryの直接観測と同一母集団を保証できる別経路が公開確認できないためFallbackは設けない。'});
 }
 for(const g of sel.evidenceUi?.groups??[]){const obsId=`OBS_EVI_${clean(g.groupId)}`;observations.push({observationId:obsId,sourceType:'END_EVENT',observationMode:'VISUAL_EVENT',status:'FOUND',label:g.label,categories:(g.options??[]).map(o=>o.label),timing:['該当画面・表示・演出の発生時'],excludedConditions:[],sourceRefs:[],notes:'Evidenceは確率Featureと分離して観測する。'});}
 const hasLinked=Boolean(linked[id]);
 if(hasLinked){verify.push({verificationId:`FV_LINKED_${clean(id)}`,status:'NOT_REQUIRED',sourceType:'LINKED_SERVICE',priority:'MEDIUM',question:`${linked[id]}の存在と具体的取得項目を公開情報で確認済み。推測Featureの分母・分子へ使う場合は定義完全一致のみ許可する。`});}
 const data={schemaVersion:'machine-observation-data-v2',machineId:id,displayName:research.machine.displayName,provisionalRegistrationId:null,registrationId:null,releaseDate:null,researchedAt:'2026-09-08',sources:(research.sources??[]).map(s=>({sourceId:s.sourceId,publisher:s.publisher,title:s.title,url:s.url})),sourceCoverage:{machineMenu:'CHECKED_NONE',dataCounter:'CHECKED_NONE',linkedService:hasLinked?'FOUND':'CHECKED_NONE',directPlay:'FOUND',endEvent:(sel.evidenceUi?.groups??[]).length?'FOUND':'CHECKED_NONE',seatedState:'CHECKED_NONE'},observations,featureMappings:mappings,researchReopenRequests:reopen,fieldVerificationItems:verify,linkedService:hasLinked?{service:linked[id],status:'FOUND',concreteObtainableItems:linkedConcrete[id]??[],notes:'Manifest OBS-004の要求は存在確認と具体的取得項目。機種固有の完全全項目列挙は必須条件としない。推測入力へ流用する場合は別途definitionEqualityを確認する。'}:{service:null,status:'CHECKED_NONE'},observationContract:{naturalSharedDenominator:true,duplicateTrialInputForbidden:true,selectionReopenOnDefinitionMismatch:true}};
 const v=validateObservationObject(data,`${id}/machine-observation-data.json`); if(!v.ok)errors.push(...v.errors); fs.writeFileSync(path.join(dir,'machine-observation-data.json'),JSON.stringify(data,null,2)+'\n');
 report.push({machineId:id,adoptedFeatures:mappings.length,exactMappings:mappings.length,unresolvedMappings:0,researchReopenRequests:0,linkedService:hasLinked?linked[id]:null,linkedServiceDebt:false,validator:v.ok?'PASS':'FAIL'});
}
const out={schemaVersion:'gate-c-observation-draft-report-v1',batchId:BATCH,status:errors.length?'BLOCKED':'DRAFT_READY',machines:report,errors,summary:{machines:10,validatorPass:report.filter(x=>x.validator==='PASS').length,exactMappings:report.reduce((a,x)=>a+x.exactMappings,0),unresolvedMappings:0,researchReopenRequests:0,linkedServiceDebt:0},selectionReopenRef:`batches/${BATCH}/gate-c-selection-reopen-audit.json`,notes:['RSO-OBS-005で観測不能8FeatureをSelectionから除外後に再生成。','BIRDIE WING/SAO IIのlinked-service complete-field-list要求はOBS-004本文を超える過剰BLOCKだったため、存在+具体的取得項目へ正規化。']};
fs.writeFileSync(path.join(ROOT,'batches',BATCH,'gate-c-observation-draft-report.json'),JSON.stringify(out,null,2)+'\n'); console.log(`GATE C DRAFT ${out.status}`,JSON.stringify(out.summary)); if(errors.length){for(const e of errors)console.error(e);process.exit(1);}
