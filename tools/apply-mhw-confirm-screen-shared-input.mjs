import fs from 'node:fs';

const selPath='research/S_MHW_ICEBORNE_ZF/selection-data.json';
const obsPath='research/S_MHW_ICEBORNE_ZF/machine-observation-data.json';
const uiPath='research/S_MHW_ICEBORNE_ZF/ui-design-data.json';
const researchPath='research/S_MHW_ICEBORNE_ZF/research-data.json';
const s=JSON.parse(fs.readFileSync(selPath,'utf8'));
const r=JSON.parse(fs.readFileSync(researchPath,'utf8'));

if(!s.inputs.some(i=>i.id==='INP_CONFIRM_MORA')){
  const you=s.inputs.find(i=>i.id==='INP_CONFIRM_YOU');
  if(!you) throw new Error('INP_CONFIRM_YOU not found');
  const idx=s.inputs.indexOf(you);
  s.inputs.splice(idx+1,0,{id:'INP_CONFIRM_MORA',name:'モラ・ガラテア&ひろし&BJ（設定4以上）',category:'SETTING_SIGNAL',type:'counter',unit:'回',displayOrder:67,inferenceRole:'INCLUDE_SUPPORT',observationScope:'SELF_PLAY',defaultValue:null,uiQuickAdd:1});
}
const f=s.features.find(x=>x.researchFeatureId==='RF_CONFIRM_SCREEN');
if(!f) throw new Error('RF_CONFIRM_SCREEN selection missing');
f.featureId='FEAT_CONFIRM_SCREEN';
f.categoryInputIds=['INP_CONFIRM_EVEN_B','INP_CONFIRM_EVEN_C','INP_CONFIRM_EVEN_D','INP_CONFIRM_ODD_A','INP_CONFIRM_ODD_B','INP_CONFIRM_YOU','INP_CONFIRM_MORA'];
delete f.categoryExcludeLabels;
f.userReason='ボーナス確定画面は8カテゴリの完全分布として評価します。モラ・ガラテア&ひろし&BJは同じカウンター入力を設定4以上Evidenceにも共有し、二重入力せず割合推測と確定判定の両方に利用します。';

const eg=s.evidenceUi?.groups?.find(g=>g.groupId==='EVID_CONFIRM_END');
if(!eg) throw new Error('EVID_CONFIRM_END missing');
eg.options=eg.options.filter(o=>!(o.sourceEvidenceIds??[]).includes('RE_CONFIRM_MORA'));
s.evidence??=[];
if(!s.evidence.some(e=>e.researchEvidenceId==='RE_CONFIRM_MORA')){
  s.evidence.push({researchEvidenceId:'RE_CONFIRM_MORA',evidenceId:'EVI_CONFIRM_MORA',inputId:'INP_CONFIRM_MORA',sharedFeatureIds:['FEAT_CONFIRM_SCREEN']});
}
const ex=s.evidenceReview?.exclusions??[];
s.evidenceReview.exclusions=ex.filter(x=>x.researchEvidenceId!=='RE_CONFIRM_MORA');
s.machineDataVersion='0.1.4';
r.machine.machineDataVersion='0.1.4';
fs.writeFileSync(selPath,JSON.stringify(s,null,2)+'\n');
fs.writeFileSync(researchPath,JSON.stringify(r,null,2)+'\n');

const o=JSON.parse(fs.readFileSync(obsPath,'utf8'));
const obs=o.observations.find(x=>x.observationId==='OBS_CONFIRM_SCREEN_RATIO');
if(!obs) throw new Error('OBS_CONFIRM_SCREEN_RATIO missing');
obs.label='ボーナス確定画面8カテゴリ';
obs.categories=['multinomial','evidence'];
obs.excludedConditions=[];
obs.semanticNote='モラ・ガラテア&ひろし&BJを含む全8カテゴリを同じ画面カウンターで記録し、MORA入力は割合Featureと設定4以上Evidenceへ共有する。';
const map=o.featureMappings.find(x=>x.featureId==='FEAT_CONFIRM_SCREEN_NON_EVIDENCE');
if(!map) throw new Error('old confirm feature mapping missing');
map.featureId='FEAT_CONFIRM_SCREEN';
map.mappingType='EXACT';
map.observationIds=['OBS_CONFIRM_SCREEN_RATIO'];
fs.writeFileSync(obsPath,JSON.stringify(o,null,2)+'\n');

const ui=JSON.parse(fs.readFileSync(uiPath,'utf8'));
const sec=ui.sections?.['ボーナス確定画面（割合）'];
if(!sec) throw new Error('confirm ratio UI section missing');
if(!sec.inputIds.includes('INP_CONFIRM_MORA')) sec.inputIds.push('INP_CONFIRM_MORA');
sec.description='確認したボーナス確定画面を8カテゴリのいずれかとして1回入力します。モラ・ガラテア&ひろし&BJは、この入力が割合推測と設定4以上Evidenceの両方に反映されます。';
ui.inputContracts['INP_CONFIRM_MORA']={name:'モラ・ガラテア&ひろし&BJ（設定4以上）',mode:'COUNTER',gridSpan:12,directInput:true,compact:true,placeholder:0,quickInput:true,quickStep:1};
const q=ui.quickInputContract?.inputIds??[];
if(!q.includes('INP_CONFIRM_MORA')) q.push('INP_CONFIRM_MORA');
const notes=ui.auditNotes??=[];
const note='ボーナス確定画面は全8カテゴリを単一入力面で扱い、MORAカウンターをNumeric FeatureとEvidenceに共有する。';
if(!notes.includes(note)) notes.push(note);
fs.writeFileSync(uiPath,JSON.stringify(ui,null,2)+'\n');
console.log('UPDATED MHW confirm screen shared-input contract');
