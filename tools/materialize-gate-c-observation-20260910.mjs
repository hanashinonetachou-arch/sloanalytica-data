import fs from 'node:fs';
import path from 'node:path';
import { validateObservationObject } from './validate-machine-observation-data.mjs';

const ROOT=process.cwd();
const BATCH='20260910-next10-v7';
const ids=['L_YABACHIBA_ZM','L_NANGOKU_SPECIAL_M1','L_SENGOKU_COLLECTION6_KS','L_KARAKURI_CIRCUS2_JG','L_ULTRAMAN_FINAL_BATTLE_ME','L_WORLD_DAI_STAR_PA3','L_YAJIKITA_MAIRU_BG','L_TONDEMO_SKILL_KM','LB_TRIPLE_CROWN_X300','L_TOARU_INDEX2_FA'];
const regIds={L_YABACHIBA_ZM:270,L_NANGOKU_SPECIAL_M1:271,L_SENGOKU_COLLECTION6_KS:272,L_KARAKURI_CIRCUS2_JG:273,L_ULTRAMAN_FINAL_BATTLE_ME:274,L_WORLD_DAI_STAR_PA3:275,L_YAJIKITA_MAIRU_BG:276,L_TONDEMO_SKILL_KM:277,LB_TRIPLE_CROWN_X300:278,L_TOARU_INDEX2_FA:279};
const release={L_YABACHIBA_ZM:'2026-07-06',L_NANGOKU_SPECIAL_M1:'2026-07-06',L_SENGOKU_COLLECTION6_KS:'2026-07-06',L_KARAKURI_CIRCUS2_JG:'2026-07-06',L_ULTRAMAN_FINAL_BATTLE_ME:'2026-07-06',L_WORLD_DAI_STAR_PA3:'2026-08-03',L_YAJIKITA_MAIRU_BG:'2026-08-03',L_TONDEMO_SKILL_KM:'2026-08-03',LB_TRIPLE_CROWN_X300:'2026-08-03',L_TOARU_INDEX2_FA:'2026-08-03'};
const linked={
 L_SENGOKU_COLLECTION6_KS:{service:'e-slot+',items:['ゲーム数・ボーナス回数等の遊技記録'],status:'PARTIAL'},
 L_WORLD_DAI_STAR_PA3:{service:'ダイトモ',items:['総プレイ数・ボーナス回数等の遊技記録'],status:'PARTIAL'},
 L_YAJIKITA_MAIRU_BG:{service:'ユニメモ',items:['遊技結果','途中記録','5回前までのまいるテーブル履歴'],status:'PARTIAL'},
 L_TONDEMO_SKILL_KM:{service:'e-slot+',items:['ゲーム数・ボーナス回数等の遊技記録'],status:'PARTIAL'}
};
const uncertainLinked=new Set(['L_YABACHIBA_ZM','L_NANGOKU_SPECIAL_M1','L_KARAKURI_CIRCUS2_JG','L_ULTRAMAN_FINAL_BATTLE_ME','LB_TRIPLE_CROWN_X300','L_TOARU_INDEX2_FA']);
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const clean=s=>String(s??'').replace(/[^A-Z0-9_]/g,'_');
const reports=[]; let errors=[];
for(const id of ids){
 const dir=path.join(ROOT,'research',id); const research=read(path.join(dir,'research-data.json')); const sel=read(path.join(dir,'selection-data.json'));
 const rfById=new Map((research.features??[]).map(r=>[`FEAT_${clean(r.researchFeatureId.replace(/^RF_/,''))}`,r]));
 const observations=[],mappings=[],reopen=[],verify=[]; let n=1;
 for(const f of (sel.features??[]).filter(x=>String(x.adoptionCategory??'').startsWith('INCLUDE'))){
   const rf=rfById.get(f.featureId); if(!rf){errors.push(`${id}: missing Research feature for ${f.featureId}`);continue;}
   const obsId=`OBS_${String(n++).padStart(3,'0')}_${clean(f.featureId.replace(/^FEAT_/,''))}`;
   let excluded=[]; let notes='ResearchDataの分子・分母・条件を変えず直接観測する。';
   if(id==='L_WORLD_DAI_STAR_PA3'&&f.featureId==='FEAT_UPPER_ST_CLIMAX_OTHER'){
     excluded=['演目が「オペラ座の怪人」の上位ST終了は分母・分子の両方から除外','通常STの同名演出は対象外'];
     notes='上位ST終了ごとに演目を確認し、オペラ座の怪人以外だけを1試行として数える。';
   }
   if(id==='L_TOARU_INDEX2_FA'&&f.featureId==='FEAT_AT_DIRECT'){
     excluded=['天井到達によるAT当選は直撃回数に含めない','超レア小役によるAT当選は直撃回数に含めない'];
     notes='分母は通常ゲーム数。分子だけを公開定義どおり、天井到達・超レア小役によるAT当選を除外して数える。AT初当りのsubsetなのでFallbackとして独立二重加算しない。';
   }
   observations.push({observationId:obsId,sourceType:'DIRECT_PLAY',observationMode:'MANUAL_COUNTER',status:'FOUND',label:rf.name,categories:rf.candidateModel==='multinomial'?(rf.categories??[]):[],numeratorDefinition:rf.numeratorDefinition??'観測回数',denominatorDefinition:rf.denominatorDefinition??rf.trialUnit??'対象試行回数',acquisitionUnit:rf.trialUnit??'1試行',targetState:rf.trialUnit??'',timing:['該当事象の成立・結果確定時に更新'],excludedConditions:excluded,resetCondition:'実戦セッション開始時に0へリセット',previousPlayerUsable:false,ownSessionUsable:true,definitionEquality:'EXACT_WITH_PUBLIC_RESEARCH_DEFINITION',sourceRefs:rf.sourceRefs??[],notes});
   mappings.push({featureId:f.featureId,mappingType:'EXACT',observationIds:[obsId],collectionMethods:['MANUAL_COUNTER'],usableForInference:true,usableForDifficulty:true,primaryObservationId:obsId,fallbackObservationIds:[],fallbackConsidered:true,fallbackReason:'直接観測と同じ母集団を保証できる別経路が未確認のためFallback観測経路は設けない。'});
 }
 for(const g of sel.evidenceUi?.groups??[]){const obsId=`OBS_EVI_${clean(g.groupId)}`;observations.push({observationId:obsId,sourceType:'END_EVENT',observationMode:'VISUAL_EVENT',status:'FOUND',label:g.label,categories:(g.options??[]).map(o=>o.label),timing:['該当画面・表示・演出が発生した時'],excludedConditions:[],sourceRefs:[],notes:'出現したEvidenceだけを記録し、非出現を低設定方向のEvidenceとして扱わない。'});}
 const ls=linked[id];
 if(ls) verify.push({verificationId:`FV_LINKED_FIELDS_${clean(id)}`,status:'WAITING_FOR_MACHINE',sourceType:'LINKED_SERVICE',priority:'LOW',question:`${ls.service}で機種固有に表示される全取得項目を実機/サービス画面で確認する。公開確認済み項目: ${ls.items.join('、')}`});
 const data={schemaVersion:'machine-observation-data-v2',machineId:id,displayName:research.machine.displayName,provisionalRegistrationId:regIds[id],registrationId:null,releaseDate:release[id],researchedAt:'2026-09-11',sources:(research.sources??[]).map(s=>({sourceId:s.sourceId,publisher:s.publisher,title:s.title,url:s.url})),sourceCoverage:{machineMenu:'UNRESOLVED',dataCounter:'UNRESOLVED',linkedService:ls?'FOUND':(uncertainLinked.has(id)?'UNRESOLVED':'CHECKED_NONE'),directPlay:'FOUND',endEvent:(sel.evidenceUi?.groups??[]).length?'FOUND':'CHECKED_NONE',seatedState:'UNRESOLVED'},observations,featureMappings:mappings,researchReopenRequests:reopen,fieldVerificationItems:verify,linkedService:ls?{service:ls.service,status:'FOUND',concreteObtainableItems:ls.items,itemDiscoveryStatus:ls.status,notes:'機種対応は公開確認済み。完全な機種固有項目一覧は実機確認debtとして保持。'}:{service:null,status:'UNRESOLVED',notes:'機種単位の対応/非対応を確証できていない。メーカー系列からNONEを推定しない。'},observationContract:{naturalSharedDenominator:true,duplicateTrialInputForbidden:true,selectionReopenOnDefinitionMismatch:true}};
 const v=validateObservationObject(data,`${id}/machine-observation-data.json`); if(!v.ok) errors.push(...v.errors); fs.writeFileSync(path.join(dir,'machine-observation-data.json'),JSON.stringify(data,null,2)+'\n');
 reports.push({machineId:id,adoptedFeatures:mappings.length,exactMappings:mappings.length,unresolvedMappings:0,researchReopenRequests:0,linkedService:ls?.service??null,linkedServiceStatus:ls?'FOUND':'UNRESOLVED',validator:v.ok?'PASS':'FAIL'});
}
const out={schemaVersion:'gate-c-observation-draft-report-v1',batchId:BATCH,checkedAt:'2026-09-11T01:06:00+09:00',status:errors.length?'BLOCKED':'DRAFT_READY',machines:reports,errors,summary:{machines:10,validatorPass:reports.filter(x=>x.validator==='PASS').length,exactMappings:reports.reduce((a,x)=>a+x.exactMappings,0),unresolvedMappings:0,researchReopenRequests:0,linkedServiceFound:reports.filter(x=>x.linkedServiceStatus==='FOUND').length,linkedServiceUnresolved:reports.filter(x=>x.linkedServiceStatus==='UNRESOLVED').length},selectionReopen:{sengoku6ExcludedFeatures:['FEAT_ROBONYAN_DRIVE','FEAT_MUGEN_GIRI','FEAT_THREE_COLLECTION'],reason:'AT中出現率の厳密なtrial母集団を公開情報だけで再現できないため。低頻度を理由にした除外ではない。'},notes:['Observation draft intentionally does not convert unresolved linked-service status to CHECKED_NONE.','All currently included numeric Features have EXACT mappings after Toaru2 Research denominator correction and Sengoku6 Selection reopen.','World Dai Star upper-ST climax maps only when Opera House trials are explicitly excluded.']};
fs.writeFileSync(path.join(ROOT,'batches',BATCH,'gate-c-observation-draft-report.json'),JSON.stringify(out,null,2)+'\n'); console.log(`GATE C DRAFT ${out.status}`,JSON.stringify(out.summary)); if(errors.length){for(const e of errors)console.error(e);process.exit(1);}
