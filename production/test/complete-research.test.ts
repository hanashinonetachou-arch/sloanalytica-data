import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {RepoStore,Orchestrator} from '../src/core.ts';
import {initializeBatch,productionRequest} from '../src/runtime.ts';
import {completeResearch} from '../src/complete-research.ts';
import {RESEARCH_COMPLETENESS_DOMAINS,validateResearchCandidateLedger} from '../src/research-validator.ts';

test('complete-research computes SHA, commits through orchestrator, promotes dependency, and fills freed research slots',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'complete-research-'));
 const s=new RepoStore(root);
 fs.mkdirSync(s.p('config'),{recursive:true});
 fs.writeFileSync(s.p('config','orchestrator.json'),JSON.stringify({manifestVersion:'8.5',concurrency:{semanticSlots:2,productionSlots:2,validationSlots:2,integrationSlots:1}}));
 initializeBatch(s,{batchId:'b',manifestVersion:'8.5',waves:[{waveId:'w1',machineIds:['M1','M2','M3','M4','M5']},{waveId:'w2',machineIds:['M6','M7','M8','M9','M10']}]});
 const o=new Orchestrator(s);
 for(const m of ['M1','M2']){
  let x=o.stage('b',m,'RESEARCH');const a=o.createAttempt(x),l=o.acquire(x,a);x=o.transition(o.stage('b',m,'RESEARCH'),'LEASED','DISPATCH',a.workId);x=o.transition(x,'RUNNING','WORKER_START',a.workId);const q=productionRequest(o,x,a,l);s.write(q,'batches','b','work-requests',q.workId+'.json');
  const d={schemaVersion:'research-v1',manifestVersion:'8.5',batchId:'b',machineId:m,machineName:m,workId:q.workId,researchCompleteness:{version:2,domains:RESEARCH_COMPLETENESS_DOMAINS.map(domain=>({domain,status:'CHECKED',sourceIds:['s1'],note:'covered by source'})),machineSpecificQueries:['mode','distribution','reset'],candidateLedger:[{candidateId:'finding:f1',label:'rate',sourceClaims:[{sourceId:'s1',claim:'c'}],discoveryQueries:['mode','distribution'],disposition:{type:'FINDING',refId:'f1'}},{candidateId:'block:b1',label:'unknown',sourceClaims:[{sourceId:'s1',claim:'c'}],discoveryQueries:['reset'],disposition:{type:'BLOCKED',refId:'b1'}}]},sources:[{sourceId:'s1',url:'https://example.com',title:'Source',sourceType:'official',claims:['c']}],findings:[{findingId:'f1',label:'rate',observationType:'probability',sourceIds:['s1'],settingDistribution:{'1':0.1,'6':0.2}}],blockedItems:[{blockId:'b1',label:'unknown',reason:'not published',reevaluationCondition:'publish values'}]};
  const f=s.p('batches','b','artifacts',m,'research','result.json');fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,JSON.stringify(d,null,2));
 }
 const r=completeResearch(root,'b',['M1','M2']);
 assert.deepEqual(r.completed.map(x=>x.kind),['COMMITTED','COMMITTED']);
 assert.equal(o.stage('b','M1','RESEARCH').state,'COMPLETE');
 assert.equal(o.stage('b','M1','EVALUATION').state,'READY');
 assert.deepEqual(r.dispatched.map(x=>x.machineId),['M3','M4']);
 assert.equal(o.stage('b','M3','RESEARCH').state,'RUNNING');
 assert.ok(fs.readFileSync(s.p('batches','b','provenance','chain.jsonl'),'utf8').trim().split('\n').length===2);
});


test('research completeness v2 ledger rejects silent source/query/finding omissions',()=>{
 const d:any={sources:[{sourceId:'s1',claims:['claim-a','claim-b']}],findings:[{findingId:'f1'}],blockedItems:[{blockId:'b1'}],researchCompleteness:{machineSpecificQueries:['query-a'],candidateLedger:[{candidateId:'f',label:'finding',sourceClaims:[{sourceId:'s1',claim:'claim-a'}],discoveryQueries:['query-a'],disposition:{type:'FINDING',refId:'f1'}},{candidateId:'b',label:'block',sourceClaims:[{sourceId:'s1',claim:'claim-b'}],discoveryQueries:[],disposition:{type:'BLOCKED',refId:'b1'}}]}};
 assert.doesNotThrow(()=>validateResearchCandidateLedger(d,new Set(['s1'])));
 const missingClaim=structuredClone(d);missingClaim.researchCompleteness.candidateLedger[1].sourceClaims=[];assert.throws(()=>validateResearchCandidateLedger(missingClaim,new Set(['s1'])),/CANDIDATE_LEDGER_UNTRACED|SOURCE_CLAIM_UNCOVERED/);
 const missingQuery=structuredClone(d);missingQuery.researchCompleteness.candidateLedger[0].discoveryQueries=[];assert.throws(()=>validateResearchCandidateLedger(missingQuery,new Set(['s1'])),/QUERY_UNCOVERED/);
 const missingFinding=structuredClone(d);missingFinding.researchCompleteness.candidateLedger[0].disposition={type:'NO_SETTING_DIFFERENCE',reason:'none'};assert.throws(()=>validateResearchCandidateLedger(missingFinding,new Set(['s1'])),/FINDING_UNLEDGERED/);
});
