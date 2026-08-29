import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');
const ACTIVE=new Set(['INCLUDE_PRIMARY','INCLUDE_SUPPORT','INCLUDE_FALLBACK']);
const configs=[
 {machineId:'L_MONKEY_TURN5_CE',predFeatureId:'FEAT_AT_PREDECESSOR',predInputs:['INP_SEATED_GAMES','INP_SEATED_AT_COUNT'],displayName:'スマスロ モンキーターンV',linked:'UNRESOLVED'},
 {machineId:'L_HIGURASHI_GOU_SS',predFeatureId:'FEAT_BONUS_PREDECESSOR',predInputs:['INP_SEATED_GAMES','INP_SEATED_BONUS_COUNT'],displayName:'L ひぐらしのなく頃に 業',linked:'UNRESOLVED'},
 {machineId:'L_HOKUTO_AD_XR',predFeatureId:'FEAT_AT_INITIAL_PREDECESSOR',predInputs:['INP_SEATED_GAMES','INP_SEATED_BB_COUNT'],displayName:'スマスロ北斗の拳',linked:'FOUND'},
 {machineId:'L_KING_PULSAR_SLCC',predFeatureId:'FEAT_PREDECESSOR_BONUS',predInputs:['INP_PREDECESSOR_GAMES','INP_PREDECESSOR_BIG','INP_PREDECESSOR_REG'],displayName:'スマスロキングパルサー',linked:'UNRESOLVED'},
 {machineId:'L_HANABI_KM',predFeatureId:'FEAT_PREDECESSOR_BONUS_OUTCOME',predInputs:['INP_PREDECESSOR_GAMES','INP_PREDECESSOR_BIG_COUNT','INP_PREDECESSOR_REG_COUNT'],displayName:'スマスロ ハナビ（未調査版）',linked:'UNRESOLVED'}
];
function referencedInputs(f){
 const ids=[f.numeratorInputId,f.denominatorInputId,f.trialCountInputId,f.conditionedOnInputId,...(f.categoryInputIds??[]),...(f.denominatorInputIds??[]),...(f.optionalCategoryInputIds??[])].filter(Boolean);
 if(f.categorySubtractInputIds) for(const [k,v] of Object.entries(f.categorySubtractInputIds)){ids.push(k,...(v??[]));}
 return [...new Set(ids)];
}
function suppressPredecessor(s,c){
 for(const id of c.predInputs){const i=s.inputs.find(x=>x.id===id); if(i)i.inferenceRole='EXCLUDE';}
 const f=s.features.find(x=>x.featureId===c.predFeatureId); if(!f)throw new Error(`${c.machineId}: missing ${c.predFeatureId}`);
 for(const k of Object.keys(f)) if(!['researchFeatureId','featureId'].includes(k)) delete f[k];
 f.adoptionCategory='EXCLUDE';
 f.rejectionReason='機種固有の着席時データの取得元と公開確率の試行区間との同値性が実機未確認のため、確認完了まで推測には使用しません。';
 f.userReason='着席時入力欄は記録用として残しますが、機種固有の実機確認完了まで前任者Featureは推測不参加とします。';
}
function buildObservation(s,c){
 const inputById=new Map(s.inputs.map(x=>[x.id,x]));
 const active=s.features.filter(f=>ACTIVE.has(f.adoptionCategory));
 const observations=[]; const featureMappings=[];
 for(const f of active){
  const ids=referencedInputs(f); if(!ids.length) throw new Error(`${c.machineId}/${f.featureId}: no observation inputs`);
  const inputs=ids.map(id=>inputById.get(id)).filter(Boolean);
  if(inputs.length!==ids.length) throw new Error(`${c.machineId}/${f.featureId}: missing input definition`);
  const oid=`OBS_${f.featureId.replace(/^FEAT_/,'').replace(/[^A-Z0-9_]/g,'_')}`;
  const cats=inputs.map(i=>i.name??i.id);
  observations.push({observationId:oid,sourceType:'DIRECT_PLAY',observationMode:'MANUAL_OR_LINKED_READ',status:'FOUND',label:cats.join('・'),categories:cats,timing:['自己実戦の該当条件中'],excludedConditions:['着席前の累積値を混ぜない','未取得の任意入力を観測済み0として扱わない'],sourceRefs:[],notes:`SelectionData ${f.featureId} の入力契約をそのまま観測する。分子・分母・条件付き試行の定義を別のゲーム数へ置換しない。`});
  featureMappings.push({featureId:f.featureId,mappingType:(f.inputTransform||f.denominatorInputIds||f.categorySubtractInputIds)?'COMBINABLE':'EXACT',observationIds:[oid],collectionMethods:['MANUAL_OR_LINKED_READ'],usableForInference:true,usableForDifficulty:f.difficultyParticipation==='INCLUDE',notes:'SelectionDataの既存分子・分母・カテゴリ契約を保持する。'});
 }
 if(s.evidenceUi?.groups?.length){observations.push({observationId:'OBS_SETTING_EVIDENCE',sourceType:'END_EVENT',observationMode:'VISUAL_CONFIRMATION',status:'FOUND',label:'設定確定・設定下限Evidence',categories:s.evidenceUi.groups.map(g=>g.label??g.groupId),timing:['該当示唆を実際に確認した時'],excludedConditions:['未確認を非発生とみなさない'],sourceRefs:[]});}
 return {schemaVersion:'machine-observation-data-v2',machineId:c.machineId,displayName:c.displayName,researchedAt:'2026-08-29',sources:[],sourceCoverage:{machineMenu:'UNRESOLVED',dataCounter:'UNRESOLVED',linkedService:c.linked,directPlay:'FOUND',endEvent:s.evidenceUi?.groups?.length?'FOUND':'UNRESOLVED',seatedState:'UNRESOLVED'},observations,featureMappings,researchReopenRequests:[],fieldVerificationItems:[{verificationId:`VFY_${c.machineId}_PREDECESSOR`,status:'WAITING_FOR_MACHINE',sourceType:'SEATED_STATE',priority:'HIGH',question:`${c.displayName}で、着席時データの取得元と公開確率の試行区間が同値か実機確認する。確認完了まで${c.predFeatureId}は推測不参加とする。`},{verificationId:`VFY_${c.machineId}_SOURCE_FIELDS`,status:'WAITING_FOR_MACHINE',sourceType:'MACHINE_MENU',priority:'LOW',question:'筐体メニュー・データカウンター・実機連動機能で取得できる具体項目を確認する。現行の自己実戦FeatureはSelectionDataの直接観測契約で成立する。'}]};
}
for(const c of configs){
 const sp=`research/${c.machineId}/selection-data.json`,op=`research/${c.machineId}/machine-observation-data.json`; const s=read(sp);
 suppressPredecessor(s,c); write(sp,s); write(op,buildObservation(s,c)); console.log('migrated',c.machineId);
}
const ap='tools/audit-selection-policy-migration.mjs'; let a=fs.readFileSync(ap,'utf8');
const additions={
 L_MONKEY_TURN5_CE:['FEAT_AT_PREDECESSOR','機種固有の着席時通常ゲーム数・SGラッシュ回数の観測元と試行区間同値性が実機未確認のため、確認完了まで前任者Featureを推測不参加とした。'],
 L_HIGURASHI_GOU_SS:['FEAT_BONUS_PREDECESSOR','機種固有の着席時ゲーム数・ボーナス回数の観測元と試行区間同値性が実機未確認のため、確認完了まで前任者Featureを推測不参加とした。'],
 L_HOKUTO_AD_XR:['FEAT_AT_INITIAL_PREDECESSOR','機種固有の着席時ゲーム数・BB初当り回数の観測元と試行区間同値性が実機未確認のため、確認完了まで前任者Featureを推測不参加とした。'],
 L_KING_PULSAR_SLCC:['FEAT_PREDECESSOR_BONUS','機種固有の着席時ゲーム数・BIG・REGの観測元と試行区間同値性が実機未確認のため、確認完了まで前任者Featureを推測不参加とした。'],
 L_HANABI_KM:['FEAT_PREDECESSOR_BONUS_OUTCOME','機種固有の着席時ゲーム数・BIG・REGの観測元と試行区間同値性が実機未確認のため、確認完了まで前任者Featureを推測不参加とした。']
};
const close='\n};\n\nfunction reviewActiveSetDiff'; let block=''; for(const [id,[fid,reason]] of Object.entries(additions)) block+=`,\n  ${id}:{featureIds:['${fid}'],reason:'${reason}'}`;
if(!a.includes('L_MONKEY_TURN5_CE:{')) a=a.replace(close,block+'\n};\n\nfunction reviewActiveSetDiff'); fs.writeFileSync(ap,a);
const tp='test/selection-policy-migration-audit.test.mjs'; let t=fs.readFileSync(tp,'utf8'); t=t.replace('reviewedSafetyChanges,9','reviewedSafetyChanges,14');
const anchor="    L_KENGAN_ASHURA_ND:['FEAT_AT_PREDECESSOR'],"; let rows=''; for(const [id,[fid]] of Object.entries(additions)) rows+=`\n    ${id}:['${fid}'],`; if(!t.includes("L_MONKEY_TURN5_CE:['FEAT_AT_PREDECESSOR']"))t=t.replace(anchor,anchor+rows); fs.writeFileSync(tp,t);
console.log('batch migrated',configs.length);