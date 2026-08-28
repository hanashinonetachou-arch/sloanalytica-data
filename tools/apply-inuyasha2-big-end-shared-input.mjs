import fs from 'node:fs';

const selectionPath='research/L_INUYASHA2_FK/selection-data.json';
const researchPath='research/L_INUYASHA2_FK/research-data.json';
const obsPath='research/L_INUYASHA2_FK/machine-observation-data.json';
const uiPath='research/L_INUYASHA2_FK/ui-design-data.json';
const s=JSON.parse(fs.readFileSync(selectionPath,'utf8'));
const r=JSON.parse(fs.readFileSync(researchPath,'utf8'));

const addInput=(id,name,order)=>{ if(!s.inputs.some(i=>i.id===id)) s.inputs.push({id,name,category:'SETTING_SIGNAL',type:'counter',unit:'回',displayOrder:order,inferenceRole:'INCLUDE_SUPPORT',observationScope:'SELF_PLAY',defaultValue:null,uiQuickAdd:1}); };
addInput('INP_RF_WHITE_BIG_END_SESSHOMARU','殺生丸（設定2以上）',62);
addInput('INP_RF_WHITE_BIG_END_PAIR','犬夜叉&かごめ（設定4以上）',63);
addInput('INP_RF_BLUE_BIG_END_INUYASHA','犬夜叉（設定2以上）',62);
addInput('INP_RF_BLUE_BIG_END_PAIR','犬夜叉&かごめ（設定4以上）',63);

const white=s.features.find(f=>f.researchFeatureId==='RF_WHITE_BIG_END');
const blue=s.features.find(f=>f.researchFeatureId==='RF_BLUE_BIG_END');
if(!white||!blue) throw new Error('BIG end features missing');
white.featureId='FEAT_WHITE_BIG_END';
white.categoryInputIds=['INP_RF_WHITE_BIG_END_SESSHOMARU','INP_RF_WHITE_BIG_END_KIKYO','INP_RF_WHITE_BIG_END_PAIR'];
delete white.categoryExcludeLabels;
white.userReason='白BIG終了画面は犬夜叉・殺生丸・桔梗・犬夜叉&かごめの完全分布として評価します。殺生丸と2人画面は同じカウンター入力をEvidenceにも共有します。';
blue.featureId='FEAT_BLUE_BIG_END';
blue.numeratorInputId='INP_RF_BLUE_BIG_END_INUYASHA';
blue.categoryInputIds=['INP_RF_BLUE_BIG_END_SESSHOMARU','INP_RF_BLUE_BIG_END_KIKYO','INP_RF_BLUE_BIG_END_PAIR'];
delete blue.categoryExcludeLabels;
blue.userReason='青7BIG終了画面は犬夜叉・殺生丸・桔梗・犬夜叉&かごめの完全分布として評価します。犬夜叉と2人画面は同じカウンター入力をEvidenceにも共有します。';

const endGroup=s.evidenceUi?.groups?.find(g=>g.groupId==='EVID_END');
if(!endGroup) throw new Error('EVID_END missing');
const moved=new Set(['RE_BIG_END_PAIR','RE_WHITE_BIG_SESSHOMARU_2PLUS','RE_BLUE_BIG_INUYASHA_2PLUS']);
endGroup.options=endGroup.options.filter(o=>!(o.sourceEvidenceIds??[]).some(id=>moved.has(id)));
s.evidence??=[];
const defs=[
  ['RE_WHITE_BIG_SESSHOMARU_2PLUS','EVI_WHITE_BIG_SESSHOMARU_2PLUS','INP_RF_WHITE_BIG_END_SESSHOMARU','FEAT_WHITE_BIG_END'],
  ['RE_BLUE_BIG_INUYASHA_2PLUS','EVI_BLUE_BIG_INUYASHA_2PLUS','INP_RF_BLUE_BIG_END_INUYASHA','FEAT_BLUE_BIG_END'],
  ['RE_BIG_END_PAIR','EVI_WHITE_BIG_PAIR_4PLUS','INP_RF_WHITE_BIG_END_PAIR','FEAT_WHITE_BIG_END'],
  ['RE_BIG_END_PAIR','EVI_BLUE_BIG_PAIR_4PLUS','INP_RF_BLUE_BIG_END_PAIR','FEAT_BLUE_BIG_END'],
];
for(const [researchEvidenceId,evidenceId,inputId,featureId] of defs){
  if(!s.evidence.some(e=>e.evidenceId===evidenceId)) s.evidence.push({researchEvidenceId,evidenceId,inputId,sharedFeatureIds:[featureId]});
}
s.machineDataVersion='0.1.3';
r.machine.machineDataVersion='0.1.3';
fs.writeFileSync(selectionPath,JSON.stringify(s,null,2)+'\n');
fs.writeFileSync(researchPath,JSON.stringify(r,null,2)+'\n');

