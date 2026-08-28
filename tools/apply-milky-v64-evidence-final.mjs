import fs from 'node:fs';

const researchPath='research/S_MILKY_HOMES_GNB/research-data.json';
const selectionPath='research/S_MILKY_HOMES_GNB/selection-data.json';
const obsPath='research/S_MILKY_HOMES_GNB/machine-observation-data.json';
const uiPath='research/S_MILKY_HOMES_GNB/ui-design-data.json';
const r=JSON.parse(fs.readFileSync(researchPath,'utf8'));
const s=JSON.parse(fs.readFileSync(selectionPath,'utf8'));

const addInput=(id,name,order)=>{ if(!s.inputs.some(i=>i.id===id)) s.inputs.push({id,name,category:'MMB_PANEL',type:'counter',unit:'回',displayOrder:order,inferenceRole:'INCLUDE_SUPPORT',observationScope:'SELF_PLAY',defaultValue:null,uiQuickAdd:1}); };
for(const [id,name,order] of [
 ['INP_MMB_PANEL_WHITE','白',40],['INP_MMB_PANEL_BLUE','青',41],['INP_MMB_PANEL_YELLOW','黄',42],['INP_MMB_PANEL_GREEN','緑',43],['INP_MMB_PANEL_RED','赤（設定3・4・5）',44],['INP_MMB_PANEL_RAINBOW','虹（設定5）',45]
]) addInput(id,name,order);

const mmb=s.features.find(f=>f.researchFeatureId==='RF_MMB_PANEL');
if(!mmb) throw new Error('RF_MMB_PANEL Selection missing');
mmb.featureId='FEAT_MMB_PANEL';
mmb.adoptionCategory='INCLUDE_SUPPORT';
mmb.numeratorInputId='INP_MMB_PANEL_WHITE';
mmb.categoryInputIds=['INP_MMB_PANEL_BLUE','INP_MMB_PANEL_YELLOW','INP_MMB_PANEL_GREEN','INP_MMB_PANEL_RED','INP_MMB_PANEL_RAINBOW'];
mmb.inputTransform='sum_inputs_to_trials';
mmb.minimumSample=1;
mmb.sampleRecommendation=30;
mmb.weight=1;
mmb.difficultyParticipation='EXCLUDE';
mmb.normalizeRoundedCategoryProbabilities=true;
mmb.userReason='MMB初回目押し成功時のパネル色は白・青・黄・緑・赤・虹の完全分布として補助推測に利用します。赤・虹は同じカウンター入力を設定限定Evidenceにも共有し、1回の観測を二重入力しません。公開丸め値はResearch原値を保持したまま採用時のみ正規化します。';
delete mmb.userFacingReason;

for(const id of ['RF_SMART_A','RF_SMART_B','RF_SMART_C']){
  const f=s.features.find(x=>x.researchFeatureId===id); if(!f) throw new Error(`${id} missing`);
  f.userFacingReason='スマTALKの設定別文字色分布は公開されていますが、現Observationでは実機メニュー「スマコレ」の前任者分を含む保持範囲・リセット条件・自分区間の質問回答回数を一意に確定できていません。試行母集団とセッション境界が未解決のため、現版の数値Featureには使用しません。';
}
const gacha=s.features.find(x=>x.researchFeatureId==='RF_GACHA');
if(!gacha) throw new Error('RF_GACHA missing');
gacha.userFacingReason='スマコレ・ガチャの設定別レアリティ分布は公開されていますが、現Observationでは前任者分を含む保持範囲・リセット条件・自分区間のガチャ回数を一意に確定できていません。試行母集団とセッション境界が未解決のため、現版の数値Featureには使用しません。';

// Clean the already-migrated bonus ending Feature name and shared references.
const endFeature=s.features.find(f=>f.researchFeatureId==='RF_BONUS_END');
if(!endFeature) throw new Error('RF_BONUS_END missing');
endFeature.featureId='FEAT_BONUS_END';
endFeature.userReason='ボーナス終了画面は全7カテゴリを同じ入力面で記録し、公開丸め値は採用時に正規化した完全分布として数値推測へ利用します。銅・金・星・虹は同じカウンターをEvidenceにも共有するため、二重入力は不要です。';
for(const e of s.evidence??[]) if((e.sharedFeatureIds??[]).includes('FEAT_BONUS_END_NON_EVIDENCE')) e.sharedFeatureIds=e.sharedFeatureIds.map(id=>id==='FEAT_BONUS_END_NON_EVIDENCE'?'FEAT_BONUS_END':id);

