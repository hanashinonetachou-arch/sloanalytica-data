import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {validateResearchPromotionReadiness,validateResearchCandidateLedger} from '../src/research-validator.ts';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=(p:string)=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const selection=read('next-machine-selection-20261016.json').selected;
const docs=selection.map((s:any)=>read('batches/batch-20261016-018/artifacts/'+s.machineId+'/research/result.json'));
const doc=(i:number)=>docs[i-1],finding=(i:number,id:string)=>doc(i).findings.find((x:any)=>x.findingId===id);
test('original 99 candidates survive with canonical identity and no pending promotion',()=>{
 let originalCount=0;
 docs.forEach((d:any,i:number)=>{
  const original=read('research-inbox/batch018/imported-handoff/extracted/research_json/M'+String(i+1).padStart(2,'0')+'_RESEARCH_PROVENANCE_DRAFT.json');
  originalCount+=original.researchCompleteness.candidateLedger.length;
  const ids=new Set(d.researchCompleteness.candidateLedger.map((r:any)=>r.candidateId));
  for(const r of original.researchCompleteness.candidateLedger)assert.ok(ids.has(r.candidateId));
  assert.equal(d.machineId,selection[i].machineId);assert.equal(d.batchId,'batch-20261016-018');
  validateResearchPromotionReadiness(d);validateResearchCandidateLedger(d,new Set(d.sources.map((s:any)=>s.sourceId)));
 });
 assert.equal(originalCount,99);
});
test('every machine has twenty factual domain records and actual query history',()=>{
 const searches=read('research-inbox/batch018/imported-handoff/actual-searches.json');
 docs.forEach((d:any,i:number)=>{
  assert.equal(new Set(d.researchCompleteness.domains.map((r:any)=>r.domain)).size,20);
  assert.deepEqual(d.researchCompleteness.machineSpecificQueries,searches[i].queries);
  assert.ok(d.researchCompleteness.domains.every((r:any)=>r.note.length>20&&r.sourceIds.length>0));
 });
});
test('2024 Bahama keeps all three restored values and excludes setting L from numeric vectors',()=>{
 assert.equal(doc(5).machineIdentityReview.manufacturer,'アムテックス');
 assert.equal(doc(5).machineIdentityReview.introducedAt,'2024-07-08');
 for(const id of ['M05-N01','M05-N02','M05-N03'])assert.ok(finding(5,id));
 for(const d of [doc(5),doc(6)])for(const f of d.findings)if(f.settingDistribution)assert.ok(!('L' in f.settingDistribution)&&!('4' in f.settingDistribution));
});
test('Bofuri cherry conflict is closed after one extra check without discarding the other candidates',()=>{
 assert.equal(finding(9,'M09-C03'),undefined);
 const b=doc(9).blockedItems.find((b:any)=>b.blockId==='M09-C03');
 assert.equal(b.sourceConflictResolution.additionalChecksUsed,1);
 assert.equal(b.sourceConflictResolution.runtimeUse,'DISABLED');
 for(const id of ['M09-C01','M09-C02','M09-C08','M09-C09','M09-C10','M09-C11','M09-C12'])assert.ok(finding(9,id));
});
test('hidden-state numerical rates stay separate from observable exact evidence',()=>{
 assert.equal(finding(1,'M01-C02'),undefined);assert.equal(finding(8,'M08-C02'),undefined);
 assert.ok(finding(1,'M01-C04').semanticCategories.some((c:any)=>c.semanticType==='EXACT_CONSTRAINT'));
 assert.ok(finding(8,'M08-C10').semanticCategories.some((c:any)=>c.semanticType==='EXACT_CONSTRAINT'));
 assert.equal(finding(1,'M01-C06').settingDistribution['1'],.094);
});
test('published Bofuri appearance distributions share category inputs with exact constraints',()=>{
 for(const id of ['M09-C10','M09-N05','M09-N06','M09-C12']){
  const f=finding(9,id),e=finding(9,f.mirrorsEvidenceFindingId);
  assert.equal(f.observationType,'appearance_distribution');
  assert.ok(e.semanticCategories.every((c:any)=>c.linkedFindingId===id));
 }
});