const o=JSON.parse(fs.readFileSync(obsPath,'utf8'));
const patchObs=(oldId,newId,label)=>{
  const ob=o.observations.find(x=>x.observationId===oldId); if(!ob) throw new Error(`${oldId} missing`);
  ob.observationId=newId; ob.label=label; ob.categories=['multinomial','evidence']; ob.excludedConditions=[];
  ob.semanticNote='終了画面4カテゴリを同じカウンター面で記録し、設定下限カテゴリはNumeric FeatureとEvidenceへ共有する。';
};
patchObs('OBS_FEAT_WHITE_BIG_END_NON_EVIDENCE','OBS_WHITE_BIG_END_FULL','白BIG終了画面4カテゴリ');
patchObs('OBS_FEAT_BLUE_BIG_END_NON_EVIDENCE','OBS_BLUE_BIG_END_FULL','青7BIG終了画面4カテゴリ');
const wm=o.featureMappings.find(x=>x.featureId==='FEAT_WHITE_BIG_END_NON_EVIDENCE'); if(!wm) throw new Error('white mapping missing');
wm.featureId='FEAT_WHITE_BIG_END'; wm.observationIds=['OBS_WHITE_BIG_END_FULL']; wm.mappingType='EXACT';
const bm=o.featureMappings.find(x=>x.featureId==='FEAT_BLUE_BIG_END_NON_EVIDENCE'); if(!bm) throw new Error('blue mapping missing');
bm.featureId='FEAT_BLUE_BIG_END'; bm.observationIds=['OBS_BLUE_BIG_END_FULL']; bm.mappingType='EXACT';
fs.writeFileSync(obsPath,JSON.stringify(o,null,2)+'\n');

