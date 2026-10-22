import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const root=process.cwd(),batch='batch-20261022-025',base=path.join(root,'batches',batch);
const read=(p:string)=>JSON.parse(fs.readFileSync(p,'utf8'));
const sel=read(path.join(root,'next-machine-selection-20261022-batch025.json')),ids=sel.selected.map((x:any)=>x.machineId);
const docs:any={};let ledger=0,mapped=0;
const results:any[]=[];
for(const id of ids){
 const machine:any={};
 for(const stage of ['RESEARCH','EVALUATION','ELIGIBILITY','CANDIDATE_CONTRACT']){
  const s=read(path.join(base,'machines',id,'stages',stage+'.json'));assert.equal(s.state,'COMPLETE');
  const ref=s.authoritativeOutputRef,filename=path.resolve(root,'..',ref.path),buf=fs.readFileSync(filename);
  assert.equal(crypto.createHash('sha256').update(buf).digest('hex'),ref.sha256);
  machine[stage]=JSON.parse(buf.toString());assert.equal(machine[stage].machineId,id);
  const q=read(path.join(base,'work-requests',ref.producerWorkId+'.json'));
  for(const input of q.inputArtifacts){const latest=fs.readFileSync(path.resolve(root,'..',input.path));assert.equal(crypto.createHash('sha256').update(latest).digest('hex'),input.sha256,'current upstream artifact binding');}
 }
 for(const stage of ['OBSERVATION_EVIDENCE','CANONICAL_UI','MACHINE_DATA','RUNTIME_POLICY','RUNTIME_PROJECTION','APP_RUNTIME','DISTRIBUTION','DEVICE_QA'])assert.notEqual(read(path.join(base,'machines',id,'stages',stage+'.json')).state,'COMPLETE');
 const r=machine.RESEARCH,c=machine.CANDIDATE_CONTRACT;
 for(const f of r.findings.filter((x:any)=>x.observationType==='evidence'))assert.deepEqual(c.evidenceCandidates.find((x:any)=>x.findingId===f.findingId).semanticCategories,f.semanticCategories);
 assert.deepEqual(r.settings.values,c.machineSettings.values);
 assert.equal(r.originalCandidateReconciliation.length,c.originalCandidateReconciliation.length);
 assert.ok(r.originalCandidateReconciliation.every((x:any)=>x.preserved));
 const packagePath=path.join(root,'research-inbox','batch025','original-packages',id+'.json'),p=read(packagePath);
 assert.deepEqual(p.machine.settings,r.settings.values);
 ledger+=r.researchCompleteness.candidateLedger.length;mapped+=r.originalCandidateReconciliation.length;
 // Every eligible numeric candidate is either a runtime route or explicitly
 // resolved/suppressed in its dependency group; none disappear silently.
 const eligible=machine.ELIGIBILITY.decisions.filter((x:any)=>x.eligibility==='ELIGIBLE');
 assert.deepEqual(eligible.map((x:any)=>x.findingId).sort(),c.candidates.map((x:any)=>x.findingId).sort());
 for(const f of r.findings.filter((x:any)=>x.existingApprovedConditionalModel?.probabilitiesCopiedExactly)){
  const old=p.features.features.find((x:any)=>x.featureId===f.existingApprovedConditionalModel.packageFeatureId);
  for(const [k,v] of Object.entries(old.probabilities))assert.equal(f.settingDistribution[k.replace('SET_','')],v);
 }
 docs[id]=machine;
 results.push({machineId:id,machineName:r.machineName,research:'COMPLETE',evaluation:'COMPLETE',eligibility:'COMPLETE',candidateContract:'COMPLETE',ledgerCandidates:r.researchCompleteness.candidateLedger.length,originalMapped:r.originalCandidateReconciliation.length,numericEvaluations:machine.EVALUATION.evaluations.length,eligible:eligible.length,runtimePermitted:c.candidates.filter((x:any)=>x.runtimeInferenceAllowed).length,evidenceSections:c.evidenceCandidates.length,blocked:c.blockedItems.length});
}
const transitions=fs.readFileSync(path.join(base,'transitions/history.jsonl'),'utf8').trim().split('\n').map(JSON.parse);
const firstResearch=ids.map((id:string)=>transitions.findIndex((x:any)=>x.machineId===id&&x.stage==='RESEARCH'&&x.toState==='COMPLETE'));
assert.ok(firstResearch.every((x:number,i:number)=>x>=0&&(i===0||x>firstResearch[i-1])));
assert.ok(transitions.findIndex((x:any)=>x.stage==='EVALUATION'&&x.toState==='RUNNING')>Math.max(...firstResearch));
const rino=docs.L_ANOTHER_RINO_HEAVEN_CC.CANDIDATE_CONTRACT;
assert.ok(!rino.candidates.some((x:any)=>x.findingId==='BONUS_COMBINED'));
assert.ok(rino.candidates.some((x:any)=>x.findingId==='BONUS_INITIAL'&&x.runtimeInferenceAllowed));
const v=docs.LB_NEW_KING_HANAHANA_V_PF;
assert.deepEqual(v.RESEARCH.settings.values,['SET_1','SET_2','SET_3','SET_4','SET_V']);
assert.equal(v.EVALUATION.evaluations.length,3);
const previousV=read(path.join(base,'revisions/native-v-format-r2/reviewed-research.json'));
for(const findingId of ['BIG','REG','BONUS_COMBINED']){
 const f=v.RESEARCH.findings.find((x:any)=>x.findingId===findingId),e=v.EVALUATION.evaluations.find((x:any)=>x.findingId===findingId);
 assert.deepEqual(f.settingDistribution,previousV.blockedItems.find((b:any)=>b.blockId===findingId).retainedSourceValues);
 assert.deepEqual(Object.keys(e.settingDistribution),['1','2','3','4','V']);
 assert.deepEqual(e.settingDistribution,f.settingDistribution);
 if(findingId==='BONUS_COMBINED'){
  assert.equal(e.model,'REFERENCE_ONLY');assert.equal(e.selectionClass,'EXCLUDE');
  assert.ok(!v.CANDIDATE_CONTRACT.candidates.some((x:any)=>x.findingId===findingId));
 }else{
  assert.equal(e.metrics.selectionScore.status,'COMPUTED');assert.equal(e.benchmarkExposure.trials,7000);
  const score=e.metrics.selectionScore.value;assert.ok(Number.isFinite(score));
  assert.equal(e.selectionClass,score>=20?'CORE':score>=10?'SUPPORT':score>=5?'JOINT_ELIGIBLE':'EXCLUDE');
 }
}
const joint=v.CANDIDATE_CONTRACT.candidates.find((x:any)=>x.findingId==='BIG');
assert.equal(joint.model,'CATEGORICAL');assert.equal(joint.runtimeInferenceAllowed,true);
assert.deepEqual(joint.jointSourceFindingIds,['BIG','REG']);
assert.deepEqual(Object.keys(joint.settingDistribution),['1','2','3','4','V']);
for(const [setting,row] of Object.entries(joint.settingDistribution) as [string,any][]){
 const big=v.RESEARCH.findings.find((x:any)=>x.findingId==='BIG').settingDistribution[setting];
 const reg=v.RESEARCH.findings.find((x:any)=>x.findingId==='REG').settingDistribution[setting];
 assert.equal(row.BIG,1/Number(big.slice(2)));assert.equal(row.REG,1/Number(reg.slice(2)));
 assert.ok(1-row.BIG-row.REG>0);
}
assert.equal(v.CANDIDATE_CONTRACT.candidates.filter((x:any)=>x.runtimeInferenceAllowed).length,1);
assert.equal(v.CANDIDATE_CONTRACT.candidates.find((x:any)=>x.findingId==='REG').resolvedIntoFindingId,'BIG');
assert.equal(v.CANDIDATE_CONTRACT.nativeSettingModelContract.otherInput,'AUTOMATIC_FROM_TRIALS_MINUS_BIG_MINUS_REG');
assert.equal(v.CANDIDATE_CONTRACT.nativeSettingModelContract.noRemapping,true);
const k=docs.LB_KELLOT_5_ND05H.RESEARCH;
assert.notEqual(k.findings.find((f:any)=>f.findingId==='REG_CUTIN').semanticCategories.find((c:any)=>c.label.includes('絵柄不明')).semanticType,'EXACT_CONSTRAINT');
const m=docs.LB_MAGICAL_HALLOWEEN_GS.RESEARCH;
assert.equal(m.findings.find((f:any)=>f.findingId==='MINI').semanticCategories.find((c:any)=>c.meaning==='設定1否定').semanticType,'EXACT_CONSTRAINT');
assert.ok(m.findings.find((f:any)=>f.findingId==='ALICE_TROPHY').semanticCategories.every((c:any)=>c.semanticType!=='EXACT_CONSTRAINT'));
const t=docs.LB_THUNDER_V_HA.RESEARCH;assert.notEqual(t.findings.find((f:any)=>f.findingId==='BIG_END').findingId,t.findings.find((f:any)=>f.findingId==='BIG_1G_END').findingId);
const report={schemaVersion:'batch025-contract-verification-v1',batchId:batch,status:'PASS',ledgerCandidates:ledger,originalCandidatesReconciled:mapped,formalAcceptedStages:40,sequentialFirstAcceptance:true,allTenBeforeEvaluation:true,sharedValidatorsModified:true,sharedValidatorChanges:['Explicit SOURCE_DERIVED SET_V permits numeric key V'],statisticalPolicyChanged:false,actionsRuns:0,implementation:false,distribution:false,apk:false,qa:false,limitations:[],resolvedPrerequisites:[{machineId:'LB_NEW_KING_HANAHANA_V_PF',type:'NATIVE_SETTING_IDENTIFIER',status:'FORMALLY_REACCEPTED_THROUGH_CANDIDATE_CONTRACT',noRemapping:true,newPublicSearch:false}],machines:results};
fs.mkdirSync(path.join(base,'validation'),{recursive:true});fs.writeFileSync(path.join(base,'validation/final-contract-verification.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
