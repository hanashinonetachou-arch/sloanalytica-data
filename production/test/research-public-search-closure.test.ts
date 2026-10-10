import test from 'node:test';
import assert from 'node:assert/strict';
import {validatePublicSearchClosure} from '../src/research-public-search-closure.ts';
import {summarizeResearchProgress} from '../src/research-progress.ts';
const draft=()=>({machineId:'machine',sources:[{sourceId:'a',url:'https://site-a.example/analysis'},{sourceId:'b',url:'https://site-b.example/analysis'}],researchCompleteness:{domains:[{domain:'SMALL_ROLE',status:'CHECKED',note:'設定1だけ確認。他設定は公開資料巡回で取得できず除外。',sourceIds:['a','b'],publicSearchClosure:{disposition:'PUBLIC_INFORMATION_NOT_FOUND_EXCLUDED',runtimeUse:'DISABLED',reopenPolicy:'NEW_CONCRETE_SOURCE_ONLY',missingInformation:'設定2以上の小役表',checkedAt:'2026-10-10',checkedSourceIds:['a','b']}}]}});
test('Closed public surveys are counted separately and never create numerical candidates',()=>{
 const d=draft();validatePublicSearchClosure(d,d.researchCompleteness.domains[0]);
 const result=summarizeResearchProgress([d]);
 assert.equal(result.verifiedDomains,1);assert.equal(result.publicInformationUnavailableDomains,1);
 assert.equal(result.numericCandidateObservationScopePending,0);
 assert.equal(result.machineRows[0].unresolvedNumericCandidates.length,0);
});
test('Missing information cannot be enabled, routinely researched again, or closed on one site',()=>{
 for(const key of ['runtimeUse','reopenPolicy']){
  const d=draft();(d.researchCompleteness.domains[0].publicSearchClosure as any)[key]='ENABLED';
  assert.throws(()=>summarizeResearchProgress([d]),/CLOSURE_INVALID/);
 }
 const d=draft();d.sources[1].url='https://site-a.example/other-page';
 assert.throws(()=>summarizeResearchProgress([d]),/SITE_COVERAGE/);
});
test('A closure must cite domain-scoped registered sources and cannot silently resolve a partial domain',()=>{
 const d=draft();d.researchCompleteness.domains[0].sourceIds=['a'];
 assert.throws(()=>summarizeResearchProgress([d]),/PROVENANCE/);
 const partial=draft();partial.researchCompleteness.domains[0].status='PARTIAL';
 assert.throws(()=>summarizeResearchProgress([partial]),/CLOSURE_INVALID/);
});