const mmbGroup=s.evidenceUi?.groups?.find(g=>g.groupId==='EVID_MMB_ROULETTE');
if(!mmbGroup) throw new Error('EVID_MMB_ROULETTE missing');
const mmbMoved=new Set(['RE_MMB_RED','RE_MMB_RAINBOW']);
mmbGroup.options=mmbGroup.options.filter(o=>!(o.sourceEvidenceIds??[]).some(id=>mmbMoved.has(id)));
s.evidence??=[];
for(const [researchEvidenceId,evidenceId,inputId] of [
 ['RE_MMB_RED','EVI_MMB_PANEL_RED','INP_MMB_PANEL_RED'],
 ['RE_MMB_RAINBOW','EVI_MMB_PANEL_RAINBOW','INP_MMB_PANEL_RAINBOW']
]) if(!s.evidence.some(e=>e.evidenceId===evidenceId)) s.evidence.push({researchEvidenceId,evidenceId,inputId,sharedFeatureIds:['FEAT_MMB_PANEL']});

const hiddenEvidenceIds=[
 'RE_SMART_A_RED','RE_SMART_B_BLUE','RE_SMART_B_RED','RE_SMART_C_BLUE','RE_SMART_C_RED',
 'RE_GACHA_A','RE_GACHA_S','RE_GACHA_SS'
];
s.evidenceUi.groups=s.evidenceUi.groups.filter(g=>!['EVID_SMART_TALK','EVID_GACHA'].includes(g.groupId));
s.evidenceReview??={policyVersion:1,exclusions:[]};
s.evidenceReview.policyVersion=1;
s.evidenceReview.exclusions??=[];
for(const researchEvidenceId of hiddenEvidenceIds){
  if(!s.evidenceReview.exclusions.some(x=>x.researchEvidenceId===researchEvidenceId)) s.evidenceReview.exclusions.push({
    researchEvidenceId,
    reason:'実機メニュー「スマコレ」の保持範囲・前任者分の混在・リセット条件が未確定で、現セッション由来の表示だと保証できないため、Research候補として保持しつつ現版のEvidence UIには公開しません。実機でセッション境界を確認後に再評価します。'
  });
}
s.uiCategoryLabels??={}; s.uiCategoryLabels.MMB_PANEL='MMB技術介入パネル';
s.uiCategoryDescriptions??={}; s.uiCategoryDescriptions.MMB_PANEL='MMB初回目押し成功時に確認したパネル色を1回だけ入力します。赤・虹は割合推測と設定Evidenceの両方に反映されます。';
s.selectionNotes??=[];
for(const note of [
 'MMB技術介入パネルは全6色を単一入力面で扱い、赤・虹をNumeric FeatureとEvidenceで共有する。',
 'スマTALK/スマコレ・ガチャはメニュー保持範囲とセッション境界が未解決のため、数値FeatureはEXCLUDE維持し、対応EvidenceもevidenceReviewで明示的に非公開とする。'
]) if(!s.selectionNotes.includes(note)) s.selectionNotes.push(note);
s.machineDataVersion='0.1.3';
r.machine.machineDataVersion='0.1.3';
fs.writeFileSync(selectionPath,JSON.stringify(s,null,2)+'\n');
fs.writeFileSync(researchPath,JSON.stringify(r,null,2)+'\n');

