import fs from 'node:fs';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');

const mid='LB_AREX_BRIGHT_BA';
const sp=`research/${mid}/selection-data.json`;
const op=`research/${mid}/machine-observation-data.json`;

const s=read(sp);
for(const id of ['INP_PREDECESSOR_GAMES','INP_PREDECESSOR_BIG_COUNT','INP_PREDECESSOR_REG_COUNT']){
  const input=s.inputs.find(x=>x.id===id);
  if(input) input.inferenceRole='EXCLUDE';
}
const pred=s.features.find(x=>x.featureId==='FEAT_PREDECESSOR_BONUS_OUTCOME');
if(!pred) throw new Error('missing predecessor feature');
Object.keys(pred).forEach(k=>{ if(!['researchFeatureId','featureId'].includes(k)) delete pred[k]; });
pred.adoptionCategory='EXCLUDE';
pred.rejectionReason='この機種固有の着席時ゲーム数・BIG・REGを同一区間として観測できることが実機未確認のため、確認完了まで推測には使用しません。';
pred.userReason='着席時入力欄は記録用として残しますが、観測元の実機確認完了まで前任者Featureは推測不参加とします。';
write(sp,s);

const o={
  schemaVersion:'machine-observation-data-v2',
  machineId:mid,
  displayName:'アレックス ブライト（未調査版）',
  researchedAt:'2026-08-29',
  sources:[],
  sourceCoverage:{machineMenu:'UNRESOLVED',dataCounter:'UNRESOLVED',linkedService:'UNRESOLVED',directPlay:'FOUND',endEvent:'FOUND',seatedState:'UNRESOLVED'},
  observations:[
    {observationId:'OBS_SELF_NORMAL_OUTCOME',sourceType:'DIRECT_PLAY',observationMode:'MANUAL_COUNT',status:'FOUND',label:'自己実戦の通常ゲーム・BIG・REG・羽',categories:['通常ゲーム数','BIG','REG','羽'],timing:['自己実戦中'],excludedConditions:['着席前の累積値を混ぜない','羽を未計測の場合は0回と扱わない','BrighTループ追加小役ゲームを新たな通常時BIGとして数えない'],sourceRefs:[],notes:'BIG・REG・羽は同じ自己実戦通常ゲーム母集団で観測する。羽は任意入力で、空欄は未観測。'},
    {observationId:'OBS_REG_END_MURAL',sourceType:'END_EVENT',observationMode:'VISUAL_CONFIRMATION',status:'FOUND',label:'REG終了画面 壁画調ver.',categories:['壁画調ver.','その他'],timing:['REG終了時'],excludedConditions:['REG未発生時を試行に含めない','未確認を0回として扱わない'],sourceRefs:[],notes:'REG1回を1試行として壁画調ver.出現回数を数える。'}
  ],
  featureMappings:[
    {featureId:'FEAT_NORMAL_OUTCOME',mappingType:'EXACT',observationIds:['OBS_SELF_NORMAL_OUTCOME'],collectionMethods:['MANUAL_COUNT'],usableForInference:true,usableForDifficulty:true,notes:'通常ゲーム数を分母にBIG・REG・任意の羽を同一母集団で評価する。'},
    {featureId:'FEAT_REG_END_MURAL',mappingType:'EXACT',observationIds:['OBS_REG_END_MURAL'],collectionMethods:['VISUAL_CONFIRMATION'],usableForInference:true,usableForDifficulty:true,notes:'REG回数を分母、壁画調ver.出現回数を分子とする条件付きFeature。'}
  ],
  researchReopenRequests:[],
  fieldVerificationItems:[
    {verificationId:'VFY_AREX_PREDECESSOR_COUNTER',status:'WAITING_FOR_MACHINE',sourceType:'SEATED_STATE',priority:'HIGH',question:'この機種固有のデータカウンターで、着席時ゲーム数・BIG・REGを同一区間として観測できるか確認する。確認完了まで前任者Featureは推測不参加とする。'},
    {verificationId:'VFY_AREX_LINKED_SERVICE',status:'WAITING_FOR_MACHINE',sourceType:'LINKED_SERVICE',priority:'LOW',question:'機種固有の実機連動機能の有無と、通常ゲーム数・羽・BIG中項目など取得可能項目を確認する。未確認項目をactive Featureの自動取得扱いにしない。'}
  ]
};
write(op,o);

const auditPath='tools/audit-selection-policy-migration.mjs';
let audit=fs.readFileSync(auditPath,'utf8');
const needle="  LB_MAGICAL_HALLOWEEN_GS:{featureIds:['FEAT_PREDECESSOR_BONUS_OUTCOME'],reason:'機種固有の着席時ゲーム数・BIG・REGの観測元が実機未確認のため、確認完了まで前任者Featureを推測不参加とした。'}";
if(!audit.includes('LB_AREX_BRIGHT_BA:{')){
  if(!audit.includes(needle)) throw new Error('audit insertion anchor missing');
  audit=audit.replace(needle,needle+",\n  LB_AREX_BRIGHT_BA:{featureIds:['FEAT_PREDECESSOR_BONUS_OUTCOME'],reason:'機種固有の着席時ゲーム数・BIG・REGの観測元が実機未確認のため、確認完了まで前任者Featureを推測不参加とした。'}");
  fs.writeFileSync(auditPath,audit);
}

const testPath='test/selection-policy-migration-audit.test.mjs';
let t=fs.readFileSync(testPath,'utf8');
t=t.replace('assert.equal(r.summary.reviewedSafetyChanges,4);','assert.equal(r.summary.reviewedSafetyChanges,5);');
t=t.replace("const expected=['LB_CREA_BONUS_TRIGGER_A2','LB_MAGICAL_HALLOWEEN_GS','S_NEO_IM_JUGGLER_EX_KK','S_ULTRA_MIRACLE_JUGGLER_KT'];","const expected=['LB_AREX_BRIGHT_BA','LB_CREA_BONUS_TRIGGER_A2','LB_MAGICAL_HALLOWEEN_GS','S_NEO_IM_JUGGLER_EX_KK','S_ULTRA_MIRACLE_JUGGLER_KT'];");
fs.writeFileSync(testPath,t);

console.log('migrated',mid);
