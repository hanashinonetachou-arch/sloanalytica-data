import test from 'node:test';
import assert from 'node:assert/strict';
import {decideSourceConflict,validateSourceConflictStandard,SOURCE_CONFLICT_CLOSED} from '../src/source-conflict-standard.ts';
function doc(){
 return {
  sources:[
   {sourceId:'a',url:'https://example.com/a',claims:['設定1 1/300']},
   {sourceId:'b',url:'https://example.net/b',claims:['設定1 1/290']},
   {sourceId:'c',url:'https://maker.example.org/c',claims:['追加照合でも解決できない']}
  ],
  findings:[],
  blockedItems:[{blockId:'cz-conflict',disposition:SOURCE_CONFLICT_CLOSED,
   label:'CZ初当たり',reason:'資料ごとに確率が異なり、正しい値を特定できないため採用しません。',
   reevaluationCondition:'新しいメーカー訂正資料が公開された場合。',
   sourceIds:['a','b','c'],
   sourceConflictResolution:{schemaVersion:'source-conflict-v1',status:SOURCE_CONFLICT_CLOSED,
    candidateId:'cz',conflictingClaim:'CZ初当たり 設定1の確率',checkedAt:'2026-10-12',
    initialSourceIds:['a','b'],additionalCheckSourceIds:['c'],additionalChecksUsed:1,
    repeatPublicSearch:false,runtimeUse:'DISABLED',reopenPolicy:'NEW_CONCRETE_SOURCE_ONLY'}}],
  researchCompleteness:{candidateLedger:[{candidateId:'cz',disposition:{type:'BLOCKED',refId:'cz-conflict'}}]}
 };
}
test('unresolved source conflict closes after one additional check',()=>{
 const r=decideSourceConflict({candidateId:'cz',initialSourceIds:['a','b'],additionalCheckSourceIds:['c']});
 assert.equal(r.status,SOURCE_CONFLICT_CLOSED);
 assert.equal(r.runtimeUse,'DISABLED');
 assert.doesNotThrow(()=>validateSourceConflictStandard(doc()));
});
test('resolution rejects repeated public searches',()=>{
 assert.throws(()=>decideSourceConflict({candidateId:'cz',initialSourceIds:['a','b'],additionalCheckSourceIds:['c','d']}),/ADDITIONAL_CHECK_LIMIT/);
 const x=doc();x.blockedItems[0].sourceConflictResolution.repeatPublicSearch=true;
 assert.throws(()=>validateSourceConflictStandard(x),/RESEARCH_LOOP_FORBIDDEN/);
});
test('closed candidate cannot remain an active numerical finding',()=>{
 const x=doc();x.findings.push({findingId:'cz'});
 assert.throws(()=>validateSourceConflictStandard(x),/ACTIVE_FINDING_FORBIDDEN/);
});
test('blocked conflict requires candidates ledger and independent source hosts',()=>{
 const x=doc();x.researchCompleteness.candidateLedger=[];
 assert.throws(()=>validateSourceConflictStandard(x),/LEDGER_BLOCK_REQUIRED/);
 const y=doc();y.sources[1].url='https://example.com/elsewhere';
 assert.throws(()=>validateSourceConflictStandard(y),/INDEPENDENT_SITES_REQUIRED/);
});
test('reopening cannot silently reuse previous sources',()=>{
 const x=doc();x.blockedItems[0].sourceConflictResolution.reopenedBy='a';
 assert.throws(()=>validateSourceConflictStandard(x),/REOPEN_NEW_SOURCE_REQUIRED/);
});
test('unrelated research remains backward compatible',()=>{
 assert.doesNotThrow(()=>validateSourceConflictStandard({sources:[],findings:[],blockedItems:[]}));
});