const o=JSON.parse(fs.readFileSync(obsPath,'utf8'));
if(!o.observations.some(x=>x.observationId==='OBS_MMB_PANEL_DIRECT')) o.observations.push({
  observationId:'OBS_MMB_PANEL_DIRECT',sourceType:'DIRECT_PLAY',observationMode:'VISUAL_EVENT',status:'FOUND',
  label:'MMB初回目押し成功時パネル6色',categories:['multinomial','evidence'],timing:['MMB中・初回目押し成功時'],excludedConditions:['目押し失敗で色を確認できないMMB'],sourceRefs:[],
  semanticNote:'同じパネル色カウンターをNumeric Featureと赤/虹Evidenceで共有する。'
});
if(!o.featureMappings.some(x=>x.featureId==='FEAT_MMB_PANEL')) o.featureMappings.push({featureId:'FEAT_MMB_PANEL',mappingType:'EXACT',observationIds:['OBS_MMB_PANEL_DIRECT'],collectionMethods:['VISUAL_EVENT'],usableForInference:true,usableForDifficulty:false});
const endMap=o.featureMappings.find(x=>x.featureId==='FEAT_BONUS_END_NON_EVIDENCE'); if(endMap) endMap.featureId='FEAT_BONUS_END';
const menu=o.observations.find(x=>x.observationId==='OBS_SMART_COLLECTION_MENU');
if(menu) menu.semanticNote='スマTALK/ガチャの存在は確認済みだが、前任者分を含む保持範囲・リセット条件・自分区間の試行回数が未解決。現版ではNumeric/Evidence入力へ利用しない。';
fs.writeFileSync(obsPath,JSON.stringify(o,null,2)+'\n');

const ui=JSON.parse(fs.readFileSync(uiPath,'utf8'));
ui.sectionOrder=ui.sectionOrder.filter(x=>!['スマTALK','スマコレ・ガチャ','ボーナス終了画面'].includes(x));
if(!ui.sectionOrder.includes('MMB技術介入パネル・ルーレット')){
  const oldIndex=ui.sectionOrder.indexOf('MMB・ミルキィルーレット');
  if(oldIndex>=0) ui.sectionOrder[oldIndex]='MMB技術介入パネル・ルーレット';
  else ui.sectionOrder.push('MMB技術介入パネル・ルーレット');
}
const oldMmb=ui.sections['MMB・ミルキィルーレット']??{};
delete ui.sections['MMB・ミルキィルーレット'];
ui.sections['MMB技術介入パネル・ルーレット']={...oldMmb,
  inputIds:['INP_MMB_PANEL_WHITE','INP_MMB_PANEL_BLUE','INP_MMB_PANEL_YELLOW','INP_MMB_PANEL_GREEN','INP_MMB_PANEL_RED','INP_MMB_PANEL_RAINBOW'],
  evidenceIds:['EVID_MMB_ROULETTE'],
  description:'MMB初回目押し成功時のパネル色を6色のいずれかとして1回入力します。赤・虹は割合推測と設定Evidenceに自動共有されます。ルーレット確定パターンのみ下のEvidenceで選択します。',
  observationRole:'DIRECT_PLAY',quickInputEligible:true
};
for(const key of ['スマTALK','スマコレ・ガチャ','ボーナス終了画面']) delete ui.sections[key];
for(const key of ['EVID_SMART_TALK','EVID_GACHA','EVID_END']) delete ui.evidenceContracts[key];
const endSec=ui.sections['ボーナス終了画面（割合）'];
if(!endSec) throw new Error('bonus end ratio UI section missing');
endSec.inputIds=['INP_END_WHITE1','INP_END_WHITE2','INP_END_WHITE3','INP_END_COPPER','INP_END_GOLD','INP_END_STAR','INP_END_RAINBOW'];
endSec.description='ボーナス終了画面を白1・白2・白3・銅・金・星・虹のいずれかとして1回入力します。銅・金・星・虹は同じ入力が割合推測と設定Evidenceの両方に反映されます。';
const contracts=[
 ['INP_MMB_PANEL_WHITE','白'],['INP_MMB_PANEL_BLUE','青'],['INP_MMB_PANEL_YELLOW','黄'],['INP_MMB_PANEL_GREEN','緑'],['INP_MMB_PANEL_RED','赤（設定3・4・5）'],['INP_MMB_PANEL_RAINBOW','虹（設定5）'],
 ['INP_END_COPPER','銅'],['INP_END_GOLD','金'],['INP_END_STAR','星'],['INP_END_RAINBOW','虹']
];
for(const [id,name] of contracts){
  ui.inputContracts[id]={name,mode:'COUNTER',gridSpan:12,directInput:true,compact:true,placeholder:0,quickInput:true,quickStep:1};
  if(!ui.quickInputContract.inputIds.includes(id)) ui.quickInputContract.inputIds.push(id);
}
ui.quickInputContract.selectableSections=ui.quickInputContract.selectableSections.filter(x=>!['MMB・ミルキィルーレット','スマTALK','スマコレ・ガチャ','ボーナス終了画面'].includes(x));
if(!ui.quickInputContract.selectableSections.includes('MMB技術介入パネル・ルーレット')) ui.quickInputContract.selectableSections.push('MMB技術介入パネル・ルーレット');
ui.unresolved??=[];
const unresolved='スマTALK/スマコレ・ガチャはメニュー保持範囲・前任者分混在・リセット条件の実機確認が終わるまで入力UIへ露出しない。';
if(!ui.unresolved.includes(unresolved)) ui.unresolved.push(unresolved);
ui.auditNotes??=[];
for(const note of [
 'MMBパネルは6色の単一入力面へ移行し、赤・虹をNumeric/Evidenceで共有。',
 'ボーナス終了画面UIをSelectionの7カテゴリshared-input実装へ同期。',
 'スマTALK/ガチャはObservation scope未確定のためSelection EvidenceとUI Designの両方で非公開。'
]) if(!ui.auditNotes.includes(note)) ui.auditNotes.push(note);
fs.writeFileSync(uiPath,JSON.stringify(ui,null,2)+'\n');

