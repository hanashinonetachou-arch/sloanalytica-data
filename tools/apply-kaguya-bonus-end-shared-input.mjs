import fs from 'node:fs';

const researchPath='research/L_KAGUYA_SAMA_JA/research-data.json';
const selectionPath='research/L_KAGUYA_SAMA_JA/selection-data.json';
const r=JSON.parse(fs.readFileSync(researchPath,'utf8'));
const s=JSON.parse(fs.readFileSync(selectionPath,'utf8'));
const rf=(r.features??[]).find(f=>f.researchFeatureId==='RF_KAGUYA_BONUS_END_FRAME');
if(!rf) throw new Error('RF_KAGUYA_BONUS_END_FRAME missing');
for(const setting of r.machine.settings){
  const dist=rf.settingDistributions?.[setting];
  if(!dist) throw new Error(`distribution missing ${setting}`);
  const explicit=['RED','PURPLE','SILVER','GOLD'].reduce((sum,k)=>sum+Number(dist[k]??0),0);
  const other=1-explicit;
  if(other<0||other>1) throw new Error(`invalid residual ${setting}: ${other}`);
  dist.OTHER=Number(other.toFixed(12));
  const total=Object.values(dist).reduce((a,b)=>a+Number(b),0);
  if(Math.abs(total-1)>1e-9) throw new Error(`distribution total ${setting}: ${total}`);
}
rf.categories=['RED','PURPLE','SILVER','GOLD','OTHER'];
rf.distributionMode='explicit_complete';
rf.numeratorDefinition='赤・紫・銀・金枠・その他終了画面の各出現回数';
rf.notes='公開された赤・紫・銀・金枠の確率は原値を保持し、OTHERは1−(RED+PURPLE+SILVER+GOLD)で派生した残差。全5カテゴリを同じ終了画面入力面で記録し、紫・銀・金はNumericとHard Evidenceに共有する。Difficulty参加は推論採否と分離して現版では除外する。';
r.machine.machineDataVersion='0.1.3';

const inputDefs=[
  ['INP_KAGUYA_END_RED','赤枠',20],
  ['INP_KAGUYA_END_PURPLE','紫枠（設定2以上）',21],
  ['INP_KAGUYA_END_SILVER','銀枠（設定4以上）',22],
  ['INP_KAGUYA_END_GOLD','金枠（設定6）',23],
  ['INP_KAGUYA_END_OTHER','その他',24],
];
for(const [id,name,displayOrder] of inputDefs){
  if(!s.inputs.some(i=>i.id===id)) s.inputs.push({id,name,category:'BONUS_END_FRAME',type:'counter',unit:'回',displayOrder,inferenceRole:'INCLUDE_SUPPORT',observationScope:'SELF_PLAY',defaultValue:null,uiQuickAdd:1});
}
const sf=s.features.find(f=>f.researchFeatureId==='RF_KAGUYA_BONUS_END_FRAME');
if(!sf) throw new Error('Selection frame feature missing');
sf.featureId='FEAT_KAGUYA_BONUS_END_FRAME';
sf.adoptionCategory='INCLUDE_SUPPORT';
sf.numeratorInputId='INP_KAGUYA_END_RED';
sf.categoryInputIds=['INP_KAGUYA_END_PURPLE','INP_KAGUYA_END_SILVER','INP_KAGUYA_END_GOLD','INP_KAGUYA_END_OTHER'];
sf.inputTransform='sum_inputs_to_trials';
sf.minimumSample=1;
sf.sampleRecommendation=30;
sf.weight=1;
sf.difficultyParticipation='EXCLUDE';
sf.userReason='BONUS終了画面は赤・紫・銀・金・その他の完全分布として補助推測に利用します。紫・銀・金は同じカウンター入力を設定下限Evidenceにも共有するため、1回の観測を二重入力しません。';
delete sf.rejectionReason;

const group=s.evidenceUi?.groups?.find(g=>g.groupId==='KAGUYA_BONUS_END');
if(!group) throw new Error('KAGUYA_BONUS_END group missing');
const sharedIds=new Set(['RE_KAGUYA_END_PURPLE','RE_KAGUYA_END_SILVER','RE_KAGUYA_END_GOLD']);
group.options=group.options.filter(o=>!(o.sourceEvidenceIds??[]).some(id=>sharedIds.has(id)));
s.evidence??=[];
const shared=[
  ['RE_KAGUYA_END_PURPLE','EVI_KAGUYA_END_PURPLE','INP_KAGUYA_END_PURPLE'],
  ['RE_KAGUYA_END_SILVER','EVI_KAGUYA_END_SILVER','INP_KAGUYA_END_SILVER'],
  ['RE_KAGUYA_END_GOLD','EVI_KAGUYA_END_GOLD','INP_KAGUYA_END_GOLD'],
];
for(const [researchEvidenceId,evidenceId,inputId] of shared){
  if(!s.evidence.some(e=>e.researchEvidenceId===researchEvidenceId)) s.evidence.push({researchEvidenceId,evidenceId,inputId,sharedFeatureIds:['FEAT_KAGUYA_BONUS_END_FRAME']});
}
s.evidenceReview??={policyVersion:1,exclusions:[]};
s.evidenceReview.policyVersion=1;
s.evidenceReview.exclusions??=[];
s.machineDataVersion='0.1.3';
s.uiCategoryLabels??={};
s.uiCategoryLabels.BONUS_END_FRAME='BONUS終了画面（割合・設定確定）';
s.uiCategoryDescriptions??={};
s.uiCategoryDescriptions.BONUS_END_FRAME='確認したBONUS終了画面を5カテゴリのいずれかとして1回入力します。紫・銀・金は、この入力が割合推測と設定Evidenceの両方に反映されます。';
s.selectionNotes??=[];
const note='BONUS終了画面は公開4枠＋派生OTHERの完全Multinomialへ移行し、紫・銀・金の入力をNumeric FeatureとEvidenceで共有する。';
if(!s.selectionNotes.includes(note)) s.selectionNotes.push(note);

fs.writeFileSync(researchPath,JSON.stringify(r,null,2)+'\n');
fs.writeFileSync(selectionPath,JSON.stringify(s,null,2)+'\n');
console.log('UPDATED Kaguya BONUS end-frame shared-input model');