const ui=JSON.parse(fs.readFileSync(uiPath,'utf8'));
const whiteSec=ui.sections?.['白BIG終了画面（割合）']; const blueSec=ui.sections?.['青7BIG終了画面（割合）'];
if(!whiteSec||!blueSec) throw new Error('BIG UI sections missing');
whiteSec.inputIds=['INP_RF_WHITE_BIG_END_INUYASHA','INP_RF_WHITE_BIG_END_SESSHOMARU','INP_RF_WHITE_BIG_END_KIKYO','INP_RF_WHITE_BIG_END_PAIR'];
whiteSec.description='白BIG終了画面を4カテゴリのいずれかとして1回入力します。殺生丸・犬夜叉&かごめは割合推測と設定Evidenceの両方に反映されます。';
blueSec.inputIds=['INP_RF_BLUE_BIG_END_INUYASHA','INP_RF_BLUE_BIG_END_SESSHOMARU','INP_RF_BLUE_BIG_END_KIKYO','INP_RF_BLUE_BIG_END_PAIR'];
blueSec.description='青7BIG終了画面を4カテゴリのいずれかとして1回入力します。犬夜叉・犬夜叉&かごめは割合推測と設定Evidenceの両方に反映されます。';
for(const [id,name] of [
 ['INP_RF_WHITE_BIG_END_SESSHOMARU','殺生丸（設定2以上）'],['INP_RF_WHITE_BIG_END_PAIR','犬夜叉&かごめ（設定4以上）'],
 ['INP_RF_BLUE_BIG_END_INUYASHA','犬夜叉（設定2以上）'],['INP_RF_BLUE_BIG_END_PAIR','犬夜叉&かごめ（設定4以上）']]){
  ui.inputContracts[id]={name,mode:'COUNTER',gridSpan:12,directInput:true,compact:true,placeholder:0,quickInput:true,quickStep:1};
  if(!ui.quickInputContract.inputIds.includes(id)) ui.quickInputContract.inputIds.push(id);
}
ui.sections['終了画面'].description='AT終了画面など、割合カウンターと共有していない独立の設定確定パターンが出た場合に選択します。白BIG/青7BIGの共有Evidenceは各割合カウンターから自動反映されます。';
ui.auditNotes??=[];
const note='白BIG/青7BIGは各4カテゴリを単一入力面で扱い、設定2以上/4以上カテゴリをNumeric FeatureとEvidenceに共有する。';
if(!ui.auditNotes.includes(note)) ui.auditNotes.push(note);
fs.writeFileSync(uiPath,JSON.stringify(ui,null,2)+'\n');

const testPath='test/inuyasha2-big-end-shared-evidence.test.mjs';
fs.writeFileSync(testPath,`import test from 'node:test';\nimport assert from 'node:assert/strict';\nimport fs from 'node:fs';\n\nconst s=JSON.parse(fs.readFileSync('research/L_INUYASHA2_FK/selection-data.json','utf8'));\nconst o=JSON.parse(fs.readFileSync('research/L_INUYASHA2_FK/machine-observation-data.json','utf8'));\n\ntest('Inuyasha2 white and blue BIG ending screens use complete shared-input distributions',()=>{\n  for(const [fid,expected] of [['FEAT_WHITE_BIG_END',3],['FEAT_BLUE_BIG_END',3]]){\n    const f=s.features.find(x=>x.featureId===fid); assert.ok(f); assert.equal(f.categoryExcludeLabels,undefined); assert.equal(f.categoryInputIds.length,expected);\n  }\n});\n\ntest('Inuyasha2 context-specific Evidence shares the exact BIG ending inputs',()=>{\n  const expected={EVI_WHITE_BIG_SESSHOMARU_2PLUS:['INP_RF_WHITE_BIG_END_SESSHOMARU','FEAT_WHITE_BIG_END'],EVI_BLUE_BIG_INUYASHA_2PLUS:['INP_RF_BLUE_BIG_END_INUYASHA','FEAT_BLUE_BIG_END'],EVI_WHITE_BIG_PAIR_4PLUS:['INP_RF_WHITE_BIG_END_PAIR','FEAT_WHITE_BIG_END'],EVI_BLUE_BIG_PAIR_4PLUS:['INP_RF_BLUE_BIG_END_PAIR','FEAT_BLUE_BIG_END']};\n  for(const [id,[inputId,featureId]] of Object.entries(expected)){ const e=s.evidence.find(x=>x.evidenceId===id); assert.ok(e); assert.equal(e.inputId,inputId); assert.deepEqual(e.sharedFeatureIds,[featureId]); }\n});\n\ntest('Inuyasha2 Observation v2 maps full BIG ending distributions',()=>{\n  assert.ok(o.featureMappings.some(x=>x.featureId==='FEAT_WHITE_BIG_END'&&x.observationIds.includes('OBS_WHITE_BIG_END_FULL')));\n  assert.ok(o.featureMappings.some(x=>x.featureId==='FEAT_BLUE_BIG_END'&&x.observationIds.includes('OBS_BLUE_BIG_END_FULL')));\n});\n`);
console.log('UPDATED Inuyasha2 BIG ending shared-input contract');
