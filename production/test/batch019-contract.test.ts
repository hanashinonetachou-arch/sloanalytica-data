import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root=path.resolve(import.meta.dirname,'..'),batch='batch-20261017-019';
const read=(p:string)=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const ids=read('specs/'+batch+'.json').waves.flatMap((w:any)=>w.machineIds);
const doc=(m:string,s:string)=>read(`batches/${batch}/artifacts/${m}/${s}/result.json`);
test('Batch019 retains all original 90 candidates, source claims, and exact stage authority',()=>{
 const originals=read('research-inbox/batch019/imported-handoff/candidates_v9.json');
 assert.equal(originals.length,90);
 const seen=new Set<string>();
 for(const m of ids){
  const r=doc(m,'research');
  for(const row of r.researchCompleteness.candidateLedger){assert(!seen.has(row.candidateId));seen.add(row.candidateId);assert(row.sourceClaims.length>0);}
  for(const stage of ['RESEARCH','EVALUATION','ELIGIBILITY','CANDIDATE_CONTRACT','OBSERVATION_EVIDENCE','CANONICAL_UI','MACHINE_DATA','RUNTIME_POLICY','RUNTIME_PROJECTION','APP_RUNTIME']){
   const s=read(`batches/${batch}/machines/${m}/stages/${stage}.json`);assert.equal(s.state,'COMPLETE');
   const ref=s.authoritativeOutputRef,bytes=fs.readFileSync(path.join(root,ref.path.replace(/^production\//,'')));
   assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),ref.sha256);
  }
  const qa=read(`batches/${batch}/machines/${m}/stages/DEVICE_QA.json`);if(qa.state==='COMPLETE'){const acceptance=read(`batches/${batch}/artifacts/${m}/device_qa/result.json`);assert.equal(acceptance.acceptedBy,'USER');assert(acceptance.machineIds.includes(m));}

 }
 for(const c of originals)assert(seen.has(c.candidate_id));
});
test('Batch019 respects complete setting vectors and concrete product copy',()=>{
 for(const m of ids){const r=doc(m,'research'),settings=r.settings.numericInferenceValues.map((v:string)=>v.replace('SET_',''));
  for(const f of r.findings){
   if(f.settingDistribution)assert.deepEqual(Object.keys(f.settingDistribution),settings);
   const text=[f.label,f.denominatorSemantics,...(f.details??[]),...(f.semanticCategories??[]).flatMap((x:any)=>[x.label,x.meaning])].filter(Boolean).join(' ');
   assert(!/https?:|なな徹|ななプレス|P-WORLD|HAZUSE|一撃|パチマガ|必勝本|DMM|スロパチクエスト/i.test(text));
  }
  for(const b of r.blockedItems)assert(!/https?:|なな徹|P-WORLD|HAZUSE|一撃|DMM/i.test(b.reason+' '+b.reevaluationCondition));
 }
});
test('Hyper Rush flags use actual vectors and built-in flag check, and cannot duplicate BIG/REG',()=>{
 const m='S_HYPER_RUSH_SLC8',r=doc(m,'research'),c=doc(m,'candidate_contract');
 const flags=['M02-C05','M02-C08','M02-C11','M02-C12','M02-C13','M02-C14','M02-C15','M02-C16','M02-C17'];
 for(const id of flags){const f=r.findings.find((x:any)=>x.findingId===id);assert(f);assert.match(f.denominatorSemantics,/決まり手チェック/);assert.equal(Object.keys(f.settingDistribution).length,6);}
 const g=c.dependencyGroups.find((x:any)=>x.groupId==='hyper_bonus');assert.equal(g.resolution,'SINGLE_MEMBER_SELECTED');
 assert.equal(c.candidates.filter((x:any)=>g.members.includes(x.findingId)&&x.runtimeInferenceAllowed).length,1);
});
test('Source conflicts, hidden trials and inferred hints retain candidate-local scope',()=>{
 const e=doc('L_ENEN_NO_SHOUBOUTAI_JG','research');
 assert(e.blockedItems.some((b:any)=>b.blockId==='M10-C03'&&b.sourceConflictResolution?.additionalChecksUsed===1));
 assert(!e.findings.some((x:any)=>x.findingId==='M10-C03'));
 assert(e.findings.some((x:any)=>x.findingId==='M10-C08'&&x.trialUniverse==='CONDITIONAL_EVENT_TRIAL'));
 const t=doc('L_TOLOVE_DARKNESS_S6','research').findings.find((x:any)=>x.findingId==='M08-C03');assert(t);assert(t.semanticCategories.every((c:any)=>c.semanticType==='PROBABILITY_UNKNOWN'));
 assert(doc('S_HARD_BOILED_XX','research').blockedItems.some((b:any)=>b.blockId==='M03-C04'));
 const n=doc('S_NAMENEKO_QQ','evaluation').evaluations.find((x:any)=>x.findingId==='M06-C01');assert.equal(n.selectionClass,'EXCLUDE');assert.equal(n.metrics.selectionScore.value,0);
 const r=doc('S_KABANERI_ZR','research');for(const id of ['M04-C01','M04-C02','M04-C03','M04-C04'])assert.equal(Object.keys(r.findings.find((f:any)=>f.findingId===id).settingDistribution).length,6);
});