const testPath='test/milky-v64-evidence-final.test.mjs';
fs.writeFileSync(testPath,`import test from 'node:test';\nimport assert from 'node:assert/strict';\nimport fs from 'node:fs';\nconst s=JSON.parse(fs.readFileSync('research/S_MILKY_HOMES_GNB/selection-data.json','utf8'));\nconst o=JSON.parse(fs.readFileSync('research/S_MILKY_HOMES_GNB/machine-observation-data.json','utf8'));\nconst ui=JSON.parse(fs.readFileSync('research/S_MILKY_HOMES_GNB/ui-design-data.json','utf8'));\n\ntest('Milky MMB panel is a complete shared-input numeric Feature',()=>{ const f=s.features.find(x=>x.featureId==='FEAT_MMB_PANEL'); assert.ok(f); assert.equal(f.adoptionCategory,'INCLUDE_SUPPORT'); assert.equal(f.categoryInputIds.length,5); assert.equal(f.normalizeRoundedCategoryProbabilities,true); for(const id of ['RE_MMB_RED','RE_MMB_RAINBOW']){ const e=s.evidence.find(x=>x.researchEvidenceId===id); assert.ok(e); assert.deepEqual(e.sharedFeatureIds,['FEAT_MMB_PANEL']); }});\n\ntest('Milky SmartTALK and Gacha are explicitly held pending menu session-boundary verification',()=>{ for(const id of ['RF_SMART_A','RF_SMART_B','RF_SMART_C','RF_GACHA']){ const f=s.features.find(x=>x.researchFeatureId===id); assert.equal(f.adoptionCategory,'EXCLUDE'); assert.match(f.userFacingReason,/試行母集団とセッション境界が未解決/); } for(const id of ['RE_SMART_A_RED','RE_SMART_B_BLUE','RE_SMART_B_RED','RE_SMART_C_BLUE','RE_SMART_C_RED','RE_GACHA_A','RE_GACHA_S','RE_GACHA_SS']) assert.ok(s.evidenceReview.exclusions.some(x=>x.researchEvidenceId===id)); assert.ok(!(s.evidenceUi.groups??[]).some(g=>['EVID_SMART_TALK','EVID_GACHA'].includes(g.groupId))); });\n\ntest('Milky Observation and UI expose shared MMB and full bonus-end counters',()=>{ assert.ok(o.featureMappings.some(x=>x.featureId==='FEAT_MMB_PANEL'&&x.observationIds.includes('OBS_MMB_PANEL_DIRECT'))); assert.ok(o.featureMappings.some(x=>x.featureId==='FEAT_BONUS_END')); const end=ui.sections['ボーナス終了画面（割合）']; assert.deepEqual(end.inputIds,['INP_END_WHITE1','INP_END_WHITE2','INP_END_WHITE3','INP_END_COPPER','INP_END_GOLD','INP_END_STAR','INP_END_RAINBOW']); assert.equal(ui.sections['スマTALK'],undefined); assert.equal(ui.sections['スマコレ・ガチャ'],undefined); });\n`);
console.log('UPDATED Milky v6.4 final Evidence contract');
